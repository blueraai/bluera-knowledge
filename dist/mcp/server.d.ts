import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';

interface CodeNode {
    type: 'function' | 'class' | 'interface' | 'type' | 'const';
    name: string;
    exported: boolean;
    async?: boolean;
    startLine: number;
    endLine: number;
    signature?: string;
    methods?: Array<{
        name: string;
        async: boolean;
        signature: string;
        startLine: number;
        endLine: number;
    }>;
}

interface GraphNode {
    id: string;
    file: string;
    type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'method';
    name: string;
    exported: boolean;
    startLine: number;
    endLine: number;
    signature?: string;
}
interface GraphEdge {
    from: string;
    to: string;
    type: 'calls' | 'imports' | 'extends' | 'implements';
    confidence: number;
}
declare class CodeGraph {
    private readonly nodes;
    private readonly edges;
    addNodes(nodes: CodeNode[], file: string): void;
    addImport(fromFile: string, toFile: string, specifiers: string[]): void;
    analyzeCallRelationships(code: string, file: string, functionName: string): void;
    getNode(id: string): GraphNode | undefined;
    getEdges(nodeId: string): GraphEdge[];
    /**
     * Add an edge to the graph (used when restoring from serialized data)
     */
    addEdge(edge: GraphEdge): void;
    /**
     * Add a graph node directly (used when restoring from serialized data)
     */
    addGraphNode(node: GraphNode): void;
    /**
     * Get edges where this node is the target (callers of this function)
     */
    getIncomingEdges(nodeId: string): GraphEdge[];
    /**
     * Count how many nodes call this node
     */
    getCalledByCount(nodeId: string): number;
    /**
     * Count how many nodes this node calls
     */
    getCallsCount(nodeId: string): number;
    getAllNodes(): GraphNode[];
    private findNodeByName;
    private resolveImportPath;
    toJSON(): {
        nodes: GraphNode[];
        edges: Array<{
            from: string;
            to: string;
            type: string;
            confidence: number;
        }>;
    };
}

