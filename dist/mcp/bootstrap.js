#!/usr/bin/env node

// src/mcp/bootstrap.ts
import { execSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var pluginRoot = join(__dirname, "..", "..");
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
  execSync(cmd, { cwd: pluginRoot, stdio: "inherit" });
}
var { runMCPServer } = await import("./server.js");
var projectRoot = process.env["PROJECT_ROOT"];
if (projectRoot === void 0) {
  throw new Error("PROJECT_ROOT environment variable is required");
}
await runMCPServer({
  dataDir: process.env["DATA_DIR"],
  config: process.env["CONFIG_PATH"],
  projectRoot
});
//# sourceMappingURL=bootstrap.js.map