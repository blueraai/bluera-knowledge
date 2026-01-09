import {
  JobService,
  ProjectRootService,
  createLogger,
  createServices,
  createStoreId,
  summarizePayload
} from "./chunk-UE4ZIJYA.js";

// src/mcp/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// src/mcp/commands/job.commands.ts
import { z as z2 } from "zod";

// src/mcp/schemas/index.ts
import { z } from "zod";
var SearchArgsSchema = z.object({
  query: z.string().min(1, "Query must be a non-empty string"),
  intent: z.enum([
    "find-pattern",
    "find-implementation",
    "find-usage",
    "find-definition",
    "find-documentation"
  ]).optional(),
  detail: z.enum(["minimal", "contextual", "full"]).default("minimal"),
  limit: z.number().int().positive().default(10),
  stores: z.array(z.string()).optional(),
  minRelevance: z.number().min(0, "minRelevance must be between 0 and 1").max(1, "minRelevance must be between 0 and 1").optional()
});
var GetFullContextArgsSchema = z.object({
  resultId: z.string().min(1, "Result ID must be a non-empty string")
});
var ListStoresArgsSchema = z.object({
  type: z.enum(["file", "repo", "web"]).optional()
});
var GetStoreInfoArgsSchema = z.object({
  store: z.string().min(1, "Store name or ID must be a non-empty string")
});
var CreateStoreArgsSchema = z.object({
  name: z.string().min(1, "Store name must be a non-empty string"),
  type: z.enum(["file", "repo"]),
  source: z.string().min(1, "Source path or URL must be a non-empty string"),
  branch: z.string().optional(),
  description: z.string().optional()
});
var IndexStoreArgsSchema = z.object({
  store: z.string().min(1, "Store name or ID must be a non-empty string")
});
var DeleteStoreArgsSchema = z.object({
  store: z.string().min(1, "Store name or ID must be a non-empty string")
});
var CheckJobStatusArgsSchema = z.object({
  jobId: z.string().min(1, "Job ID must be a non-empty string")
});
var ListJobsArgsSchema = z.object({
  activeOnly: z.boolean().optional(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]).optional()
});
var CancelJobArgsSchema = z.object({
  jobId: z.string().min(1, "Job ID must be a non-empty string")
});
var ExecuteArgsSchema = z.object({
  command: z.string().min(1, "Command name is required"),
  args: z.record(z.string(), z.unknown()).optional()
});

// src/mcp/handlers/job.handler.ts
var handleCheckJobStatus = (args, context) => {
  const validated = CheckJobStatusArgsSchema.parse(args);
  const { options } = context;
  const jobService = new JobService(options.dataDir);
  const job = jobService.getJob(validated.jobId);
  if (!job) {
    throw new Error(`Job not found: ${validated.jobId}`);
  }
  return Promise.resolve({
    content: [
      {
        type: "text",
        text: JSON.stringify(job, null, 2)
      }
    ]
  });
};
var handleListJobs = (args, context) => {
  const validated = ListJobsArgsSchema.parse(args);
  const { options } = context;
  const jobService = new JobService(options.dataDir);
  let jobs;
  if (validated.activeOnly === true) {
    jobs = jobService.listActiveJobs();
  } else if (validated.status !== void 0) {
    jobs = jobService.listJobs(validated.status);
  } else {
    jobs = jobService.listJobs();
  }
  return Promise.resolve({
    content: [
      {
        type: "text",
        text: JSON.stringify({ jobs }, null, 2)
      }
    ]
  });
};
var handleCancelJob = (args, context) => {
  const validated = CancelJobArgsSchema.parse(args);
  const { options } = context;
  const jobService = new JobService(options.dataDir);
  const result = jobService.cancelJob(validated.jobId);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  const job = jobService.getJob(validated.jobId);
  return Promise.resolve({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: true,
            job,
            message: "Job cancelled successfully"
          },
          null,
          2
        )
      }
    ]
  });
};

// src/mcp/commands/job.commands.ts
var jobCommands = [
  {
    name: "jobs",
    description: "List all background jobs",
    argsSchema: z2.object({
      activeOnly: z2.boolean().optional().describe("Only show active jobs"),
      status: z2.enum(["pending", "running", "completed", "failed", "cancelled"]).optional().describe("Filter by job status")
    }),
    handler: (args, context) => handleListJobs(args, context)
  },
  {
    name: "job:status",
    description: "Check the status of a specific background job",
    argsSchema: z2.object({
      jobId: z2.string().min(1).describe("Job ID to check")
    }),
    handler: (args, context) => handleCheckJobStatus(args, context)
  },
  {
    name: "job:cancel",
    description: "Cancel a running or pending background job",
    argsSchema: z2.object({
      jobId: z2.string().min(1).describe("Job ID to cancel")
    }),
    handler: (args, context) => handleCancelJob(args, context)
  }
];

