# AI Search Quality Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CLI command that uses Claude to generate test queries and evaluate search result quality, outputting structured JSONL for trend tracking.

**Architecture:** TypeScript script invokes Claude CLI twice per run - once to generate queries from fixtures, once per query to evaluate search results. Results stream to timestamped JSONL files.

**Tech Stack:** TypeScript, Node.js child_process, Claude CLI with JSON schema validation

---

### Task 1: Create Configuration File

**Files:**
- Create: `tests/quality-config.json`

**Step 1: Create the config file**

```json
{
  "queryCount": 15,
  "searchLimit": 10,
  "searchMode": "hybrid",
  "stores": null,
  "maxRetries": 3,
  "timeoutMs": 60000
}
```

**Step 2: Commit**

```bash
git add tests/quality-config.json
git commit -m "chore: add search quality test configuration"
```

---

### Task 2: Create Results Directory

**Files:**
- Create: `tests/quality-results/.gitkeep`

**Step 1: Create directory with .gitkeep**

```bash
mkdir -p tests/quality-results
touch tests/quality-results/.gitkeep
```

**Step 2: Add to .gitignore (keep .gitkeep, ignore results)**

Append to `.gitignore`:
```
tests/quality-results/*.jsonl
```

**Step 3: Commit**

```bash
git add tests/quality-results/.gitkeep .gitignore
git commit -m "chore: add quality results directory structure"
```

---

### Task 3: Create JSON Schemas for Claude Output

**Files:**
- Create: `tests/scripts/schemas/query-generation.json`
- Create: `tests/scripts/schemas/evaluation.json`

**Step 1: Create query generation schema**

`tests/scripts/schemas/query-generation.json`:
```json
{
  "type": "object",
  "properties": {
    "queries": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "query": { "type": "string" },
          "intent": { "type": "string" },
          "expectedContentTypes": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["query", "intent"]
      }
    }
  },
  "required": ["queries"]
}
```

**Step 2: Create evaluation schema**

`tests/scripts/schemas/evaluation.json`:
```json
{
  "type": "object",
  "properties": {
    "scores": {
      "type": "object",
      "properties": {
        "relevance": { "type": "number", "minimum": 0, "maximum": 1 },
        "ranking": { "type": "number", "minimum": 0, "maximum": 1 },
        "coverage": { "type": "number", "minimum": 0, "maximum": 1 },
        "snippetQuality": { "type": "number", "minimum": 0, "maximum": 1 },
        "overall": { "type": "number", "minimum": 0, "maximum": 1 }
      },
      "required": ["relevance", "ranking", "coverage", "snippetQuality", "overall"]
    },
    "analysis": {
      "type": "object",
      "properties": {
        "relevance": { "type": "string" },
        "ranking": { "type": "string" },
        "coverage": { "type": "string" },
        "snippetQuality": { "type": "string" }
      },
      "required": ["relevance", "ranking", "coverage", "snippetQuality"]
    },
    "suggestions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "resultAssessments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "rank": { "type": "integer" },
          "source": { "type": "string" },
          "relevant": { "type": "boolean" },
          "note": { "type": "string" }
        },
        "required": ["rank", "source", "relevant"]
      }
    }
  },
  "required": ["scores", "analysis", "suggestions", "resultAssessments"]
}
```

**Step 3: Commit**

```bash
git add tests/scripts/schemas/
git commit -m "feat: add JSON schemas for Claude quality evaluation"
```

---

### Task 4: Create Type Definitions

**Files:**
- Create: `tests/scripts/search-quality.types.ts`

**Step 1: Create TypeScript types**

```typescript
export interface QualityConfig {
  queryCount: number;
  searchLimit: number;
  searchMode: 'vector' | 'fts' | 'hybrid';
  stores: string[] | null;
  maxRetries: number;
  timeoutMs: number;
}

export interface GeneratedQuery {
  query: string;
  intent: string;
  expectedContentTypes?: string[];
}

export interface QueryGenerationResult {
  queries: GeneratedQuery[];
}

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

export interface QueryEvaluation {
  timestamp: string;
  query: string;
  queryIntent: string;
  searchMode: string;
  resultCount: number;
  scores: Scores;
  analysis: Analysis;
  suggestions: string[];
  results: ResultAssessment[];
}

export interface RunSummary {
  type: 'summary';
  timestamp: string;
  totalQueries: number;
  averageScores: Scores;
  topIssues: string[];
  recommendedFocus: string;
}
```

**Step 2: Commit**

