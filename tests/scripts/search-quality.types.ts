/**
 * Type definitions for AI-powered search quality testing
 */

// Configuration types
export interface QualityConfig {
  queryCount: number;
  searchLimit: number;
  searchMode: 'hybrid' | 'semantic' | 'keyword';
  stores: string[] | null;
  maxRetries: number;
  timeoutMs: number;
  querySet: 'core' | 'explore' | string;
  corpusVersion: string;
}

// Query set types
export interface CoreQuery {
  id: string;
  query: string;
  intent: string;
  category: 'code-pattern' | 'concept' | 'api-reference' | 'troubleshooting' | 'comparison';
  expectedSources?: string[];
}

export interface QuerySet {
  version: string;
  description: string;
  queries: CoreQuery[];
  source?: 'curated' | 'ai-generated';
  generatedAt?: string;
}

// Baseline types
export interface BaselineScores {
  relevance: number;
  ranking: number;
  coverage: number;
  snippetQuality: number;
  overall: number;
}

export interface Baseline {
  updatedAt: string;
  corpus: string;
  querySet: string;
  scores: BaselineScores;
  thresholds: {
    regression: number;
    improvement: number;
  };
}

// Query generation types
export interface GeneratedQuery {
  query: string;
  intent: string;
  expectedContentTypes?: string[];
}

export interface QueryGenerationResult {
  queries: GeneratedQuery[];
}

// Evaluation types
export interface Scores {
  relevance: number;
  ranking: number;
  coverage: number;
  snippetQuality: number;
  overall: number;
}

export interface Analysis {
  relevance: string;
  ranking: string;
  coverage: string;
  snippetQuality: string;
}

export interface ResultAssessment {
  rank: number;
  source: string;
  relevant: boolean;
  note?: string;
}

export interface EvaluationResult {
  scores: Scores;
  analysis: Analysis;
  suggestions: string[];
  resultAssessments: ResultAssessment[];
}

// Search result types (from CLI output)
export interface SearchResult {
  source: string;
  title?: string;
  snippet: string;
  score?: number;
  store?: string;
}

// Per-query evaluation output
export interface QueryEvaluation {
  timestamp: string;
  query: GeneratedQuery;
  searchResults: SearchResult[];
  evaluation: EvaluationResult;
  searchTimeMs: number;
  evaluationTimeMs: number;
}

// Run summary types
export interface RunSummary {
  timestamp: string;
  runId: string;
  config: QualityConfig;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageScores: Scores;
  queryEvaluations: QueryEvaluation[];
  topSuggestions: string[];
  totalTimeMs: number;
}

// JSONL line type (for output file)
export type QualityResultLine =
  | { type: 'run_start'; timestamp: string; runId: string; config: QualityConfig }
  | { type: 'query_evaluation'; data: QueryEvaluation }
  | { type: 'run_summary'; data: RunSummary };
