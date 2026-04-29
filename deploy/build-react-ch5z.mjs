#!/usr/bin/env node
/**
 * Cross-platform Node bundler that produces a valid Crestron .ch5z by
 * delegating to `ch5-cli archive` for the actual archive step. This is
 * critical: the panel firmware verifies a SHA-256 in the manifest that
 * ch5-cli computes — a manual `zip` won't satisfy it (the panel will
 * upload fine via SFTP but reject activation with "Error installing
 * User project").
 *
 * Steps:
 *   1. Vite build of web/                          → web/dist/
 *   2. Stage that dist/ into a CH5-shaped Shell/   → dist/prod/Shell/
 *   3. Drop in contract + libs + theme placeholder
 *   4. `npx ch5-cli archive -d dist/prod/Shell -o dist/prod -P samplesource=Shell -c config/contract.cse2j`
 *      → dist/prod/office-react.ch5z (with valid manifest sha)
 *
 * Usage (from repo root, works on Windows PowerShell, macOS, Linux):
 *   node deploy/build-react-ch5z.mjs            # mock mode
 *   node deploy/build-react-ch5z.mjs --live     # real CIP
 *
 * Then deploy from any TTY:
 *   npx ch5-cli deploy -p -H 192.168.50.105 -t touchscreen dist/prod/office-react.ch5z
 */
import { execSync } from "node:child_process";
import { existsSync, rmSync, renameSync, readdirSync, statSync } from "node:fs";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function listCh5z(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ch5z"))
    .map((name) => {
      const path = join(dir, name);
      return { name, path, mtime: statSync(path).mtimeMs };
    });
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const WEB = join(REPO, "web");
const STAGE = join(REPO, "dist", "prod", "Shell");
const OUT_DIR = join(REPO, "dist", "prod");
const OUT_FINAL = join(OUT_DIR, "office-react.ch5z");

const isLive = process.argv.includes("--live");

function log(msg) { console.log(`[build] ${msg}`); }
function run(cmd, opts = {}) {
  log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

async function main() {
  log(isLive ? "LIVE mode: real CrComLib at runtime" : "MOCK mode: dev/screenshot bundle");

  // 1. Vite build
  const env = { ...process.env, ...(isLive ? { VITE_CIP_MODE: "live" } : {}) };
  run("npx vite build", { cwd: WEB, env });

  // 2. Stage Shell/
  if (existsSync(STAGE)) rmSync(STAGE, { recursive: true, force: true });
  await mkdir(STAGE, { recursive: true });
  await mkdir(join(STAGE, "config"), { recursive: true });
  await mkdir(join(STAGE, "libraries"), { recursive: true });
  await mkdir(join(STAGE, "appui"), { recursive: true });

  // React bundle → panel index
  await cp(join(WEB, "dist", "index.html"), join(STAGE, "index.html"));
  await cp(join(WEB, "dist", "assets"), join(STAGE, "assets"), { recursive: true });
  await cp(join(WEB, "public", "img"), join(STAGE, "img"), { recursive: true });

  // Crestron contract — same one the CH5 build uses
  await cp(join(REPO, "config", "contract.cse2j"), join(STAGE, "config", "contract.cse2j"));

  // CIP runtime libraries from node_modules so the panel has them when
  // the React app loads them at runtime
  for (const lib of [
    join(WEB, "node_modules", "@crestron", "ch5-crcomlib", "build_bundles", "umd", "cr-com-lib.js"),
    join(WEB, "node_modules", "@crestron", "ch5-crcomlib", "dist", "cr-com-lib.js"),
  ]) {
    if (existsSync(lib)) {
      await cp(lib, join(STAGE, "libraries", "cr-com-lib.js"));
      log(`copied ${lib}`);
      break;
    }
  }

  // Empty appui manifest — ch5-cli archive expects this folder to exist
  await writeFile(join(STAGE, "appui", "manifest"), "");

  // 3. ch5-cli archive — generates the manifest with a valid SHA-256
  if (existsSync(OUT_FINAL)) rmSync(OUT_FINAL);

  // ch5-cli archive accepts a directory and outputs a .ch5z named after the
  // -P samplesource value. We pass samplesource=Shell so it writes Shell.ch5z,
  // then we rename to office-react.ch5z.
  // ch5-cli names the output after the projectName in app/project-config.json
  // (office-v3-ui.ch5z). Track the latest .ch5z mtime so we can rename it
  // to office-react.ch5z regardless of the project name.
  const before = listCh5z(OUT_DIR);
  run(
    `npx ch5-cli archive -P samplesource=Shell -d "${STAGE}" -o "${OUT_DIR}" -c "${join(REPO, "config", "contract.cse2j")}"`,
    { cwd: REPO }
  );
  const after = listCh5z(OUT_DIR);
  const fresh = after.find(
    (f) => !before.find((b) => b.name === f.name && b.mtime === f.mtime)
  );
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
