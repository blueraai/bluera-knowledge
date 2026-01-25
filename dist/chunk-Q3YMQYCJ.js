import {
  createDocumentId,
  createStoreId
} from "./chunk-CLIMKLTW.js";
import {
  parseIgnorePatternsForScanning
} from "./chunk-UIU36LNA.js";

// src/analysis/adapter-registry.ts
var AdapterRegistry = class _AdapterRegistry {
  static instance;
  /** Map from languageId to adapter */
  adaptersByLanguageId = /* @__PURE__ */ new Map();
  /** Map from extension to adapter */
  adaptersByExtension = /* @__PURE__ */ new Map();
  constructor() {
  }
  /**
   * Get the singleton instance of the registry.
   */
  static getInstance() {
    _AdapterRegistry.instance ??= new _AdapterRegistry();
    return _AdapterRegistry.instance;
  }
  /**
   * Reset the singleton instance (for testing).
   */
  static resetInstance() {
    _AdapterRegistry.instance = void 0;
  }
  /**
   * Register a language adapter.
   *
   * @param adapter - The adapter to register
   * @throws If a different adapter with the same extension is already registered
   */
  register(adapter) {
    if (this.adaptersByLanguageId.has(adapter.languageId)) {
      return;
    }
    for (const ext of adapter.extensions) {
      const normalizedExt = this.normalizeExtension(ext);
      const existingAdapter = this.adaptersByExtension.get(normalizedExt);
      if (existingAdapter !== void 0) {
        throw new Error(
          `Extension "${normalizedExt}" is already registered by adapter "${existingAdapter.languageId}"`
        );
      }
    }
    this.adaptersByLanguageId.set(adapter.languageId, adapter);
    for (const ext of adapter.extensions) {
      const normalizedExt = this.normalizeExtension(ext);
      this.adaptersByExtension.set(normalizedExt, adapter);
    }
  }
  /**
   * Unregister a language adapter by its language ID.
   *
   * @param languageId - The language ID to unregister
   * @returns true if the adapter was found and removed, false otherwise
   */
  unregister(languageId) {
    const adapter = this.adaptersByLanguageId.get(languageId);
    if (adapter === void 0) {
      return false;
    }
    this.adaptersByLanguageId.delete(languageId);
    for (const ext of adapter.extensions) {
      const normalizedExt = this.normalizeExtension(ext);
      this.adaptersByExtension.delete(normalizedExt);
    }
    return true;
  }
  /**
   * Get an adapter by file extension.
   *
   * @param ext - File extension (with or without leading dot)
   * @returns The adapter if found, undefined otherwise
   */
  getByExtension(ext) {
    const normalizedExt = this.normalizeExtension(ext);
    return this.adaptersByExtension.get(normalizedExt);
  }
  /**
   * Get an adapter by language ID.
   *
   * @param languageId - The unique language identifier
   * @returns The adapter if found, undefined otherwise
   */
  getByLanguageId(languageId) {
    return this.adaptersByLanguageId.get(languageId);
  }
  /**
   * Get all registered adapters.
   *
   * @returns Array of all registered adapters
   */
  getAllAdapters() {
    return Array.from(this.adaptersByLanguageId.values());
  }
  /**
   * Check if an extension is registered.
   *
   * @param ext - File extension (with or without leading dot)
   * @returns true if the extension is registered
   */
  hasExtension(ext) {
    const normalizedExt = this.normalizeExtension(ext);
    return this.adaptersByExtension.has(normalizedExt);
  }
  /**
   * Normalize extension to always have a leading dot.
   */
  normalizeExtension(ext) {
    return ext.startsWith(".") ? ext : `.${ext}`;
  }
};

// src/logging/logger.ts
import { mkdirSync, existsSync as existsSync2 } from "fs";
import { join as join2 } from "path";
import pino from "pino";

