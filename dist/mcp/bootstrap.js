#!/usr/bin/env node

// src/mcp/bootstrap.ts
import { execSync } from "child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync
} from "fs";
import { homedir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
var envProjectRoot = process.env["PROJECT_ROOT"];
var logDir = envProjectRoot !== void 0 && envProjectRoot !== "" ? join(envProjectRoot, ".bluera", "bluera-knowledge", "logs") : join(homedir(), ".bluera", "bluera-knowledge", "logs");
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
var installLockFile = join(pluginRoot, ".node_modules_installing");
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
  try {
    const output = execSync(cmd, { cwd: pluginRoot, stdio: "pipe" });
    if (output.length > 0) {
      log("debug", "Install output", { output: output.toString().trim() });
    }
    log("info", "Dependencies installed via package manager");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = { message: errorMessage };
    if (typeof error === "object" && error !== null) {
      if ("stdout" in error && Buffer.isBuffer(error.stdout)) {
        errorDetails["stdout"] = error.stdout.toString().trim();
      }
      if ("stderr" in error && Buffer.isBuffer(error.stderr)) {
        errorDetails["stderr"] = error.stderr.toString().trim();
      }
    }
    log("error", "Dependency installation failed", errorDetails);
    throw error;
  }
}
function ensureDependencies() {
  const nodeModulesPath = join(pluginRoot, "node_modules");
  if (existsSync(installLockFile)) {
    log("info", "Detected interrupted install, cleaning up");
    rmSync(nodeModulesPath, { recursive: true, force: true });
    unlinkSync(installLockFile);
  }
  if (existsSync(nodeModulesPath)) {
    log("info", "Dependencies already installed");
    return;
  }
  writeFileSync(installLockFile, (/* @__PURE__ */ new Date()).toISOString());
  installWithPackageManager();
  unlinkSync(installLockFile);
}
var VERSION = getVersion();
log("info", "Bootstrap starting", { pluginRoot, version: VERSION });
ensureDependencies();
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