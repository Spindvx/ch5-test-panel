#!/usr/bin/env node
/**
 * Cross-platform Node version of build-react-ch5z.sh.
 * Works on PowerShell / cmd / bash equally — no shell tools required.
 *
 * Usage (from repo root):
 *   node deploy/build-react-ch5z.mjs              # mock mode
 *   node deploy/build-react-ch5z.mjs --live       # real CIP, talks to CP3
 *
 * Output: dist/prod/office-react.ch5z (~3 MB)
 *
 * Then deploy from any TTY (PowerShell, VS Code terminal, etc.):
 *   npx ch5-cli deploy -p -H 192.168.50.105 -t touchscreen dist/prod/office-react.ch5z
 */
import { execSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, rmSync } from "node:fs";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "../web/node_modules/archiver/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const WEB = join(REPO, "web");
const STAGE = join(REPO, "dist", "prod", "react-stage");
const SHELL_DIR = join(STAGE, "Shell");
const OUT = join(REPO, "dist", "prod", "office-react.ch5z");

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

  // 2. Stage
  if (existsSync(STAGE)) rmSync(STAGE, { recursive: true, force: true });
  await mkdir(SHELL_DIR, { recursive: true });
  await mkdir(join(SHELL_DIR, "config"), { recursive: true });
  await mkdir(join(SHELL_DIR, "libraries"), { recursive: true });

  // React bundle → panel index
  await cp(join(WEB, "dist", "index.html"), join(SHELL_DIR, "index.html"));
  await cp(join(WEB, "dist", "assets"), join(SHELL_DIR, "assets"), { recursive: true });
  await cp(join(WEB, "public", "img"), join(SHELL_DIR, "img"), { recursive: true });

  // Crestron contract
  await cp(join(REPO, "config", "contract.cse2j"), join(SHELL_DIR, "config", "contract.cse2j"));

  // CIP runtime libs (best-effort — both names CH5 ships under)
  for (const lib of [
    join(WEB, "node_modules", "@crestron", "ch5-crcomlib", "build_bundles", "umd", "cr-com-lib.js"),
    join(WEB, "node_modules", "@crestron", "ch5-crcomlib", "dist", "cr-com-lib.js"),
  ]) {
    if (existsSync(lib)) {
      await cp(lib, join(SHELL_DIR, "libraries", "cr-com-lib.js"));
      log(`copied ${lib}`);
      break;
    }
  }

  // Manifest
  await writeFile(
    join(SHELL_DIR, "_manifest.json"),
    JSON.stringify({ projectname: "Office.ch5", samplesource: "Shell", version: "1.0.0" }, null, 2)
  );

  // 3. Zip → .ch5z
  if (existsSync(OUT)) rmSync(OUT);

  // CH5 archive: outer .ch5z is a zip containing Office.ch5 + _manifest.json,
  // and Office.ch5 is itself a zip of the Shell/* contents.
  const innerCh5 = join(STAGE, "Office.ch5");
  await zipDir(SHELL_DIR, innerCh5);
  log(`inner archive: ${innerCh5}`);

  await zipFiles(OUT, [
    { src: innerCh5, name: "Office.ch5" },
    { src: join(SHELL_DIR, "_manifest.json"), name: "Office_manifest.json" },
  ]);

  log(`✅ Built ${OUT}`);
  console.log("");
  console.log("Deploy from any TTY (PowerShell / VS Code terminal):");
  console.log(`  npx ch5-cli deploy -p -H 192.168.50.105 -t touchscreen ${OUT}`);
}

function zipDir(srcDir, outFile) {
  return new Promise((resolveP, reject) => {
    const out = createWriteStream(outFile);
    const ar = archiver("zip", { zlib: { level: 9 } });
    out.on("close", resolveP);
    ar.on("error", reject);
    ar.pipe(out);
    ar.directory(srcDir, false);
    ar.finalize();
  });
}

function zipFiles(outFile, entries) {
  return new Promise((resolveP, reject) => {
    const out = createWriteStream(outFile);
    const ar = archiver("zip", { zlib: { level: 9 } });
    out.on("close", resolveP);
    ar.on("error", reject);
    ar.pipe(out);
    for (const e of entries) ar.file(e.src, { name: e.name });
    ar.finalize();
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