declare const CrawlResultSchema: z.ZodObject<{
    pages: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodString;
        content: z.ZodString;
        links: z.ZodArray<z.ZodString>;
        crawledAt: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
declare const HeadlessResultSchema: z.ZodObject<{
    html: z.ZodString;
    markdown: z.ZodString;
    links: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        href: z.ZodString;
        text: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        base_domain: z.ZodOptional<z.ZodString>;
        head_data: z.ZodOptional<z.ZodUnknown>;
        head_extraction_status: z.ZodOptional<z.ZodUnknown>;
        head_extraction_error: z.ZodOptional<z.ZodUnknown>;
        intrinsic_score: z.ZodOptional<z.ZodNumber>;
        contextual_score: z.ZodOptional<z.ZodUnknown>;
        total_score: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>, z.ZodString]>>;
}, z.core.$strip>;
type CrawlResult = z.infer<typeof CrawlResultSchema>;
type HeadlessResult = z.infer<typeof HeadlessResultSchema>;
declare const ParsePythonResultSchema: z.ZodObject<{
    nodes: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            function: "function";
            class: "class";
        }>;
        name: z.ZodString;
        exported: z.ZodBoolean;
        startLine: z.ZodNumber;
        endLine: z.ZodNumber;
        async: z.ZodOptional<z.ZodBoolean>;
        signature: z.ZodOptional<z.ZodString>;
        calls: z.ZodOptional<z.ZodArray<z.ZodString>>;
        methods: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            async: z.ZodBoolean;
            signature: z.ZodString;
            startLine: z.ZodNumber;
            endLine: z.ZodNumber;
            calls: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    imports: z.ZodArray<z.ZodObject<{
        source: z.ZodString;
        imported: z.ZodString;
        alias: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type ParsePythonResult = z.infer<typeof ParsePythonResultSchema>;

declare class PythonBridge {
    private process;
    private readonly pending;
    private stoppingIntentionally;
    private stdoutReadline;
    private stderrReadline;
    start(): Promise<void>;
    crawl(url: string, timeoutMs?: number): Promise<CrawlResult>;
    fetchHeadless(url: string, timeoutMs?: number): Promise<HeadlessResult>;
    parsePython(code: string, filePath: string, timeoutMs?: number): Promise<ParsePythonResult>;
    stop(): Promise<void>;
    private rejectAllPending;
}

declare const StoreIdBrand: unique symbol;
declare const DocumentIdBrand: unique symbol;
type StoreId = string & {
    readonly [StoreIdBrand]: typeof StoreIdBrand;
};
type DocumentId = string & {
    readonly [DocumentIdBrand]: typeof DocumentIdBrand;
};

/**
 * Service for building, persisting, and querying code graphs.
 * Code graphs track relationships between code elements (functions, classes, etc.)
 * for enhanced search context.
 */
declare class CodeGraphService {
    private readonly dataDir;
    private readonly parser;
    private readonly parserFactory;
    private readonly graphCache;
    constructor(dataDir: string, pythonBridge?: PythonBridge);
    /**
     * Build a code graph from source files.
     */
    buildGraph(files: Array<{
        path: string;
        content: string;
    }>): Promise<CodeGraph>;
    /**
     * Save a code graph for a store.
     */
    saveGraph(storeId: StoreId, graph: CodeGraph): Promise<void>;
    /**
     * Delete the code graph file for a store.
     * Silently succeeds if the file doesn't exist.
     */
    deleteGraph(storeId: StoreId): Promise<void>;
    /**
     * Load a code graph for a store.
     * Returns undefined if no graph exists.
     */
    loadGraph(storeId: StoreId): Promise<CodeGraph | undefined>;
    /**
     * Get usage stats for a code element.
     */
    getUsageStats(graph: CodeGraph, filePath: string, symbolName: string): {
        calledBy: number;
        calls: number;
    };
    /**
     * Get related code (callers and callees) for a code element.
     */
    getRelatedCode(graph: CodeGraph, filePath: string, symbolName: string): Array<{
        id: string;
        relationship: string;
    }>;
    /**
     * Clear cached graphs.
     */
    clearCache(): void;
    private getGraphPath;
    /**
     * Type guard for SerializedGraph structure.
     */
    private isSerializedGraph;
    /**
     * Type guard for valid node types.
     */
    private isValidNodeType;
    /**
     * Validate and return a node type, or undefined if invalid.
     */
    private validateNodeType;
    /**
     * Type guard for valid edge types.
     */
    private isValidEdgeType;
    /**
     * Validate and return an edge type, or undefined if invalid.
     */
    private validateEdgeType;
}

interface EmbeddingConfig {
    readonly model: string;
    readonly batchSize: number;
    readonly dimensions: number;
}
interface IndexingConfig {
    readonly concurrency: number;
    readonly chunkSize: number;
    readonly chunkOverlap: number;
    readonly ignorePatterns: readonly string[];
}
interface SearchConfig {
    readonly defaultMode: 'vector' | 'fts' | 'hybrid';
    readonly defaultLimit: number;
    readonly minScore: number;
    readonly rrf: {
        readonly k: number;
        readonly vectorWeight: number;
        readonly ftsWeight: number;
    };
}
interface CrawlConfig {
    readonly userAgent: string;
    readonly timeout: number;
    readonly maxConcurrency: number;
}
interface ServerConfig {
    readonly port: number;
    readonly host: string;
}
interface AppConfig {
    readonly version: number;
    readonly dataDir: string;
    readonly embedding: EmbeddingConfig;
    readonly indexing: IndexingConfig;
    readonly search: SearchConfig;
    readonly crawl: CrawlConfig;
    readonly server: ServerConfig;
}

declare class ConfigService {
    private readonly configPath;
    private readonly dataDir;
    private config;
    constructor(configPath?: string, dataDir?: string, projectRoot?: string);
    load(): Promise<AppConfig>;
    save(config: AppConfig): Promise<void>;
    resolveDataDir(): string;
    resolveConfigPath(): string;
    private expandPath;
}

declare class EmbeddingEngine {
    private extractor;
    private readonly modelName;
    private readonly dimensions;
    constructor(modelName?: string, dimensions?: number);
    initialize(): Promise<void>;
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    getDimensions(): number;
    /**
     * Dispose the embedding pipeline to free resources.
     * Should be called before process exit to prevent ONNX runtime cleanup issues on macOS.
     */
    dispose(): Promise<void>;
}

declare const DocumentTypeSchema: z.ZodEnum<{
    file: "file";
    web: "web";
    chunk: "chunk";
}>;
type DocumentType = z.infer<typeof DocumentTypeSchema>;
interface DocumentMetadata {
    readonly path?: string | undefined;
    readonly url?: string | undefined;
    readonly type: DocumentType;
    readonly storeId: StoreId;
    readonly indexedAt: Date;
    readonly fileHash?: string | undefined;
    readonly chunkIndex?: number | undefined;
    readonly totalChunks?: number | undefined;
    readonly [key: string]: unknown;
}
interface Document {
    readonly id: DocumentId;
    readonly content: string;
    readonly vector: readonly number[];
    readonly metadata: DocumentMetadata;
}

declare class LanceStore {
    private connection;
    private readonly tables;
    private readonly dataDir;
    constructor(dataDir: string);
    initialize(storeId: StoreId): Promise<void>;
    addDocuments(storeId: StoreId, documents: Document[]): Promise<void>;
    deleteDocuments(storeId: StoreId, documentIds: DocumentId[]): Promise<void>;
    search(storeId: StoreId, vector: number[], limit: number, _threshold?: number): Promise<Array<{
        id: DocumentId;
        content: string;
        score: number;
        metadata: DocumentMetadata;
    }>>;
    createFtsIndex(storeId: StoreId): Promise<void>;
    fullTextSearch(storeId: StoreId, query: string, limit: number): Promise<Array<{
        id: DocumentId;
        content: string;
        score: number;
        metadata: DocumentMetadata;
    }>>;
    deleteStore(storeId: StoreId): Promise<void>;
    close(): void;
    /**
     * Async close for API consistency. Calls sync close() internally.
     * Do NOT call process.exit() after this - let the event loop drain
     * naturally so native threads can complete cleanup.
     */
    closeAsync(): Promise<void>;
    private getTableName;
    private getTable;
}

interface ProgressEvent {
    type: 'start' | 'progress' | 'complete' | 'error';
    current: number;
    total: number;
    message: string;
    details?: Record<string, unknown>;
}
type ProgressCallback = (event: ProgressEvent) => void;

type Result<T, E = Error> = {
    readonly success: true;
    readonly data: T;
} | {
    readonly success: false;
    readonly error: E;
};

type StoreType = 'file' | 'repo' | 'web';
type StoreStatus = 'ready' | 'indexing' | 'error';
interface BaseStore {
    readonly id: StoreId;
    readonly name: string;
    readonly description?: string | undefined;
    readonly tags?: readonly string[] | undefined;
    readonly status?: StoreStatus | undefined;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
interface FileStore extends BaseStore {
    readonly type: 'file';
    readonly path: string;
}
interface RepoStore extends BaseStore {
    readonly type: 'repo';
    readonly path: string;
    readonly url?: string | undefined;
    readonly branch?: string | undefined;
}
interface WebStore extends BaseStore {
    readonly type: 'web';
    readonly url: string;
    readonly depth: number;
    readonly maxPages?: number | undefined;
}
type Store = FileStore | RepoStore | WebStore;

interface IndexResult {
    documentsIndexed: number;
    chunksCreated: number;
    timeMs: number;
}
interface IndexOptions {
    chunkSize?: number;
    chunkOverlap?: number;
    codeGraphService?: CodeGraphService;
    concurrency?: number;
}
declare class IndexService {
    private readonly lanceStore;
    private readonly embeddingEngine;
    private readonly chunker;
    private readonly codeGraphService;
    private readonly concurrency;
    constructor(lanceStore: LanceStore, embeddingEngine: EmbeddingEngine, options?: IndexOptions);
    indexStore(store: Store, onProgress?: ProgressCallback): Promise<Result<IndexResult>>;
    private indexFileStore;
    /**
     * Process a single file: read, chunk, embed, and return documents.
     * Extracted for parallel processing.
     */
    private processFile;
    private scanDirectory;
    /**
     * Classify file type for ranking purposes.
     * Documentation files rank higher than source code for documentation queries.
     * Phase 4: Enhanced to detect internal implementation files.
     */
    private classifyFileType;
    /**
     * Detect if a source file is internal implementation code.
     * Internal code should rank lower than public-facing APIs and docs.
     */
    private isInternalImplementation;
}

type SearchMode = 'vector' | 'fts' | 'hybrid';
interface CodeUnit {
    type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'documentation' | 'example';
    name: string;
    signature: string;
    fullContent: string;
    startLine: number;
    endLine: number;
    language: string;
}
interface ResultSummary {
    readonly type: 'function' | 'class' | 'interface' | 'pattern' | 'documentation';
    readonly name: string;
    readonly signature: string;
    readonly purpose: string;
    readonly location: string;
    readonly relevanceReason: string;
}
interface ResultContext {
    readonly interfaces: readonly string[];
    readonly keyImports: readonly string[];
    readonly relatedConcepts: readonly string[];
    readonly usage: {
        readonly calledBy: number;
        readonly calls: number;
    };
}
interface ResultFull {
    readonly completeCode: string;
    readonly relatedCode: ReadonlyArray<{
        readonly file: string;
        readonly summary: string;
        readonly relationship: string;
    }>;
    readonly documentation: string;
    readonly tests?: string | undefined;
}
type DetailLevel = 'minimal' | 'contextual' | 'full';
interface SearchQuery {
    readonly query: string;
    readonly stores?: readonly StoreId[] | undefined;
    readonly mode?: SearchMode | undefined;
    readonly limit?: number | undefined;
    readonly threshold?: number | undefined;
    readonly minRelevance?: number | undefined;
    readonly filter?: Record<string, unknown> | undefined;
    readonly includeContent?: boolean | undefined;
    readonly contextLines?: number | undefined;
    readonly detail?: DetailLevel | undefined;
}
interface SearchResult {
    readonly id: DocumentId;
    score: number;
    readonly content: string;
    readonly highlight?: string | undefined;
    readonly metadata: DocumentMetadata;
    readonly codeUnit?: CodeUnit | undefined;
    readonly summary?: ResultSummary | undefined;
    readonly context?: ResultContext | undefined;
    readonly full?: ResultFull | undefined;
    readonly rankingMetadata?: {
        readonly vectorRank?: number;
        readonly ftsRank?: number;
        readonly vectorRRF: number;
        readonly ftsRRF: number;
        readonly fileTypeBoost: number;
        readonly frameworkBoost: number;
        readonly urlKeywordBoost: number;
        readonly pathKeywordBoost: number;
        readonly rawVectorScore?: number;
    } | undefined;
}
type SearchConfidence = 'high' | 'medium' | 'low';
interface SearchResponse {
    readonly query: string;
    readonly mode: SearchMode;
    readonly stores: readonly StoreId[];
    readonly results: readonly SearchResult[];
    readonly totalResults: number;
    readonly timeMs: number;
    readonly confidence?: SearchConfidence | undefined;
    readonly maxRawScore?: number | undefined;
}

declare class SearchService {
    private readonly lanceStore;
    private readonly embeddingEngine;
    private readonly codeUnitService;
    private readonly codeGraphService;
    private readonly graphCache;
    constructor(lanceStore: LanceStore, embeddingEngine: EmbeddingEngine, codeGraphService?: CodeGraphService);
    /**
     * Load code graph for a store, with caching.
     * Returns null if no graph is available.
     */
    private loadGraphForStore;
    /**
     * Calculate confidence level based on max raw vector similarity score.
     * Configurable via environment variables, with sensible defaults for CLI usage.
     */
    private calculateConfidence;
    search(query: SearchQuery): Promise<SearchResponse>;
    /**
     * Deduplicate results by source file path.
     * Keeps the best chunk for each unique source, considering both score and query relevance.
     */
    private deduplicateBySource;
    /**
     * Count how many query terms appear in the content.
     */
    private countQueryTerms;
    /**
     * Normalize scores to 0-1 range and optionally filter by threshold.
     * This ensures threshold values match displayed scores (UX consistency).
     *
     * Edge case handling:
     * - If there's only 1 result or all results have the same score, normalization
     *   would make them all 1.0. In this case, we keep the raw scores to allow
     *   threshold filtering to work meaningfully on absolute quality.
     */
    private normalizeAndFilterScores;
    /**
     * Fetch raw vector search results without normalization.
     * Returns results with raw cosine similarity scores [0-1].
     */
    private vectorSearchRaw;
    private vectorSearch;
    private ftsSearch;
    /**
     * Internal hybrid search result with additional metadata for confidence calculation.
     */
    private hybridSearchWithMetadata;
    searchAllStores(query: SearchQuery, storeIds: StoreId[]): Promise<SearchResponse>;
    /**
     * Get a score multiplier based on file type and query intent.
     * Documentation files get a strong boost to surface them higher.
     * Phase 4: Strengthened boosts for better documentation ranking.
     * Phase 1: Intent-based adjustments for context-aware ranking.
     */
    private getFileTypeBoost;
    /**
     * Get a score multiplier based on URL keyword matching.
     * Boosts results where URL path contains significant query keywords.
     * This helps queries like "troubleshooting" rank /troubleshooting pages first.
     */
    private getUrlKeywordBoost;
    /**
     * Get a score multiplier based on file path keyword matching.
     * Boosts results where file path contains significant query keywords.
     * This helps queries like "dispatcher" rank async_dispatcher.py higher.
     */
    private getPathKeywordBoost;
    /**
     * Get a score multiplier based on framework context.
     * If query mentions a framework, boost results from that framework's files.
     */
    private getFrameworkContextBoost;
    private addProgressiveContext;
    private extractCodeUnitFromResult;
    private extractSymbolName;
    private inferType;
    private generatePurpose;
    private generateRelevanceReason;
    private extractInterfaces;
    private extractImports;
    private extractConcepts;
    private extractDocumentation;
    /**
     * Get usage stats from code graph.
     * Returns default values if no graph is available.
     */
    private getUsageFromGraph;
    /**
     * Get related code from graph.
     * Returns callers and callees for the symbol.
     */
    private getRelatedCodeFromGraph;
    /**
     * Parse a node ID into file path and symbol name.
     */
    private parseNodeId;
}

/**
 * Service for managing .gitignore patterns for Bluera Knowledge.
 *
 * When stores are created, this service ensures the project's .gitignore
 * is updated to:
 * - Ignore the .bluera/ data directory (not committed)
 * - Allow committing .bluera/bluera-knowledge/stores.config.json (for team sharing)
 */
declare class GitignoreService {
    private readonly gitignorePath;
    constructor(projectRoot: string);
    /**
     * Check if all required patterns are present in .gitignore
     */
    hasRequiredPatterns(): Promise<boolean>;
    /**
     * Ensure required .gitignore patterns are present.
     *
     * - Creates .gitignore if it doesn't exist
     * - Appends missing patterns if .gitignore exists
     * - Does nothing if all patterns are already present
     *
     * @returns Object with updated flag and descriptive message
     */
    ensureGitignorePatterns(): Promise<{
        updated: boolean;
        message: string;
    }>;
    /**
     * Get the path to the .gitignore file
     */
    getGitignorePath(): string;
}

/**
 * Discriminated union of all store definition types.
 * Use the `type` field to narrow the type.
 */
declare const StoreDefinitionSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"file">;
    path: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"repo">;
    url: z.ZodURL;
    branch: z.ZodOptional<z.ZodString>;
    depth: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodLiteral<"web">;
    url: z.ZodURL;
    depth: z.ZodDefault<z.ZodNumber>;
    maxPages: z.ZodOptional<z.ZodNumber>;
    crawlInstructions: z.ZodOptional<z.ZodString>;
    extractInstructions: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "type">;
type StoreDefinition = z.infer<typeof StoreDefinitionSchema>;
/**
 * Root configuration schema for store definitions.
 * Version field enables future schema migrations.
 */
declare const StoreDefinitionsConfigSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    stores: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type: z.ZodLiteral<"file">;
        path: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type: z.ZodLiteral<"repo">;
        url: z.ZodURL;
        branch: z.ZodOptional<z.ZodString>;
        depth: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type: z.ZodLiteral<"web">;
        url: z.ZodURL;
        depth: z.ZodDefault<z.ZodNumber>;
        maxPages: z.ZodOptional<z.ZodNumber>;
        crawlInstructions: z.ZodOptional<z.ZodString>;
        extractInstructions: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>], "type">>;
}, z.core.$strip>;
type StoreDefinitionsConfig = z.infer<typeof StoreDefinitionsConfigSchema>;