```bash
git add tests/scripts/search-quality.types.ts
git commit -m "feat: add TypeScript types for quality testing"
```

---

### Task 5: Create Main Script - Imports and Config Loading

**Files:**
- Create: `tests/scripts/search-quality.ts`

**Step 1: Create script with imports and config loading**

```typescript
#!/usr/bin/env npx tsx

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  QualityConfig,
  QueryGenerationResult,
  EvaluationResult,
  QueryEvaluation,
  RunSummary,
  Scores,
} from './search-quality.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');
const RESULTS_DIR = join(__dirname, '..', 'quality-results');
const SCHEMAS_DIR = join(__dirname, 'schemas');

function loadConfig(): QualityConfig {
  const configPath = join(__dirname, '..', 'quality-config.json');
  const defaultConfig: QualityConfig = {
    queryCount: 15,
    searchLimit: 10,
    searchMode: 'hybrid',
    stores: null,
    maxRetries: 3,
    timeoutMs: 60000,
  };

  if (existsSync(configPath)) {
    const userConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    return { ...defaultConfig, ...userConfig };
  }
  return defaultConfig;
}

function loadSchema(name: string): string {
  return readFileSync(join(SCHEMAS_DIR, `${name}.json`), 'utf-8');
}

// Continue in next task...
```

**Step 2: Commit**

```bash
git add tests/scripts/search-quality.ts
git commit -m "feat: add quality script skeleton with config loading"
```

---

### Task 6: Add Query Generation Function

**Files:**
- Modify: `tests/scripts/search-quality.ts`

**Step 1: Add generateQueries function after loadSchema**

```typescript
function generateQueries(config: QualityConfig): QueryGenerationResult {
  console.log('🔍 Generating test queries from tests/fixtures/...');

  const schema = loadSchema('query-generation');
  const prompt = `You have access to explore the tests/fixtures/ directory which contains content that has been indexed in a knowledge store search system.

Your task:
1. Use the Glob and Read tools to explore tests/fixtures/ and understand what content is available
2. Generate exactly ${config.queryCount} diverse search queries that would thoroughly test the search system

Generate queries that:
- Cover different content types (code, documentation, READMEs)
- Range from specific (function names) to conceptual (design patterns)
- Include some ambiguous queries that could match multiple files
- Test edge cases (very short queries, natural language questions)

Return your queries in the specified JSON format.`;

  const args = [
    'claude',
    '-p',
    '--output-format', 'json',
    '--json-schema', JSON.stringify(JSON.parse(schema)),
    '--allowedTools', 'Glob,Read',
    prompt,
  ];

  try {
    const result = execSync(args.join(' '), {
      encoding: 'utf-8',
      timeout: config.timeoutMs * 2, // Extra time for exploration
      cwd: ROOT_DIR,
      maxBuffer: 10 * 1024 * 1024,
    });

    const parsed = JSON.parse(result) as QueryGenerationResult;
    console.log(`✓ Generated ${parsed.queries.length} queries\n`);
    return parsed;
  } catch (error) {
    console.error('Failed to generate queries:', error);
    throw error;
  }
}
```

**Step 2: Commit**

```bash
git add tests/scripts/search-quality.ts
git commit -m "feat: add query generation using Claude CLI"
```

---

### Task 7: Add Search Execution Function

**Files:**
- Modify: `tests/scripts/search-quality.ts`

**Step 1: Add runSearch function**

```typescript
interface SearchResult {
  rank: number;
  score: number;
  source: string;
  content: string;
}

function runSearch(query: string, config: QualityConfig): { results: SearchResult[]; rawOutput: string } {
  const args = [
    'node', 'dist/index.js', 'search',
    JSON.stringify(query),
    '--mode', config.searchMode,
    '--limit', String(config.searchLimit),
    '--include-content',
  ];

  if (config.stores && config.stores.length > 0) {
    args.push('--stores', config.stores.join(','));
  }

  try {
    const rawOutput = execSync(args.join(' '), {
      encoding: 'utf-8',
      timeout: config.timeoutMs,
      cwd: ROOT_DIR,
    });

    // Parse the output format: "1. [-0.23] /path/to/file.ts\n   content..."
    const results: SearchResult[] = [];
    const lines = rawOutput.split('\n');
    let currentResult: Partial<SearchResult> | null = null;

    for (const line of lines) {
      const headerMatch = line.match(/^(\d+)\.\s+\[(-?[0-9.]+)\]\s+(.+)$/);
      if (headerMatch) {
        if (currentResult && currentResult.content !== undefined) {
          results.push(currentResult as SearchResult);
        }
        currentResult = {
          rank: parseInt(headerMatch[1], 10),
          score: parseFloat(headerMatch[2]),
          source: headerMatch[3].trim(),
          content: '',
        };
      } else if (currentResult && line.startsWith('   ')) {
        currentResult.content += (currentResult.content ? '\n' : '') + line.trim();
      }
    }
    if (currentResult && currentResult.content !== undefined) {
      results.push(currentResult as SearchResult);
    }

    return { results, rawOutput };
  } catch (error) {
    console.error(`Search failed for query "${query}":`, error);
    return { results: [], rawOutput: '' };
  }
}
```

