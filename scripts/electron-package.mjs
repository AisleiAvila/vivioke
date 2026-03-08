import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(workspaceRoot, "package.json"), "utf8"));
const packageVersion = packageJson.version;
const releaseDir = path.join(workspaceRoot, "release");
const fallbackReleaseDir = path.join(workspaceRoot, "release-fallback");
const isWindows = process.platform === "win32";
const extraArgs = process.argv.slice(2);
const isDirOnlyBuild = extraArgs.includes("--dir");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    stdio: "inherit",
    shell: isWindows,
    env: {
      ...process.env,
      CSC_IDENTITY_AUTO_DISCOVERY: "false",
    },
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function stopRunningVivioke() {
  if (!isWindows) {
    return;
  }

  try {
    execFileSync("taskkill", ["/F", "/IM", "Vivioke.exe"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } catch {
    // Ignore when no matching process exists.
  }

  sleep(1500);
}

function cleanReleaseOutput() {
  if (!fs.existsSync(releaseDir)) {
    return true;
  }

  try {
    fs.rmSync(releaseDir, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 500,
    });
    return true;
  } catch (error) {
    console.warn("[electron-package] release/ esta bloqueado. Vou empacotar em release-fallback/.");
    console.warn(String(error));
    return false;
  }
}

stopRunningVivioke();
const canUseDefaultReleaseDir = cleanReleaseOutput();
const outputDir = canUseDefaultReleaseDir ? releaseDir : fallbackReleaseDir;

if (!canUseDefaultReleaseDir && fs.existsSync(fallbackReleaseDir)) {
  fs.rmSync(fallbackReleaseDir, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 500,
  });
}

run("npm", ["run", "build"]);

const builderArgs = ["electron-builder", ...extraArgs];
if (!canUseDefaultReleaseDir) {
  builderArgs.push(`--config.directories.output=${fallbackReleaseDir}`);
}

run("npx", builderArgs);

const installerPath = path.join(outputDir, `Vivioke-Setup-${packageVersion}.exe`);
const unpackedExePath = path.join(outputDir, "win-unpacked", "Vivioke.exe");

console.log(`\n[electron-package] Saida: ${outputDir}`);
if (!isDirOnlyBuild && fs.existsSync(installerPath)) {
  console.log(`[electron-package] Instalador: ${installerPath}`);
}
if (fs.existsSync(unpackedExePath)) {
  console.log(`[electron-package] Executavel: ${unpackedExePath}`);
}