// src/mcp/commands/meta.commands.ts
import { z as z4 } from "zod";

// src/mcp/commands/registry.ts
import { z as z3 } from "zod";
var CommandRegistry = class {
  commands = /* @__PURE__ */ new Map();
  /**
   * Register a command
   */
  register(command) {
    if (this.commands.has(command.name)) {
      throw new Error(`Command already registered: ${command.name}`);
    }
    this.commands.set(command.name, command);
  }
  /**
   * Register multiple commands at once
   */
  registerAll(commands) {
    for (const command of commands) {
      this.register(command);
    }
  }
  /**
   * Get a command by name
   */
  get(name) {
    return this.commands.get(name);
  }
  /**
   * Check if a command exists
   */
  has(name) {
    return this.commands.has(name);
  }
  /**
   * Get all registered commands
   */
  all() {
    return Array.from(this.commands.values());
  }
  /**
   * Get commands grouped by category (prefix before colon)
   */
  grouped() {
    const groups = /* @__PURE__ */ new Map();
    for (const cmd of this.commands.values()) {
      const colonIndex = cmd.name.indexOf(":");
      const category = colonIndex === -1 ? "general" : cmd.name.slice(0, colonIndex);
      const existing = groups.get(category) ?? [];
      existing.push(cmd);
      groups.set(category, existing);
    }
    return groups;
  }
};
var commandRegistry = new CommandRegistry();
async function executeCommand(commandName, args, context) {
  const command = commandRegistry.get(commandName);
  if (command === void 0) {
    throw new Error(
      `Unknown command: ${commandName}. Use execute("commands") to list available commands.`
    );
  }
  const validatedArgs = command.argsSchema !== void 0 ? command.argsSchema.parse(args) : args;
  return command.handler(validatedArgs, context);
}
function generateHelp(commandName) {
  if (commandName !== void 0) {
    const command = commandRegistry.get(commandName);
    if (command === void 0) {
      throw new Error(`Unknown command: ${commandName}`);
    }
    const lines2 = [`Command: ${command.name}`, `Description: ${command.description}`, ""];
    if (command.argsSchema !== void 0) {
      lines2.push("Arguments:");
      const schema = command.argsSchema;
      if (schema instanceof z3.ZodObject) {
        const shape = schema.shape;
        for (const [key, fieldSchema] of Object.entries(shape)) {
          const isOptional = fieldSchema.safeParse(void 0).success;
          const desc = fieldSchema.description ?? "";
          lines2.push(`  ${key}${isOptional ? " (optional)" : ""}: ${desc}`);
        }
      }
    } else {
      lines2.push("Arguments: none");
    }
    return lines2.join("\n");
  }
  const groups = commandRegistry.grouped();
  const lines = ["Available commands:", ""];
  for (const [category, commands] of groups) {
    lines.push(`${category}:`);
    for (const cmd of commands) {
      lines.push(`  ${cmd.name} - ${cmd.description}`);
    }
    lines.push("");
  }
  lines.push('Use execute("help", {command: "name"}) for detailed command help.');
  return lines.join("\n");
}

// src/mcp/commands/meta.commands.ts
var metaCommands = [
  {
    name: "commands",
    description: "List all available commands",
    handler: () => {
      const commands = commandRegistry.all();
      const commandList = commands.map((cmd) => ({
        name: cmd.name,
        description: cmd.description
      }));
      return Promise.resolve({
        content: [
          {
            type: "text",
            text: JSON.stringify({ commands: commandList }, null, 2)
          }
        ]
      });
    }
  },
  {
    name: "help",
    description: "Show help for a specific command or list all commands",
    argsSchema: z4.object({
      command: z4.string().optional().describe("Command name to get help for")
    }),
    handler: (args) => {
      const commandName = args["command"];
      const helpText = generateHelp(commandName);
      return Promise.resolve({
        content: [
          {
            type: "text",
            text: helpText
          }
        ]
      });
    }
  }
];