// src/services/project-root.service.ts
import { existsSync, statSync, realpathSync } from "fs";
import { dirname, join, normalize, sep } from "path";
var ProjectRootService = class {
  /**
   * Resolve project root directory using hierarchical detection.
   */
  static resolve(options) {
    if (options?.projectRoot !== void 0 && options.projectRoot !== "") {
      return this.normalize(options.projectRoot);
    }
    const projectRootEnv = process.env["PROJECT_ROOT"];
    if (projectRootEnv !== void 0 && projectRootEnv !== "") {
      return this.normalize(projectRootEnv);
    }
    const gitRoot = this.findGitRoot(process.cwd());
    if (gitRoot !== null) {
      return gitRoot;
    }
    const pwdEnv = process.env["PWD"];
    if (pwdEnv !== void 0 && pwdEnv !== "") {
      return this.normalize(pwdEnv);
    }
    return process.cwd();
  }
  /**
   * Find git repository root by walking up the directory tree looking for .git
   */
  static findGitRoot(startPath) {
    let currentPath = normalize(startPath);
    const root = normalize(sep);
    while (currentPath !== root) {
      const gitPath = join(currentPath, ".git");
      if (existsSync(gitPath)) {
        try {
          const stats = statSync(gitPath);
          if (stats.isDirectory() || stats.isFile()) {
            return currentPath;
          }
        } catch {
        }
      }
      const parentPath = dirname(currentPath);
      if (parentPath === currentPath) {
        break;
      }
      currentPath = parentPath;
    }
    return null;
  }
  /**
   * Normalize path by resolving symlinks and normalizing separators
   */
  static normalize(path4) {
    try {
      const realPath = realpathSync(path4);
      return normalize(realPath);
    } catch {
      return normalize(path4);
    }
  }
  /**
   * Validate that a path exists and is a directory
   */
  static validate(path4) {
    try {
      const stats = statSync(path4);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
};

// src/logging/logger.ts
var VALID_LEVELS = ["trace", "debug", "info", "warn", "error", "fatal"];
var VALID_LEVELS_SET = new Set(VALID_LEVELS);
function getLogDir() {
  const projectRoot = ProjectRootService.resolve();
  return join2(projectRoot, ".bluera", "bluera-knowledge", "logs");
}
function ensureLogDir() {
  const logDir = getLogDir();
  if (!existsSync2(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
  return logDir;
}
function isValidLogLevel(level) {
  return VALID_LEVELS_SET.has(level);
}
function getLogLevel() {
  const level = process.env["LOG_LEVEL"]?.toLowerCase();
  if (level === void 0 || level === "") {
    return "info";
  }
  if (!isValidLogLevel(level)) {
    throw new Error(`Invalid LOG_LEVEL: "${level}". Valid values: ${VALID_LEVELS.join(", ")}`);
  }
  return level;
}
var rootLogger = null;
function initializeLogger() {
  if (rootLogger !== null) {
    return rootLogger;
  }
  const logDir = ensureLogDir();
  const logFile = join2(logDir, "app.log");
  const level = getLogLevel();
  const options = {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label })
    },
    transport: {
      target: "pino-roll",
      options: {
        file: logFile,
        size: "10m",
        // 10MB rotation
        limit: { count: 5 },
        // Keep 5 rotated files
        mkdir: true
      }
    }
  };
  rootLogger = pino(options);
  return rootLogger;
}
function createLogger(module) {
  const root = initializeLogger();
  return root.child({ module });
}
function isLevelEnabled(level) {
  const currentLevel = getLogLevel();
  const currentIndex = VALID_LEVELS.indexOf(currentLevel);
  const checkIndex = VALID_LEVELS.indexOf(level);
  return checkIndex >= currentIndex;
}
function getLogDirectory() {
  return getLogDir();
}
function shutdownLogger() {
  return new Promise((resolve4) => {
    if (rootLogger !== null) {
      rootLogger.flush();
      setTimeout(() => {
        rootLogger = null;
        resolve4();
      }, 100);
    } else {
      resolve4();
    }
  });
}

// src/logging/payload.ts
import { createHash } from "crypto";
import { writeFileSync, mkdirSync as mkdirSync2, existsSync as existsSync3 } from "fs";
import { join as join3 } from "path";
var MAX_PREVIEW_LENGTH = 500;
var PAYLOAD_DUMP_THRESHOLD = 1e4;
function getPayloadDir() {
  const dir = join3(getLogDirectory(), "payload");
  if (!existsSync3(dir)) {
    mkdirSync2(dir, { recursive: true });
  }
  return dir;
}
function safeFilename(identifier) {
  return identifier.replace(/[^a-zA-Z0-9-]/g, "_").substring(0, 50);
}
function summarizePayload(content, type, identifier, dumpFull = isLevelEnabled("trace")) {
  const sizeBytes = Buffer.byteLength(content, "utf8");
  const hash = createHash("md5").update(content).digest("hex").substring(0, 12);
  const preview = truncateForLog(content, MAX_PREVIEW_LENGTH);
  const baseSummary = { preview, sizeBytes, hash };
  if (dumpFull && sizeBytes > PAYLOAD_DUMP_THRESHOLD) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const safeId = safeFilename(identifier);
    const filename = `${timestamp}-${type}-${safeId}-${hash}.json`;
    const filepath = join3(getPayloadDir(), filename);
    writeFileSync(
      filepath,
      JSON.stringify(
        {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          type,
          identifier,
          sizeBytes,
          content
        },
        null,
        2
      )
    );
    return { ...baseSummary, payloadFile: filename };
  }
  return baseSummary;
}
function truncateForLog(content, maxLength = MAX_PREVIEW_LENGTH) {
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.substring(0, maxLength)}... [truncated]`;
}

// src/services/job.service.ts
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

// src/types/job.ts
import { z } from "zod";
var JobTypeSchema = z.enum(["clone", "index", "crawl"]);
var JobStatusSchema = z.enum(["pending", "running", "completed", "failed", "cancelled"]);
var JobDetailsSchema = z.object({
  storeName: z.string().optional(),
  storeId: z.string().optional(),
  url: z.string().optional(),
  path: z.string().optional(),
  filesProcessed: z.number().optional(),
  totalFiles: z.number().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  error: z.string().optional(),
  // Crawl-specific fields
  crawlInstruction: z.string().optional(),
  extractInstruction: z.string().optional(),
  maxPages: z.number().optional(),
  simple: z.boolean().optional(),
  useHeadless: z.boolean().optional(),
  pagesCrawled: z.number().optional()
});
var JobSchema = z.object({
  id: z.string(),
  type: JobTypeSchema,
  status: JobStatusSchema,
  progress: z.number().min(0).max(100),
  message: z.string(),
  details: JobDetailsSchema.default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

// src/types/result.ts
function ok(data) {
  return { success: true, data };
}
function err(error) {
  return { success: false, error };
}

// src/utils/atomic-write.ts
import { writeFileSync as writeFileSync2, renameSync, mkdirSync as mkdirSync3 } from "fs";
import { writeFile, rename, mkdir } from "fs/promises";
import { dirname as dirname2 } from "path";
async function atomicWriteFile(filePath, content) {
  await mkdir(dirname2(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp.${String(Date.now())}.${String(process.pid)}`;
  await writeFile(tempPath, content, "utf-8");
  await rename(tempPath, filePath);
}
function atomicWriteFileSync(filePath, content) {
  mkdirSync3(dirname2(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp.${String(Date.now())}.${String(process.pid)}`;
  writeFileSync2(tempPath, content, "utf-8");
  renameSync(tempPath, filePath);
}

// src/services/job.service.ts
var JobService = class {
  jobsDir;
  constructor(dataDir) {
    let baseDir;
    if (dataDir !== void 0) {
      baseDir = dataDir;
    } else {
      const homeDir = process.env["HOME"] ?? process.env["USERPROFILE"];
      if (homeDir === void 0) {
        throw new Error("HOME or USERPROFILE environment variable is required");
      }
      baseDir = path.join(homeDir, ".local/share/bluera-knowledge");
    }
    this.jobsDir = path.join(baseDir, "jobs");
    if (!fs.existsSync(this.jobsDir)) {
      fs.mkdirSync(this.jobsDir, { recursive: true });
    }
  }
  /**
   * Create a new job
   */
  createJob(params) {
    const job = {
      id: `job_${randomUUID().replace(/-/g, "").substring(0, 12)}`,
      type: params.type,
      status: "pending",
      progress: 0,
      message: params.message ?? `${params.type} job created`,
      details: params.details,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.writeJob(job);
    return job;
  }
  /**
   * Update an existing job
   */
  updateJob(jobId, updates) {
    const job = this.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    if (updates.status !== void 0) {
      job.status = updates.status;
    }
    if (updates.progress !== void 0) {
      job.progress = updates.progress;
    }
    if (updates.message !== void 0) {
      job.message = updates.message;
    }
    if (updates.details !== void 0) {
      job.details = { ...job.details, ...updates.details };
    }
    job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.writeJob(job);
  }
  /**
   * Get a job by ID
   */
  getJob(jobId) {
    const jobFile = path.join(this.jobsDir, `${jobId}.json`);
    if (!fs.existsSync(jobFile)) {
      return null;
    }
    try {
      const content = fs.readFileSync(jobFile, "utf-8");
      return JobSchema.parse(JSON.parse(content));
    } catch (error) {
      throw new Error(
        `Failed to read job ${jobId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  /**
   * List all jobs with optional status filter
   */
  listJobs(statusFilter) {
    if (!fs.existsSync(this.jobsDir)) {
      return [];
    }
    const files = fs.readdirSync(this.jobsDir);
    const jobs = [];
    for (const file of files) {
      if (!file.endsWith(".json") || file.endsWith(".pid")) {
        continue;
      }
      try {
        const content = fs.readFileSync(path.join(this.jobsDir, file), "utf-8");
        const job = JobSchema.parse(JSON.parse(content));
        if (statusFilter !== void 0) {
          const filters = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
          if (filters.includes(job.status)) {
            jobs.push(job);
          }
        } else {
          jobs.push(job);
        }
      } catch (error) {
        throw new Error(
          `Failed to read job file ${file}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    jobs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return jobs;
  }
  /**
   * List active jobs (pending or running)
   */
  listActiveJobs() {
    return this.listJobs(["pending", "running"]);
  }
  /**
   * Cancel a job
   */
  cancelJob(jobId) {
    const job = this.getJob(jobId);
    if (!job) {
      return err(new Error(`Job ${jobId} not found`));
    }
    if (job.status === "completed" || job.status === "failed") {
      return err(new Error(`Cannot cancel ${job.status} job`));
    }
    if (job.status === "cancelled") {
      return ok(void 0);
    }
    this.updateJob(jobId, {
      status: "cancelled",
      message: "Job cancelled by user",
      details: { cancelledAt: (/* @__PURE__ */ new Date()).toISOString() }
    });
    const pidFile = path.join(this.jobsDir, `${jobId}.pid`);
    if (fs.existsSync(pidFile)) {
      try {
        const pid = parseInt(fs.readFileSync(pidFile, "utf-8"), 10);
        if (!Number.isNaN(pid) && Number.isInteger(pid) && pid > 0) {
          process.kill(pid, "SIGTERM");
        }
      } catch {
      }
      try {
        fs.unlinkSync(pidFile);
      } catch {
      }
    }
    return ok(void 0);
  }
  /**
   * Clean up old completed/failed/cancelled jobs
   */
  cleanupOldJobs(olderThanHours = 24) {
    const jobs = this.listJobs();
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1e3;
    let cleaned = 0;
    for (const job of jobs) {
      if ((job.status === "completed" || job.status === "failed" || job.status === "cancelled") && new Date(job.updatedAt).getTime() < cutoffTime) {
        const jobFile = path.join(this.jobsDir, `${job.id}.json`);
        try {
          fs.unlinkSync(jobFile);
          cleaned++;
        } catch (error) {
          throw new Error(
            `Failed to delete job file ${job.id}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }
    return cleaned;
  }
  /**
   * Clean up stale pending jobs that never started or got stuck
   *
   * @param olderThanHours - Consider pending jobs stale after this many hours (default 2)
   * @param options - Options for cleanup behavior
   * @param options.markAsFailed - If true, mark jobs as failed instead of deleting
   * @returns Number of jobs cleaned up or marked as failed
   */
  cleanupStalePendingJobs(olderThanHours = 2, options = {}) {
    const jobs = this.listJobs();
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1e3;
    let cleaned = 0;
    for (const job of jobs) {
      if (job.status === "pending" && new Date(job.updatedAt).getTime() < cutoffTime) {
        const jobFile = path.join(this.jobsDir, `${job.id}.json`);
        if (options.markAsFailed === true) {
          this.updateJob(job.id, {
            status: "failed",
            message: `Job marked as stale - pending for over ${String(olderThanHours)} hours without progress`
          });
        } else {
          try {
            fs.unlinkSync(jobFile);
          } catch (error) {
            throw new Error(
              `Failed to delete stale job ${job.id}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
        cleaned++;
      }
    }
    return cleaned;
  }
  /**
   * Delete a specific job
   */
  deleteJob(jobId) {
    const jobFile = path.join(this.jobsDir, `${jobId}.json`);
    if (!fs.existsSync(jobFile)) {
      return false;
    }
    try {
      fs.unlinkSync(jobFile);
      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete job ${jobId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  /**
   * Write job to file
   */
  writeJob(job) {
    const jobFile = path.join(this.jobsDir, `${job.id}.json`);
    atomicWriteFileSync(jobFile, JSON.stringify(job, null, 2));
  }
};

// src/services/code-graph.service.ts
import { readFile, writeFile as writeFile2, mkdir as mkdir2, rm } from "fs/promises";
import { join as join4, dirname as dirname3 } from "path";

// src/analysis/ast-parser.ts
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import * as t from "@babel/types";
function getTraverse(mod) {
  if (typeof mod === "function") {
    return mod;
  }
  if (mod !== null && typeof mod === "object" && "default" in mod) {
    const withDefault = mod;
    if (typeof withDefault.default === "function") {
      return withDefault.default;
    }
  }
  throw new Error("Invalid traverse module export");
}
var traverse = getTraverse(traverseModule);
var ASTParser = class {
  parse(code, language) {
    try {
      const plugins = ["jsx"];
      if (language === "typescript") {
        plugins.push("typescript");
      }
      const ast = parse(code, {
        sourceType: "module",
        plugins
      });
      const nodes = [];
      traverse(ast, {
        FunctionDeclaration: (path4) => {
          const node = path4.node;
          if (!node.id) return;
          const exported = path4.parent.type === "ExportNamedDeclaration" || path4.parent.type === "ExportDefaultDeclaration";
          nodes.push({
            type: "function",
            name: node.id.name,
            exported,
            async: node.async,
            startLine: node.loc?.start.line ?? 0,
            endLine: node.loc?.end.line ?? 0,
            signature: this.extractFunctionSignature(node)
          });
        },
        ClassDeclaration: (path4) => {
          const node = path4.node;
          if (!node.id) return;
          const exported = path4.parent.type === "ExportNamedDeclaration" || path4.parent.type === "ExportDefaultDeclaration";
          const methods = [];
          for (const member of node.body.body) {
            if (t.isClassMethod(member) && t.isIdentifier(member.key)) {
              methods.push({
                name: member.key.name,
                async: member.async,
                signature: this.extractMethodSignature(member),
                startLine: member.loc?.start.line ?? 0,
                endLine: member.loc?.end.line ?? 0
              });
            }
          }
          nodes.push({
            type: "class",
            name: node.id.name,
            exported,
            startLine: node.loc?.start.line ?? 0,
            endLine: node.loc?.end.line ?? 0,
            methods
          });
        },
        TSInterfaceDeclaration: (path4) => {
          const node = path4.node;
          const exported = path4.parent.type === "ExportNamedDeclaration";
          nodes.push({
            type: "interface",
            name: node.id.name,
            exported,
            startLine: node.loc?.start.line ?? 0,
            endLine: node.loc?.end.line ?? 0
          });
        }
      });
      return nodes;
    } catch {
      return [];
    }
  }
  extractImports(code) {
    try {
      const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"]
      });
      const imports = [];
      traverse(ast, {
        ImportDeclaration: (path4) => {
          const node = path4.node;
          const specifiers = [];
          for (const spec of node.specifiers) {
            if (t.isImportDefaultSpecifier(spec)) {
              specifiers.push(spec.local.name);
            } else if (t.isImportSpecifier(spec)) {
              specifiers.push(spec.local.name);
            } else if (t.isImportNamespaceSpecifier(spec)) {
              specifiers.push(spec.local.name);
            }
          }
          imports.push({
            source: node.source.value,
            specifiers,
            isType: node.importKind === "type"
          });
        }
      });
      return imports;
    } catch {
      return [];
    }
  }
  extractFunctionSignature(node) {
    const params = node.params.map((p) => {
      if (t.isIdentifier(p)) return p.name;
      return "param";
    }).join(", ");
    return `${node.id?.name ?? "anonymous"}(${params})`;
  }
  extractMethodSignature(node) {
    const params = node.params.map((p) => {
      if (t.isIdentifier(p)) return p.name;
      return "param";
    }).join(", ");
    const name = t.isIdentifier(node.key) ? node.key.name : "method";
    return `${name}(${params})`;
  }
};

// src/analysis/code-graph.ts
var CodeGraph = class {
  nodes = /* @__PURE__ */ new Map();
  edges = /* @__PURE__ */ new Map();
  addNodes(nodes, file) {
    for (const node of nodes) {
      const id = `${file}:${node.name}`;
      const graphNode = {
        id,
        file,
        type: node.type,
        name: node.name,
        exported: node.exported,
        startLine: node.startLine,
        endLine: node.endLine
      };
      if (node.signature !== void 0) {
        graphNode.signature = node.signature;
      }
      this.nodes.set(id, graphNode);
      if (!this.edges.has(id)) {
        this.edges.set(id, []);
      }
      if (node.type === "class" && node.methods !== void 0) {
        for (const method of node.methods) {
          const methodId = `${file}:${node.name}.${method.name}`;
          const methodNode = {
            id: methodId,
            file,
            type: "method",
            name: method.name,
            exported: node.exported,
            // Methods inherit export status from class
            startLine: method.startLine,
            endLine: method.endLine,
            signature: method.signature
          };
          this.nodes.set(methodId, methodNode);
          if (!this.edges.has(methodId)) {
            this.edges.set(methodId, []);
          }
        }
      }
    }
  }
  addImport(fromFile, toFile, specifiers) {
    const resolvedTo = this.resolveImportPath(fromFile, toFile);
    for (const spec of specifiers) {
      const edge = {
        from: fromFile,
        to: `${resolvedTo}:${spec}`,
        type: "imports",
        confidence: 1
      };
      const edges = this.edges.get(fromFile) ?? [];
      edges.push(edge);
      this.edges.set(fromFile, edges);
    }
  }
  analyzeCallRelationships(code, file, functionName) {
    const nodeId = `${file}:${functionName}`;
    const callPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    const calls = /* @__PURE__ */ new Set();
    let match;
    while ((match = callPattern.exec(code)) !== null) {
      if (match[1] !== void 0 && match[1] !== "") {
        calls.add(match[1]);
      }
    }
    const edges = this.edges.get(nodeId) ?? [];
    for (const calledFunction of calls) {
      const targetNode = this.findNodeByName(calledFunction);
      if (targetNode) {
        edges.push({
          from: nodeId,
          to: targetNode.id,
          type: "calls",
          confidence: 0.8
          // Lower confidence for regex-based detection
        });
      } else {
        edges.push({
          from: nodeId,
          to: `unknown:${calledFunction}`,
          type: "calls",
          confidence: 0.5
        });
      }
    }
    this.edges.set(nodeId, edges);
  }
  getNode(id) {
    return this.nodes.get(id);
  }
  getEdges(nodeId) {
    return this.edges.get(nodeId) ?? [];
  }
  /**
   * Add an edge to the graph (used when restoring from serialized data)
   */
  addEdge(edge) {
    const edges = this.edges.get(edge.from) ?? [];
    edges.push(edge);
    this.edges.set(edge.from, edges);
  }
  /**
   * Add a graph node directly (used when restoring from serialized data)
   */
  addGraphNode(node) {
    this.nodes.set(node.id, node);
    if (!this.edges.has(node.id)) {
      this.edges.set(node.id, []);
    }
  }
  /**
   * Get edges where this node is the target (callers of this function)
   */
  getIncomingEdges(nodeId) {
    const incoming = [];
    for (const edges of this.edges.values()) {
      for (const edge of edges) {
        if (edge.to === nodeId) {
          incoming.push(edge);
        }
      }
    }
    return incoming;
  }
  /**
   * Count how many nodes call this node
   */
  getCalledByCount(nodeId) {
    return this.getIncomingEdges(nodeId).filter((e) => e.type === "calls").length;
  }
  /**
   * Count how many nodes this node calls
   */
  getCallsCount(nodeId) {
    return this.getEdges(nodeId).filter((e) => e.type === "calls").length;
  }
  getAllNodes() {
    return Array.from(this.nodes.values());
  }
  findNodeByName(name) {
    for (const node of this.nodes.values()) {
      if (node.name === name) {
        return node;
      }
    }
    return void 0;
  }
  resolveImportPath(fromFile, importPath) {
    if (importPath.startsWith(".")) {
      const fromDir = fromFile.split("/").slice(0, -1).join("/");
      const parts = importPath.split("/");
      let resolved = fromDir;
      for (const part of parts) {
        if (part === "..") {
          resolved = resolved.split("/").slice(0, -1).join("/");
        } else if (part !== ".") {
          resolved += `/${part}`;
        }
      }
      return resolved.replace(/\.js$/, "");
    }
    return importPath;
  }
  toJSON() {
    const allEdges = [];
    for (const edges of this.edges.values()) {
      allEdges.push(...edges);
    }
    return {
      nodes: Array.from(this.nodes.values()),
      edges: allEdges.map((e) => ({
        from: e.from,
        to: e.to,
        type: e.type,
        confidence: e.confidence
      }))
    };
  }
};

// src/analysis/tree-sitter-parser.ts
import Parser from "tree-sitter";
import Go from "tree-sitter-go";
import Rust from "tree-sitter-rust";
function createRustParser() {
  const parser = new Parser();
  parser.setLanguage(Rust);
  return parser;
}
function parseRustCode(code) {
  try {
    const parser = createRustParser();
    return parser.parse(code);
  } catch {
    return null;
  }
}
function createGoParser() {
  const parser = new Parser();
  parser.setLanguage(Go);
  return parser;
}
function parseGoCode(code) {
  try {
    const parser = createGoParser();
    return parser.parse(code);
  } catch {
    return null;
  }
}
function positionToLineNumber(position) {
  return position.row + 1;
}
function getFirstChildOfType(node, type) {
  return node.children.find((child) => child.type === type) ?? null;
}
function getChildByFieldName(node, fieldName) {
  return node.childForFieldName(fieldName);
}
function hasVisibilityModifier(node) {
  return node.children.some((child) => child.type === "visibility_modifier");
}
function isAsyncFunction(node) {
  return node.children.some((child) => child.type === "async" || child.text === "async");
}
function getFunctionSignature(node) {
  const nameNode = getChildByFieldName(node, "name");
  const parametersNode = getChildByFieldName(node, "parameters");
  const returnTypeNode = getChildByFieldName(node, "return_type");
  const typeParametersNode = getChildByFieldName(node, "type_parameters");
  if (nameNode === null) {
    return "";
  }
  let signature = nameNode.text;
  if (typeParametersNode !== null) {
    signature += typeParametersNode.text;
  }
  if (parametersNode !== null) {
    signature += parametersNode.text;
  }
  if (returnTypeNode !== null) {
    signature += ` ${returnTypeNode.text}`;
  }
  return signature;
}
function queryNodesByType(tree, nodeType) {
  const types = Array.isArray(nodeType) ? nodeType : [nodeType];
  return tree.rootNode.descendantsOfType(types);
}
function extractImportPath(useNode) {
  const argumentNode = getChildByFieldName(useNode, "argument");
  if (argumentNode === null) {
    return "";
  }
  return argumentNode.text;
}

// src/analysis/go-ast-parser.ts
var GoASTParser = class {
  /**
   * Parse Go code into CodeNode array
   * @param code Go source code
   * @param filePath File path for error context
   * @returns Array of CodeNode objects representing Go constructs
   */
  parse(code, _filePath) {
    try {
      const tree = parseGoCode(code);
      if (tree === null) {
        return [];
      }
      const nodes = [];
      const functions = this.parseFunctions(tree);
      nodes.push(...functions);
      const structs = this.parseStructs(tree);
      nodes.push(...structs);
      const interfaces = this.parseInterfaces(tree);
      nodes.push(...interfaces);
      const types = this.parseTypeAliases(tree);
      nodes.push(...types);
      const constants = this.parseConstants(tree);
      nodes.push(...constants);
      this.parseMethods(tree, nodes);
      return nodes;
    } catch {
      return [];
    }
  }
  /**
   * Extract imports from Go code
   * @param code Go source code
   * @returns Array of ImportInfo objects
   */
  extractImports(code) {
    try {
      const tree = parseGoCode(code);
      if (tree === null) {
        return [];
      }
      const imports = [];
      const importDecls = queryNodesByType(tree, "import_declaration");
      for (const importDecl of importDecls) {
        const importSpecs = importDecl.descendantsOfType("import_spec");
        for (const spec of importSpecs) {
          const pathNode = getChildByFieldName(spec, "path");
          if (pathNode === null) {
            continue;
          }
          const stringContent = pathNode.descendantsOfType("interpreted_string_literal_content")[0];
          const path4 = stringContent !== void 0 ? stringContent.text : pathNode.text.replace(/"/g, "");
          if (path4 !== "") {
            imports.push({
              source: path4,
              specifiers: [],
              isType: false
            });
          }
        }
      }
      return imports;
    } catch {
      return [];
    }
  }
  /**
   * Parse function declarations
   */
  parseFunctions(tree) {
    const functionNodes = queryNodesByType(tree, "function_declaration");
    const nodes = [];
    for (const fnNode of functionNodes) {
      const nameNode = getChildByFieldName(fnNode, "name");
      if (nameNode === null) {
        continue;
      }
      const name = nameNode.text;
      const exported = this.isExported(name);
      const startLine = positionToLineNumber(fnNode.startPosition);
      const endLine = positionToLineNumber(fnNode.endPosition);
      const signature = getFunctionSignature(fnNode);
      nodes.push({
        type: "function",
        name,
        exported,
        async: false,
        startLine,
        endLine,
        signature
      });
    }
    return nodes;
  }
  /**
   * Parse struct definitions
   */
  parseStructs(tree) {
    const typeDecls = queryNodesByType(tree, "type_declaration");
    const nodes = [];
    for (const typeDecl of typeDecls) {
      const typeSpec = getFirstChildOfType(typeDecl, "type_spec");
      if (typeSpec === null) {
        continue;
      }
      const nameNode = getChildByFieldName(typeSpec, "name");
      const typeNode = getChildByFieldName(typeSpec, "type");
      if (nameNode === null || typeNode === null) {
        continue;
      }
      if (typeNode.type !== "struct_type") {
        continue;
      }
      const name = nameNode.text;
      const exported = this.isExported(name);
      const startLine = positionToLineNumber(typeDecl.startPosition);
      const endLine = positionToLineNumber(typeDecl.endPosition);
      nodes.push({
        type: "class",
        name,
        exported,
        startLine,
        endLine,
        signature: name,
        methods: []
      });
    }
    return nodes;
  }
  /**
   * Parse interface definitions
   */
  parseInterfaces(tree) {
    const typeDecls = queryNodesByType(tree, "type_declaration");
    const nodes = [];
    for (const typeDecl of typeDecls) {
      const typeSpec = getFirstChildOfType(typeDecl, "type_spec");
      if (typeSpec === null) {
        continue;
      }
      const nameNode = getChildByFieldName(typeSpec, "name");
      const typeNode = getChildByFieldName(typeSpec, "type");
      if (nameNode === null || typeNode === null) {
        continue;
      }
      if (typeNode.type !== "interface_type") {
        continue;
      }
      const name = nameNode.text;
      const exported = this.isExported(name);
      const startLine = positionToLineNumber(typeDecl.startPosition);
      const endLine = positionToLineNumber(typeDecl.endPosition);
      const methods = this.extractInterfaceMethods(typeNode);
      nodes.push({
        type: "interface",
        name,
        exported,
        startLine,
        endLine,
        signature: name,
        methods
      });
    }
    return nodes;
  }
  /**
   * Parse type aliases
   */
  parseTypeAliases(tree) {
    const typeDecls = queryNodesByType(tree, "type_declaration");
    const nodes = [];
    for (const typeDecl of typeDecls) {
      const typeSpec = getFirstChildOfType(typeDecl, "type_spec");
      if (typeSpec === null) {
        continue;
      }
      const nameNode = getChildByFieldName(typeSpec, "name");
      const typeNode = getChildByFieldName(typeSpec, "type");
      if (nameNode === null || typeNode === null) {
        continue;
      }
      if (typeNode.type === "struct_type" || typeNode.type === "interface_type") {
        continue;
      }
      const name = nameNode.text;
      const exported = this.isExported(name);
      const startLine = positionToLineNumber(typeDecl.startPosition);
      const endLine = positionToLineNumber(typeDecl.endPosition);
      const signature = `${name} = ${typeNode.text}`;
      nodes.push({
        type: "type",
        name,
        exported,
        startLine,
        endLine,
        signature
      });
    }
    return nodes;
  }
  /**
   * Parse constants and variables
   */
  parseConstants(tree) {
    const nodes = [];
    const constDecls = queryNodesByType(tree, "const_declaration");
    for (const constDecl of constDecls) {
      const specs = constDecl.descendantsOfType("const_spec");
      for (const spec of specs) {
        const nameNode = getChildByFieldName(spec, "name");
        if (nameNode === null) {
          continue;
        }
        const name = nameNode.text;
        const exported = this.isExported(name);
        const startLine = positionToLineNumber(spec.startPosition);
        const endLine = positionToLineNumber(spec.endPosition);
        const typeNode = getChildByFieldName(spec, "type");
        const signature = typeNode !== null ? `${name}: ${typeNode.text}` : name;
        nodes.push({
          type: "const",
          name,
          exported,
          startLine,
          endLine,
          signature
        });
      }
    }
    const varDecls = queryNodesByType(tree, "var_declaration");
    for (const varDecl of varDecls) {
      const specs = varDecl.descendantsOfType("var_spec");
      for (const spec of specs) {
        const nameNode = getChildByFieldName(spec, "name");
        if (nameNode === null) {
          continue;
        }
        const name = nameNode.text;
        const exported = this.isExported(name);
        const startLine = positionToLineNumber(spec.startPosition);
        const endLine = positionToLineNumber(spec.endPosition);
        const typeNode = getChildByFieldName(spec, "type");
        const signature = typeNode !== null ? `${name}: ${typeNode.text}` : name;
        nodes.push({
          type: "const",
          name,
          exported,
          startLine,
          endLine,
          signature
        });
      }
    }
    return nodes;
  }
  /**
   * Parse methods and attach to corresponding structs
   */
  parseMethods(tree, nodes) {
    const methodNodes = queryNodesByType(tree, "method_declaration");
    for (const methodNode of methodNodes) {
      const receiverType = this.getReceiverType(methodNode);
      if (receiverType === null) {
        continue;
      }
      const nameNode = getChildByFieldName(methodNode, "name");
      if (nameNode === null) {
        continue;
      }
      const name = nameNode.text;
      const signature = getFunctionSignature(methodNode);
      const startLine = positionToLineNumber(methodNode.startPosition);
      const endLine = positionToLineNumber(methodNode.endPosition);
      const structNode = nodes.find((node) => node.type === "class" && node.name === receiverType);
      if (structNode?.methods !== void 0) {
        structNode.methods.push({
          name,
          async: false,
          signature,
          startLine,
          endLine
        });
      }
    }
  }
  /**
   * Extract methods from interface definition
   */
  extractInterfaceMethods(interfaceNode) {
    const methods = [];
    const methodElems = interfaceNode.descendantsOfType("method_elem");
    for (const methodElem of methodElems) {
      const nameNode = getChildByFieldName(methodElem, "name");
      if (nameNode === null) {
        continue;
      }
      const name = nameNode.text;
      const signature = getFunctionSignature(methodElem);
      const startLine = positionToLineNumber(methodElem.startPosition);
      const endLine = positionToLineNumber(methodElem.endPosition);
      methods.push({
        name,
        async: false,
        signature,
        startLine,
        endLine
      });
    }
    return methods;
  }
  /**
   * Get the receiver type name for a method
   */
  getReceiverType(methodNode) {
    const receiverNode = getChildByFieldName(methodNode, "receiver");
    if (receiverNode === null) {
      return null;
    }
    const paramDecl = getFirstChildOfType(receiverNode, "parameter_declaration");
    if (paramDecl === null) {
      return null;
    }
    const typeNode = getChildByFieldName(paramDecl, "type");
    if (typeNode === null) {
      return null;
    }
    if (typeNode.type === "pointer_type") {
      const innerType = typeNode.children.find((child) => child.type === "type_identifier");
      return innerType !== void 0 ? innerType.text : null;
    }
    if (typeNode.type === "type_identifier") {
      return typeNode.text;
    }
    return null;
  }
  /**
   * Check if a name is exported (starts with uppercase letter)
   */
  isExported(name) {
    if (name.length === 0) {
      return false;
    }
    const firstChar = name[0];
    if (firstChar === void 0) {
      return false;
    }
    return firstChar === firstChar.toUpperCase();
  }
};

// src/analysis/parser-factory.ts
import path2 from "path";

// src/analysis/python-ast-parser.ts
var PythonASTParser = class {
  constructor(bridge) {
    this.bridge = bridge;
  }
  async parse(code, filePath) {
    const result = await this.bridge.parsePython(code, filePath);
    return result.nodes.map((node) => {
      const codeNode = {
        type: node.type,
        name: node.name,
        exported: node.exported,
        startLine: node.startLine,
        endLine: node.endLine
      };
      if (node.async !== void 0) {
        codeNode.async = node.async;
      }
      if (node.signature !== void 0) {
        codeNode.signature = node.signature;
      }
      if (node.methods !== void 0) {
        codeNode.methods = node.methods;
      }
      return codeNode;
    });
  }
};

// src/analysis/rust-ast-parser.ts
var RustASTParser = class {
  /**
   * Parse Rust code into CodeNode array
   * @param code Rust source code
   * @param filePath File path for error context
   * @returns Array of CodeNode objects representing Rust constructs
   */
  parse(code, _filePath) {
    try {
      const tree = parseRustCode(code);
      if (tree === null) {
        return [];
      }
      const nodes = [];
      const functions = this.parseFunctions(tree);
      nodes.push(...functions);
      const structs = this.parseStructs(tree);
      nodes.push(...structs);
      const traits = this.parseTraits(tree);
      nodes.push(...traits);
      const types = this.parseTypeAliases(tree);
      nodes.push(...types);
      const constants = this.parseConstants(tree);
      nodes.push(...constants);
      this.parseImplBlocks(tree, nodes);
      return nodes;
    } catch {
      return [];
    }
  }
  /**
   * Extract imports from Rust code
   * @param code Rust source code
   * @returns Array of ImportInfo objects
   */
  extractImports(code) {
    try {
      const tree = parseRustCode(code);
      if (tree === null) {
        return [];
      }
      const useDeclarations = queryNodesByType(tree, "use_declaration");
      const imports = [];
      for (const useNode of useDeclarations) {
        const importPath = extractImportPath(useNode);
        if (importPath === "") {
          continue;
        }
        const { source, specifiers } = this.parseImportPath(importPath);
        imports.push({
          source,
          specifiers,
          isType: false
          // Rust doesn't distinguish type-only imports at syntax level
        });
      }
      return imports;
    } catch {
      return [];
    }
  }
  /**
   * Parse function declarations (excluding impl block methods)
   */
  parseFunctions(tree) {
    const functionNodes = queryNodesByType(tree, "function_item");
    const nodes = [];
    for (const fnNode of functionNodes) {
      if (this.isInsideImplBlock(fnNode)) {
        continue;
      }
      const nameNode = getChildByFieldName(fnNode, "name");
      if (nameNode === null) {
        continue;
      }
      const name = nameNode.text;
      const exported = hasVisibilityModifier(fnNode);
      const async = isAsyncFunction(fnNode);
      const startLine = positionToLineNumber(fnNode.startPosition);
      const endLine = positionToLineNumber(fnNode.endPosition);
      const signature = getFunctionSignature(fnNode);
      nodes.push({
        type: "function",
        name,
        exported,
        async,
        startLine,
        endLine,
        signature
      });
    }
    return nodes;
  }
  /**
   * Check if a node is inside an impl block
   */
  isInsideImplBlock(node) {
    let current = node.parent;
    while (current !== null) {
      if (current.type === "impl_item") {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
  /**
   * Parse struct definitions
   */
  parseStructs(tree) {
    const structNodes = queryNodesByType(tree, "struct_item");
    const nodes = [];
    for (const structNode of structNodes) {
      const nameNode = getChildByFieldName(structNode, "name");
      if (nameNode === null) {
        continue;
      }
      const name = nameNode.text;
      const exported = hasVisibilityModifier(structNode);
      const startLine = positionToLineNumber(structNode.startPosition);
      const endLine = positionToLineNumber(structNode.endPosition);
      const typeParamsNode = getChildByFieldName(structNode, "type_parameters");
      const signature = typeParamsNode !== null ? `${name}${typeParamsNode.text}` : name;
      nodes.push({
        type: "class",
        name,
        exported,
        startLine,
        endLine,
        signature,
        methods: []
        // Will be populated by parseImplBlocks
      });
    }
    return nodes;
  }
  /**
   * Parse trait definitions
   */
  parseTraits(tree) {
    const traitNodes = queryNodesByType(tree, "trait_item");
    const nodes = [];
    for (const traitNode of traitNodes) {
      const nameNode = getChildByFieldName(traitNode, "name");
      if (nameNode === null) {
        continue;
      }
      const name = nameNode.text;
      const exported = hasVisibilityModifier(traitNode);
      const startLine = positionToLineNumber(traitNode.startPosition);
      const endLine = positionToLineNumber(traitNode.endPosition);
      const typeParamsNode = getChildByFieldName(traitNode, "type_parameters");
      const signature = typeParamsNode !== null ? `${name}${typeParamsNode.text}` : name;
      const methods = this.extractTraitMethods(traitNode);
      nodes.push({
        type: "interface",
        name,
        exported,
        startLine,
        endLine,
        signature,
        methods
      });
    }
    return nodes;
  }
  /**
   * Parse type aliases
   */
  parseTypeAliases(tree) {
    const typeNodes = queryNodesByType(tree, "type_item");
    const nodes = [];
    for (const typeNode of typeNodes) {
      const nameNode = getChildByFieldName(typeNode, "name");
      if (nameNode === null) {
        continue;
      }
      const name = nameNode.text;
      const exported = hasVisibilityModifier(typeNode);
      const startLine = positionToLineNumber(typeNode.startPosition);
      const endLine = positionToLineNumber(typeNode.endPosition);
      const valueNode = getChildByFieldName(typeNode, "type");
      const signature = valueNode !== null ? `${name} = ${valueNode.text}` : name;
      nodes.push({
        type: "type",
        name,
        exported,
        startLine,
        endLine,
        signature
      });
    }
    return nodes;
  }
  /**
   * Parse constants and statics
   */
  parseConstants(tree) {
    const constNodes = queryNodesByType(tree, ["const_item", "static_item"]);
    const nodes = [];
    for (const constNode of constNodes) {
      const nameNode = getChildByFieldName(constNode, "name");
      if (nameNode === null) {
        continue;
      }
      const name = nameNode.text;
      const exported = hasVisibilityModifier(constNode);
      const startLine = positionToLineNumber(constNode.startPosition);
      const endLine = positionToLineNumber(constNode.endPosition);
      const typeNode = getChildByFieldName(constNode, "type");
      const signature = typeNode !== null ? `${name}: ${typeNode.text}` : name;
      nodes.push({
        type: "const",
        name,
        exported,
        startLine,
        endLine,
        signature
      });
    }
    return nodes;
  }
  /**
   * Parse impl blocks and attach methods to corresponding structs
   */
  parseImplBlocks(tree, nodes) {
    const implNodes = queryNodesByType(tree, "impl_item");
    for (const implNode of implNodes) {
      const typeNode = getChildByFieldName(implNode, "type");
      if (typeNode === null) {
        continue;
      }
      const typeName = typeNode.text;
      const methods = this.extractImplMethods(implNode);
      const structNode = nodes.find((node) => node.type === "class" && node.name === typeName);
      if (structNode?.methods !== void 0) {
        structNode.methods.push(...methods);
      }
    }
  }
  /**
   * Extract methods from trait definition
   */
  extractTraitMethods(traitNode) {
    const methods = [];
    const bodyNode = getChildByFieldName(traitNode, "body");
    if (bodyNode === null) {
      return methods;
    }
    const functionSignatures = bodyNode.descendantsOfType("function_signature_item");
    for (const fnSigNode of functionSignatures) {
      const nameNode = getChildByFieldName(fnSigNode, "name");
      if (nameNode === null) {
        continue;
      }
      const name = nameNode.text;
      const async = isAsyncFunction(fnSigNode);
      const signature = getFunctionSignature(fnSigNode);
      const startLine = positionToLineNumber(fnSigNode.startPosition);
      const endLine = positionToLineNumber(fnSigNode.endPosition);
      methods.push({
        name,
        async,
        signature,
        startLine,
        endLine
      });
    }
    return methods;
  }
  /**
   * Extract methods from impl block
   */
  extractImplMethods(implNode) {
    const methods = [];
    const bodyNode = getChildByFieldName(implNode, "body");
    if (bodyNode === null) {
      return methods;
    }
    const functionItems = bodyNode.descendantsOfType("function_item");
    for (const fnNode of functionItems) {
      const nameNode = getChildByFieldName(fnNode, "name");
      if (nameNode === null) {
        continue;
      }
      const name = nameNode.text;
      const async = isAsyncFunction(fnNode);
      const signature = getFunctionSignature(fnNode);
      const startLine = positionToLineNumber(fnNode.startPosition);
      const endLine = positionToLineNumber(fnNode.endPosition);
      methods.push({
        name,
        async,
        signature,
        startLine,
        endLine
      });
    }
    return methods;
  }
  /**
   * Parse import path into source and specifiers
   * Examples:
   * - "std::collections::HashMap" -> { source: "std::collections", specifiers: ["HashMap"] }
   * - "crate::utils::*" -> { source: "crate::utils", specifiers: ["*"] }
   * - "super::Type" -> { source: "super", specifiers: ["Type"] }
   */
  parseImportPath(importPath) {
    const path4 = importPath.trim();
    if (path4.includes("::*")) {
      const source = path4.replace("::*", "");
      return { source, specifiers: ["*"] };
    }
    const scopedMatch = path4.match(/^(.+)::\{(.+)\}$/);
    if (scopedMatch !== null) {
      const source = scopedMatch[1] ?? "";
      const specifiersStr = scopedMatch[2] ?? "";
      const specifiers = specifiersStr.split(",").map((s) => s.trim());
      return { source, specifiers };
    }
    const parts = path4.split("::");
    if (parts.length > 1) {
      const specifiers = [parts[parts.length - 1] ?? ""];
      const source = parts.slice(0, -1).join("::");
      return { source, specifiers };
    }
    return { source: "", specifiers: [path4] };
  }
};

// src/analysis/parser-factory.ts
var ParserFactory = class {
  constructor(pythonBridge) {
    this.pythonBridge = pythonBridge;
  }
  async parseFile(filePath, code) {
    const ext = path2.extname(filePath);
    if ([".ts", ".tsx"].includes(ext)) {
      const parser = new ASTParser();
      return parser.parse(code, "typescript");
    }
    if ([".js", ".jsx"].includes(ext)) {
      const parser = new ASTParser();
      return parser.parse(code, "javascript");
    }
    if (ext === ".py") {
      if (!this.pythonBridge) {
        throw new Error("Python bridge not available for parsing Python files");
      }
      const parser = new PythonASTParser(this.pythonBridge);
      return parser.parse(code, filePath);
    }
    if (ext === ".rs") {
      const parser = new RustASTParser();
      return parser.parse(code, filePath);
    }
    if (ext === ".go") {
      const parser = new GoASTParser();
      return parser.parse(code, filePath);
    }
    const registry = AdapterRegistry.getInstance();
    const adapter = registry.getByExtension(ext);
    if (adapter !== void 0) {
      return adapter.parse(code, filePath);
    }
    return [];
  }
};

// src/services/code-graph.service.ts
var CodeGraphService = class {
  dataDir;
  parser;
  parserFactory;
  graphCache;
  cacheListeners;
  constructor(dataDir, pythonBridge) {
    this.dataDir = dataDir;
    this.parser = new ASTParser();
    this.parserFactory = new ParserFactory(pythonBridge);
    this.graphCache = /* @__PURE__ */ new Map();
    this.cacheListeners = /* @__PURE__ */ new Set();
  }
  /**
   * Subscribe to cache invalidation events.
   * Returns an unsubscribe function.
   */
  onCacheInvalidation(listener) {
    this.cacheListeners.add(listener);
    return () => {
      this.cacheListeners.delete(listener);
    };
  }
  /**
   * Emit a cache invalidation event to all listeners.
   */
  emitCacheInvalidation(event) {
    for (const listener of this.cacheListeners) {
      listener(event);
    }
  }
  /**
   * Build a code graph from source files.
   */
  async buildGraph(files) {
    const graph = new CodeGraph();
    for (const file of files) {
      const ext = file.path.split(".").pop() ?? "";
      if (!["ts", "tsx", "js", "jsx", "py", "rs", "go"].includes(ext)) continue;
      const nodes = await this.parserFactory.parseFile(file.path, file.content);
      graph.addNodes(nodes, file.path);
      if (ext === "rs") {
        const rustParser = new RustASTParser();
        const imports = rustParser.extractImports(file.content);
        for (const imp of imports) {
          if (!imp.isType) {
            graph.addImport(file.path, imp.source, imp.specifiers);
          }
        }
      } else if (ext === "go") {
        const goParser = new GoASTParser();
        const imports = goParser.extractImports(file.content);
        for (const imp of imports) {
          if (!imp.isType) {
            graph.addImport(file.path, imp.source, imp.specifiers);
          }
        }
      } else if (ext !== "py") {
        const imports = this.parser.extractImports(file.content);
        for (const imp of imports) {
          if (!imp.isType) {
            graph.addImport(file.path, imp.source, imp.specifiers);
          }
        }
      }
      for (const node of nodes) {
        const lines = file.content.split("\n");
        if (node.type === "function") {
          const functionCode = lines.slice(node.startLine - 1, node.endLine).join("\n");
          graph.analyzeCallRelationships(functionCode, file.path, node.name);
        } else if (node.type === "class" && node.methods !== void 0) {
          for (const method of node.methods) {
            const methodCode = lines.slice(method.startLine - 1, method.endLine).join("\n");
            graph.analyzeCallRelationships(methodCode, file.path, `${node.name}.${method.name}`);
          }
        }
      }
    }
    return graph;
  }
  /**
   * Save a code graph for a store.
   */
  async saveGraph(storeId, graph) {
    const graphPath = this.getGraphPath(storeId);
    await mkdir2(dirname3(graphPath), { recursive: true });
    const serialized = graph.toJSON();
    await writeFile2(graphPath, JSON.stringify(serialized, null, 2));
    this.emitCacheInvalidation({ type: "graph-updated", storeId });
  }
  /**
   * Delete the code graph file for a store.
   * Silently succeeds if the file doesn't exist.
   */
  async deleteGraph(storeId) {
    const graphPath = this.getGraphPath(storeId);
    await rm(graphPath, { force: true });
    this.graphCache.delete(storeId);
    this.emitCacheInvalidation({ type: "graph-deleted", storeId });
  }
  /**
   * Load a code graph for a store.
   * Returns undefined if no graph exists.
   */
  async loadGraph(storeId) {
    const cached = this.graphCache.get(storeId);
    if (cached) return cached;
    const graphPath = this.getGraphPath(storeId);
    try {
      const content = await readFile(graphPath, "utf-8");
      const parsed = JSON.parse(content);
      if (!this.isSerializedGraph(parsed)) {
        return void 0;
      }
      const serialized = parsed;
      const graph = new CodeGraph();
      for (const node of serialized.nodes) {
        const nodeType = this.validateNodeType(node.type);
        if (!nodeType) continue;
        if (nodeType === "method") {
          const graphNode = {
            id: node.id,
            file: node.file,
            type: "method",
            name: node.name,
            exported: node.exported,
            startLine: node.startLine,
            endLine: node.endLine
          };
          if (node.signature !== void 0) {
            graphNode.signature = node.signature;
          }
          graph.addGraphNode(graphNode);
          continue;
        }
        const codeNode = {
          type: nodeType,
          name: node.name,
          exported: node.exported,
          startLine: node.startLine,
          endLine: node.endLine
        };
        if (node.signature !== void 0) {
          codeNode.signature = node.signature;
        }
        graph.addNodes([codeNode], node.file);
      }
      for (const edge of serialized.edges) {
        const edgeType = this.validateEdgeType(edge.type);
        if (!edgeType) continue;
        graph.addEdge({
          from: edge.from,
          to: edge.to,
          type: edgeType,
          confidence: edge.confidence
        });
      }
      this.graphCache.set(storeId, graph);
      return graph;
    } catch {
      return void 0;
    }
  }
  /**
   * Get usage stats for a code element.
   */
  getUsageStats(graph, filePath, symbolName) {
    const nodeId = `${filePath}:${symbolName}`;
    return {
      calledBy: graph.getCalledByCount(nodeId),
      calls: graph.getCallsCount(nodeId)
    };
  }
  /**
   * Get related code (callers and callees) for a code element.
   */
  getRelatedCode(graph, filePath, symbolName) {
    const nodeId = `${filePath}:${symbolName}`;
    const related = [];
    const incoming = graph.getIncomingEdges(nodeId);
    for (const edge of incoming) {
      if (edge.type === "calls") {
        related.push({ id: edge.from, relationship: "calls this" });
      }
    }
    const outgoing = graph.getEdges(nodeId);
    for (const edge of outgoing) {
      if (edge.type === "calls") {
        related.push({ id: edge.to, relationship: "called by this" });
      }
    }
    return related;
  }
  /**
   * Clear cached graphs.
   */
  clearCache() {
    this.graphCache.clear();
  }
  getGraphPath(storeId) {
    return join4(this.dataDir, "graphs", `${storeId}.json`);
  }
  /**
   * Type guard for SerializedGraph structure.
   */
  isSerializedGraph(value) {
    if (typeof value !== "object" || value === null) return false;
    if (!("nodes" in value) || !("edges" in value)) return false;
    const obj = value;
    return Array.isArray(obj.nodes) && Array.isArray(obj.edges);
  }
  /**
   * Type guard for valid node types.
   */
  isValidNodeType(type) {
    return ["function", "class", "interface", "type", "const", "method"].includes(type);
  }
  /**
   * Validate and return a node type, or undefined if invalid.
   */
  validateNodeType(type) {
    if (this.isValidNodeType(type)) {
      return type;
    }
    return void 0;
  }
  /**
   * Type guard for valid edge types.
   */
  isValidEdgeType(type) {
    return ["calls", "imports", "extends", "implements"].includes(type);
  }
  /**
   * Validate and return an edge type, or undefined if invalid.
   */
  validateEdgeType(type) {
    if (this.isValidEdgeType(type)) {
      return type;
    }
    return void 0;
  }
};

// src/services/config.service.ts
import { readFile as readFile2, access } from "fs/promises";
import { homedir } from "os";
import { join as join5, resolve } from "path";

// src/types/config.ts
var DEFAULT_CONFIG = {
  version: 1,
  dataDir: ".bluera/bluera-knowledge/data",
  embedding: {
    model: "Xenova/all-MiniLM-L6-v2",
    batchSize: 32
  },
  indexing: {
    concurrency: 4,
    chunkSize: 1e3,
    chunkOverlap: 150,
    ignorePatterns: ["node_modules/**", ".git/**", "*.min.js", "*.map"]
  },
  search: {
    defaultMode: "hybrid",
    defaultLimit: 10
  },
  crawl: {
    userAgent: "BlueraKnowledge/1.0",
    timeout: 3e4,
    maxConcurrency: 3
  },
  server: {
    port: 3847,
    host: "127.0.0.1"
  }
};

// src/utils/deep-merge.ts
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}
function deepMerge(defaults, overrides) {
  if (!isPlainObject(overrides)) {
    return { ...defaults };
  }
  const defaultsRecord = defaults;
  return deepMergeRecords(defaultsRecord, overrides);
}
function deepMergeRecords(defaults, overrides) {
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    const defaultValue = defaults[key];
    const overrideValue = overrides[key];
    if (overrideValue === void 0) {
      continue;
    }
    if (isPlainObject(defaultValue) && isPlainObject(overrideValue)) {
      result[key] = deepMergeRecords(defaultValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  }
  return result;
}

// src/services/config.service.ts
var DEFAULT_CONFIG_PATH = ".bluera/bluera-knowledge/config.json";
async function fileExists(path4) {
  try {
    await access(path4);
    return true;
  } catch {
    return false;
  }
}
var ConfigService = class {
  configPath;
  dataDir;
  projectRoot;
  config = null;
  constructor(configPath, dataDir, projectRoot) {
    this.projectRoot = projectRoot ?? ProjectRootService.resolve();
    if (configPath !== void 0 && configPath !== "") {
      this.configPath = this.expandPath(configPath, this.projectRoot);
    } else {
      this.configPath = join5(this.projectRoot, DEFAULT_CONFIG_PATH);
    }
    if (dataDir !== void 0 && dataDir !== "") {
      this.dataDir = this.expandPath(dataDir, this.projectRoot);
    } else {
      this.dataDir = this.expandPath(DEFAULT_CONFIG.dataDir, this.projectRoot);
    }
  }
  /**
   * Get the resolved project root directory.
   */
  resolveProjectRoot() {
    return this.projectRoot;
  }
  async load() {
    if (this.config !== null) {
      return this.config;
    }
    const exists = await fileExists(this.configPath);
    if (!exists) {
      this.config = { ...DEFAULT_CONFIG };
      await this.save(this.config);
      return this.config;
    }
    const content = await readFile2(this.configPath, "utf-8");
    try {
      this.config = deepMerge(DEFAULT_CONFIG, JSON.parse(content));
    } catch (error) {
      throw new Error(
        `Failed to parse config file at ${this.configPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return this.config;
  }
  async save(config) {
    await atomicWriteFile(this.configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }
  resolveDataDir() {
    return this.dataDir;
  }
  resolveConfigPath() {
    return this.configPath;
  }
  expandPath(path4, baseDir) {
    if (path4.startsWith("~")) {
      return path4.replace("~", homedir());
    }
    if (!path4.startsWith("/")) {
      return resolve(baseDir, path4);
    }
    return path4;
  }
};

// src/services/gitignore.service.ts
import { readFile as readFile3, writeFile as writeFile3, access as access2 } from "fs/promises";
import { join as join6 } from "path";
var REQUIRED_PATTERNS = [
  ".bluera/",
  "!.bluera/",
  "!.bluera/bluera-knowledge/",
  "!.bluera/bluera-knowledge/stores.config.json",
  "!.bluera/bluera-knowledge/config.json",
  "!.bluera/bluera-knowledge/skill-activation.json",
  ".bluera/bluera-knowledge/data/"
];
var SECTION_HEADER = `
# Bluera Knowledge
# Config files (stores.config.json, config.json, skill-activation.json) can be committed
# Data directory (vector DB, cloned repos) is not committed
`;
async function fileExists2(path4) {
  try {
    await access2(path4);
    return true;
  } catch {
    return false;
  }
}
var GitignoreService = class {
  gitignorePath;
  constructor(projectRoot) {
    this.gitignorePath = join6(projectRoot, ".gitignore");
  }
  /**
   * Check if all required patterns are present in .gitignore
   */
  async hasRequiredPatterns() {
    const exists = await fileExists2(this.gitignorePath);
    if (!exists) {
      return false;
    }
    const content = await readFile3(this.gitignorePath, "utf-8");
    const lines = content.split("\n").map((l) => l.trim());
    for (const pattern of REQUIRED_PATTERNS) {
      if (!lines.includes(pattern)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Ensure required .gitignore patterns are present.
   *
   * - Creates .gitignore if it doesn't exist
   * - Appends missing patterns if .gitignore exists
   * - Does nothing if all patterns are already present
   *
   * @returns Object with updated flag and descriptive message
   */
  async ensureGitignorePatterns() {
    const exists = await fileExists2(this.gitignorePath);
    if (!exists) {
      const content = `${SECTION_HEADER.trim()}
${REQUIRED_PATTERNS.join("\n")}
`;
      await writeFile3(this.gitignorePath, content);
      return {
        updated: true,
        message: "Created .gitignore with Bluera Knowledge patterns"
      };
    }
    const existingContent = await readFile3(this.gitignorePath, "utf-8");
    const lines = existingContent.split("\n").map((l) => l.trim());
    const missingPatterns = REQUIRED_PATTERNS.filter((pattern) => !lines.includes(pattern));
    if (missingPatterns.length === 0) {
      return {
        updated: false,
        message: "All Bluera Knowledge patterns already present in .gitignore"
      };
    }
    let newContent = existingContent;
    if (!newContent.endsWith("\n")) {
      newContent += "\n";
    }
    newContent += SECTION_HEADER;
    newContent += `${missingPatterns.join("\n")}
`;
    await writeFile3(this.gitignorePath, newContent);
    return {
      updated: true,
      message: `Updated .gitignore with ${String(missingPatterns.length)} Bluera Knowledge pattern(s)`
    };
  }
  /**
   * Get the path to the .gitignore file
   */
  getGitignorePath() {
    return this.gitignorePath;
  }
};

// src/services/index.service.ts
import { createHash as createHash3 } from "crypto";
import { readFile as readFile5, readdir } from "fs/promises";
import { join as join7, extname, basename, relative } from "path";

// src/services/chunking.service.ts
var CHUNK_PRESETS = {
  code: { chunkSize: 768, chunkOverlap: 100 },
  web: { chunkSize: 1200, chunkOverlap: 200 },
  docs: { chunkSize: 1200, chunkOverlap: 200 }
};
var ChunkingService = class _ChunkingService {
  chunkSize;
  chunkOverlap;
  constructor(config) {
    this.chunkSize = config.chunkSize;
    this.chunkOverlap = config.chunkOverlap;
  }
  /**
   * Create a ChunkingService with preset configuration for a content type.
   * - 'code': Smaller chunks (768/100) for precise code symbol matching
   * - 'web': Larger chunks (1200/200) for web prose content
   * - 'docs': Larger chunks (1200/200) for documentation
   */
  static forContentType(type) {
    return new _ChunkingService(CHUNK_PRESETS[type]);
  }
  /**
   * Chunk text content. Uses semantic chunking for Markdown and code files,
   * falling back to sliding window for other content.
   */
  chunk(text, filePath) {
    if (filePath !== void 0 && filePath !== "" && /\.md$/i.test(filePath)) {
      return this.chunkMarkdown(text);
    }
    if (filePath !== void 0 && filePath !== "" && /\.(ts|tsx|js|jsx)$/i.test(filePath)) {
      return this.chunkCode(text);
    }
    return this.chunkSlidingWindow(text);
  }
  /**
   * Semantic chunking for Markdown files.
   * Splits on section headers to keep related content together.
   */
  chunkMarkdown(text) {
    const headerRegex = /^(#{1,4})\s+(.+)$/gm;
    const sections = [];
    let lastIndex = 0;
    let lastHeader = "";
    let match;
    while ((match = headerRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const content = text.slice(lastIndex, match.index).trim();
        if (content) {
          sections.push({
            header: lastHeader,
            content,
            startOffset: lastIndex
          });
        }
      }
      lastHeader = match[2] ?? "";
      lastIndex = match.index;
    }
    const finalContent = text.slice(lastIndex).trim();
    if (finalContent) {
      sections.push({
        header: lastHeader,
        content: finalContent,
        startOffset: lastIndex
      });
    }
    if (sections.length === 0) {
      return this.chunkSlidingWindow(text);
    }
    const chunks = [];
    for (const section of sections) {
      if (section.content.length <= this.chunkSize) {
        chunks.push({
          content: section.content,
          chunkIndex: chunks.length,
          totalChunks: 0,
          startOffset: section.startOffset,
          endOffset: section.startOffset + section.content.length,
          sectionHeader: section.header || void 0
        });
      } else {
        const sectionChunks = this.chunkSlidingWindow(section.content);
        for (const subChunk of sectionChunks) {
          chunks.push({
            ...subChunk,
            chunkIndex: chunks.length,
            startOffset: section.startOffset + subChunk.startOffset,
            endOffset: section.startOffset + subChunk.endOffset,
            sectionHeader: section.header || void 0
          });
        }
      }
    }
    for (const chunk of chunks) {
      chunk.totalChunks = chunks.length;
    }
    return chunks;
  }
  /**
   * Semantic chunking for TypeScript/JavaScript code files.
   * Splits on top-level declarations to keep functions/classes together.
   */
  chunkCode(text) {
    const declarationRegex = /^(?:\/\*\*[\s\S]*?\*\/\s*)?(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|const|let|var|enum)\s+(\w+)/gm;
    const declarations = [];
    let match;
    while ((match = declarationRegex.exec(text)) !== null) {
      const name = match[1];
      const decl = {
        startOffset: match.index,
        endOffset: match.index
      };
      if (name !== void 0) {
        decl.name = name;
      }
      declarations.push(decl);
    }
    if (declarations.length === 0) {
      return this.chunkSlidingWindow(text);
    }
    for (let i = 0; i < declarations.length; i++) {
      const currentDecl = declarations[i];
      const nextDecl = declarations[i + 1];
      if (currentDecl === void 0) continue;
      const declText = text.slice(currentDecl.startOffset);
      if (/^(?:\/\*\*[\s\S]*?\*\/\s*)?(?:export\s+)?(?:async\s+)?(?:function|class|enum)\s+/m.test(
        declText
      )) {
        const boundary = this.findDeclarationEnd(declText);
        if (boundary > 0) {
          currentDecl.endOffset = currentDecl.startOffset + boundary;
        } else {
          currentDecl.endOffset = nextDecl !== void 0 ? nextDecl.startOffset : text.length;
        }
      } else {
        currentDecl.endOffset = nextDecl !== void 0 ? nextDecl.startOffset : text.length;
      }
    }
    const chunks = [];
    for (const decl of declarations) {
      const content = text.slice(decl.startOffset, decl.endOffset).trim();
      if (content.length <= this.chunkSize) {
        chunks.push({
          content,
          chunkIndex: chunks.length,
          totalChunks: 0,
          startOffset: decl.startOffset,
          endOffset: decl.endOffset,
          functionName: decl.name
        });
      } else {
        const declChunks = this.chunkSlidingWindow(content);
        for (const subChunk of declChunks) {
          chunks.push({
            ...subChunk,
            chunkIndex: chunks.length,
            startOffset: decl.startOffset + subChunk.startOffset,
            endOffset: decl.startOffset + subChunk.endOffset,
            functionName: decl.name
          });
        }
      }
    }
    for (const chunk of chunks) {
      chunk.totalChunks = chunks.length;
    }
    return chunks.length > 0 ? chunks : this.chunkSlidingWindow(text);
  }
  /**
   * Find the end of a code declaration by counting braces while ignoring
   * braces inside strings and comments.
   * Returns the offset where the declaration ends, or -1 if not found.
   */
  findDeclarationEnd(text) {
    let braceCount = 0;
    let inString = false;
    let inSingleLineComment = false;
    let inMultiLineComment = false;
    let stringChar = "";
    let i = 0;
    let foundFirstBrace = false;
    while (i < text.length) {
      const char = text[i];
      const nextChar = i + 1 < text.length ? text[i + 1] : "";
      if (!inString && !inMultiLineComment && char === "/" && nextChar === "/") {
        inSingleLineComment = true;
        i += 2;
        continue;
      }
      if (!inString && !inSingleLineComment && char === "/" && nextChar === "*") {
        inMultiLineComment = true;
        i += 2;
        continue;
      }
      if (inMultiLineComment && char === "*" && nextChar === "/") {
        inMultiLineComment = false;
        i += 2;
        continue;
      }
      if (inSingleLineComment && char === "\n") {
        inSingleLineComment = false;
        i++;
        continue;
      }
      if (inSingleLineComment || inMultiLineComment) {
        i++;
        continue;
      }
      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
        i++;
        continue;
      }
      if (inString && char === "\\") {
        i += 2;
        continue;
      }
      if (inString && char === stringChar) {
        inString = false;
        stringChar = "";
        i++;
        continue;
      }
      if (inString) {
        i++;
        continue;
      }
      if (char === "{") {
        braceCount++;
        foundFirstBrace = true;
      } else if (char === "}") {
        braceCount--;
        if (foundFirstBrace && braceCount === 0) {
          return i + 1;
        }
      }
      i++;
    }
    return -1;
  }
  /**
   * Traditional sliding window chunking for non-Markdown content.
   */
  chunkSlidingWindow(text) {
    if (text.length <= this.chunkSize) {
      return [
        {
          content: text,
          chunkIndex: 0,
          totalChunks: 1,
          startOffset: 0,
          endOffset: text.length
        }
      ];
    }
    const chunks = [];
    const step = this.chunkSize - this.chunkOverlap;
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      chunks.push({
        content: text.slice(start, end),
        chunkIndex: chunks.length,
        totalChunks: 0,
        startOffset: start,
        endOffset: end
      });
      start += step;
      if (end === text.length) break;
    }
    for (const chunk of chunks) {
      chunk.totalChunks = chunks.length;
    }
    return chunks;
  }
};

// src/services/drift.service.ts
import { createHash as createHash2 } from "crypto";
import { readFile as readFile4, stat } from "fs/promises";
var DriftService = class {
  /**
   * Detect changes between current files and manifest.
   *
   * @param manifest - The stored manifest from last index
   * @param currentFiles - Current files on disk with mtime/size
   * @returns Classification of files into added, modified, deleted, unchanged
   */
  async detectChanges(manifest, currentFiles) {
    const result = {
      added: [],
      modified: [],
      deleted: [],
      unchanged: []
    };
    const currentPathSet = new Set(currentFiles.map((f) => f.path));
    const manifestPaths = new Set(Object.keys(manifest.files));
    for (const path4 of manifestPaths) {
      if (!currentPathSet.has(path4)) {
        result.deleted.push(path4);
      }
    }
    const potentiallyModified = [];
    for (const file of currentFiles) {
      const manifestState = manifest.files[file.path];
      if (manifestState === void 0) {
        result.added.push(file.path);
      } else {
        if (file.mtime === manifestState.mtime && file.size === manifestState.size) {
          result.unchanged.push(file.path);
        } else {
          potentiallyModified.push(file);
        }
      }
    }
    for (const file of potentiallyModified) {
      const manifestState = manifest.files[file.path];
      if (manifestState === void 0) {
        result.added.push(file.path);
        continue;
      }
      const currentHash = await this.computeFileHash(file.path);
      if (currentHash === manifestState.hash) {
        result.unchanged.push(file.path);
      } else {
        result.modified.push(file.path);
      }
    }
    return result;
  }
  /**
   * Get the current state of a file on disk.
   */
  async getFileState(path4) {
    const stats = await stat(path4);
    return {
      path: path4,
      mtime: stats.mtimeMs,
      size: stats.size
    };
  }
  /**
   * Compute MD5 hash of a file.
   */
  async computeFileHash(path4) {
    const content = await readFile4(path4);
    return createHash2("md5").update(content).digest("hex");
  }
  /**
   * Create a file state entry for the manifest after indexing.
   *
   * @param path - File path
   * @param documentIds - Document IDs created from this file
   * @returns File state for manifest
   */
  async createFileState(path4, documentIds) {
    const stats = await stat(path4);
    const content = await readFile4(path4);
    const hash = createHash2("md5").update(content).digest("hex");
    const { createDocumentId: createDocumentId2 } = await import("./brands-3EYIYV6T.js");
    return {
      state: {
        mtime: stats.mtimeMs,
        size: stats.size,
        hash,
        documentIds: documentIds.map((id) => createDocumentId2(id))
      },
      hash
    };
  }
};

// src/services/index.service.ts
var logger = createLogger("index-service");
var TEXT_EXTENSIONS = /* @__PURE__ */ new Set([
  ".txt",
  ".md",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".json",
  ".yaml",
  ".yml",
  ".html",
  ".css",
  ".scss",
  ".less",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".sh",
  ".bash",
  ".zsh",
  ".sql",
  ".xml"
]);
var IndexService = class {
  lanceStore;
  embeddingEngine;
  chunker;
  codeGraphService;
  manifestService;
  driftService;
  concurrency;
  ignoreDirs;
  ignoreFilePatterns;
  constructor(lanceStore, embeddingEngine, options = {}) {
    this.lanceStore = lanceStore;
    this.embeddingEngine = embeddingEngine;
    this.chunker = new ChunkingService({
      chunkSize: options.chunkSize ?? 768,
      chunkOverlap: options.chunkOverlap ?? 100
    });
    this.codeGraphService = options.codeGraphService;
    this.manifestService = options.manifestService;
    this.driftService = new DriftService();
    this.concurrency = options.concurrency ?? 4;
    const parsed = parseIgnorePatternsForScanning(options.ignorePatterns ?? []);
    this.ignoreDirs = parsed.dirs;
    this.ignoreFilePatterns = parsed.fileMatchers;
  }
  async indexStore(store, onProgress) {
    logger.info(
      {
        storeId: store.id,
        storeName: store.name,
        storeType: store.type
      },
      "Starting store indexing"
    );
    try {
      if (store.type === "file" || store.type === "repo") {
        return await this.indexFileStore(store, onProgress);
      }
      logger.error(
        { storeId: store.id, storeType: store.type },
        "Unsupported store type for indexing"
      );
      return err(new Error(`Indexing not supported for store type: ${store.type}`));
    } catch (error) {
      logger.error(
        {
          storeId: store.id,
          error: error instanceof Error ? error.message : String(error)
        },
        "Store indexing failed"
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
  /**
   * Incrementally index a store, only processing changed files.
   * Requires manifestService to be configured.
   *
   * @param store - The store to index
   * @param onProgress - Optional progress callback
   * @returns Result with incremental index statistics
   */
  async indexStoreIncremental(store, onProgress) {
    if (this.manifestService === void 0) {
      return err(new Error("ManifestService required for incremental indexing"));
    }
    if (store.type !== "file" && store.type !== "repo") {
      return err(new Error(`Incremental indexing not supported for store type: ${store.type}`));
    }
    logger.info(
      {
        storeId: store.id,
        storeName: store.name,
        storeType: store.type
      },
      "Starting incremental store indexing"
    );
    const startTime = Date.now();
    try {
      const manifest = await this.manifestService.load(store.id);
      const filePaths = await this.scanDirectory(store.path);
      const currentFiles = await Promise.all(
        filePaths.map((path4) => this.driftService.getFileState(path4))
      );
      const drift = await this.driftService.detectChanges(manifest, currentFiles);
      logger.debug(
        {
          storeId: store.id,
          added: drift.added.length,
          modified: drift.modified.length,
          deleted: drift.deleted.length,
          unchanged: drift.unchanged.length
        },
        "Drift detection complete"
      );
      const documentIdsToDelete = [];
      for (const path4 of [...drift.modified, ...drift.deleted]) {
        const fileState = manifest.files[path4];
        if (fileState !== void 0) {
          documentIdsToDelete.push(...fileState.documentIds);
        }
      }
      if (documentIdsToDelete.length > 0) {
        await this.lanceStore.deleteDocuments(store.id, documentIdsToDelete);
        logger.debug(
          { storeId: store.id, count: documentIdsToDelete.length },
          "Deleted old documents"
        );
      }
      const filesToProcess = [...drift.added, ...drift.modified];
      const totalFiles = filesToProcess.length;
      onProgress?.({
        type: "start",
        current: 0,
        total: totalFiles,
        message: `Processing ${String(totalFiles)} changed files`
      });
      const documents = [];
      const newManifestFiles = {};
      let filesProcessed = 0;
      for (const path4 of drift.unchanged) {
        const existingState = manifest.files[path4];
        if (existingState !== void 0) {
          newManifestFiles[path4] = existingState;
        }
      }
      for (let i = 0; i < filesToProcess.length; i += this.concurrency) {
        const batch = filesToProcess.slice(i, i + this.concurrency);
        const batchResults = await Promise.all(
          batch.map(async (filePath) => {
            const result = await this.processFile(filePath, store);
            const documentIds = result.documents.map((d) => d.id);
            const { state } = await this.driftService.createFileState(filePath, documentIds);
            return {
              filePath,
              documents: result.documents,
              fileState: state
            };
          })
        );
        for (const result of batchResults) {
          documents.push(...result.documents);
          newManifestFiles[result.filePath] = result.fileState;
        }
        filesProcessed += batch.length;
        onProgress?.({
          type: "progress",
          current: filesProcessed,
          total: totalFiles,
          message: `Processed ${String(filesProcessed)}/${String(totalFiles)} files`
        });
      }
      if (documents.length > 0) {
        await this.lanceStore.addDocuments(store.id, documents);
        await this.lanceStore.createFtsIndex(store.id);
      }
      if (this.codeGraphService) {
        const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go"];
        const hasSourceChanges = filesToProcess.some((p) => sourceExtensions.includes(extname(p).toLowerCase())) || drift.deleted.some((p) => sourceExtensions.includes(extname(p).toLowerCase()));
        if (hasSourceChanges) {
          const allSourceFiles = [];
          const allPaths = [...drift.unchanged, ...filesToProcess];
          for (const filePath of allPaths) {
            const ext = extname(filePath).toLowerCase();
            if (sourceExtensions.includes(ext)) {
              try {
                const content = await readFile5(filePath, "utf-8");
                allSourceFiles.push({ path: filePath, content });
              } catch {
              }
            }
          }
          if (allSourceFiles.length > 0) {
            const graph = await this.codeGraphService.buildGraph(allSourceFiles);
            await this.codeGraphService.saveGraph(store.id, graph);
            logger.debug(
              { storeId: store.id, sourceFiles: allSourceFiles.length },
              "Rebuilt code graph during incremental indexing"
            );
          } else {
            await this.codeGraphService.deleteGraph(store.id);
            logger.debug(
              { storeId: store.id },
              "Deleted stale code graph (no source files remain)"
            );
          }
        }
      }
      const updatedManifest = {
        version: 1,
        storeId: store.id,
        indexedAt: (/* @__PURE__ */ new Date()).toISOString(),
        files: newManifestFiles
      };
      await this.manifestService.save(updatedManifest);
      onProgress?.({
        type: "complete",
        current: totalFiles,
        total: totalFiles,
        message: "Incremental indexing complete"
      });
      const timeMs = Date.now() - startTime;
      logger.info(
        {
          storeId: store.id,
          storeName: store.name,
          filesAdded: drift.added.length,
          filesModified: drift.modified.length,
          filesDeleted: drift.deleted.length,
          filesUnchanged: drift.unchanged.length,
          chunksCreated: documents.length,
          timeMs
        },
        "Incremental indexing complete"
      );
      return ok({
        filesIndexed: filesToProcess.length,
        chunksCreated: documents.length,
        timeMs,
        filesAdded: drift.added.length,
        filesModified: drift.modified.length,
        filesDeleted: drift.deleted.length,
        filesUnchanged: drift.unchanged.length
      });
    } catch (error) {
      logger.error(
        {
          storeId: store.id,
          error: error instanceof Error ? error.message : String(error)
        },
        "Incremental indexing failed"
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
  async indexFileStore(store, onProgress) {
    const startTime = Date.now();
    await this.lanceStore.clearAllDocuments(store.id);
    if (this.manifestService) {
      await this.manifestService.delete(store.id);
    }
    const files = await this.scanDirectory(store.path);
    const documents = [];
    let filesProcessed = 0;
    logger.debug(
      {
        storeId: store.id,
        path: store.path,
        fileCount: files.length,
        concurrency: this.concurrency
      },
      "Files scanned for indexing"
    );
    const sourceFiles = [];
    onProgress?.({
      type: "start",
      current: 0,
      total: files.length,
      message: "Starting index"
    });
    for (let i = 0; i < files.length; i += this.concurrency) {
      const batch = files.slice(i, i + this.concurrency);
      const batchResults = await Promise.all(
        batch.map((filePath) => this.processFile(filePath, store))
      );
      for (const result of batchResults) {
        documents.push(...result.documents);
        if (result.sourceFile !== void 0) {
          sourceFiles.push(result.sourceFile);
        }
      }
      filesProcessed += batch.length;
      onProgress?.({
        type: "progress",
        current: filesProcessed,
        total: files.length,
        message: `Indexed ${String(filesProcessed)}/${String(files.length)} files`
      });
    }
    if (documents.length > 0) {
      await this.lanceStore.addDocuments(store.id, documents);
      await this.lanceStore.createFtsIndex(store.id);
    }
    if (this.codeGraphService && sourceFiles.length > 0) {
      const graph = await this.codeGraphService.buildGraph(sourceFiles);
      await this.codeGraphService.saveGraph(store.id, graph);
    } else if (this.codeGraphService) {
      await this.codeGraphService.deleteGraph(store.id);
    }
    onProgress?.({
      type: "complete",
      current: files.length,
      total: files.length,
      message: "Indexing complete"
    });
    const timeMs = Date.now() - startTime;
    logger.info(
      {
        storeId: store.id,
        storeName: store.name,
        filesIndexed: filesProcessed,
        chunksCreated: documents.length,
        sourceFilesForGraph: sourceFiles.length,
        timeMs
      },
      "Store indexing complete"
    );
    return ok({
      filesIndexed: filesProcessed,
      chunksCreated: documents.length,
      timeMs
    });
  }
  /**
   * Process a single file: read, chunk, embed, and return documents.
   * Extracted for parallel processing.
   */
  async processFile(filePath, store) {
    const content = await readFile5(filePath, "utf-8");
    const fileHash = createHash3("md5").update(content).digest("hex");
    const chunks = this.chunker.chunk(content, filePath);
    const relativePath = relative(store.path, filePath);
    const pathHash = createHash3("md5").update(relativePath).digest("hex").slice(0, 8);
    const ext = extname(filePath).toLowerCase();
    const fileName = basename(filePath).toLowerCase();
    const fileType = this.classifyFileType(ext, fileName, filePath);
    const sourceFile = [".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go"].includes(ext) ? { path: filePath, content } : void 0;
    if (chunks.length === 0) {
      return { documents: [], sourceFile };
    }
    const chunkContents = chunks.map((c) => c.content);
    const vectors = await this.embeddingEngine.embedBatch(chunkContents);
    const documents = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vector = vectors[i];
      if (chunk === void 0 || vector === void 0) {
        throw new Error(
          `Chunk/vector mismatch at index ${String(i)}: chunk=${String(chunk !== void 0)}, vector=${String(vector !== void 0)}`
        );
      }
      const chunkId = chunks.length > 1 ? `${store.id}-${pathHash}-${fileHash}-${String(chunk.chunkIndex)}` : `${store.id}-${pathHash}-${fileHash}`;
      documents.push({
        id: createDocumentId(chunkId),
        content: chunk.content,
        vector,
        metadata: {
          type: chunks.length > 1 ? "chunk" : "file",
          storeId: store.id,
          path: filePath,
          indexedAt: (/* @__PURE__ */ new Date()).toISOString(),
          fileHash,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          fileType,
          sectionHeader: chunk.sectionHeader,
          functionName: chunk.functionName,
          hasDocComments: /\/\*\*[\s\S]*?\*\//.test(chunk.content),
          docSummary: chunk.docSummary
        }
      });
    }
    return { documents, sourceFile };
  }
  async scanDirectory(dir) {
    const files = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join7(dir, entry.name);
      if (entry.isDirectory()) {
        if (!this.ignoreDirs.has(entry.name)) {
          files.push(...await this.scanDirectory(fullPath));
        }
      } else if (entry.isFile()) {
        const shouldIgnore = this.ignoreFilePatterns.some((matcher) => matcher(entry.name));
        if (shouldIgnore) {
          continue;
        }
        const ext = extname(entry.name).toLowerCase();
        if (TEXT_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }
    return files;
  }
  /**
   * Classify file type for ranking purposes.
   * Documentation files rank higher than source code for documentation queries.
   * Phase 4: Enhanced to detect internal implementation files.
   */
  classifyFileType(ext, fileName, filePath) {
    if (ext === ".md") {
      if (fileName === "changelog.md" || fileName === "changes.md" || /changelog/i.test(fileName)) {
        return "changelog";
      }
      if (["readme.md", "migration.md", "contributing.md"].includes(fileName)) {
        return "documentation-primary";
      }
      if (/\/(docs?|documentation|guides?|tutorials?|articles?)\//i.test(filePath)) {
        return "documentation";
      }
      return "documentation";
    }
    if (/\.(test|spec)\.[jt]sx?$/.test(fileName) || /\/__tests__\//.test(filePath)) {
      return "test";
    }
    if (/\/examples?\//.test(filePath) || fileName.includes("example")) {
      return "example";
    }
    if (/^(tsconfig|package|\.eslint|\.prettier|vite\.config|next\.config)/i.test(fileName)) {
      return "config";
    }
    if ([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java"].includes(ext)) {
      if (this.isInternalImplementation(filePath, fileName)) {
        return "source-internal";
      }
      return "source";
    }
    return "other";
  }
  /**
   * Detect if a source file is internal implementation code.
   * Internal code should rank lower than public-facing APIs and docs.
   */
  isInternalImplementation(filePath, fileName) {
    const pathLower = filePath.toLowerCase();
    const fileNameLower = fileName.toLowerCase();
    if (/\/packages\/[^/]+\/src\//.test(pathLower)) {
      if (fileNameLower === "index.ts" || fileNameLower === "index.js") {
        return false;
      }
      return true;
    }
    if (/\/(internal|lib\/core|core\/src|_internal|private)\//.test(pathLower)) {
      return true;
    }
    if (/\/(compiler|transforms?|parse|codegen)\//.test(pathLower) && !fileNameLower.includes("readme") && !fileNameLower.includes("index")) {
      return true;
    }
    return false;
  }
};
function classifyWebContentType(url, title) {
  const urlLower = url.toLowerCase();
  const titleLower = (title ?? "").toLowerCase();
  if (/\/api[-/]?(ref|reference|docs?)?\//i.test(urlLower) || /api\s*(reference|documentation)/i.test(titleLower)) {
    return "documentation-primary";
  }
  if (/\/(getting[-_]?started|quickstart|tutorial|setup)\b/i.test(urlLower) || /(getting started|quickstart|tutorial)/i.test(titleLower)) {
    return "documentation-primary";
  }
  if (/\/(docs?|documentation|reference|learn|manual|guide)/i.test(urlLower)) {
    return "documentation";
  }
  if (/\/(examples?|demos?|samples?|cookbook)/i.test(urlLower)) {
    return "example";
  }
  if (/changelog|release[-_]?notes/i.test(urlLower)) {
    return "changelog";
  }
  if (/\/blog\//i.test(urlLower)) {
    return "other";
  }
  return "documentation";
}

// src/services/manifest.service.ts
import { readFile as readFile6, access as access3, mkdir as mkdir3 } from "fs/promises";
import { join as join8 } from "path";

// src/types/manifest.ts
import { z as z2 } from "zod";
var FileStateSchema = z2.object({
  /** File modification time in milliseconds since epoch */
  mtime: z2.number(),
  /** File size in bytes */
  size: z2.number(),
  /** MD5 hash of file content */
  hash: z2.string(),
  /** Document IDs created from this file (for cleanup) */
  documentIds: z2.array(z2.string())
});
var StoreManifestSchema = z2.object({
  /** Schema version for future migrations */
  version: z2.literal(1),
  /** Store ID this manifest belongs to */
  storeId: z2.string(),
  /** When the manifest was last updated */
  indexedAt: z2.string(),
  /** Map of file paths to their state */
  files: z2.record(z2.string(), FileStateSchema)
});
function createEmptyManifest(storeId) {
  return {
    version: 1,
    storeId,
    indexedAt: (/* @__PURE__ */ new Date()).toISOString(),
    files: {}
  };
}

// src/services/manifest.service.ts
var ManifestService = class {
  manifestsDir;
  constructor(dataDir) {
    this.manifestsDir = join8(dataDir, "manifests");
  }
  /**
   * Initialize the manifests directory.
   */
  async initialize() {
    await mkdir3(this.manifestsDir, { recursive: true });
  }
  /**
   * Get the file path for a store's manifest.
   */
  getManifestPath(storeId) {
    return join8(this.manifestsDir, `${storeId}.manifest.json`);
  }
  /**
   * Load a store's manifest.
   * Returns an empty manifest if one doesn't exist.
   * Throws on parse/validation errors (fail fast).
   */
  async load(storeId) {
    const manifestPath = this.getManifestPath(storeId);
    const exists = await this.fileExists(manifestPath);
    if (!exists) {
      return createEmptyManifest(storeId);
    }
    const content = await readFile6(manifestPath, "utf-8");
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to parse manifest at ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    const result = StoreManifestSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Invalid manifest at ${manifestPath}: ${result.error.message}`);
    }
    return this.toTypedManifest(result.data, storeId);
  }
  /**
   * Save a store's manifest atomically.
   */
  async save(manifest) {
    const manifestPath = this.getManifestPath(manifest.storeId);
    const toSave = {
      ...manifest,
      indexedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await atomicWriteFile(manifestPath, JSON.stringify(toSave, null, 2));
  }
  /**
   * Delete a store's manifest.
   * Called when a store is deleted or during full re-index.
   */
  async delete(storeId) {
    const manifestPath = this.getManifestPath(storeId);
    const { unlink } = await import("fs/promises");
    const exists = await this.fileExists(manifestPath);
    if (exists) {
      await unlink(manifestPath);
    }
  }
  /**
   * Check if a file exists.
   */
  async fileExists(path4) {
    try {
      await access3(path4);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Convert a parsed manifest to a typed manifest with branded types.
   */
  toTypedManifest(data, storeId) {
    const files = {};
    for (const [path4, state] of Object.entries(data.files)) {
      files[path4] = {
        mtime: state.mtime,
        size: state.size,
        hash: state.hash,
        documentIds: state.documentIds.map((id) => createDocumentId(id))
      };
    }
    return {
      version: 1,
      storeId,
      indexedAt: data.indexedAt,
      files
    };
  }
};

// src/services/code-unit.service.ts
var CodeUnitService = class {
  extractCodeUnit(code, symbolName, language) {
    const lines = code.split("\n");
    let startLine = -1;
    let type = "function";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (line.includes(`function ${symbolName}`)) {
        startLine = i + 1;
        type = "function";
        break;
      }
      if (line.includes(`class ${symbolName}`)) {
        startLine = i + 1;
        type = "class";
        break;
      }
      if (line.match(new RegExp(`interface\\s+${symbolName}(?:\\s|{|<)`))) {
        startLine = i + 1;
        type = "interface";
        break;
      }
      if (line.match(new RegExp(`type\\s+${symbolName}(?:\\s|=|<)`))) {
        startLine = i + 1;
        type = "type";
        break;
      }
      if (line.match(new RegExp(`(?:const|let|var)\\s+${symbolName}\\s*=`))) {
        startLine = i + 1;
        type = "const";
        break;
      }
    }
    if (startLine === -1) return void 0;
    let endLine = startLine;
    let braceCount = 0;
    let foundFirstBrace = false;
    if (type === "type") {
      const firstLine2 = lines[startLine - 1] ?? "";
      if (!firstLine2.includes("{") && firstLine2.includes(";")) {
        endLine = startLine;
        const fullContent2 = firstLine2;
        const signature2 = this.extractSignature(firstLine2, symbolName, type);
        return {
          type,
          name: symbolName,
          signature: signature2,
          fullContent: fullContent2,
          startLine,
          endLine,
          language
        };
      }
    }
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplateLiteral = false;
    let inMultiLineComment = false;
    for (let i = startLine - 1; i < lines.length; i++) {
      const line = lines[i] ?? "";
      let inSingleLineComment = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const prevChar = j > 0 ? line[j - 1] : "";
        const nextChar = j < line.length - 1 ? line[j + 1] : "";
        if (prevChar === "\\" && (inSingleQuote || inDoubleQuote || inTemplateLiteral)) {
          continue;
        }
        if (inMultiLineComment) {
          if (char === "*" && nextChar === "/") {
            inMultiLineComment = false;
            j++;
          }
          continue;
        }
        if (inSingleLineComment) {
          continue;
        }
        if (inSingleQuote) {
          if (char === "'") inSingleQuote = false;
          continue;
        }
        if (inDoubleQuote) {
          if (char === '"') inDoubleQuote = false;
          continue;
        }
        if (inTemplateLiteral) {
          if (char === "`") inTemplateLiteral = false;
          continue;
        }
        if (char === "/" && nextChar === "*") {
          inMultiLineComment = true;
          j++;
          continue;
        }
        if (char === "/" && nextChar === "/") {
          inSingleLineComment = true;
          continue;
        }
        if (char === "'") {
          inSingleQuote = true;
          continue;
        }
        if (char === '"') {
          inDoubleQuote = true;
          continue;
        }
        if (char === "`") {
          inTemplateLiteral = true;
          continue;
        }
        if (char === "{") {
          braceCount++;
          foundFirstBrace = true;
        }
        if (char === "}") braceCount--;
      }
      if (foundFirstBrace && braceCount === 0) {
        endLine = i + 1;
        break;
      }
    }
    const fullContent = lines.slice(startLine - 1, endLine).join("\n");
    const firstLine = lines[startLine - 1] ?? "";
    const signature = this.extractSignature(firstLine, symbolName, type);
    return {
      type,
      name: symbolName,
      signature,
      fullContent,
      startLine,
      endLine,
      language
    };
  }
  extractSignature(line, name, type) {
    const sig = line.replace(/^\s*export\s+/, "").replace(/^\s*async\s+/, "").trim();
    if (type === "function") {
      const match = sig.match(/function\s+(\w+\([^)]*\):\s*[\w<>[\],\s|]+)/);
      if (match?.[1] !== void 0 && match[1].length > 0) return match[1].trim();
    }
    if (type === "class") {
      return `class ${name}`;
    }
    if (type === "interface") {
      return `interface ${name}`;
    }
    if (type === "type") {
      const typeMatch = sig.match(new RegExp(`type\\s+(${name}(?:<[^>]+>)?)\\s*=`));
      if (typeMatch?.[1] !== void 0 && typeMatch[1].length > 0) {
        return `type ${typeMatch[1]}`;
      }
      return `type ${name}`;
    }
    if (type === "const") {
      const arrowMatch = sig.match(
        new RegExp(
          `((?:const|let|var)\\s+${name}\\s*=\\s*(?:async\\s+)?\\([^)]*\\)(?::\\s*[^=]+)?)`
        )
      );
      const matchedSig = arrowMatch?.[1];
      if (matchedSig !== void 0 && matchedSig !== "") return matchedSig.trim();
      return `const ${name}`;
    }
    return sig;
  }
};

// src/services/search.service.ts
var logger2 = createLogger("search-service");
var INTENT_FILE_BOOSTS = {
  "how-to": {
    "documentation-primary": 1.3,
    // Strong boost for docs
    documentation: 1.2,
    example: 1.5,
    // Examples are ideal for "how to"
    source: 0.85,
    // Moderate penalty - source might still have good content
    "source-internal": 0.7,
    // Stronger penalty - internal code less useful
    test: 0.8,
    config: 0.7,
    changelog: 0.6,
    // Changelogs rarely answer "how to" questions
    other: 0.9
  },
  implementation: {
    "documentation-primary": 0.95,
    documentation: 1,
    example: 1,
    source: 1.1,
    // Slight boost for source code
    "source-internal": 1.05,
    // Internal code can be relevant
    test: 1,
    config: 0.95,
    changelog: 0.8,
    // Might reference implementation changes
    other: 1
  },
  conceptual: {
    "documentation-primary": 1.1,
    documentation: 1.05,
    example: 1,
    source: 0.95,
    "source-internal": 0.9,
    test: 0.9,
    config: 0.85,
    changelog: 0.7,
    // Sometimes explains concepts behind changes
    other: 0.95
  },
  comparison: {
    "documentation-primary": 1.15,
    documentation: 1.1,
    example: 1.05,
    source: 0.9,
    "source-internal": 0.85,
    test: 0.9,
    config: 0.85,
    changelog: 0.9,
    // Version comparisons can be useful
    other: 0.95
  },
  debugging: {
    "documentation-primary": 1,
    documentation: 1,
    example: 1.05,
    source: 1,
    // Source code helps with debugging
    "source-internal": 0.95,
    test: 1.05,
    // Tests can show expected behavior
    config: 0.9,
    changelog: 1.1,
    // Often contains bug fixes and known issues
    other: 1
  }
};
var FRAMEWORK_PATTERNS = [
  { pattern: /\bexpress\b/i, terms: ["express", "expressjs", "express.js"] },
  { pattern: /\bhono\b/i, terms: ["hono"] },
  { pattern: /\bzod\b/i, terms: ["zod"] },
  { pattern: /\breact\b/i, terms: ["react", "reactjs", "react.js"] },
  { pattern: /\bvue\b/i, terms: ["vue", "vuejs", "vue.js", "vue3"] },
  { pattern: /\bnode\b/i, terms: ["node", "nodejs", "node.js"] },
  { pattern: /\btypescript\b/i, terms: ["typescript", "ts"] },
  { pattern: /\bjwt\b/i, terms: ["jwt", "jsonwebtoken", "json-web-token"] }
];
var HOW_TO_PATTERNS = [
  /how (do|can|should|would) (i|you|we)/i,
  /how to\b/i,
  /what('s| is) the (best |right |correct )?(way|approach) to/i,
  /i (need|want|have) to/i,
  /show me how/i,
  /\bwhat's the syntax\b/i,
  /\bhow do i (use|create|make|set up|configure|implement|add|get)\b/i,
  /\bi'm (trying|building|creating|making)\b/i
];
var IMPLEMENTATION_PATTERNS = [
  /how (does|is) .* (implemented|work internally)/i,
  /\binternal(ly)?\b/i,
  /\bsource code\b/i,
  /\bunder the hood\b/i,
  /\bimplementation (of|details?)\b/i
];
var COMPARISON_PATTERNS = [
  /\b(vs\.?|versus)\b/i,
  /\bdifference(s)? between\b/i,
  /\bcompare\b/i,
  /\bshould (i|we) use .* or\b/i,
  /\bwhat's the difference\b/i,
  /\bwhich (one|is better)\b/i,
  /\bwhen (should|to) use\b/i
];
var DEBUGGING_PATTERNS = [
  /\b(error|bug|issue|problem|crash|fail|broken|wrong)\b/i,
  /\bdoesn't (work|compile|run)\b/i,
  /\bisn't (working|updating|rendering)\b/i,
  /\bwhy (is|does|doesn't|isn't)\b/i,
  /\bwhat('s| is) (wrong|happening|going on)\b/i,
  /\bwhat am i doing wrong\b/i,
  /\bnot (working|updating|showing)\b/i,
  /\bhow do i (fix|debug|solve|resolve)\b/i
];
var CONCEPTUAL_PATTERNS = [
  /\bwhat (is|are)\b/i,
  /\bexplain\b/i,
  /\bwhat does .* (mean|do)\b/i,
  /\bhow does .* work\b/i,
  /\bwhat('s| is) the (purpose|point|idea)\b/i
];
function classifyQueryIntents(query) {
  const q = query.toLowerCase();
  const intents = [];
  if (IMPLEMENTATION_PATTERNS.some((p) => p.test(q))) {
    intents.push({ intent: "implementation", confidence: 0.9 });
  }
  if (DEBUGGING_PATTERNS.some((p) => p.test(q))) {
    intents.push({ intent: "debugging", confidence: 0.85 });
  }
  if (COMPARISON_PATTERNS.some((p) => p.test(q))) {
    intents.push({ intent: "comparison", confidence: 0.8 });
  }
  if (HOW_TO_PATTERNS.some((p) => p.test(q))) {
    intents.push({ intent: "how-to", confidence: 0.75 });
  }
  if (CONCEPTUAL_PATTERNS.some((p) => p.test(q))) {
    intents.push({ intent: "conceptual", confidence: 0.7 });
  }
  if (intents.length === 0) {
    intents.push({ intent: "how-to", confidence: 0.5 });
  }
  return intents.sort((a, b) => b.confidence - a.confidence);
}
function getPrimaryIntent(intents) {
  return intents[0]?.intent ?? "how-to";
}
function mapSearchIntentToQueryIntent(intent) {
  switch (intent) {
    case "find-pattern":
    case "find-implementation":
    case "find-definition":
      return "implementation";
    case "find-usage":
    case "find-documentation":
      return "how-to";
  }
}
var RRF_PRESETS = {
  code: { k: 20, vectorWeight: 0.6, ftsWeight: 0.4 },
  web: { k: 30, vectorWeight: 0.55, ftsWeight: 0.45 }
};
function detectContentType(results) {
  const webCount = results.filter((r) => "url" in r.metadata).length;
  return webCount > results.length / 2 ? "web" : "code";
}
var SearchService = class {
  lanceStore;
  embeddingEngine;
  codeUnitService;
  codeGraphService;
  graphCache;
  searchConfig;
  unsubscribeCacheInvalidation;
  constructor(lanceStore, embeddingEngine, codeGraphService, searchConfig) {
    this.lanceStore = lanceStore;
    this.embeddingEngine = embeddingEngine;
    this.codeUnitService = new CodeUnitService();
    this.codeGraphService = codeGraphService;
    this.graphCache = /* @__PURE__ */ new Map();
    this.searchConfig = searchConfig;
    if (codeGraphService) {
      this.unsubscribeCacheInvalidation = codeGraphService.onCacheInvalidation((event) => {
        this.graphCache.delete(event.storeId);
      });
    }
  }
  /**
   * Clean up resources (unsubscribe from events).
   * Call this when destroying the service.
   */
  cleanup() {
    this.unsubscribeCacheInvalidation?.();
  }
  /**
   * Load code graph for a store, with caching.
   * Returns null if no graph is available.
   */
  async loadGraphForStore(storeId) {
    if (!this.codeGraphService) return null;
    const cached = this.graphCache.get(storeId);
    if (cached !== void 0) return cached;
    const graph = await this.codeGraphService.loadGraph(storeId);
    const result = graph ?? null;
    this.graphCache.set(storeId, result);
    return result;
  }
  /**
   * Calculate confidence level based on max raw vector similarity score.
   * Configurable via environment variables, with sensible defaults for CLI usage.
   */
  calculateConfidence(maxRawScore) {
    const highThreshold = parseFloat(process.env["SEARCH_CONFIDENCE_HIGH"] ?? "0.5");
    const mediumThreshold = parseFloat(process.env["SEARCH_CONFIDENCE_MEDIUM"] ?? "0.3");
    if (maxRawScore >= highThreshold) return "high";
    if (maxRawScore >= mediumThreshold) return "medium";
    return "low";
  }
  async search(query) {
    const startTime = Date.now();
    const mode = query.mode ?? this.searchConfig?.defaultMode ?? "hybrid";
    const limit = query.limit ?? this.searchConfig?.defaultLimit ?? 10;
    const stores = query.stores ?? [];
    const detail = query.detail ?? "minimal";
    const intents = classifyQueryIntents(query.query);
    const primaryIntent = query.intent !== void 0 ? mapSearchIntentToQueryIntent(query.intent) : getPrimaryIntent(intents);
    logger2.debug(
      {
        query: query.query,
        mode,
        limit,
        stores,
        detail,
        intent: primaryIntent,
        userIntent: query.intent,
        autoClassifiedIntents: intents,
        minRelevance: query.minRelevance
      },
      "Search query received"
    );
    let allResults = [];
    let maxRawScore = 0;
    const fetchLimit = limit * 3;
    if (mode === "vector") {
      const rawResults = await this.vectorSearchRaw(query.query, stores, fetchLimit);
      maxRawScore = rawResults.length > 0 ? rawResults[0]?.score ?? 0 : 0;
      allResults = this.normalizeAndFilterScores(rawResults, query.threshold).slice(0, fetchLimit);
    } else if (mode === "fts") {
      allResults = await this.ftsSearch(query.query, stores, fetchLimit);
    } else {
      const hybridResult = await this.hybridSearchWithMetadata(
        query.query,
        stores,
        fetchLimit,
        query.threshold
      );
      allResults = hybridResult.results;
      maxRawScore = hybridResult.maxRawScore;
    }
    if (query.minRelevance !== void 0) {
      if (mode === "fts") {
        logger2.warn(
          { query: query.query, minRelevance: query.minRelevance },
          "minRelevance filter ignored in FTS mode (no vector scores available)"
        );
      } else if (maxRawScore < query.minRelevance) {
        const timeMs2 = Date.now() - startTime;
        logger2.info(
          {
            query: query.query,
            mode,
            maxRawScore,
            minRelevance: query.minRelevance,
            timeMs: timeMs2
          },
          "Search filtered by minRelevance - no sufficiently relevant results"
        );
        return {
          query: query.query,
          mode,
          stores,
          results: [],
          totalResults: 0,
          timeMs: timeMs2,
          confidence: this.calculateConfidence(maxRawScore),
          maxRawScore
        };
      }
    }
    const dedupedResults = this.deduplicateBySource(allResults, query.query);
    const resultsToEnhance = dedupedResults.slice(0, limit);
    const graphs = /* @__PURE__ */ new Map();
    if (detail === "contextual" || detail === "full") {
      const storeIds = new Set(resultsToEnhance.map((r) => r.metadata.storeId));
      for (const storeId of storeIds) {
        graphs.set(storeId, await this.loadGraphForStore(storeId));
      }
    }
    const enhancedResults = resultsToEnhance.map((r) => {
      const graph = graphs.get(r.metadata.storeId) ?? null;
      return this.addProgressiveContext(r, query.query, detail, graph);
    });
    const timeMs = Date.now() - startTime;
    const confidence = mode !== "fts" ? this.calculateConfidence(maxRawScore) : void 0;
    logger2.info(
      {
        query: query.query,
        mode,
        resultCount: enhancedResults.length,
        dedupedFrom: allResults.length,
        intents: intents.map((i) => `${i.intent}(${i.confidence.toFixed(2)})`),
        maxRawScore: mode !== "fts" ? maxRawScore : void 0,
        confidence,
        timeMs
      },
      "Search complete"
    );
    return {
      query: query.query,
      mode,
      stores,
      results: enhancedResults,
      totalResults: enhancedResults.length,
      timeMs,
      confidence,
      maxRawScore: mode !== "fts" ? maxRawScore : void 0
    };
  }
  /**
   * Deduplicate results by source file path.
   * Keeps the best chunk for each unique source, considering both score and query relevance.
   */
  deduplicateBySource(results, query) {
    const bySource = /* @__PURE__ */ new Map();
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t2) => t2.length > 2);
    for (const result of results) {
      const storeId = result.metadata.storeId;
      const source = result.metadata.path ?? result.metadata.url ?? result.id;
      const sourceKey = `${storeId}:${source}`;
      const existing = bySource.get(sourceKey);
      if (!existing) {
        bySource.set(sourceKey, result);
      } else {
        const existingTermCount = this.countQueryTerms(existing.content, queryTerms);
        const newTermCount = this.countQueryTerms(result.content, queryTerms);
        const existingRelevance = existingTermCount * existing.score;
        const newRelevance = newTermCount * result.score;
        if (newRelevance > existingRelevance) {
          bySource.set(sourceKey, result);
        }
      }
    }
    return Array.from(bySource.values()).sort((a, b) => b.score - a.score);
  }
  /**
   * Count how many query terms appear in the content.
   */
  countQueryTerms(content, queryTerms) {
    const lowerContent = content.toLowerCase();
    return queryTerms.filter((term) => lowerContent.includes(term)).length;
  }
  /**
   * Normalize scores to 0-1 range and optionally filter by threshold.
   * This ensures threshold values match displayed scores (UX consistency).
   *
   * Edge case handling:
   * - If there's only 1 result or all results have the same score, normalization
   *   would make them all 1.0. In this case, we keep the raw scores to allow
   *   threshold filtering to work meaningfully on absolute quality.
   */
  normalizeAndFilterScores(results, threshold) {
    if (results.length === 0) return [];
    const sorted = [...results].sort((a, b) => b.score - a.score);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first === void 0 || last === void 0) return [];
    const maxScore = first.score;
    const minScore = last.score;
    const range = maxScore - minScore;
    const normalized = range > 0 ? sorted.map((r) => ({
      ...r,
      score: Math.round((r.score - minScore) / range * 1e6) / 1e6
    })) : sorted;
    if (threshold !== void 0) {
      return normalized.filter((r) => r.score >= threshold);
    }
    return normalized;
  }
  /**
   * Fetch raw vector search results without normalization.
   * Returns results with raw cosine similarity scores [0-1].
   */
  async vectorSearchRaw(query, stores, limit) {
    const queryVector = await this.embeddingEngine.embed(query);
    const results = [];
    for (const storeId of stores) {
      const hits = await this.lanceStore.search(storeId, queryVector, limit);
      results.push(
        ...hits.map((r) => ({
          id: r.id,
          score: r.score,
          // Raw cosine similarity (1 - distance)
          content: r.content,
          metadata: r.metadata
        }))
      );
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
  async ftsSearch(query, stores, limit) {
    const results = [];
    for (const storeId of stores) {
      try {
        const hits = await this.lanceStore.fullTextSearch(storeId, query, limit);
        results.push(
          ...hits.map((r) => ({
            id: r.id,
            score: r.score,
            content: r.content,
            metadata: r.metadata
          }))
        );
      } catch {
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
  /**
   * Internal hybrid search result with additional metadata for confidence calculation.
   */
  async hybridSearchWithMetadata(query, stores, limit, threshold) {
    const intents = classifyQueryIntents(query);
    const rawVectorResults = await this.vectorSearchRaw(query, stores, limit * 2);
    const rawVectorScores = /* @__PURE__ */ new Map();
    rawVectorResults.forEach((r) => {
      rawVectorScores.set(r.id, r.score);
    });
    const maxRawScore = rawVectorResults.length > 0 ? rawVectorResults[0]?.score ?? 0 : 0;
    const vectorResults = this.normalizeAndFilterScores(rawVectorResults);
    const ftsResults = await this.ftsSearch(query, stores, limit * 2);
    const vectorRanks = /* @__PURE__ */ new Map();
    const ftsRanks = /* @__PURE__ */ new Map();
    const allDocs = /* @__PURE__ */ new Map();
    vectorResults.forEach((r, i) => {
      vectorRanks.set(r.id, i + 1);
      allDocs.set(r.id, r);
    });
    ftsResults.forEach((r, i) => {
      ftsRanks.set(r.id, i + 1);
      if (!allDocs.has(r.id)) {
        allDocs.set(r.id, r);
      }
    });
    const rrfScores = [];
    const contentType = detectContentType([...allDocs.values()]);
    const { k, vectorWeight, ftsWeight } = RRF_PRESETS[contentType];
    for (const [id, result] of allDocs) {
      const vectorRank = vectorRanks.get(id) ?? Infinity;
      const ftsRank = ftsRanks.get(id) ?? Infinity;
      const rawVectorScore = rawVectorScores.get(id);
      const vectorRRF = vectorRank !== Infinity ? vectorWeight / (k + vectorRank) : 0;
      const ftsRRF = ftsRank !== Infinity ? ftsWeight / (k + ftsRank) : 0;
      const fileTypeBoost = this.getFileTypeBoost(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        result.metadata["fileType"],
        intents
      );
      const frameworkBoost = this.getFrameworkContextBoost(query, result);
      const urlKeywordBoost = this.getUrlKeywordBoost(query, result);
      const pathKeywordBoost = this.getPathKeywordBoost(query, result);
      const metadata = {
        vectorRRF,
        ftsRRF,
        fileTypeBoost,
        frameworkBoost,
        urlKeywordBoost,
        pathKeywordBoost
      };
      if (vectorRank !== Infinity) {
        metadata.vectorRank = vectorRank;
      }
      if (ftsRank !== Infinity) {
        metadata.ftsRank = ftsRank;
      }
      if (rawVectorScore !== void 0) {
        metadata.rawVectorScore = rawVectorScore;
      }
      rrfScores.push({
        id,
        score: (vectorRRF + ftsRRF) * fileTypeBoost * frameworkBoost * urlKeywordBoost * pathKeywordBoost,
        result,
        rawVectorScore,
        metadata
      });
    }
    const sorted = rrfScores.sort((a, b) => b.score - a.score).slice(0, limit);
    let normalizedResults;
    if (sorted.length > 0) {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      if (first === void 0 || last === void 0) {
        normalizedResults = sorted.map((r) => ({
          ...r.result,
          score: r.score,
          rankingMetadata: r.metadata
        }));
      } else {
        const maxScore = first.score;
        const minScore = last.score;
        const range = maxScore - minScore;
        if (range > 0) {
          normalizedResults = sorted.map((r) => ({
            ...r.result,
            score: Math.round((r.score - minScore) / range * 1e6) / 1e6,
            rankingMetadata: r.metadata
          }));
        } else {
          normalizedResults = sorted.map((r) => ({
            ...r.result,
            score: r.score,
            rankingMetadata: r.metadata
          }));
        }
      }
    } else {
      normalizedResults = [];
    }
    if (threshold !== void 0) {
      normalizedResults = normalizedResults.filter((r) => r.score >= threshold);
    }
    return { results: normalizedResults, maxRawScore };
  }
  async searchAllStores(query, storeIds) {
    return this.search({
      ...query,
      stores: storeIds
    });
  }
  /**
   * Get a score multiplier based on file type and query intent.
   * Documentation files get a strong boost to surface them higher.
   * Phase 4: Strengthened boosts for better documentation ranking.
   * Phase 1: Intent-based adjustments for context-aware ranking.
   */
  getFileTypeBoost(fileType, intents) {
    let baseBoost;
    switch (fileType) {
      case "documentation-primary":
        baseBoost = 1.8;
        break;
      case "documentation":
        baseBoost = 1.5;
        break;
      case "example":
        baseBoost = 1.4;
        break;
      case "source":
        baseBoost = 1;
        break;
      case "source-internal":
        baseBoost = 0.75;
        break;
      case "test":
        baseBoost = parseFloat(process.env["SEARCH_TEST_FILE_BOOST"] ?? "0.5");
        break;
      case "config":
        baseBoost = 0.5;
        break;
      case "changelog":
        baseBoost = 0.7;
        break;
      default:
        baseBoost = 1;
    }
    let weightedMultiplier = 0;
    let totalConfidence = 0;
    for (const { intent, confidence } of intents) {
      const intentBoosts = INTENT_FILE_BOOSTS[intent];
      const multiplier = intentBoosts[fileType ?? "other"] ?? 1;
      weightedMultiplier += multiplier * confidence;
      totalConfidence += confidence;
    }
    const blendedMultiplier = totalConfidence > 0 ? weightedMultiplier / totalConfidence : 1;
    const finalBoost = baseBoost * blendedMultiplier;
    if (fileType === "test") {
      return Math.min(finalBoost, 0.6);
    }
    return finalBoost;
  }
  /**
   * Get a score multiplier based on URL keyword matching.
   * Boosts results where URL path contains significant query keywords.
   * This helps queries like "troubleshooting" rank /troubleshooting pages first.
   */
  getUrlKeywordBoost(query, result) {
    const url = result.metadata.url;
    if (url === void 0 || url === "") return 1;
    const urlPath = url.toLowerCase().replace(/[^a-z0-9]+/g, " ");
    const stopWords = /* @__PURE__ */ new Set([
      "how",
      "to",
      "the",
      "a",
      "an",
      "is",
      "are",
      "what",
      "why",
      "when",
      "where",
      "can",
      "do",
      "does",
      "i",
      "my",
      "your",
      "it",
      "in",
      "on",
      "for",
      "with",
      "this",
      "that",
      "get",
      "use",
      "using"
    ]);
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t2) => t2.length > 2 && !stopWords.has(t2));
    if (queryTerms.length === 0) return 1;
    const matchingTerms = queryTerms.filter((term) => urlPath.includes(term));
    if (matchingTerms.length === 0) return 1;
    const matchRatio = matchingTerms.length / queryTerms.length;
    return 1 + 1 * matchRatio;
  }
  /**
   * Get a score multiplier based on file path keyword matching.
   * Boosts results where file path contains significant query keywords.
   * This helps queries like "dispatcher" rank async_dispatcher.py higher.
   */
  getPathKeywordBoost(query, result) {
    const path4 = result.metadata.path;
    if (path4 === void 0 || path4 === "") return 1;
    const pathSegments = path4.toLowerCase().replace(/[^a-z0-9]+/g, " ");
    const stopWords = /* @__PURE__ */ new Set([
      "how",
      "to",
      "the",
      "a",
      "an",
      "is",
      "are",
      "what",
      "why",
      "when",
      "where",
      "can",
      "do",
      "does",
      "i",
      "my",
      "your",
      "it",
      "in",
      "on",
      "for",
      "with",
      "this",
      "that",
      "get",
      "use",
      "using"
    ]);
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t2) => t2.length > 2 && !stopWords.has(t2));
    if (queryTerms.length === 0) return 1;
    const matchingTerms = queryTerms.filter((term) => pathSegments.includes(term));
    if (matchingTerms.length === 0) return 1;
    const matchRatio = matchingTerms.length / queryTerms.length;
    return 1 + 1 * matchRatio;
  }
  /**
   * Get a score multiplier based on framework context.
   * If query mentions a framework, boost results from that framework's files.
   */
  getFrameworkContextBoost(query, result) {
    const path4 = result.metadata.path ?? result.metadata.url ?? "";
    const content = result.content.toLowerCase();
    const pathLower = path4.toLowerCase();
    for (const { pattern, terms } of FRAMEWORK_PATTERNS) {
      if (pattern.test(query)) {
        const resultMatchesFramework = terms.some(
          (term) => pathLower.includes(term) || content.includes(term)
        );
        if (resultMatchesFramework) {
          return 1.5;
        } else {
          return 0.8;
        }
      }
    }
    return 1;
  }
  addProgressiveContext(result, query, detail, graph) {
    const enhanced = { ...result };
    const path4 = result.metadata.path ?? result.metadata.url ?? "unknown";
    const fileType = result.metadata["fileType"];
    const codeUnit = this.extractCodeUnitFromResult(result);
    const symbolName = codeUnit?.name ?? this.extractSymbolName(result.content);
    enhanced.summary = {
      type: this.inferType(fileType, codeUnit),
      name: symbolName,
      signature: codeUnit?.signature ?? "",
      purpose: this.generatePurpose(result.content, query),
      location: `${path4}${codeUnit ? `:${String(codeUnit.startLine)}` : ""}`,
      relevanceReason: this.generateRelevanceReason(result, query)
    };
    if (detail === "contextual" || detail === "full") {
      const usage = this.getUsageFromGraph(graph, path4, symbolName);
      enhanced.context = {
        interfaces: this.extractInterfaces(result.content),
        keyImports: this.extractImports(result.content),
        relatedConcepts: this.extractConcepts(result.content, query),
        usage
      };
    }
    if (detail === "full") {
      const relatedCode = this.getRelatedCodeFromGraph(graph, path4, symbolName);
      enhanced.full = {
        completeCode: codeUnit?.fullContent ?? result.content,
        relatedCode,
        documentation: this.extractDocumentation(result.content),
        tests: void 0
      };
    }
    return enhanced;
  }
  extractCodeUnitFromResult(result) {
    const path4 = result.metadata.path;
    if (path4 === void 0 || path4 === "") return void 0;
    const ext = path4.split(".").pop() ?? "";
    const language = ext === "ts" || ext === "tsx" ? "typescript" : ext === "js" || ext === "jsx" ? "javascript" : ext;
    const symbolName = this.extractSymbolName(result.content);
    if (symbolName === "") return void 0;
    return this.codeUnitService.extractCodeUnit(result.content, symbolName, language);
  }
  extractSymbolName(content) {
    const funcMatch = content.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
    if (funcMatch?.[1] !== void 0 && funcMatch[1] !== "") return funcMatch[1];
    const classMatch = content.match(/(?:export\s+)?class\s+(\w+)/);
    if (classMatch?.[1] !== void 0 && classMatch[1] !== "") return classMatch[1];
    const constMatch = content.match(/(?:export\s+)?const\s+(\w+)/);
    if (constMatch?.[1] !== void 0 && constMatch[1] !== "") return constMatch[1];
    return "(anonymous)";
  }
  inferType(fileType, codeUnit) {
    if (codeUnit) return codeUnit.type;
    if (fileType === "documentation" || fileType === "documentation-primary")
      return "documentation";
    return "function";
  }
  generatePurpose(content, query) {
    const docMatch = content.match(/\/\*\*\s*\n\s*\*\s*([^\n]+)/);
    if (docMatch?.[1] !== void 0 && docMatch[1] !== "") return docMatch[1].trim();
    const lines = content.split("\n");
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t2) => t2.length > 2);
    const shouldSkip = (cleaned) => {
      return cleaned.startsWith("import ") || cleaned.startsWith("export ") || cleaned.startsWith("interface ") || cleaned.startsWith("type ");
    };
    const scoreLine = (cleaned) => {
      const lowerLine = cleaned.toLowerCase();
      return queryTerms.filter((term) => lowerLine.includes(term)).length;
    };
    const isMeaningful = (cleaned) => {
      if (cleaned.length === 0) return false;
      if (cleaned.startsWith("//") || cleaned.startsWith("/*")) return false;
      if (cleaned.startsWith("#") && cleaned.length > 3) return true;
      return cleaned.length >= 15;
    };
    let bestLine = null;
    let bestScore = 0;
    for (const line of lines) {
      const cleaned = line.trim();
      if (shouldSkip(cleaned) || !isMeaningful(cleaned)) continue;
      let score = scoreLine(cleaned);
      if (/[.!?]$/.test(cleaned)) {
        score += 0.5;
      }
      if (/\w+\([^)]*\)|=\s*\w+\(|=>/.test(cleaned)) {
        score += 0.6;
      }
      if (score > bestScore) {
        bestScore = score;
        bestLine = cleaned;
      }
    }
    if (bestLine !== null && bestLine !== "" && bestScore > 0) {
      if (bestLine.length > 150) {
        const firstSentence = bestLine.match(/^[^.!?]+[.!?]/);
        if (firstSentence && firstSentence[0].length >= 20 && firstSentence[0].length <= 150) {
          return firstSentence[0].trim();
        }
        return `${bestLine.substring(0, 147)}...`;
      }
      return bestLine;
    }
    for (const line of lines) {
      const cleaned = line.trim();
      if (shouldSkip(cleaned) || !isMeaningful(cleaned)) continue;
      if (cleaned.length > 150) {
        const firstSentence = cleaned.match(/^[^.!?]+[.!?]/);
        if (firstSentence && firstSentence[0].length >= 20 && firstSentence[0].length <= 150) {
          return firstSentence[0].trim();
        }
        return `${cleaned.substring(0, 147)}...`;
      }
      return cleaned;
    }
    return "Code related to query";
  }
  generateRelevanceReason(result, query) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t2) => t2.length > 2);
    const contentLower = result.content.toLowerCase();
    const matchedTerms = queryTerms.filter((term) => contentLower.includes(term));
    if (matchedTerms.length > 0) {
      return `Matches: ${matchedTerms.join(", ")}`;
    }
    return "Semantically similar to query";
  }
  extractInterfaces(content) {
    const interfaces = [];
    const matches = content.matchAll(/interface\s+(\w+)/g);
    for (const match of matches) {
      if (match[1] !== void 0 && match[1] !== "") interfaces.push(match[1]);
    }
    return interfaces;
  }
  extractImports(content) {
    const imports = [];
    const matches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
    for (const match of matches) {
      if (match[1] !== void 0 && match[1] !== "") imports.push(match[1]);
    }
    return imports.slice(0, 5);
  }
  extractConcepts(content, _query) {
    const stopwords = /* @__PURE__ */ new Set([
      "this",
      "that",
      "these",
      "those",
      "from",
      "with",
      "have",
      "will",
      "would",
      "should",
      "could",
      "about",
      "been",
      "were",
      "being",
      "function",
      "return",
      "const",
      "import",
      "export",
      "default",
      "type",
      "interface",
      "class",
      "extends",
      "implements",
      "async",
      "await",
      "then",
      "catch",
      "throw",
      "error",
      "undefined",
      "null",
      "true",
      "false",
      "void",
      "number",
      "string",
      "boolean",
      "object",
      "array",
      "promise",
      "callback",
      "resolve",
      "reject",
      "value",
      "param",
      "params",
      "args",
      "props",
      "options",
      "config",
      "data"
    ]);
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [];
    const frequency = /* @__PURE__ */ new Map();
    for (const word of words) {
      if (stopwords.has(word)) continue;
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }
    return Array.from(frequency.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word);
  }
  extractDocumentation(content) {
    const docMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
    if (docMatch?.[1] !== void 0 && docMatch[1] !== "") {
      return docMatch[1].split("\n").map((line) => line.replace(/^\s*\*\s?/, "").trim()).filter((line) => line.length > 0).join("\n");
    }
    return "";
  }
  /**
   * Get usage stats from code graph.
   * Returns default values if no graph is available.
   */
  getUsageFromGraph(graph, filePath, symbolName) {
    if (!graph || symbolName === "" || symbolName === "(anonymous)") {
      return { calledBy: 0, calls: 0 };
    }
    const nodeId = `${filePath}:${symbolName}`;
    return {
      calledBy: graph.getCalledByCount(nodeId),
      calls: graph.getCallsCount(nodeId)
    };
  }
  /**
   * Get related code from graph.
   * Returns callers and callees for the symbol.
   */
  getRelatedCodeFromGraph(graph, filePath, symbolName) {
    if (!graph || symbolName === "" || symbolName === "(anonymous)") {
      return [];
    }
    const nodeId = `${filePath}:${symbolName}`;
    const related = [];
    const incoming = graph.getIncomingEdges(nodeId);
    for (const edge of incoming) {
      if (edge.type === "calls") {
        const [file, symbol] = this.parseNodeId(edge.from);
        related.push({
          file,
          summary: symbol ? `${symbol}()` : "unknown",
          relationship: "calls this"
        });
      }
    }
    const outgoing = graph.getEdges(nodeId);
    for (const edge of outgoing) {
      if (edge.type === "calls") {
        const [file, symbol] = this.parseNodeId(edge.to);
        related.push({
          file,
          summary: symbol ? `${symbol}()` : "unknown",
          relationship: "called by this"
        });
      }
    }
    return related.slice(0, 10);
  }
  /**
   * Parse a node ID into file path and symbol name.
   */
  parseNodeId(nodeId) {
    const lastColon = nodeId.lastIndexOf(":");
    if (lastColon === -1) {
      return [nodeId, ""];
    }
    return [nodeId.substring(0, lastColon), nodeId.substring(lastColon + 1)];
  }
};

// src/services/store-definition.service.ts
import { readFile as readFile7, access as access4 } from "fs/promises";
import { resolve as resolve2, isAbsolute, join as join9 } from "path";

// src/types/store-definition.ts
import { z as z3 } from "zod";
var BaseStoreDefinitionSchema = z3.object({
  name: z3.string().min(1, "Store name is required"),
  description: z3.string().optional(),
  tags: z3.array(z3.string()).optional()
});
var FileStoreDefinitionSchema = BaseStoreDefinitionSchema.extend({
  type: z3.literal("file"),
  path: z3.string().min(1, "Path is required for file stores")
});
var GitUrlSchema = z3.string().refine(
  (val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return /^git@[\w.-]+:[\w./-]+$/.test(val);
    }
  },
  { message: "Must be a valid URL or SSH URL (git@host:path)" }
);
var RepoStoreDefinitionSchema = BaseStoreDefinitionSchema.extend({
  type: z3.literal("repo"),
  url: GitUrlSchema,
  branch: z3.string().optional(),
  depth: z3.number().int().positive("Depth must be a positive integer").optional()
});
var WebStoreDefinitionSchema = BaseStoreDefinitionSchema.extend({
  type: z3.literal("web"),
  url: z3.url("Valid URL is required for web stores"),
  depth: z3.number().int().min(0, "Depth must be non-negative").default(1),
  maxPages: z3.number().int().positive("maxPages must be a positive integer").optional(),
  crawlInstructions: z3.string().optional(),
  extractInstructions: z3.string().optional()
});
var StoreDefinitionSchema = z3.discriminatedUnion("type", [
  FileStoreDefinitionSchema,
  RepoStoreDefinitionSchema,
  WebStoreDefinitionSchema
]);
var StoreDefinitionsConfigSchema = z3.object({
  version: z3.literal(1),
  stores: z3.array(StoreDefinitionSchema)
});
function isFileStoreDefinition(def) {
  return def.type === "file";
}
function isRepoStoreDefinition(def) {
  return def.type === "repo";
}
function isWebStoreDefinition(def) {
  return def.type === "web";
}
var DEFAULT_STORE_DEFINITIONS_CONFIG = {
  version: 1,
  stores: []
};

// src/services/store-definition.service.ts
async function fileExists3(path4) {
  try {
    await access4(path4);
    return true;
  } catch {
    return false;
  }
}
var StoreDefinitionService = class {
  configPath;
  projectRoot;
  config = null;
  constructor(projectRoot) {
    this.projectRoot = projectRoot ?? ProjectRootService.resolve();
    this.configPath = join9(this.projectRoot, ".bluera/bluera-knowledge/stores.config.json");
  }
  /**
   * Load store definitions from config file.
   * Returns empty config if file doesn't exist.
   * Throws on parse/validation errors (fail fast per CLAUDE.md).
   */
  async load() {
    if (this.config !== null) {
      return this.config;
    }
    const exists = await fileExists3(this.configPath);
    if (!exists) {
      this.config = {
        ...DEFAULT_STORE_DEFINITIONS_CONFIG,
        stores: [...DEFAULT_STORE_DEFINITIONS_CONFIG.stores]
      };
      return this.config;
    }
    const content = await readFile7(this.configPath, "utf-8");
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to parse store definitions at ${this.configPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    const result = StoreDefinitionsConfigSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Invalid store definitions at ${this.configPath}: ${result.error.message}`);
    }
    this.config = result.data;
    return this.config;
  }
  /**
   * Save store definitions to config file.
   */
  async save(config) {
    await atomicWriteFile(this.configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }
  /**
   * Add a store definition.
   * Throws if a definition with the same name already exists.
   */
  async addDefinition(definition) {
    const config = await this.load();
    const existing = config.stores.find((s) => s.name === definition.name);
    if (existing !== void 0) {
      throw new Error(`Store definition "${definition.name}" already exists`);
    }
    config.stores.push(definition);
    await this.save(config);
  }
  /**
   * Remove a store definition by name.
   * Returns true if removed, false if not found.
   */
  async removeDefinition(name) {
    const config = await this.load();
    const index = config.stores.findIndex((s) => s.name === name);
    if (index === -1) {
      return false;
    }
    config.stores.splice(index, 1);
    await this.save(config);
    return true;
  }
  /**
   * Update an existing store definition.
   * Only updates the provided fields, preserving others.
   * Throws if definition not found.
   */
  async updateDefinition(name, updates) {
    const config = await this.load();
    const index = config.stores.findIndex((s) => s.name === name);
    if (index === -1) {
      throw new Error(`Store definition "${name}" not found`);
    }
    const existing = config.stores[index];
    if (existing === void 0) {
      throw new Error(`Store definition "${name}" not found at index ${String(index)}`);
    }
    if (updates.description !== void 0) {
      existing.description = updates.description;
    }
    if (updates.tags !== void 0) {
      existing.tags = updates.tags;
    }
    await this.save(config);
  }
  /**
   * Get a store definition by name.
   * Returns undefined if not found.
   */
  async getByName(name) {
    const config = await this.load();
    return config.stores.find((s) => s.name === name);
  }
  /**
   * Check if any definitions exist.
   */
  async hasDefinitions() {
    const config = await this.load();
    return config.stores.length > 0;
  }
  /**
   * Resolve a file store path relative to project root.
   */
  resolvePath(path4) {
    if (isAbsolute(path4)) {
      return path4;
    }
    return resolve2(this.projectRoot, path4);
  }
  /**
   * Get the config file path.
   */
  getConfigPath() {
    return this.configPath;
  }
  /**
   * Get the project root.
   */
  getProjectRoot() {
    return this.projectRoot;
  }
  /**
   * Clear the cached config (useful for testing).
   */
  clearCache() {
    this.config = null;
  }
};

// src/services/store.service.ts
import { randomUUID as randomUUID2 } from "crypto";
import { readFile as readFile8, mkdir as mkdir5, stat as stat2, access as access5 } from "fs/promises";
import { join as join10, resolve as resolve3 } from "path";

// src/plugin/git-clone.ts
import { spawn } from "child_process";
import { mkdir as mkdir4 } from "fs/promises";
async function cloneRepository(options) {
  const { url, targetDir, branch, depth = 1 } = options;
  await mkdir4(targetDir, { recursive: true });
  const args = ["clone", "--depth", String(depth)];
  if (branch !== void 0) {
    args.push("--branch", branch);
  }
  args.push(url, targetDir);
  return new Promise((resolve4) => {
    const git = spawn("git", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    git.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    git.on("error", (error) => {
      resolve4(err(error));
    });
    git.on("close", (code) => {
      if (code === 0) {
        resolve4(ok(targetDir));
      } else {
        resolve4(err(new Error(`Git clone failed: ${stderr}`)));
      }
    });
  });
}
function isGitUrl(source) {
  return source.startsWith("http://") || source.startsWith("https://") || source.startsWith("git@");
}
function extractRepoName(url) {
  const match = /\/([^/]+?)(\.git)?$/.exec(url);
  const name = match?.[1];
  if (name === void 0) {
    return "repository";
  }
  return name;
}

// src/services/store.service.ts
async function fileExists4(path4) {
  try {
    await access5(path4);
    return true;
  } catch {
    return false;
  }
}
var StoreService = class {
  dataDir;
  definitionService;
  gitignoreService;
  projectRoot;
  registry = { stores: [] };
  constructor(dataDir, options) {
    this.dataDir = dataDir;
    this.definitionService = options?.definitionService ?? void 0;
    this.gitignoreService = options?.gitignoreService ?? void 0;
    this.projectRoot = options?.projectRoot ?? void 0;
  }
  async initialize() {
    await mkdir5(this.dataDir, { recursive: true });
    await this.loadRegistry();
  }
  /**
   * Convert a Store and CreateStoreInput to a StoreDefinition for persistence.
   * Returns undefined for stores that shouldn't be persisted (e.g., local repo stores).
   */
  createDefinitionFromStore(store, input) {
    const tags = store.tags !== void 0 ? [...store.tags] : void 0;
    const base = {
      name: store.name,
      description: store.description,
      tags
    };
    switch (store.type) {
      case "file": {
        const fileStore = store;
        const fileDef = {
          ...base,
          type: "file",
          // Use original input path if provided (may be relative), otherwise use normalized
          path: input.path ?? fileStore.path
        };
        return fileDef;
      }
      case "repo": {
        const repoStore = store;
        if (repoStore.url === void 0) {
          return void 0;
        }
        const repoDef = {
          ...base,
          type: "repo",
          url: repoStore.url,
          branch: repoStore.branch,
          depth: input.depth
        };
        return repoDef;
      }
      case "web": {
        const webStore = store;
        const webDef = {
          ...base,
          type: "web",
          url: webStore.url,
          depth: webStore.depth
        };
        return webDef;
      }
    }
  }
  /**
   * Create a StoreDefinition from an existing store (without original input).
   * Used when updating/renaming stores where we don't have the original input.
   * Returns undefined for stores that shouldn't be persisted (e.g., local repo stores).
   */
  createDefinitionFromExistingStore(store) {
    const tags = store.tags !== void 0 ? [...store.tags] : void 0;
    const base = {
      name: store.name,
      description: store.description,
      tags
    };
    switch (store.type) {
      case "file": {
        const fileDef = {
          ...base,
          type: "file",
          path: store.path
        };
        return fileDef;
      }
      case "repo": {
        if (store.url === void 0) {
          return void 0;
        }
        const repoDef = {
          ...base,
          type: "repo",
          url: store.url,
          branch: store.branch,
          depth: store.depth
        };
        return repoDef;
      }
      case "web": {
        const webDef = {
          ...base,
          type: "web",
          url: store.url,
          depth: store.depth
        };
        return webDef;
      }
    }
  }
  async create(input, options) {
    if (!input.name || input.name.trim() === "") {
      return err(new Error("Store name cannot be empty"));
    }
    const existing = await this.getByName(input.name);
    if (existing !== void 0) {
      return err(new Error(`Store with name "${input.name}" already exists`));
    }
    const id = createStoreId(randomUUID2());
    const now = /* @__PURE__ */ new Date();
    let store;
    switch (input.type) {
      case "file": {
        if (input.path === void 0) {
          return err(new Error("Path is required for file stores"));
        }
        const normalizedPath = this.projectRoot !== void 0 ? resolve3(this.projectRoot, input.path) : resolve3(input.path);
        try {
          const stats = await stat2(normalizedPath);
          if (!stats.isDirectory()) {
            return err(new Error(`Path is not a directory: ${normalizedPath}`));
          }
        } catch {
          return err(new Error(`Directory does not exist: ${normalizedPath}`));
        }
        store = {
          type: "file",
          id,
          name: input.name,
          path: normalizedPath,
          description: input.description,
          tags: input.tags,
          status: "ready",
          createdAt: now,
          updatedAt: now
        };
        break;
      }
      case "repo": {
        let repoPath = input.path;
        if (input.url !== void 0) {
          const cloneDir = join10(this.dataDir, "repos", id);
          const result = await cloneRepository({
            url: input.url,
            targetDir: cloneDir,
            ...input.branch !== void 0 ? { branch: input.branch } : {},
            depth: input.depth ?? 1
          });
          if (!result.success) {
            return err(result.error);
          }
          repoPath = result.data;
        }
        if (repoPath === void 0) {
          return err(new Error("Path or URL required for repo stores"));
        }
        const normalizedRepoPath = this.projectRoot !== void 0 ? resolve3(this.projectRoot, repoPath) : resolve3(repoPath);
        if (input.url === void 0) {
          try {
            const stats = await stat2(normalizedRepoPath);
            if (!stats.isDirectory()) {
              return err(new Error(`Path is not a directory: ${normalizedRepoPath}`));
            }
          } catch {
            return err(new Error(`Repository path does not exist: ${normalizedRepoPath}`));
          }
        }
        store = {
          type: "repo",
          id,
          name: input.name,
          path: normalizedRepoPath,
          url: input.url,
          branch: input.branch,
          depth: input.depth,
          description: input.description,
          tags: input.tags,
          status: "ready",
          createdAt: now,
          updatedAt: now
        };
        break;
      }
      case "web":
        if (input.url === void 0) {
          return err(new Error("URL is required for web stores"));
        }
        store = {
          type: "web",
          id,
          name: input.name,
          url: input.url,
          depth: input.depth ?? 1,
          description: input.description,
          tags: input.tags,
          status: "ready",
          createdAt: now,
          updatedAt: now
        };
        break;
      default: {
        const invalidType = input.type;
        return err(new Error(`Invalid store type: ${String(invalidType)}`));
      }
    }
    this.registry.stores.push(store);
    await this.saveRegistry();
    if (this.gitignoreService !== void 0) {
      await this.gitignoreService.ensureGitignorePatterns();
    }
    if (this.definitionService !== void 0 && options?.skipDefinitionSync !== true) {
      const definition = this.createDefinitionFromStore(store, input);
      if (definition !== void 0) {
        await this.definitionService.addDefinition(definition);
      }
    }
    return ok(store);
  }
  async list(type) {
    if (type !== void 0) {
      return Promise.resolve(this.registry.stores.filter((s) => s.type === type));
    }
    return Promise.resolve([...this.registry.stores]);
  }
  async get(id) {
    return Promise.resolve(this.registry.stores.find((s) => s.id === id));
  }
  async getByName(name) {
    return Promise.resolve(this.registry.stores.find((s) => s.name === name));
  }
  async getByIdOrName(idOrName) {
    return Promise.resolve(
      this.registry.stores.find((s) => s.id === idOrName || s.name === idOrName)
    );
  }
  async update(id, updates, options) {
    const index = this.registry.stores.findIndex((s) => s.id === id);
    if (index === -1) {
      return err(new Error(`Store not found: ${id}`));
    }
    const store = this.registry.stores[index];
    if (store === void 0) {
      return err(new Error(`Store not found: ${id}`));
    }
    const isRenaming = updates.name !== void 0 && updates.name !== store.name;
    if (isRenaming) {
      const existing = this.registry.stores.find((s) => s.name === updates.name && s.id !== id);
      if (existing !== void 0) {
        return err(new Error(`Store with name '${updates.name}' already exists`));
      }
    }
    const updated = {
      ...store,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.registry.stores[index] = updated;
    await this.saveRegistry();
    if (this.definitionService !== void 0 && options?.skipDefinitionSync !== true) {
      if (isRenaming) {
        await this.definitionService.removeDefinition(store.name);
        const newDefinition = this.createDefinitionFromExistingStore(updated);
        if (newDefinition !== void 0) {
          await this.definitionService.addDefinition(newDefinition);
        }
      } else {
        const defUpdates = {};
        if (updates.description !== void 0) {
          defUpdates.description = updates.description;
        }
        if (updates.tags !== void 0) {
          defUpdates.tags = [...updates.tags];
        }
        if (Object.keys(defUpdates).length > 0) {
          await this.definitionService.updateDefinition(store.name, defUpdates);
        }
      }
    }
    return ok(updated);
  }
  async delete(id, options) {
    const index = this.registry.stores.findIndex((s) => s.id === id);
    if (index === -1) {
      return err(new Error(`Store not found: ${id}`));
    }
    const store = this.registry.stores[index];
    if (store === void 0) {
      return err(new Error(`Store not found: ${id}`));
    }
    const storeName = store.name;
    this.registry.stores.splice(index, 1);
    await this.saveRegistry();
    if (this.definitionService !== void 0 && options?.skipDefinitionSync !== true) {
      await this.definitionService.removeDefinition(storeName);
    }
    return ok(void 0);
  }
  async loadRegistry() {
    const registryPath = join10(this.dataDir, "stores.json");
    const exists = await fileExists4(registryPath);
    if (!exists) {
      this.registry = { stores: [] };
      await this.saveRegistry();
      return;
    }
    const content = await readFile8(registryPath, "utf-8");
    try {
      const data = JSON.parse(content);
      this.registry = {
        stores: data.stores.filter((s) => s !== null).map((s) => ({
          ...s,
          id: createStoreId(s.id),
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        }))
      };
    } catch (error) {
      throw new Error(
        `Failed to parse store registry at ${registryPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  async saveRegistry() {
    const registryPath = join10(this.dataDir, "stores.json");
    await atomicWriteFile(registryPath, JSON.stringify(this.registry, null, 2));
  }
};

// src/crawl/bridge.ts
import { spawn as spawn2 } from "child_process";
import { randomUUID as randomUUID3 } from "crypto";
import { existsSync as existsSync4 } from "fs";
import path3 from "path";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { ZodError } from "zod";

// src/crawl/schemas.ts
import { z as z4 } from "zod";
var CrawledLinkSchema = z4.object({
  href: z4.string(),
  text: z4.string(),
  title: z4.string().optional(),
  base_domain: z4.string().optional(),
  head_data: z4.unknown().optional(),
  head_extraction_status: z4.unknown().optional(),
  head_extraction_error: z4.unknown().optional(),
  intrinsic_score: z4.number().optional(),
  contextual_score: z4.unknown().optional(),
  total_score: z4.unknown().optional()
});
var CrawlPageSchema = z4.object({
  url: z4.string(),
  title: z4.string(),
  content: z4.string(),
  links: z4.array(z4.string()),
  crawledAt: z4.string()
});
var CrawlResultSchema = z4.object({
  pages: z4.array(CrawlPageSchema)
});
var HeadlessResultSchema = z4.object({
  html: z4.string(),
  markdown: z4.string(),
  links: z4.array(z4.union([CrawledLinkSchema, z4.string()]))
});
function validateHeadlessResult(data) {
  return HeadlessResultSchema.parse(data);
}
function validateCrawlResult(data) {
  return CrawlResultSchema.parse(data);
}
var MethodInfoSchema = z4.object({
  name: z4.string(),
  async: z4.boolean(),
  signature: z4.string(),
  startLine: z4.number(),
  endLine: z4.number(),
  calls: z4.array(z4.string())
});
var CodeNodeSchema = z4.object({
  type: z4.enum(["function", "class"]),
  name: z4.string(),
  exported: z4.boolean(),
  startLine: z4.number(),
  endLine: z4.number(),
  async: z4.boolean().optional(),
  signature: z4.string().optional(),
  calls: z4.array(z4.string()).optional(),
  methods: z4.array(MethodInfoSchema).optional()
});
var ImportInfoSchema = z4.object({
  source: z4.string(),
  imported: z4.string(),
  alias: z4.string().optional().nullable()
});
var ParsePythonResultSchema = z4.object({
  nodes: z4.array(CodeNodeSchema),
  imports: z4.array(ImportInfoSchema)
});
function validateParsePythonResult(data) {
  return ParsePythonResultSchema.parse(data);
}

// src/crawl/bridge.ts
var logger3 = createLogger("python-bridge");
var PythonBridge = class {
  process = null;
  pending = /* @__PURE__ */ new Map();
  stoppingIntentionally = false;
  stdoutReadline = null;
  stderrReadline = null;
  start() {
    if (this.process) return Promise.resolve();
    const currentFilePath = fileURLToPath(import.meta.url);
    const distPattern = `${path3.sep}dist${path3.sep}`;
    const isProduction = currentFilePath.includes(distPattern);
    let pythonWorkerPath;
    let pythonPath;
    if (isProduction) {
      const distIndex = currentFilePath.indexOf(distPattern);
      const pluginRoot = currentFilePath.substring(0, distIndex);
      pythonWorkerPath = path3.join(pluginRoot, "python", "crawl_worker.py");
      const venvPython = path3.join(pluginRoot, ".venv", "bin", "python3");
      pythonPath = existsSync4(venvPython) ? venvPython : "python3";
    } else {
      const srcDir = path3.dirname(path3.dirname(currentFilePath));
      const projectRoot = path3.dirname(srcDir);
      pythonWorkerPath = path3.join(projectRoot, "python", "crawl_worker.py");
      pythonPath = "python3";
    }
    logger3.debug(
      { pythonWorkerPath, pythonPath, currentFilePath, isProduction },
      "Starting Python bridge process"
    );
    this.process = spawn2(pythonPath, [pythonWorkerPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    this.process.on("error", (err2) => {
      logger3.error({ error: err2.message, stack: err2.stack }, "Python bridge process error");
      this.rejectAllPending(new Error(`Process error: ${err2.message}`));
    });
    this.process.on("exit", (code, signal) => {
      if (code !== 0 && code !== null) {
        logger3.error({ code }, "Python bridge process exited with non-zero code");
        this.rejectAllPending(new Error(`Process exited with code ${String(code)}`));
      } else if (signal && !this.stoppingIntentionally) {
        logger3.error({ signal }, "Python bridge process killed with signal");
        this.rejectAllPending(new Error(`Process killed with signal ${signal}`));
      }
      this.process = null;
      this.stoppingIntentionally = false;
    });
    if (this.process.stderr) {
      this.stderrReadline = createInterface({ input: this.process.stderr });
      this.stderrReadline.on("line", (line) => {
        logger3.warn({ stderr: line }, "Python bridge stderr output");
      });
    }
    if (this.process.stdout === null) {
      this.process.kill();
      this.process = null;
      return Promise.reject(new Error("Python bridge process stdout is null"));
    }
    this.stdoutReadline = createInterface({ input: this.process.stdout });
    this.stdoutReadline.on("line", (line) => {
      if (!line.trim().startsWith("{")) {
        return;
      }
      try {
        const response = JSON.parse(line);
        const pending = this.pending.get(response.id);
        if (pending !== void 0) {
          if (response.error !== void 0) {
            clearTimeout(pending.timeout);
            this.pending.delete(response.id);
            pending.reject(new Error(response.error.message));
          } else if (response.result !== void 0) {
            clearTimeout(pending.timeout);
            this.pending.delete(response.id);
            try {
              let validated;
              if (pending.method === "crawl") {
                validated = validateCrawlResult(response.result);
              } else if (pending.method === "fetch_headless") {
                validated = validateHeadlessResult(response.result);
              } else {
                validated = validateParsePythonResult(response.result);
              }
              pending.resolve(validated);
            } catch (error) {
              if (error instanceof ZodError) {
                logger3.error(
                  {
                    issues: error.issues,
                    response: JSON.stringify(response.result)
                  },
                  "Python bridge response validation failed"
                );
                pending.reject(
                  new Error(`Invalid response format from Python bridge: ${error.message}`)
                );
              } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger3.error({ error: errorMessage }, "Response validation error");
                pending.reject(new Error(`Response validation error: ${errorMessage}`));
              }
            }
          }
        }
      } catch (err2) {
        logger3.error(
          {
            error: err2 instanceof Error ? err2.message : String(err2),
            line
          },
          "Failed to parse JSON response from Python bridge"
        );
      }
    });
    return Promise.resolve();
  }
  async crawl(url, timeoutMs = 3e4) {
    if (!this.process) await this.start();
    const id = randomUUID3();
    const request = {
      jsonrpc: "2.0",
      id,
      method: "crawl",
      params: { url }
    };
    return new Promise((resolve4, reject) => {
      const timeout = setTimeout(() => {
        const pending = this.pending.get(id);
        if (pending) {
          this.pending.delete(id);
          reject(new Error(`Crawl timeout after ${String(timeoutMs)}ms for URL: ${url}`));
        }
      }, timeoutMs);
      this.pending.set(id, {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Promise resolve type narrowing
        resolve: resolve4,
        reject,
        timeout,
        method: "crawl"
      });
      if (!this.process?.stdin) {
        reject(new Error("Python bridge process not available"));
        return;
      }
      this.process.stdin.write(`${JSON.stringify(request)}
`);
    });
  }
  async fetchHeadless(url, timeoutMs = 6e4) {
    if (!this.process) await this.start();
    const id = randomUUID3();
    const request = {
      jsonrpc: "2.0",
      id,
      method: "fetch_headless",
      params: { url }
    };
    return new Promise((resolve4, reject) => {
      const timeout = setTimeout(() => {
        const pending = this.pending.get(id);
        if (pending) {
          this.pending.delete(id);
          reject(new Error(`Headless fetch timeout after ${String(timeoutMs)}ms for URL: ${url}`));
        }
      }, timeoutMs);
      this.pending.set(id, {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Promise resolve type narrowing
        resolve: resolve4,
        reject,
        timeout,
        method: "fetch_headless"
      });
      if (!this.process?.stdin) {
        reject(new Error("Python bridge process not available"));
        return;
      }
      this.process.stdin.write(`${JSON.stringify(request)}
`);
    });
  }
  async parsePython(code, filePath, timeoutMs = 1e4) {
    if (!this.process) await this.start();
    const id = randomUUID3();
    const request = {
      jsonrpc: "2.0",
      id,
      method: "parse_python",
      params: { code, filePath }
    };
    return new Promise((resolve4, reject) => {
      const timeout = setTimeout(() => {
        const pending = this.pending.get(id);
        if (pending) {
          this.pending.delete(id);
          reject(
            new Error(`Python parsing timeout after ${String(timeoutMs)}ms for file: ${filePath}`)
          );
        }
      }, timeoutMs);
      this.pending.set(id, {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Promise resolve type narrowing
        resolve: resolve4,
        reject,
        timeout,
        method: "parse_python"
      });
      if (!this.process?.stdin) {
        reject(new Error("Python bridge process not available"));
        return;
      }
      this.process.stdin.write(`${JSON.stringify(request)}
`);
    });
  }
  stop() {
    if (!this.process) {
      return Promise.resolve();
    }
    return new Promise((resolve4) => {
      this.stoppingIntentionally = true;
      this.rejectAllPending(new Error("Python bridge stopped"));
      if (this.stdoutReadline) {
        this.stdoutReadline.close();
        this.stdoutReadline = null;
      }
      if (this.stderrReadline) {
        this.stderrReadline.close();
        this.stderrReadline = null;
      }
      const proc = this.process;
      if (proc === null) {
        resolve4();
        return;
      }
      const onExit = () => {
        resolve4();
      };
      proc.once("exit", onExit);
      proc.kill();
      setTimeout(() => {
        proc.removeListener("exit", onExit);
        if (this.process === proc) {
          proc.kill("SIGKILL");
          this.process = null;
        }
        resolve4();
      }, 1e3);
    });
  }
  rejectAllPending(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
  }
};

// src/db/embeddings.ts
import { homedir as homedir2 } from "os";
import { join as join11 } from "path";
import { pipeline, env } from "@huggingface/transformers";
env.cacheDir = join11(homedir2(), ".cache", "huggingface-transformers");
var EMBEDDING_DIMENSIONS = 384;
var EmbeddingEngine = class {
  extractor = null;
  modelName;
  batchSize;
  constructor(modelName = "Xenova/all-MiniLM-L6-v2", batchSize = 32) {
    this.modelName = modelName;
    this.batchSize = batchSize;
  }
  async initialize() {
    if (this.extractor !== null) return;
    this.extractor = await pipeline("feature-extraction", this.modelName, {
      dtype: "fp32"
    });
  }
  async embed(text) {
    if (this.extractor === null) {
      await this.initialize();
    }
    if (this.extractor === null) {
      throw new Error("Failed to initialize embedding model");
    }
    const output = await this.extractor(text, {
      pooling: "mean",
      normalize: true
    });
    const result = Array.from(output.data);
    return result.map((v) => Number(v));
  }
  async embedBatch(texts) {
    const results = [];
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      const batchResults = await Promise.all(batch.map((text) => this.embed(text)));
      results.push(...batchResults);
      if (i + this.batchSize < texts.length) {
        await new Promise((resolve4) => setTimeout(resolve4, 100));
      }
    }
    return results;
  }
  getDimensions() {
    return EMBEDDING_DIMENSIONS;
  }
  /**
   * Dispose the embedding pipeline to free resources.
   * Should be called before process exit to prevent ONNX runtime cleanup issues on macOS.
   */
  async dispose() {
    if (this.extractor !== null) {
      await this.extractor.dispose();
      this.extractor = null;
    }
  }
};

// src/db/lance.ts
import * as lancedb from "@lancedb/lancedb";

// src/types/document.ts
import { z as z5 } from "zod";
var DocumentTypeSchema = z5.enum(["file", "chunk", "web"]);
var DocumentMetadataSchema = z5.object({
  path: z5.string().optional(),
  url: z5.string().optional(),
  type: DocumentTypeSchema,
  storeId: z5.string(),
  indexedAt: z5.string(),
  // ISO 8601 string (what JSON serialization produces)
  fileHash: z5.string().optional(),
  chunkIndex: z5.number().optional(),
  totalChunks: z5.number().optional()
}).loose();

// src/db/lance.ts
var LanceStore = class {
  connection = null;
  tables = /* @__PURE__ */ new Map();
  dataDir;
  constructor(dataDir) {
    this.dataDir = dataDir;
  }
  async initialize(storeId) {
    this.connection ??= await lancedb.connect(this.dataDir);
    const tableName = this.getTableName(storeId);
    const tableNames = await this.connection.tableNames();
    if (!tableNames.includes(tableName)) {
      const table = await this.connection.createTable(tableName, [
        {
          id: "__init__",
          content: "",
          vector: new Array(EMBEDDING_DIMENSIONS).fill(0),
          metadata: "{}"
        }
      ]);
      await table.delete('id = "__init__"');
      this.tables.set(tableName, table);
    } else {
      const table = await this.connection.openTable(tableName);
      this.tables.set(tableName, table);
    }
  }
  async addDocuments(storeId, documents) {
    const table = await this.getTable(storeId);
    const lanceDocuments = documents.map((doc) => ({
      id: doc.id,
      content: doc.content,
      vector: [...doc.vector],
      metadata: JSON.stringify(doc.metadata)
    }));
    await table.add(lanceDocuments);
  }
  async deleteDocuments(storeId, documentIds) {
    const table = await this.getTable(storeId);
    const idList = documentIds.map((id) => `"${id}"`).join(", ");
    await table.delete(`id IN (${idList})`);
  }
  async clearAllDocuments(storeId) {
    const table = await this.getTable(storeId);
    await table.delete("id IS NOT NULL");
  }
  async search(storeId, vector, limit, _threshold) {
    const table = await this.getTable(storeId);
    const query = table.vectorSearch(vector).limit(limit).distanceType("cosine");
    const results = await query.toArray();
    return results.map((r) => {
      const metadata = DocumentMetadataSchema.parse(JSON.parse(r.metadata));
      return {
        id: createDocumentId(r.id),
        content: r.content,
        score: 1 - r._distance,
        // Schema validates structure, cast to branded type
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        metadata
      };
    });
  }
  async createFtsIndex(storeId) {
    const table = await this.getTable(storeId);
    await table.createIndex("content", {
      config: lancedb.Index.fts()
    });
  }
  async fullTextSearch(storeId, query, limit) {
    const table = await this.getTable(storeId);
    const results = await table.search(query, "fts").limit(limit).toArray();
    return results.map((r) => {
      const metadata = DocumentMetadataSchema.parse(JSON.parse(r.metadata));
      return {
        id: createDocumentId(r.id),
        content: r.content,
        score: r._score,
        // Schema validates structure, cast to branded type
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        metadata
      };
    });
  }
  async deleteStore(storeId) {
    const tableName = this.getTableName(storeId);
    if (this.connection !== null) {
      await this.connection.dropTable(tableName);
      this.tables.delete(tableName);
    }
  }
  close() {
    this.tables.clear();
    if (this.connection !== null) {
      this.connection.close();
      this.connection = null;
    }
  }
  /**
   * Async close for API consistency. Calls sync close() internally.
   * Do NOT call process.exit() after this - let the event loop drain
   * naturally so native threads can complete cleanup.
   */
  closeAsync() {
    this.close();
    return Promise.resolve();
  }
  getTableName(storeId) {
    return `documents_${storeId}`;
  }
  async getTable(storeId) {
    const tableName = this.getTableName(storeId);
    let table = this.tables.get(tableName);
    if (table === void 0) {
      await this.initialize(storeId);
      table = this.tables.get(tableName);
    }
    if (table === void 0) {
      throw new Error(`Table not found for store: ${storeId}`);
    }
    return table;
  }
};

// src/services/index.ts
var logger4 = createLogger("services");
var LazyServiceContainer = class {
  // Eagerly initialized (lightweight)
  config;
  store;
  lance;
  pythonBridge;
  // Configuration for lazy initialization
  appConfig;
  dataDir;
  // Lazily initialized (heavy)
  // eslint-disable-next-line @typescript-eslint/prefer-readonly -- mutated in lazy getter
  _manifest = null;
  _embeddings = null;
  _codeGraph = null;
  _search = null;
  _index = null;
  constructor(config, appConfig, dataDir, store, lance, pythonBridge) {
    this.config = config;
    this.appConfig = appConfig;
    this.dataDir = dataDir;
    this.store = store;
    this.lance = lance;
    this.pythonBridge = pythonBridge;
  }
  /**
   * EmbeddingEngine is lazily created on first access.
   * Model loading (3-10s) is deferred until embed() is called.
   */
  get embeddings() {
    if (this._embeddings === null) {
      logger4.debug("Lazy-initializing EmbeddingEngine");
      this._embeddings = new EmbeddingEngine(
        this.appConfig.embedding.model,
        this.appConfig.embedding.batchSize
      );
    }
    return this._embeddings;
  }
  /**
   * CodeGraphService is lazily created on first access.
   */
  get codeGraph() {
    if (this._codeGraph === null) {
      logger4.debug("Lazy-initializing CodeGraphService");
      this._codeGraph = new CodeGraphService(this.dataDir, this.pythonBridge);
    }
    return this._codeGraph;
  }
  /**
   * SearchService is lazily created on first access.
   */
  get search() {
    if (this._search === null) {
      logger4.debug("Lazy-initializing SearchService");
      this._search = new SearchService(
        this.lance,
        this.embeddings,
        this.codeGraph,
        this.appConfig.search
      );
    }
    return this._search;
  }
  /**
   * IndexService is lazily created on first access.
   */
  get index() {
    if (this._index === null) {
      logger4.debug("Lazy-initializing IndexService");
      this._index = new IndexService(this.lance, this.embeddings, {
        codeGraphService: this.codeGraph,
        manifestService: this.manifest,
        chunkSize: this.appConfig.indexing.chunkSize,
        chunkOverlap: this.appConfig.indexing.chunkOverlap,
        concurrency: this.appConfig.indexing.concurrency,
        ignorePatterns: this.appConfig.indexing.ignorePatterns
      });
    }
    return this._index;
  }
  /**
   * ManifestService is lazily created on first access.
   */
  get manifest() {
    if (this._manifest === null) {
      logger4.debug("Lazy-initializing ManifestService");
      this._manifest = new ManifestService(this.dataDir);
    }
    return this._manifest;
  }
  /**
   * Check if embeddings have been initialized (for cleanup purposes).
   */
  get hasEmbeddings() {
    return this._embeddings !== null;
  }
};
async function createLazyServices(configPath, dataDir, projectRoot) {
  logger4.info({ configPath, dataDir, projectRoot }, "Initializing lazy services");
  const startTime = Date.now();
  const config = new ConfigService(configPath, dataDir, projectRoot);
  const appConfig = await config.load();
  const resolvedDataDir = config.resolveDataDir();
  const pythonBridge = new PythonBridge();
  await pythonBridge.start();
  const lance = new LanceStore(resolvedDataDir);
  const resolvedProjectRoot = config.resolveProjectRoot();
  const definitionService = new StoreDefinitionService(resolvedProjectRoot);
  const gitignoreService = new GitignoreService(resolvedProjectRoot);
  const storeOptions = {
    definitionService,
    gitignoreService,
    projectRoot: resolvedProjectRoot
  };
  const store = new StoreService(resolvedDataDir, storeOptions);
  await store.initialize();
  const durationMs = Date.now() - startTime;
  logger4.info(
    { dataDir: resolvedDataDir, projectRoot: resolvedProjectRoot, durationMs },
    "Lazy services initialized"
  );
  return new LazyServiceContainer(config, appConfig, resolvedDataDir, store, lance, pythonBridge);
}
async function createServices(configPath, dataDir, projectRoot) {
  logger4.info({ configPath, dataDir, projectRoot }, "Initializing services");
  const config = new ConfigService(configPath, dataDir, projectRoot);
  const appConfig = await config.load();
  const resolvedDataDir = config.resolveDataDir();
  const pythonBridge = new PythonBridge();
  await pythonBridge.start();
  const lance = new LanceStore(resolvedDataDir);
  const embeddings = new EmbeddingEngine(appConfig.embedding.model, appConfig.embedding.batchSize);
  await embeddings.initialize();
  const resolvedProjectRoot = config.resolveProjectRoot();
  const definitionService = new StoreDefinitionService(resolvedProjectRoot);
  const gitignoreService = new GitignoreService(resolvedProjectRoot);
  const storeOptions = {
    definitionService,
    gitignoreService,
    projectRoot: resolvedProjectRoot
  };
  const store = new StoreService(resolvedDataDir, storeOptions);
  await store.initialize();
  const codeGraph = new CodeGraphService(resolvedDataDir, pythonBridge);
  const manifest = new ManifestService(resolvedDataDir);
  const search = new SearchService(lance, embeddings, codeGraph, appConfig.search);
  const index = new IndexService(lance, embeddings, {
    codeGraphService: codeGraph,
    manifestService: manifest,
    chunkSize: appConfig.indexing.chunkSize,
    chunkOverlap: appConfig.indexing.chunkOverlap,
    concurrency: appConfig.indexing.concurrency,
    ignorePatterns: appConfig.indexing.ignorePatterns
  });
  logger4.info(
    { dataDir: resolvedDataDir, projectRoot: resolvedProjectRoot },
    "Services initialized successfully"
  );
  return {
    config,
    store,
    search,
    index,
    lance,
    embeddings,
    codeGraph,
    pythonBridge,
    manifest
  };
}
async function destroyServices(services) {
  logger4.info("Shutting down services");
  const errors = [];
  services.search.cleanup();
  try {
    await services.pythonBridge.stop();
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger4.error({ error }, "Error stopping Python bridge");
    errors.push(error);
  }
  const isLazyContainer = services instanceof LazyServiceContainer;
  const shouldDisposeEmbeddings = !isLazyContainer || services.hasEmbeddings;
  if (shouldDisposeEmbeddings) {
    try {
      await services.embeddings.dispose();
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger4.error({ error }, "Error disposing EmbeddingEngine");
      errors.push(error);
    }
  } else {
    logger4.debug("Skipping embeddings disposal (not initialized)");
  }
  try {
    await services.lance.closeAsync();
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger4.error({ error }, "Error closing LanceStore");
    errors.push(error);
  }
  await shutdownLogger();
  if (errors.length === 1 && errors[0] !== void 0) {
    throw new Error(`Service shutdown failed: ${errors[0].message}`, { cause: errors[0] });
  } else if (errors.length > 1) {
    throw new AggregateError(errors, "Multiple errors during service shutdown");
  }
}

export {
  AdapterRegistry,
  createLogger,
  shutdownLogger,
  summarizePayload,
  truncateForLog,
  PythonBridge,
  ChunkingService,
  ASTParser,
  ok,
  err,
  classifyWebContentType,
  isFileStoreDefinition,
  isRepoStoreDefinition,
  isWebStoreDefinition,
  StoreDefinitionService,
  isGitUrl,
  extractRepoName,
  JobService,
  createLazyServices,
  createServices,
  destroyServices
};
//# sourceMappingURL=chunk-Q3YMQYCJ.js.map