/**
 * Service for managing git-committable store definitions.
 *
 * Store definitions are saved to `.bluera/bluera-knowledge/stores.config.json`
 * within the project root. This file is designed to be committed to version
 * control, allowing teams to share store configurations.
 *
 * The actual store data (vector embeddings, cloned repos) lives in the data
 * directory and should be gitignored.
 */
declare class StoreDefinitionService {
    private readonly configPath;
    private readonly projectRoot;
    private config;
    constructor(projectRoot?: string);
    /**
     * Load store definitions from config file.
     * Returns empty config if file doesn't exist.
     * Throws on parse/validation errors (fail fast per CLAUDE.md).
     */
    load(): Promise<StoreDefinitionsConfig>;
    /**
     * Save store definitions to config file.
     */
    save(config: StoreDefinitionsConfig): Promise<void>;
    /**
     * Add a store definition.
     * Throws if a definition with the same name already exists.
     */
    addDefinition(definition: StoreDefinition): Promise<void>;
    /**
     * Remove a store definition by name.
     * Returns true if removed, false if not found.
     */
    removeDefinition(name: string): Promise<boolean>;
    /**
     * Update an existing store definition.
     * Only updates the provided fields, preserving others.
     * Throws if definition not found.
     */
    updateDefinition(name: string, updates: {
        description?: string;
        tags?: string[];
    }): Promise<void>;
    /**
     * Get a store definition by name.
     * Returns undefined if not found.
     */
    getByName(name: string): Promise<StoreDefinition | undefined>;
    /**
     * Check if any definitions exist.
     */
    hasDefinitions(): Promise<boolean>;
    /**
     * Resolve a file store path relative to project root.
     */
    resolvePath(path: string): string;
    /**
     * Get the config file path.
     */
    getConfigPath(): string;
    /**
     * Get the project root.
     */
    getProjectRoot(): string;
    /**
     * Clear the cached config (useful for testing).
     */
    clearCache(): void;
}