**Step 2: Commit**

```bash
git add tests/scripts/search-quality.ts
git commit -m "feat: add search execution and result parsing"
```

---

### Task 8: Add Evaluation Function

**Files:**
- Modify: `tests/scripts/search-quality.ts`

**Step 1: Add evaluateResults function**

```typescript
function evaluateResults(
  query: string,
  intent: string,
  results: SearchResult[],
  config: QualityConfig
): EvaluationResult {
  const schema = loadSchema('evaluation');

  const resultsForPrompt = results.map(r => ({
    rank: r.rank,
    score: r.score,
    source: r.source,
    contentPreview: r.content.slice(0, 500) + (r.content.length > 500 ? '...' : ''),
  }));

  const prompt = `Evaluate these search results for quality.

**Query:** "${query}"
**Intent:** ${intent}

**Search Results (${results.length} returned):**
${JSON.stringify(resultsForPrompt, null, 2)}

Evaluate on these dimensions (0.0 to 1.0 scale):

1. **Relevance**: Do the results actually relate to the query intent?
2. **Ranking**: Are the most relevant results at the top?
3. **Coverage**: Did the search find the expected content? (Consider what SHOULD match)
4. **Snippet Quality**: Are the content previews useful and showing relevant sections?
5. **Overall**: Weighted assessment of search quality

Provide:
- Numeric scores for each dimension
- Detailed analysis explaining each score
- Specific, actionable suggestions for improving the search system
- Assessment of each result (relevant or not, with notes)

Be critical and specific. Your feedback will be used to improve the search system.`;

  const args = [
    'claude',
    '-p',
    '--output-format', 'json',
    '--json-schema', JSON.stringify(JSON.parse(schema)),
    prompt,
  ];

  try {
    const result = execSync(args.join(' '), {
      encoding: 'utf-8',
      timeout: config.timeoutMs,
      cwd: ROOT_DIR,
      maxBuffer: 10 * 1024 * 1024,
    });

    return JSON.parse(result) as EvaluationResult;
  } catch (error) {
    console.error(`Evaluation failed for query "${query}":`, error);
    // Return a failure result
    return {
      scores: { relevance: 0, ranking: 0, coverage: 0, snippetQuality: 0, overall: 0 },
      analysis: {
        relevance: 'Evaluation failed',
        ranking: 'Evaluation failed',
        coverage: 'Evaluation failed',
        snippetQuality: 'Evaluation failed',
      },
      suggestions: ['Evaluation failed - check logs'],
      resultAssessments: [],
    };
  }
}
```

**Step 2: Commit**

```bash
git add tests/scripts/search-quality.ts
git commit -m "feat: add result evaluation using Claude CLI"
```

---

### Task 9: Add Summary Generation and Main Function

**Files:**
- Modify: `tests/scripts/search-quality.ts`

**Step 1: Add summary generation and main function**

