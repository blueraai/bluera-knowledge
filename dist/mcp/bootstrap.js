#!/usr/bin/env node

// src/mcp/bootstrap.ts
import { execSync } from "child_process";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
var logDir = join(homedir(), ".bluera", "bluera-knowledge", "logs");
var logFile = join(logDir, "app.log");
var log = (msg, data) => {
  try {
    mkdirSync(logDir, { recursive: true });
    const entry = {
      time: (/* @__PURE__ */ new Date()).toISOString(),
      level: "info",
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
log("Bootstrap starting", { pluginRoot });
if (!existsSync(join(pluginRoot, "node_modules"))) {
  const hasBun = (() => {
    try {
      execSync("which bun", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();
  const cmd = hasBun ? "bun install --frozen-lockfile" : "npm ci --silent";
  log("Dependencies missing, installing", { hasBun, cmd });
  execSync(cmd, { cwd: pluginRoot, stdio: "inherit" });
  log("Dependencies installed");
} else {
  log("Dependencies already installed");
}
log("Loading server module");
var { runMCPServer } = await import("./server.js");
var projectRoot = process.env["PROJECT_ROOT"];
if (projectRoot === void 0) {
  throw new Error("PROJECT_ROOT environment variable is required");
}
log("Starting MCP server", { projectRoot, dataDir: process.env["DATA_DIR"] });
await runMCPServer({
  dataDir: process.env["DATA_DIR"],
  config: process.env["CONFIG_PATH"],
  projectRoot
});
//# sourceMappingURL=bootstrap.js.map