interface CreateStoreInput {
    name: string;
    type: StoreType;
    path?: string | undefined;
    url?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    branch?: string | undefined;
    depth?: number | undefined;
}
interface StoreServiceOptions {
    /** Optional definition service for auto-updating git-committable config */
    definitionService?: StoreDefinitionService;
    /** Optional gitignore service for ensuring .gitignore patterns */
    gitignoreService?: GitignoreService;
}
interface OperationOptions {
    /** Skip syncing to store definitions (used by stores:sync command) */
    skipDefinitionSync?: boolean;
}
declare class StoreService {
    private readonly dataDir;
    private readonly definitionService;
    private readonly gitignoreService;
    private registry;
    constructor(dataDir: string, options?: StoreServiceOptions);
    initialize(): Promise<void>;
    /**
     * Convert a Store and CreateStoreInput to a StoreDefinition for persistence.
     */
    private createDefinitionFromStore;
    create(input: CreateStoreInput, options?: OperationOptions): Promise<Result<Store>>;
    list(type?: StoreType): Promise<Store[]>;
    get(id: StoreId): Promise<Store | undefined>;
    getByName(name: string): Promise<Store | undefined>;
    getByIdOrName(idOrName: string): Promise<Store | undefined>;
    update(id: StoreId, updates: Partial<Pick<Store, 'name' | 'description' | 'tags'>>, options?: OperationOptions): Promise<Result<Store>>;
    delete(id: StoreId, options?: OperationOptions): Promise<Result<void>>;
    private loadRegistry;
    private saveRegistry;
}

interface ServiceContainer {
    config: ConfigService;
    store: StoreService;
    search: SearchService;
    index: IndexService;
    lance: LanceStore;
    embeddings: EmbeddingEngine;
    codeGraph: CodeGraphService;
    pythonBridge: PythonBridge;
}

/**
 * Configuration options for the MCP server
 */
interface MCPServerOptions {
    dataDir?: string | undefined;
    config?: string | undefined;
    projectRoot?: string | undefined;
}

/**
 * Create MCP server with pre-initialized services.
 *
 * Services are initialized ONCE at server startup and reused for all tool calls.
 * This reduces per-call latency from 1-15s to <500ms.
 */
declare function createMCPServer(options: MCPServerOptions, services: ServiceContainer): Server;
/**
 * Run MCP server with lazy service initialization.
 *
 * Services are initialized ONCE at startup:
 * - Lightweight services (config, store, lance wrapper): immediate
 * - Heavy services (embeddings model): deferred until first use
 *
 * This reduces server startup from ~5s to <500ms.
 */
declare function runMCPServer(options: MCPServerOptions): Promise<void>;

export { createMCPServer, runMCPServer };
