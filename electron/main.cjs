const { app, BrowserWindow, dialog } = require("electron");
const path = require("node:path");
const { spawn } = require("node:child_process");
const http = require("node:http");
const net = require("node:net");
const fs = require("node:fs");

const APP_URL = process.env.APP_URL || "http://localhost:3002";
const SERVER_PORT = process.env.PORT || "3002";

let serverProcess = null;

function hasMediaCatalog(mediaDir) {
  const bdIniPath = path.join(mediaDir, "BD.ini");
  if (!fs.existsSync(mediaDir) || !fs.existsSync(bdIniPath)) {
    return false;
  }

  return fs.readdirSync(mediaDir).some((fileName) => fileName.toLowerCase().endsWith(".mp4"));
}

function seedBundledMedia(runtimeMediaDir) {
  const bundledMediaDir = path.join(process.resourcesPath, "media");

  if (!app.isPackaged || !fs.existsSync(bundledMediaDir) || hasMediaCatalog(runtimeMediaDir)) {
    return;
  }

  fs.cpSync(bundledMediaDir, runtimeMediaDir, {
    recursive: true,
    force: false,
    errorOnExist: false,
  });
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();

    probe.once("error", () => {
      resolve(false);
    });

    probe.listen(port, "127.0.0.1", () => {
      probe.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(startPort, maxTries = 20) {
  for (let offset = 0; offset < maxTries; offset += 1) {
    const candidatePort = startPort + offset;
    if (await isPortAvailable(candidatePort)) {
      return candidatePort;
    }
  }

  throw new Error(`No available port found from ${startPort}`);
}

function waitForServer(url, processRef, timeoutMs = 60000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    let settled = false;

    const onProcessExit = (code) => {
      if (!settled) {
        settled = true;
        reject(
          new Error(
            `Bundled server exited before startup (code ${code ?? "unknown"}). Check log at ${path.join(app.getPath("userData"), "bundled-server.log")}`
          )
        );
      }
    };

    if (processRef) {
      processRef.once("exit", onProcessExit);
    }

    const finish = (error) => {
      if (settled) return;
      settled = true;
      if (processRef) {
        processRef.off("exit", onProcessExit);
      }
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const ping = () => {
      const request = http.get(url, (response) => {
        response.resume();
        finish();
      });

      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          finish(
            new Error(
              `Timeout waiting for server at ${url}. Check log at ${path.join(app.getPath("userData"), "bundled-server.log")}`
            )
          );
          return;
        }

        setTimeout(ping, 500);
      });
    };

    ping();
  });
}

async function startBundledServerIfNeeded() {
  if (!app.isPackaged) {
    return APP_URL;
  }

  // In packaged builds, keep dist inside app.asar so Node can resolve runtime deps from app's node_modules.
  const packagedAppPath = app.getAppPath();
  const serverEntryMjs = path.join(packagedAppPath, "dist", "index.mjs");
  const serverEntryCjs = path.join(packagedAppPath, "dist", "index.cjs");
  const serverEntryJs = path.join(packagedAppPath, "dist", "index.js");
  let serverEntry = serverEntryJs;
  if (fs.existsSync(serverEntryMjs)) {
    serverEntry = serverEntryMjs;
  } else if (fs.existsSync(serverEntryCjs)) {
    serverEntry = serverEntryCjs;
  }

  const preferredPort = Number.parseInt(SERVER_PORT, 10) || 3002;
  const selectedPort = await findAvailablePort(preferredPort);
  const runtimeDir = app.getPath("userData");
  const mediaDir = path.join(runtimeDir, "media");
  const logFilePath = path.join(runtimeDir, "bundled-server.log");

  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.mkdirSync(mediaDir, { recursive: true });
  seedBundledMedia(mediaDir);
  fs.writeFileSync(logFilePath, "", "utf8");

  serverProcess = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PORT: String(selectedPort),
      NODE_ENV: "production",
      VIVIOKE_RUNTIME_DIR: runtimeDir,
      VIVIOKE_MEDIA_DIR: mediaDir,
      VIVIOKE_LOCAL_AUTH: process.env.VIVIOKE_LOCAL_AUTH || "1",
    },
    cwd: runtimeDir,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  if (serverProcess.stdout) {
    serverProcess.stdout.on("data", (chunk) => {
      fs.appendFileSync(logFilePath, chunk.toString());
    });
  }
  if (serverProcess.stderr) {
    serverProcess.stderr.on("data", (chunk) => {
      fs.appendFileSync(logFilePath, chunk.toString());
    });
  }

  return `http://localhost:${selectedPort}`;
}

async function createWindow() {
  const appUrl = await startBundledServerIfNeeded();
  await waitForServer(appUrl, serverProcess, 60000);

  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    title: "Vivioke",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  await mainWindow.loadURL(appUrl);
}

app.whenReady().then(createWindow).catch((error) => {
  console.error("[Electron] startup failed", error);
  dialog.showErrorBox("Vivioke - Falha ao iniciar", String(error));
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});