// src/mcp/commands/store.commands.ts
import { z as z5 } from "zod";

// src/mcp/handlers/store.handler.ts
import { rm } from "fs/promises";
import { join } from "path";

// src/workers/spawn-worker.ts
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
function spawnBackgroundWorker(jobId, dataDir) {
  const __dirname2 = path.dirname(fileURLToPath(import.meta.url));
  const isProduction = __dirname2.includes("/dist/");
  let command;
  let args;
  if (isProduction) {
    const workerScript = path.join(__dirname2, "background-worker-cli.js");
    command = process.execPath;
    args = [workerScript, jobId];
  } else {
    const workerScript = path.join(__dirname2, "background-worker-cli.ts");
    command = "npx";
    args = ["tsx", workerScript, jobId];
  }
  const worker = spawn(command, args, {
    detached: true,
    // Detach from parent process
    stdio: "ignore",
    // Don't pipe stdio (fully independent)
    env: {
      ...process.env,
      // Inherit environment variables
      BLUERA_DATA_DIR: dataDir
      // Pass dataDir to worker
    }
  });
  worker.unref();
}

// src/mcp/handlers/store.handler.ts
var handleListStores = async (args, context) => {
  const validated = ListStoresArgsSchema.parse(args);
  const { services } = context;
  const stores = await services.store.list();
  const filtered = validated.type !== void 0 ? stores.filter((s) => s.type === validated.type) : stores;
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            stores: filtered.map((s) => ({
              id: s.id,
              name: s.name,
              type: s.type,
              path: "path" in s ? s.path : void 0,
              url: "url" in s && s.url !== void 0 ? s.url : void 0,
              description: s.description,
              createdAt: s.createdAt.toISOString()
            }))
          },
          null,
          2
        )
      }
    ]
  };
};
var handleGetStoreInfo = async (args, context) => {
  const validated = GetStoreInfoArgsSchema.parse(args);
  const { services } = context;
  const store = await services.store.getByIdOrName(createStoreId(validated.store));
  if (store === void 0) {
    throw new Error(`Store not found: ${validated.store}`);
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            id: store.id,
            name: store.name,
            type: store.type,
            path: "path" in store ? store.path : void 0,
            url: "url" in store && store.url !== void 0 ? store.url : void 0,
            branch: "branch" in store ? store.branch : void 0,
            description: store.description,
            status: store.status,
            createdAt: store.createdAt.toISOString(),
            updatedAt: store.updatedAt.toISOString()
          },
          null,
          2
        )
      }
    ]
  };
};
var handleCreateStore = async (args, context) => {
  const validated = CreateStoreArgsSchema.parse(args);
  const { services, options } = context;
  const isUrl = validated.source.startsWith("http://") || validated.source.startsWith("https://") || validated.source.startsWith("git@");
  const result = await services.store.create({
    name: validated.name,
    type: validated.type,
    ...isUrl ? { url: validated.source } : { path: validated.source },
    ...validated.branch !== void 0 ? { branch: validated.branch } : {},
    ...validated.description !== void 0 ? { description: validated.description } : {}
  });
  if (!result.success) {
    throw new Error(result.error.message);
  }
  const jobService = new JobService(options.dataDir);
  const jobDetails = {
    storeName: result.data.name,
    storeId: result.data.id
  };
  if (isUrl) {
    jobDetails["url"] = validated.source;
  }
  if ("path" in result.data && result.data.path) {
    jobDetails["path"] = result.data.path;
  }
  const job = jobService.createJob({
    type: validated.type === "repo" && isUrl ? "clone" : "index",
    details: jobDetails,
    message: `Indexing ${result.data.name}...`
  });
  spawnBackgroundWorker(job.id, options.dataDir ?? "");
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            store: {
              id: result.data.id,
              name: result.data.name,
              type: result.data.type,
              path: "path" in result.data ? result.data.path : void 0
            },
            job: {
              id: job.id,
              status: job.status,
              message: job.message
            },
            message: `Store created. Indexing started in background (Job ID: ${job.id})`
          },
          null,
          2
        )
      }
    ]
  };
};
var handleIndexStore = async (args, context) => {
  const validated = IndexStoreArgsSchema.parse(args);
  const { services, options } = context;
  const store = await services.store.getByIdOrName(createStoreId(validated.store));
  if (store === void 0) {
    throw new Error(`Store not found: ${validated.store}`);
  }
  const jobService = new JobService(options.dataDir);
  const jobDetails = {
    storeName: store.name,
    storeId: store.id
  };
  if ("path" in store && store.path) {
    jobDetails["path"] = store.path;
  }
  const job = jobService.createJob({
    type: "index",
    details: jobDetails,
    message: `Re-indexing ${store.name}...`
  });
  spawnBackgroundWorker(job.id, options.dataDir ?? "");
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            store: {
              id: store.id,
              name: store.name
            },
            job: {
              id: job.id,
              status: job.status,
              message: job.message
            },
            message: `Indexing started in background (Job ID: ${job.id})`
          },
          null,
          2
        )
      }
    ]
  };
};
var handleDeleteStore = async (args, context) => {
  const validated = DeleteStoreArgsSchema.parse(args);
  const { services, options } = context;
  const store = await services.store.getByIdOrName(createStoreId(validated.store));
  if (store === void 0) {
    throw new Error(`Store not found: ${validated.store}`);
  }
  await services.lance.deleteStore(store.id);
  if (store.type === "repo" && "url" in store && store.url !== void 0) {
    if (options.dataDir === void 0) {
      throw new Error("dataDir is required to delete cloned repository files");
    }
    const repoPath = join(options.dataDir, "repos", store.id);
    await rm(repoPath, { recursive: true, force: true });
  }
  const result = await services.store.delete(store.id);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            deleted: true,
            store: {
              id: store.id,
              name: store.name,
              type: store.type
            },
            message: `Successfully deleted store: ${store.name}`
          },
          null,
          2
        )
      }
    ]
  };
};