```typescript
function generateSummary(evaluations: QueryEvaluation[]): RunSummary {
  const avgScores: Scores = {
    relevance: 0,
    ranking: 0,
    coverage: 0,
    snippetQuality: 0,
    overall: 0,
  };

  for (const eval_ of evaluations) {
    avgScores.relevance += eval_.scores.relevance;
    avgScores.ranking += eval_.scores.ranking;
    avgScores.coverage += eval_.scores.coverage;
    avgScores.snippetQuality += eval_.scores.snippetQuality;
    avgScores.overall += eval_.scores.overall;
  }

  const count = evaluations.length || 1;
  avgScores.relevance = Math.round((avgScores.relevance / count) * 100) / 100;
  avgScores.ranking = Math.round((avgScores.ranking / count) * 100) / 100;
  avgScores.coverage = Math.round((avgScores.coverage / count) * 100) / 100;
  avgScores.snippetQuality = Math.round((avgScores.snippetQuality / count) * 100) / 100;
  avgScores.overall = Math.round((avgScores.overall / count) * 100) / 100;

  // Collect all suggestions and count occurrences
  const suggestionCounts = new Map<string, number>();
  for (const eval_ of evaluations) {
    for (const suggestion of eval_.suggestions) {
      const key = suggestion.toLowerCase().slice(0, 50);
      suggestionCounts.set(key, (suggestionCounts.get(key) || 0) + 1);
    }
  }

  const topIssues = [...suggestionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue]) => issue);

  // Find lowest scoring dimension
  const dimensions = ['relevance', 'ranking', 'coverage', 'snippetQuality'] as const;
  const lowestDim = dimensions.reduce((min, dim) =>
    avgScores[dim] < avgScores[min] ? dim : min
  );

  return {
    type: 'summary',
    timestamp: new Date().toISOString(),
    totalQueries: evaluations.length,
    averageScores: avgScores,
    topIssues,
    recommendedFocus: `${lowestDim} (avg: ${avgScores[lowestDim]}) - review evaluations for specific improvement suggestions`,
  };
}

async function main() {
  const config = loadConfig();

  // Ensure results directory exists
  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, { recursive: true });
  }

  // Generate output filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputPath = join(RESULTS_DIR, `${timestamp}.jsonl`);

  // Phase 1: Generate queries
  const { queries } = generateQueries(config);

  // Phase 2: Evaluate each query
  console.log('📊 Evaluating search quality...');
  const evaluations: QueryEvaluation[] = [];

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const progress = `[${i + 1}/${queries.length}]`;

    // Run search
    const { results } = runSearch(q.query, config);

    // Evaluate results
    const evaluation = evaluateResults(q.query, q.intent, results, config);

    // Build full evaluation record
    const record: QueryEvaluation = {
      timestamp: new Date().toISOString(),
      query: q.query,
      queryIntent: q.intent,
      searchMode: config.searchMode,
      resultCount: results.length,
      scores: evaluation.scores,
      analysis: evaluation.analysis,
      suggestions: evaluation.suggestions,
      results: evaluation.resultAssessments,
    };

    evaluations.push(record);

    // Write immediately (append)
    appendFileSync(outputPath, JSON.stringify(record) + '\n');

    console.log(`  ${progress} "${q.query.slice(0, 40)}${q.query.length > 40 ? '...' : ''}" - overall: ${evaluation.scores.overall.toFixed(2)}`);
  }

  // Write summary
  const summary = generateSummary(evaluations);
  appendFileSync(outputPath, JSON.stringify(summary) + '\n');

  console.log(`\n✓ Results written to ${outputPath}`);
  console.log(`📈 Average overall score: ${summary.averageScores.overall}`);

  if (summary.topIssues.length > 0) {
    console.log('\n🎯 Top issues to address:');
    summary.topIssues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
  }

  console.log(`\n💡 Recommended focus: ${summary.recommendedFocus}`);
}

main().catch(console.error);
```

**Step 2: Commit**

```bash
git add tests/scripts/search-quality.ts
git commit -m "feat: add summary generation and main execution loop"
```

---

### Task 10: Add npm Script

**Files:**
- Modify: `package.json`

**Step 1: Add npm script**

Add to "scripts" section:
```json
"test:search-quality": "npx tsx tests/scripts/search-quality.ts"
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add npm script for search quality testing"
```

---

### Task 11: Test the Implementation

**Step 1: Build the project**

```bash
npm run build
```

**Step 2: Ensure test fixtures are indexed**

```bash
node dist/index.js store create test-fixtures --type file --source tests/fixtures
node dist/index.js index test-fixtures
```

**Step 3: Run the quality test**

```bash
npm run test:search-quality
```

**Step 4: Verify output**

Check that `tests/quality-results/` contains a new JSONL file with:
- One JSON object per line for each query evaluation
- Final line is the summary object

**Step 5: Commit any fixes if needed**

---

### Task 12: Final Commit - Feature Complete

**Step 1: Verify all files are committed**

```bash
git status
```

**Step 2: Create final commit if any uncommitted changes**

```bash
git add -A
git commit -m "feat: complete AI-powered search quality testing

Adds npm run test:search-quality command that:
- Uses Claude CLI to generate test queries from fixtures
- Evaluates search results with detailed scoring and analysis
- Outputs JSONL for trend tracking

Closes #AI-quality-testing"
```
