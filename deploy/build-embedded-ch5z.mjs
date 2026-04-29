#!/usr/bin/env node
/**
 * Embed the React app inside a structurally-valid CH5 Shell.
 *
 * The TS-1070 panel firmware validates that an archive looks like a CH5
 * project (assets/data/project-config.json, app/template/, libraries/
 * cr-com-lib + component, etc.). A pure-Vite SPA fails that validation.
 * Solution: build the CH5 Shell normally (so all the boilerplate is
 * present), then replace the page content with a thin React mount that
 * loads our bundle. Panel sees a valid CH5 project; user sees React.
 *
 * Steps:
 *   1. Build the React app  → web/dist/{index.html, assets/index.js, index.css}
 *   2. Build the CH5 Shell  → dist/prod/Shell/ (full CH5 framework)
 *   3. Patch Shell:
 *        - Copy web/dist/assets/* into Shell/assets/react/
 *        - Replace Shell/app/project/components/pages/mainpage/mainpage.html
 *          with a fragment that mounts React full-screen
 *   4. ch5-cli archive  → dist/prod/office-react.ch5z
 *
 * Usage from repo root:
 *   node deploy/build-embedded-ch5z.mjs            # mock CIP
 *   node deploy/build-embedded-ch5z.mjs --live     # real CP3
 */
import { execSync } from "node:child_process";
import { existsSync, rmSync, renameSync, readdirSync, statSync } from "node:fs";
import { cp, mkdir, writeFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const WEB = join(REPO, "web");
const SHELL = join(REPO, "dist", "prod", "Shell");
const OUT_DIR = join(REPO, "dist", "prod");
const OUT_FINAL = join(OUT_DIR, "office-react.ch5z");

const isLive = process.argv.includes("--live");
const log = (msg) => console.log(`[embed] ${msg}`);
const run = (cmd, opts = {}) => {
  log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
};

function listCh5z(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ch5z"))
    .map((name) => ({ name, path: join(dir, name), mtime: statSync(join(dir, name)).mtimeMs }));
}

async function main() {
  log(isLive ? "LIVE mode (real CrComLib at runtime)" : "MOCK mode (sample data)");

  // 1. Build React
  const env = { ...process.env, ...(isLive ? { VITE_CIP_MODE: "live" } : {}) };
  run("npx vite build", { cwd: WEB, env });

  // 2. Build CH5 Shell (validates project-config + produces full structure)
  run("npm run build:prod", { cwd: REPO });

  // 3. Patch Shell with React app
  const reactAssetsDir = join(SHELL, "assets", "react");
  if (existsSync(reactAssetsDir)) rmSync(reactAssetsDir, { recursive: true, force: true });
  await mkdir(reactAssetsDir, { recursive: true });

  // Copy Vite output into Shell/assets/react/
  await cp(join(WEB, "dist", "assets"), reactAssetsDir, { recursive: true });
  // React markup uses `./img/...` paths which resolve relative to the
  // panel's document base URL → Shell root. Copy public/img/ to
  // Shell/img/ (NOT under assets/react/).
  const rootImgDir = join(SHELL, "img");
  if (existsSync(rootImgDir)) rmSync(rootImgDir, { recursive: true, force: true });
  await cp(join(WEB, "public", "img"), rootImgDir, { recursive: true });

  // List what landed (for the mainpage script reference)
  const reactAssets = await readdir(reactAssetsDir);
  const cssFile = reactAssets.find((f) => f.endsWith(".css"));
  const jsFile = reactAssets.find((f) => f.endsWith(".js")) || "index.js";
  log(`React assets in Shell/assets/react/: js=${jsFile} css=${cssFile || "(none)"}`);

  // Replace mainpage.html with React mount fragment.
  // The CH5 shell loads this as a snippet inside <ch5-template-page>;
  // our React root takes over the full visible area via fixed positioning.
  const mainpageFragment = `
<!--
  React app mounted inside the CH5 shell. The CH5 framework loads this
  fragment as the mainpage's content. We point at our React bundle in
  Shell/assets/react/ which mounts into #react-root and takes over the
  full viewport. CH5 header/footer are hidden via project-config.
-->
<style>
  #react-root,
  .react-mount-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: #07090c;
  }
</style>

<section id="MainPage-page" class="details-container react-mount-fullscreen">
  <div id="react-root"></div>
${cssFile ? `  <link rel="stylesheet" href="./assets/react/${cssFile}">` : ""}
  <script type="module" src="./assets/react/${jsFile}"></script>
</section>
`;
  const mainpagePath = join(
    SHELL,
    "app",
    "project",
    "components",
    "pages",
    "mainpage",
    "mainpage.html"
  );
  // The CH5 build may have built the project page differently — find the
  // actual mainpage.html that ch5 produced.
  if (!existsSync(mainpagePath)) {
    // Fallback: look for any *.html in app/project/components/pages/
    const pagesRoot = join(SHELL, "app", "project", "components", "pages");
    if (existsSync(pagesRoot)) {
      const subdirs = await readdir(pagesRoot);
      log(`mainpage.html missing — pages found: ${subdirs.join(", ")}`);
    }
  }
  await writeFile(mainpagePath, mainpageFragment);
  log(`patched ${mainpagePath}`);

  log(`mirrored img/ into ${rootImgDir} (relative ./img/ refs in React resolve to Shell root)`);

  // 4. ch5-cli archive over the patched Shell
  const before = listCh5z(OUT_DIR);
  run(
    `npx ch5-cli archive -P samplesource=Shell -d "${SHELL}" -o "${OUT_DIR}" -c "${join(REPO, "config", "contract.cse2j")}"`,
    { cwd: REPO }
  );
  const after = listCh5z(OUT_DIR);
  const fresh = after.find((f) => !before.find((b) => b.name === f.name && b.mtime === f.mtime));
  if (fresh) {
    if (fresh.path !== OUT_FINAL) {
      if (existsSync(OUT_FINAL)) rmSync(OUT_FINAL);
      renameSync(fresh.path, OUT_FINAL);
    }
    log(`renamed ${fresh.name} → ${OUT_FINAL.split(/[\\/]/).pop()}`);
  } else {
    log("warning: ch5-cli produced no new .ch5z — check output above");
  }

  log(`✅ Built ${OUT_FINAL}`);
  console.log("");
  console.log("Deploy from any TTY (PowerShell / VS Code terminal):");
  console.log(`  npx ch5-cli deploy -p -H 192.168.50.105 -t touchscreen "${OUT_FINAL}"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