// src/mcp/commands/store.commands.ts
var storeCommands = [
  {
    name: "stores",
    description: "List all indexed knowledge stores",
    argsSchema: z5.object({
      type: z5.enum(["file", "repo", "web"]).optional().describe("Filter by store type")
    }),
    handler: (args, context) => handleListStores(args, context)
  },
  {
    name: "store:info",
    description: "Get detailed information about a specific store",
    argsSchema: z5.object({
      store: z5.string().min(1).describe("Store name or ID")
    }),
    handler: (args, context) => handleGetStoreInfo(args, context)
  },
  {
    name: "store:create",
    description: "Create a new knowledge store from git URL or local path",
    argsSchema: z5.object({
      name: z5.string().min(1).describe("Store name"),
      type: z5.enum(["file", "repo"]).describe("Store type"),
      source: z5.string().min(1).describe("Git URL or local path"),
      branch: z5.string().optional().describe("Git branch (for repo type)"),
      description: z5.string().optional().describe("Store description")
    }),
    handler: (args, context) => handleCreateStore(args, context)
  },
  {
    name: "store:index",
    description: "Re-index a knowledge store to update search data",
    argsSchema: z5.object({
      store: z5.string().min(1).describe("Store name or ID")
    }),
    handler: (args, context) => handleIndexStore(args, context)
  },
  {
    name: "store:delete",
    description: "Delete a knowledge store and all associated data",
    argsSchema: z5.object({
      store: z5.string().min(1).describe("Store name or ID")
    }),
    handler: (args, context) => handleDeleteStore(args, context)
  }
];

// src/mcp/commands/sync.commands.ts
import { z as z7 } from "zod";

// src/services/store-definition.service.ts
import { readFile, writeFile, mkdir, access } from "fs/promises";
import { dirname, resolve, isAbsolute, join as join2 } from "path";

