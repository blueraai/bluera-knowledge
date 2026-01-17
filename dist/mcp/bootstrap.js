#!/usr/bin/env node

// src/mcp/bootstrap.ts
import { execSync } from "child_process";
import {
  appendFileSync,
  chmodSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync
} from "fs";
import { get } from "https";
import { arch, homedir, platform } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createGunzip } from "zlib";
var logDir = join(homedir(), ".bluera", "bluera-knowledge", "logs");
var logFile = join(logDir, "app.log");
var log = (level, msg, data) => {
  try {
    mkdirSync(logDir, { recursive: true });
    const entry = {
      time: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      module: "bootstrap",
      msg,
      ...data
    };
    appendFileSync(logFile, `${JSON.stringify(entry)}
`);
  } catch {
  }
};
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var pluginRoot = join(__dirname, "..", "..");
var getVersion = () => {
  try {
    const pkg = JSON.parse(readFileSync(join(pluginRoot, "package.json"), "utf-8"));
    if (typeof pkg === "object" && pkg !== null && "version" in pkg && typeof pkg.version === "string") {
      return `v${pkg.version}`;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
};
var VERSION = getVersion();
var MANIFEST_URL = `https://github.com/blueraai/bluera-knowledge/releases/download/${VERSION}/manifest.json`;
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const request = (targetUrl, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error("Too many redirects"));
        return;
      }
      get(targetUrl, { headers: { "User-Agent": "bluera-knowledge" } }, (res) => {
        const location = res.headers.location;
        if ((res.statusCode === 302 || res.statusCode === 301) && typeof location === "string" && location.length > 0) {
          request(location, redirectCount + 1);
          return;
        }
        const statusCode = res.statusCode ?? 0;
        if (statusCode !== 200) {
          reject(new Error(`HTTP ${String(statusCode)}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => data += chunk.toString());
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        });
      }).on("error", reject);
    };
    request(url);
  });
}
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const request = (targetUrl, redirectCount = 0) => {
      if (redirectCount > 10) {
        reject(new Error("Too many redirects"));
        return;
      }
      get(targetUrl, { headers: { "User-Agent": "bluera-knowledge" } }, (res) => {
        const location = res.headers.location;
        if ((res.statusCode === 302 || res.statusCode === 301) && typeof location === "string" && location.length > 0) {
          request(location, redirectCount + 1);
          return;
        }
        const statusCode = res.statusCode ?? 0;
        if (statusCode !== 200) {
          reject(new Error(`HTTP ${String(statusCode)}`));
          return;
        }
        const file = createWriteStream(destPath);
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
        file.on("error", (err) => {
          file.close();
          reject(err);
        });
      }).on("error", reject);
    };
    request(url);
  });
}
function extractTar(tarPath, destDir) {
  return new Promise((resolve, reject) => {
    const gunzip = createGunzip();
    const input = createReadStream(tarPath);
    let buffer = Buffer.alloc(0);
    let currentFile = null;
    let bytesRemaining = 0;
    let fileStream = null;
    const parseHeader = (header) => {
      if (header.every((b) => b === 0)) {
        return null;
      }
      const name = header.subarray(0, 100).toString("utf-8").replace(/\0/g, "");
      const mode = parseInt(header.subarray(100, 108).toString("utf-8").trim(), 8);
      const size = parseInt(header.subarray(124, 136).toString("utf-8").trim(), 8);
      const typeByte = header[156];
      const typeFlag = typeByte !== void 0 ? String.fromCharCode(typeByte) : "0";
      let type = "file";
      if (typeFlag === "5") type = "directory";
      else if (typeFlag === "2") type = "symlink";
      return { name, size, type, mode: isNaN(mode) ? 420 : mode };
    };
    const processChunk = (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length > 0) {
        if (currentFile === null) {
          if (buffer.length < 512) break;
          const header = buffer.subarray(0, 512);
          buffer = buffer.subarray(512);
          const parsed = parseHeader(header);
          if (parsed === null) {
            continue;
          }
          currentFile = parsed;
          bytesRemaining = currentFile.size;
          let filePath = currentFile.name;
          if (filePath.startsWith("./")) {
            filePath = filePath.slice(2);
          }
          if (filePath.length === 0 || filePath === ".") {
            currentFile = null;
            continue;
          }
          const fullPath = join(destDir, filePath);
          if (currentFile.type === "directory") {
            mkdirSync(fullPath, { recursive: true });
            currentFile = null;
          } else if (currentFile.type === "file" && bytesRemaining > 0) {
            mkdirSync(dirname(fullPath), { recursive: true });
            fileStream = createWriteStream(fullPath, {
              mode: currentFile.mode
            });
          } else if (currentFile.type === "file" && bytesRemaining === 0) {
            mkdirSync(dirname(fullPath), { recursive: true });
            createWriteStream(fullPath, { mode: currentFile.mode }).close();
            currentFile = null;
          } else {
            currentFile = null;
          }
        } else {
          const toRead = Math.min(bytesRemaining, buffer.length);
          if (fileStream !== null && toRead > 0) {
            fileStream.write(buffer.subarray(0, toRead));
          }
          buffer = buffer.subarray(toRead);
          bytesRemaining -= toRead;
          if (bytesRemaining === 0) {
            if (fileStream !== null) {
              const stream = fileStream;
              const file = currentFile;
              stream.end(() => {
                if ((file.mode & 73) !== 0) {
                  try {
                    const fullPath = join(
                      destDir,
                      file.name.startsWith("./") ? file.name.slice(2) : file.name
                    );
                    chmodSync(fullPath, file.mode);
                  } catch {
                  }
                }
              });
              fileStream = null;
            }
            currentFile = null;
            const padding = (512 - toRead % 512) % 512;
            if (buffer.length >= padding) {
              buffer = buffer.subarray(padding);
            }
          }
        }
      }
    };
    input.pipe(gunzip).on("data", processChunk).on("end", () => {
      if (fileStream !== null) {
        fileStream.end();
      }
      resolve();
    }).on("error", reject);
  });
}
function isManifest(value) {
  return typeof value === "object" && value !== null && "version" in value && "platforms" in value && typeof value.platforms === "object";
}
async function downloadPrebuilt() {
  const plat = platform();
  const ar = arch();
  const platformKey = `${plat}-${ar}`;
  try {
    log("info", "Checking for prebuilt binary", { platformKey, version: VERSION });
    const manifestData = await fetchJSON(MANIFEST_URL);
    if (!isManifest(manifestData)) {
      log("info", "Invalid manifest format");
      return false;
    }
    const platformInfo = manifestData.platforms[platformKey];
    if (platformInfo === void 0) {
      log("info", "No prebuilt binary available for platform", { platformKey });
      return false;
    }
    log("info", "Downloading prebuilt binary", { url: platformInfo.url });
    const tmpDir = join(homedir(), ".bluera", "tmp");
    mkdirSync(tmpDir, { recursive: true });
    const tarPath = join(tmpDir, `bluera-knowledge-${platformKey}.tar.gz`);
    await downloadFile(platformInfo.url, tarPath);
    log("info", "Download complete, extracting", { tarPath, destDir: pluginRoot });
    await extractTar(tarPath, pluginRoot);
    try {
      unlinkSync(tarPath);
    } catch {
    }
    log("info", "Prebuilt binary installed successfully");
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("debug", "Prebuilt download failed, will use package manager", {
      error: message
    });
    return false;
  }
}
function installWithPackageManager() {
  const hasBun = (() => {
    try {
      execSync("which bun", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();
  const cmd = hasBun ? "bun install --frozen-lockfile" : "npm ci --silent";
  log("info", "Installing dependencies with package manager", { hasBun, cmd });
  execSync(cmd, { cwd: pluginRoot, stdio: "inherit" });
  log("info", "Dependencies installed via package manager");
}
async function ensureDependencies() {
  if (existsSync(join(pluginRoot, "node_modules"))) {
    log("info", "Dependencies already installed");
    return;
  }
  const prebuiltSuccess = await downloadPrebuilt();
  if (prebuiltSuccess) {
    return;
  }
  installWithPackageManager();
}
log("info", "Bootstrap starting", { pluginRoot, version: VERSION });
await ensureDependencies();
log("info", "Loading server module");
var { runMCPServer } = await import("./server.js");
var projectRoot = process.env["PROJECT_ROOT"];
if (projectRoot === void 0) {
  throw new Error("PROJECT_ROOT environment variable is required");
}
log("info", "Starting MCP server", {
  projectRoot,
  dataDir: process.env["DATA_DIR"]
});
await runMCPServer({
  dataDir: process.env["DATA_DIR"],
  config: process.env["CONFIG_PATH"],
  projectRoot
});
//# sourceMappingURL=bootstrap.js.map