// src/types/store-definition.ts
import { z as z6 } from "zod";
var BaseStoreDefinitionSchema = z6.object({
  name: z6.string().min(1, "Store name is required"),
  description: z6.string().optional(),
  tags: z6.array(z6.string()).optional()
});
var FileStoreDefinitionSchema = BaseStoreDefinitionSchema.extend({
  type: z6.literal("file"),
  path: z6.string().min(1, "Path is required for file stores")
});
var RepoStoreDefinitionSchema = BaseStoreDefinitionSchema.extend({
  type: z6.literal("repo"),
  url: z6.url("Valid URL is required for repo stores"),
  branch: z6.string().optional(),
  depth: z6.number().int().positive("Depth must be a positive integer").optional()
});
var WebStoreDefinitionSchema = BaseStoreDefinitionSchema.extend({
  type: z6.literal("web"),
  url: z6.url("Valid URL is required for web stores"),
  depth: z6.number().int().min(0, "Depth must be non-negative").default(1),
  maxPages: z6.number().int().positive("maxPages must be a positive integer").optional(),
  crawlInstructions: z6.string().optional(),
  extractInstructions: z6.string().optional()
});
var StoreDefinitionSchema = z6.discriminatedUnion("type", [
  FileStoreDefinitionSchema,
  RepoStoreDefinitionSchema,
  WebStoreDefinitionSchema
]);
var StoreDefinitionsConfigSchema = z6.object({
  version: z6.literal(1),
  stores: z6.array(StoreDefinitionSchema)
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
async function fileExists(path2) {
  try {
    await access(path2);
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
    this.configPath = join2(this.projectRoot, ".bluera/bluera-knowledge/stores.config.json");
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
    const exists = await fileExists(this.configPath);
    if (!exists) {
      this.config = {
        ...DEFAULT_STORE_DEFINITIONS_CONFIG,
        stores: [...DEFAULT_STORE_DEFINITIONS_CONFIG.stores]
      };
      return this.config;
    }
    const content = await readFile(this.configPath, "utf-8");
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
    await mkdir(dirname(this.configPath), { recursive: true });
    await writeFile(this.configPath, JSON.stringify(config, null, 2));
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
  resolvePath(path2) {
    if (isAbsolute(path2)) {
      return path2;
    }
    return resolve(this.projectRoot, path2);
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

// src/mcp/commands/sync.commands.ts
async function handleStoresSync(args, context) {
  const { services, options } = context;
  const projectRoot = options.projectRoot;
  if (projectRoot === void 0) {
    throw new Error("Project root is required for stores:sync");
  }
  const defService = new StoreDefinitionService(projectRoot);
  const config = await defService.load();
  const result = {
    created: [],
    skipped: [],
    failed: [],
    orphans: []
  };
  if (args.dryRun === true) {
    result.dryRun = true;
    result.wouldCreate = [];
    result.wouldPrune = [];
  }
  const existingStores = await services.store.list();
  const existingNames = new Set(existingStores.map((s) => s.name));
  for (const def of config.stores) {
    if (existingNames.has(def.name)) {
      result.skipped.push(def.name);
      continue;
    }
    if (args.dryRun === true) {
      result.wouldCreate?.push(def.name);
      continue;
    }
    const createResult = await createStoreFromDefinition(def, defService, services, context);
    if (createResult.success) {
      result.created.push(def.name);
    } else {
      result.failed.push({ name: def.name, error: createResult.error });
    }
  }
  const definedNames = new Set(config.stores.map((d) => d.name));
  for (const store of existingStores) {
    if (!definedNames.has(store.name)) {
      result.orphans.push(store.name);
    }
  }
  if (args.prune === true && result.orphans.length > 0) {
    if (args.dryRun === true) {
      result.wouldPrune = [...result.orphans];
    } else {
      result.pruned = [];
      for (const orphanName of result.orphans) {
        const store = await services.store.getByName(orphanName);
        if (store !== void 0) {
          const deleteResult = await services.store.delete(store.id, { skipDefinitionSync: true });
          if (deleteResult.success) {
            result.pruned.push(orphanName);
          }
        }
      }
    }
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}
async function createStoreFromDefinition(def, defService, services, _context) {
  try {
    if (isFileStoreDefinition(def)) {
      const resolvedPath = defService.resolvePath(def.path);
      const createResult = await services.store.create(
        {
          name: def.name,
          type: "file",
          path: resolvedPath,
          description: def.description,
          tags: def.tags
        },
        { skipDefinitionSync: true }
        // Don't re-add to definitions
      );
      if (!createResult.success) {
        return { success: false, error: createResult.error.message };
      }
      return { success: true };
    }
    if (isRepoStoreDefinition(def)) {
      const createResult = await services.store.create(
        {
          name: def.name,
          type: "repo",
          url: def.url,
          branch: def.branch,
          depth: def.depth,
          description: def.description,
          tags: def.tags
        },
        { skipDefinitionSync: true }
      );
      if (!createResult.success) {
        return { success: false, error: createResult.error.message };
      }
      return { success: true };
    }
    if (isWebStoreDefinition(def)) {
      const createResult = await services.store.create(
        {
          name: def.name,
          type: "web",
          url: def.url,
          depth: def.depth,
          description: def.description,
          tags: def.tags
        },
        { skipDefinitionSync: true }
      );
      if (!createResult.success) {
        return { success: false, error: createResult.error.message };
      }
      return { success: true };
    }
    return { success: false, error: "Unknown store definition type" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
var syncCommands = [
  {
    name: "stores:sync",
    description: "Sync stores from definitions config (bootstrap on fresh clone)",
    argsSchema: z7.object({
      reindex: z7.boolean().optional().describe("Re-index existing stores after sync"),
      prune: z7.boolean().optional().describe("Remove stores not in definitions"),
      dryRun: z7.boolean().optional().describe("Show what would happen without making changes")
    }),
    handler: (args, context) => {
      const syncArgs = {};
      if (typeof args["reindex"] === "boolean") {
        syncArgs.reindex = args["reindex"];
      }
      if (typeof args["prune"] === "boolean") {
        syncArgs.prune = args["prune"];
      }
      if (typeof args["dryRun"] === "boolean") {
        syncArgs.dryRun = args["dryRun"];
      }
      return handleStoresSync(syncArgs, context);
    }
  }
];

// src/mcp/commands/index.ts
commandRegistry.registerAll(storeCommands);
commandRegistry.registerAll(jobCommands);
commandRegistry.registerAll(metaCommands);
commandRegistry.registerAll(syncCommands);

// src/mcp/handlers/execute.handler.ts
var handleExecute = async (args, context) => {
  const validated = ExecuteArgsSchema.parse(args);
  const commandArgs = validated.args ?? {};
  return executeCommand(validated.command, commandArgs, context);
};

// src/services/token.service.ts
var CHARS_PER_TOKEN = 3.5;
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
function formatTokenCount(tokens) {
  if (tokens >= 1e3) {
    return `~${(tokens / 1e3).toFixed(1)}k`;
  }
  return `~${String(tokens)}`;
}

// src/mcp/cache.ts
var LRUCache = class {
  cache = /* @__PURE__ */ new Map();
  maxSize;
  /**
   * Create a new LRU cache
   *
   * @param maxSize - Maximum number of items to store (default: 1000)
   */
  constructor(maxSize = 1e3) {
    this.maxSize = maxSize;
  }
  /**
   * Store a value in the cache
   *
   * If the key already exists, it will be moved to the end (most recent).
   * If the cache is at capacity, the oldest item will be evicted.
   *
   * @param key - The cache key
   * @param value - The value to store
   */
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0) {
        this.cache.delete(firstKey);
      }
    }
  }
  /**
   * Retrieve a value from the cache
   *
   * If the key exists, it will be moved to the end (most recent).
   *
   * @param key - The cache key
   * @returns The cached value, or undefined if not found
   */
  get(key) {
    const value = this.cache.get(key);
    if (value !== void 0) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  /**
   * Check if a key exists in the cache
   *
   * @param key - The cache key
   * @returns True if the key exists
   */
  has(key) {
    return this.cache.has(key);
  }
  /**
   * Remove a specific key from the cache
   *
   * @param key - The cache key
   * @returns True if the key was removed, false if it didn't exist
   */
  delete(key) {
    return this.cache.delete(key);
  }
  /**
   * Clear all entries from the cache
   */
  clear() {
    this.cache.clear();
  }
  /**
   * Get the current number of items in the cache
   */
  get size() {
    return this.cache.size;
  }
};

// src/mcp/handlers/search.handler.ts
var logger = createLogger("mcp-search");
var resultCache = new LRUCache(1e3);
var handleSearch = async (args, context) => {
  const validated = SearchArgsSchema.parse(args);
  logger.info(
    {
      query: validated.query,
      stores: validated.stores,
      detail: validated.detail,
      limit: validated.limit,
      intent: validated.intent
    },
    "Search started"
  );
  const { services } = context;
  const storeIds = validated.stores !== void 0 ? await Promise.all(
    validated.stores.map(async (s) => {
      const store = await services.store.getByIdOrName(s);
      if (!store) {
        throw new Error(`Store not found: ${s}`);
      }
      return store.id;
    })
  ) : (await services.store.list()).map((s) => s.id);
  try {
    for (const storeId of storeIds) {
      await services.lance.initialize(storeId);
    }
  } catch (error) {
    throw new Error(
      `Failed to initialize vector stores: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  const searchQuery = {
    query: validated.query,
    stores: storeIds,
    mode: "hybrid",
    limit: validated.limit,
    detail: validated.detail,
    minRelevance: validated.minRelevance
  };
  const results = await services.search.search(searchQuery);
  for (const result of results.results) {
    resultCache.set(result.id, result);
  }
  const enhancedResults = await Promise.all(
    results.results.map(async (r) => {
      const storeId = r.metadata.storeId;
      const store = await services.store.getByIdOrName(storeId);
      return {
        id: r.id,
        score: r.score,
        summary: {
          ...r.summary,
          storeName: store?.name,
          repoRoot: store?.type === "repo" ? store.path : void 0
        },
        context: r.context,
        full: r.full
      };
    })
  );
  const responseJson = JSON.stringify(
    {
      results: enhancedResults,
      totalResults: results.totalResults,
      mode: results.mode,
      timeMs: results.timeMs,
      confidence: results.confidence,
      maxRawScore: results.maxRawScore
    },
    null,
    2
  );
  const responseTokens = estimateTokens(responseJson);
  const confidenceInfo = results.confidence !== void 0 ? ` | Confidence: ${results.confidence}` : "";
  const header = `Search: "${validated.query}" | Results: ${String(results.totalResults)} | ${formatTokenCount(responseTokens)} tokens | ${String(results.timeMs)}ms${confidenceInfo}

`;
  logger.info(
    {
      query: validated.query,
      totalResults: results.totalResults,
      responseTokens,
      timeMs: results.timeMs,
      ...summarizePayload(responseJson, "mcp-response", validated.query)
    },
    "Search complete - context sent to Claude Code"
  );
  return {
    content: [
      {
        type: "text",
        text: header + responseJson
      }
    ]
  };
};
var handleGetFullContext = async (args, context) => {
  const validated = GetFullContextArgsSchema.parse(args);
  logger.info({ resultId: validated.resultId }, "Get full context requested");
  const resultId = validated.resultId;
  const cachedResult = resultCache.get(resultId);
  if (!cachedResult) {
    throw new Error(`Result not found in cache: ${resultId}. Run a search first to cache results.`);
  }
  if (cachedResult.full) {
    const responseJson2 = JSON.stringify(
      {
        id: cachedResult.id,
        score: cachedResult.score,
        summary: cachedResult.summary,
        context: cachedResult.context,
        full: cachedResult.full
      },
      null,
      2
    );
    logger.info(
      {
        resultId,
        cached: true,
        hasFullContext: true,
        ...summarizePayload(responseJson2, "mcp-full-context", resultId)
      },
      "Full context retrieved from cache"
    );
    return {
      content: [
        {
          type: "text",
          text: responseJson2
        }
      ]
    };
  }
  const { services } = context;
  const store = await services.store.getByIdOrName(cachedResult.metadata.storeId);
  if (!store) {
    throw new Error(`Store not found: ${cachedResult.metadata.storeId}`);
  }
  await services.lance.initialize(store.id);
  const searchQuery = {
    query: cachedResult.content.substring(0, 100),
    // Use snippet of content as query
    stores: [store.id],
    mode: "hybrid",
    limit: 1,
    detail: "full"
  };
  const results = await services.search.search(searchQuery);
  const fullResult = results.results.find((r) => r.id === resultId);
  if (!fullResult) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              id: cachedResult.id,
              score: cachedResult.score,
              summary: cachedResult.summary,
              context: cachedResult.context,
              warning: "Could not retrieve full context, returning cached minimal result"
            },
            null,
            2
          )
        }
      ]
    };
  }
  resultCache.set(resultId, fullResult);
  const responseJson = JSON.stringify(
    {
      id: fullResult.id,
      score: fullResult.score,
      summary: fullResult.summary,
      context: fullResult.context,
      full: fullResult.full
    },
    null,
    2
  );
  logger.info(
    {
      resultId,
      cached: false,
      hasFullContext: true,
      ...summarizePayload(responseJson, "mcp-full-context", resultId)
    },
    "Full context retrieved via re-query"
  );
  return {
    content: [
      {
        type: "text",
        text: responseJson
      }
    ]
  };
};

// src/mcp/handlers/index.ts
var tools = [
  {
    name: "search",
    description: "Search all indexed knowledge stores with pattern detection and AI-optimized results. Returns structured code units with progressive context layers.",
    schema: SearchArgsSchema,
    handler: handleSearch
  },
  {
    name: "get_full_context",
    description: "Get complete code and context for a specific search result by ID. Use this after search to get full implementation details.",
    schema: GetFullContextArgsSchema,
    handler: handleGetFullContext
  }
];

// src/mcp/server.ts
var logger2 = createLogger("mcp-server");
function createMCPServer(options) {
  const server = new Server(
    {
      name: "bluera-knowledge",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );
  server.setRequestHandler(ListToolsRequestSchema, () => {
    return Promise.resolve({
      tools: [
        // Native search tool with full schema (most used, benefits from detailed params)
        {
          name: "search",
          description: "Search all indexed knowledge stores with pattern detection and AI-optimized results. Returns structured code units with progressive context layers.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query (can include type signatures, constraints, or natural language)"
              },
              intent: {
                type: "string",
                enum: [
                  "find-pattern",
                  "find-implementation",
                  "find-usage",
                  "find-definition",
                  "find-documentation"
                ],
                description: "Search intent for better ranking"
              },
              detail: {
                type: "string",
                enum: ["minimal", "contextual", "full"],
                default: "minimal",
                description: "Context detail level: minimal (summary only), contextual (+ imports/types), full (+ complete code)"
              },
              limit: {
                type: "number",
                default: 10,
                description: "Maximum number of results"
              },
              stores: {
                type: "array",
                items: { type: "string" },
                description: "Specific store IDs to search (optional)"
              },
              minRelevance: {
                type: "number",
                description: "Minimum raw cosine similarity (0-1). Returns empty if no results meet threshold. Use to filter irrelevant results."
              }
            },
            required: ["query"]
          }
        },
        // Native get_full_context tool (frequently used after search)
        {
          name: "get_full_context",
          description: "Get complete code and context for a specific search result by ID. Use this after search to get full implementation details.",
          inputSchema: {
            type: "object",
            properties: {
              resultId: {
                type: "string",
                description: "Result ID from previous search"
              }
            },
            required: ["resultId"]
          }
        },
        // Meta-tool for store and job management (consolidates 8 tools into 1)
        {
          name: "execute",
          description: "Execute store/job management commands. Commands: stores, store:info, store:create, store:index, store:delete, jobs, job:status, job:cancel, help, commands",
          inputSchema: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description: 'Command to execute (e.g., "stores", "store:create", "jobs", "help")'
              },
              args: {
                type: "object",
                description: 'Command arguments (e.g., {store: "mystore"} for store:info)'
              }
            },
            required: ["command"]
          }
        }
      ]
    });
  });
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const startTime = Date.now();
    logger2.info({ tool: name, args: JSON.stringify(args) }, "Tool invoked");
    const services = await createServices(options.config, options.dataDir, options.projectRoot);
    const context = { services, options };
    try {
      let result;
      if (name === "execute") {
        const validated = ExecuteArgsSchema.parse(args ?? {});
        result = await handleExecute(validated, context);
      } else {
        const tool = tools.find((t) => t.name === name);
        if (tool === void 0) {
          throw new Error(`Unknown tool: ${name}`);
        }
        const validated = tool.schema.parse(args ?? {});
        result = await tool.handler(validated, context);
      }
      const durationMs = Date.now() - startTime;
      logger2.info({ tool: name, durationMs }, "Tool completed");
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      logger2.error(
        {
          tool: name,
          durationMs,
          error: error instanceof Error ? error.message : String(error)
        },
        "Tool execution failed"
      );
      throw error;
    }
  });
  return server;
}
async function runMCPServer(options) {
  logger2.info(
    {
      dataDir: options.dataDir,
      projectRoot: options.projectRoot
    },
    "MCP server starting"
  );
  const server = createMCPServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger2.info("MCP server connected to stdio transport");
}
var scriptPath = process.argv[1] ?? "";
var isMCPServerEntry = scriptPath.endsWith("mcp/server.js") || scriptPath.endsWith("mcp/server");
if (isMCPServerEntry) {
  runMCPServer({
    dataDir: process.env["DATA_DIR"],
    config: process.env["CONFIG_PATH"],
    projectRoot: process.env["PROJECT_ROOT"] ?? process.env["PWD"]
  }).catch((error) => {
    logger2.error(
      { error: error instanceof Error ? error.message : String(error) },
      "Failed to start MCP server"
    );
    process.exit(1);
  });
}

export {
  isFileStoreDefinition,
  isRepoStoreDefinition,
  isWebStoreDefinition,
  StoreDefinitionService,
  createMCPServer,
  runMCPServer
};
//# sourceMappingURL=chunk-DP5XBPQV.js.map