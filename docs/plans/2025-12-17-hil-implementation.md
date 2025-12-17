# HIL Quality Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add human-in-the-loop capabilities to search quality testing with query management, verbose output, and post-run review.

**Architecture:** Three new scripts share utilities from `quality-shared.ts`. Main test runner gets verbose output by default. HIL data stored inline in existing JSONL format.

**Tech Stack:** TypeScript, Node.js readline for interactive prompts, existing Claude CLI integration

---

## Task 1: Add HIL Types

**Files:**
- Modify: `tests/scripts/search-quality.types.ts`

**Step 1: Add HIL type definitions**

Add to end of file:

```typescript
// HIL (Human-in-the-Loop) types
export type HilJudgment = 'good' | 'okay' | 'poor' | 'terrible';

export const HIL_JUDGMENT_SCORES: Record<HilJudgment, number> = {
  good: 1.0,
  okay: 0.7,
  poor: 0.4,
  terrible: 0.1,
};

export interface HilQueryData {
  reviewed: boolean;
  judgment?: HilJudgment;
  humanScore?: number;
  note?: string;
  flagged?: boolean;
  reviewedAt?: string;
}

export interface HilReviewSummary {
  reviewedAt: string;
  queriesReviewed: number;
  queriesSkipped: number;
  queriesFlagged: number;
  humanAverageScore: number;
  aiVsHumanDelta: number;
  synthesis: string;
  actionItems: string[];
}

// Extended types with HIL support
export interface QueryEvaluationWithHil extends QueryEvaluation {
  hil?: HilQueryData;
}

export interface RunSummaryWithHil extends RunSummary {
  hilReview?: HilReviewSummary;
}
```

**Step 2: Commit**

```bash
git add tests/scripts/search-quality.types.ts
git commit -m "feat(tests): add HIL type definitions"
```

---

## Task 2: Create Shared Utilities

**Files:**
- Create: `tests/scripts/quality-shared.ts`

**Step 1: Create the shared utilities file**

```typescript
#!/usr/bin/env npx tsx

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createInterface } from 'node:readline';
import type { QuerySet, HilJudgment } from './search-quality.types.js';

// Directory constants
export const ROOT_DIR = join(import.meta.dirname, '..', '..');
export const RESULTS_DIR = join(import.meta.dirname, '..', 'quality-results');
export const QUERIES_DIR = join(import.meta.dirname, '..', 'fixtures', 'queries');

// Query set discovery
export interface QuerySetInfo {
  name: string;
  path: string;
  queryCount: number;
  source: 'curated' | 'ai-generated';
  version?: string;
}

export function listQuerySets(): QuerySetInfo[] {
  const sets: QuerySetInfo[] = [];

  // Curated sets (top-level .json files)
  if (existsSync(QUERIES_DIR)) {
    const files = readdirSync(QUERIES_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const path = join(QUERIES_DIR, file);
        const data = JSON.parse(readFileSync(path, 'utf-8')) as QuerySet;
        sets.push({
          name: basename(file, '.json'),
          path,
          queryCount: data.queries.length,
          source: data.source ?? 'curated',
          version: data.version,
        });
      }
    }
  }

  // Generated sets (in generated/ subdirectory)
  const generatedDir = join(QUERIES_DIR, 'generated');
  if (existsSync(generatedDir)) {
    const files = readdirSync(generatedDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const path = join(generatedDir, file);
        const data = JSON.parse(readFileSync(path, 'utf-8')) as QuerySet;
        sets.push({
          name: `generated/${basename(file, '.json')}`,
          path,
          queryCount: data.queries.length,
          source: 'ai-generated',
          version: data.version,
        });
      }
    }
  }

  return sets;
}

export function loadQuerySet(name: string): QuerySet {
  const sets = listQuerySets();
  const set = sets.find(s => s.name === name);
  if (!set) {
    throw new Error(`Query set not found: ${name}`);
  }
  return JSON.parse(readFileSync(set.path, 'utf-8')) as QuerySet;
}

export function loadAllQuerySets(): QuerySet {
  const sets = listQuerySets().filter(s => s.source === 'curated');
  const combined: QuerySet = {
    version: '1.0.0',
    description: 'Combined curated query sets',
    queries: [],
    source: 'curated',
  };

  for (const set of sets) {
    const data = JSON.parse(readFileSync(set.path, 'utf-8')) as QuerySet;
    combined.queries.push(...data.queries.map(q => ({
      ...q,
      id: `${set.name}:${q.id}`,
    })));
  }

  return combined;
}

// Run discovery
export interface RunInfo {
  id: string;
  path: string;
  querySet: string;
  queryCount: number;
  overallScore: number;
  hasHilReview: boolean;
  timestamp: string;
}

export function listRuns(): RunInfo[] {
  const runs: RunInfo[] = [];

  if (!existsSync(RESULTS_DIR)) return runs;

  const files = readdirSync(RESULTS_DIR)
    .filter(f => f.endsWith('.jsonl'))
    .sort()
    .reverse();

  for (const file of files) {
    const path = join(RESULTS_DIR, file);
    const lines = readFileSync(path, 'utf-8').trim().split('\n');

    // Find summary line
    for (const line of lines) {
      const parsed = JSON.parse(line);
      if (parsed.type === 'run_summary') {
        runs.push({
          id: basename(file, '.jsonl'),
          path,
          querySet: parsed.data.config?.querySet ?? 'unknown',
          queryCount: parsed.data.totalQueries,
          overallScore: parsed.data.averageScores?.overall ?? 0,
          hasHilReview: !!parsed.data.hilReview,
          timestamp: parsed.data.timestamp,
        });
        break;
      }
    }
  }

  return runs;
}

// Interactive prompts
export function createPrompt(): { question: (q: string) => Promise<string>; close: () => void } {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return {
    question: (q: string) => new Promise(resolve => rl.question(q, resolve)),
    close: () => rl.close(),
  };
}

export function formatJudgmentPrompt(): string {
  return '[g]ood  [o]kay  [p]oor  [t]errible  [n]ote only  [enter] skip';
}

export function parseJudgment(input: string): HilJudgment | 'note' | 'skip' {
  const lower = input.toLowerCase().trim();
  if (lower === '' || lower === 's') return 'skip';
  if (lower === 'g' || lower === 'good') return 'good';
  if (lower === 'o' || lower === 'okay') return 'okay';
  if (lower === 'p' || lower === 'poor') return 'poor';
  if (lower === 't' || lower === 'terrible') return 'terrible';
  if (lower === 'n' || lower === 'note') return 'note';
  return 'skip';
}

// Display helpers
export function printQuerySets(sets: QuerySetInfo[]): void {
  console.log('Available query sets:');
  for (const set of sets) {
    const source = set.source === 'curated' ? `curated, v${set.version}` : 'ai-generated';
    console.log(`  ${set.name.padEnd(20)} ${String(set.queryCount).padStart(3)} queries  (${source})`);
  }
}

export function printRuns(runs: RunInfo[]): void {
  console.log('Recent test runs:');
  for (const run of runs.slice(0, 10)) {
    const reviewed = run.hasHilReview ? '(reviewed)' : '(no HIL review)';
    console.log(`  ${run.id}  ${run.querySet.padEnd(10)} ${String(run.queryCount).padStart(3)} queries  overall=${run.overallScore.toFixed(2)}  ${reviewed}`);
  }
}
```

**Step 2: Commit**

```bash
git add tests/scripts/quality-shared.ts
git commit -m "feat(tests): add shared HIL utilities"
```

---

## Task 3: Update Test Runner - Verbose Output

**Files:**
- Modify: `tests/scripts/search-quality.ts`

**Step 1: Add output mode parsing after CLI args parsing**

Find this section (around line 413-415):
```typescript
const isExplore = args.includes('--explore');
const updateBaseline = args.includes('--update-baseline');
```

Add after it:
```typescript
// Output verbosity
const quietMode = args.includes('--quiet');
const silentMode = args.includes('--silent');
```

**Step 2: Update the query loop output**

Find the console.log in the query loop (around line 502):
```typescript
console.log(`  ${progress} "${q.query.slice(0, 40)}${q.query.length > 40 ? '...' : ''}" - overall: ${evaluation.scores.overall.toFixed(2)}`);
```

Replace the entire query loop output section with:
```typescript
if (!silentMode) {
  if (quietMode) {
    // Quiet mode: summary only
    console.log(`  ${progress} "${q.query.slice(0, 40)}${q.query.length > 40 ? '...' : ''}" - overall: ${evaluation.scores.overall.toFixed(2)}`);
  } else {
    // Default verbose mode: full results
    console.log(`\n${progress} "${q.query}"`);
    for (const r of results.slice(0, 5)) {
      console.log(`  → ${r.rank}. [${r.score.toFixed(2)}] ${r.source}`);
      const snippet = r.content.slice(0, 100).replace(/\n/g, ' ');
      console.log(`       "${snippet}${r.content.length > 100 ? '...' : ''}"`);
    }
    if (results.length > 5) {
      console.log(`  ... and ${results.length - 5} more results`);
    }
    const s = evaluation.scores;
    console.log(`  ✓ AI: relevance=${s.relevance.toFixed(2)} ranking=${s.ranking.toFixed(2)} coverage=${s.coverage.toFixed(2)} snippet=${s.snippetQuality.toFixed(2)} overall=${s.overall.toFixed(2)}`);
  }
}
```

**Step 3: Commit**

```bash
git add tests/scripts/search-quality.ts
git commit -m "feat(tests): add verbose output by default with --quiet/--silent"
```

---

## Task 4: Update Test Runner - Set All Support

**Files:**
- Modify: `tests/scripts/search-quality.ts`

**Step 1: Add import for shared utilities**

Add near top imports:
```typescript
import { listQuerySets, loadAllQuerySets } from './quality-shared.js';
```

**Step 2: Update query loading logic**

Find where queries are loaded (around line 458-462):
```typescript
} else {
  const querySet = loadQuerySet(querySetName);
```

Replace with:
```typescript
} else {
  let querySet: QuerySet;
  if (querySetName === 'all') {
    querySet = loadAllQuerySets();
    console.log(`📋 Loaded ${querySet.queries.length} queries from all curated sets\n`);
  } else {
    querySet = loadQuerySet(querySetName);
    console.log(`📋 Loaded ${querySet.queries.length} queries from ${querySetName}.json\n`);
  }
```

**Step 3: Commit**

```bash
git add tests/scripts/search-quality.ts
git commit -m "feat(tests): add --set all support for combined query sets"
```

---

## Task 5: Create Query Management Script

**Files:**
- Create: `tests/scripts/quality-queries.ts`

**Step 1: Create the query management script**

```typescript
#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import {
  listQuerySets,
  loadQuerySet,
  loadAllQuerySets,
  printQuerySets,
  createPrompt,
  QUERIES_DIR,
  ROOT_DIR,
} from './quality-shared.js';
import type { QuerySet, CoreQuery } from './search-quality.types.js';

const CLAUDE_CLI = process.env.CLAUDE_CLI || `${process.env.HOME}/.claude/local/claude`;

function shellEscape(str: string): string {
  return `'${str.replace(/'/g, "'\"'\"'")}'`;
}

async function generateQueries(seedSet?: string): Promise<void> {
  const prompt = createPrompt();

  console.log('🔍 Query Generation Mode\n');

  // Load seed queries if specified
  let seedQueries: CoreQuery[] = [];
  if (seedSet) {
    const seed = seedSet === 'all' ? loadAllQuerySets() : loadQuerySet(seedSet);
    seedQueries = seed.queries;
    console.log(`Seeding from ${seedSet} (${seedQueries.length} queries)\n`);
  }

  // Generate queries via Claude
  console.log('Generating queries from corpus analysis...\n');

  const generatePrompt = `You have access to explore the tests/fixtures/ directory which contains content indexed in a knowledge store.

${seedQueries.length > 0 ? `Existing queries to build on:\n${seedQueries.map(q => `- "${q.query}" (${q.category})`).join('\n')}\n\nPropose 10-15 NEW queries that complement the existing ones.` : 'Propose 10-15 diverse search queries.'}

For each query provide:
- query: the search string
- intent: what the user is trying to find
- category: one of code-pattern, concept, api-reference, troubleshooting, comparison

Return as JSON array.`;

  const args = [
    CLAUDE_CLI,
    '-p', shellEscape(generatePrompt),
    '--output-format', 'json',
    '--allowedTools', 'Glob,Read',
  ];

  const result = execSync(args.join(' '), {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    timeout: 120000,
  });

  const parsed = JSON.parse(result);
  let queries: CoreQuery[] = parsed.structured_output ?? JSON.parse(parsed.result);

  // Assign IDs
  queries = queries.map((q, i) => ({
    ...q,
    id: `gen-${String(i + 1).padStart(3, '0')}`,
  }));

  // Interactive review loop
  let done = false;
  while (!done) {
    console.log(`\nProposed queries (${queries.length}):\n`);
    queries.forEach((q, i) => {
      console.log(`${String(i + 1).padStart(2)}. [${q.category}] "${q.query}"`);
      console.log(`    Intent: ${q.intent}\n`);
    });

    const action = await prompt.question('Actions: [a]ccept, [d]rop <nums>, [e]dit <num>, [r]egenerate, [q]uit: ');

    if (action === 'a' || action === 'accept') {
      done = true;
    } else if (action.startsWith('d ') || action.startsWith('drop ')) {
      const nums = action.replace(/^d(rop)?\s+/, '').split(',').map(n => parseInt(n.trim(), 10) - 1);
      queries = queries.filter((_, i) => !nums.includes(i));
      console.log(`Dropped ${nums.length} queries.`);
    } else if (action.startsWith('e ') || action.startsWith('edit ')) {
      const num = parseInt(action.replace(/^e(dit)?\s+/, ''), 10) - 1;
      if (queries[num]) {
        const newQuery = await prompt.question(`Query [${queries[num].query}]: `);
        const newIntent = await prompt.question(`Intent [${queries[num].intent}]: `);
        if (newQuery.trim()) queries[num].query = newQuery.trim();
        if (newIntent.trim()) queries[num].intent = newIntent.trim();
      }
    } else if (action === 'r' || action === 'regenerate') {
      console.log('Regenerating...');
      // Would call Claude again here - simplified for now
    } else if (action === 'q' || action === 'quit') {
      prompt.close();
      console.log('Cancelled.');
      return;
    }
  }

  // Save to file
  const name = await prompt.question('Save as (name): ');
  const filename = name.trim() || `generated-${new Date().toISOString().split('T')[0]}`;

  const outputDir = join(QUERIES_DIR, 'generated');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, `${filename}.json`);
  const querySet: QuerySet = {
    version: '1.0.0',
    description: `AI-generated queries from ${new Date().toISOString()}`,
    queries,
    source: 'ai-generated',
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(outputPath, JSON.stringify(querySet, null, 2));
  console.log(`\n✓ Saved ${queries.length} queries to ${outputPath}`);

  prompt.close();
}

async function reviewQueries(setName: string): Promise<void> {
  const prompt = createPrompt();

  console.log(`📝 Reviewing query set: ${setName}\n`);

  const querySet = setName === 'all' ? loadAllQuerySets() : loadQuerySet(setName);
  let queries = [...querySet.queries];

  // Interactive review loop (same as generate)
  let done = false;
  while (!done) {
    console.log(`\nQueries (${queries.length}):\n`);
    queries.forEach((q, i) => {
      console.log(`${String(i + 1).padStart(2)}. [${q.category}] "${q.query}"`);
      console.log(`    Intent: ${q.intent}\n`);
    });

    const action = await prompt.question('Actions: [d]rop <nums>, [e]dit <num>, [a]dd, [s]ave, [q]uit: ');

    if (action === 's' || action === 'save') {
      done = true;
    } else if (action.startsWith('d ') || action.startsWith('drop ')) {
      const nums = action.replace(/^d(rop)?\s+/, '').split(',').map(n => parseInt(n.trim(), 10) - 1);
      queries = queries.filter((_, i) => !nums.includes(i));
      console.log(`Dropped ${nums.length} queries.`);
    } else if (action.startsWith('e ') || action.startsWith('edit ')) {
      const num = parseInt(action.replace(/^e(dit)?\s+/, ''), 10) - 1;
      if (queries[num]) {
        const newQuery = await prompt.question(`Query [${queries[num].query}]: `);
        const newIntent = await prompt.question(`Intent [${queries[num].intent}]: `);
        if (newQuery.trim()) queries[num].query = newQuery.trim();
        if (newIntent.trim()) queries[num].intent = newIntent.trim();
      }
    } else if (action === 'a' || action === 'add') {
      const newQuery = await prompt.question('Query: ');
      const newIntent = await prompt.question('Intent: ');
      const newCategory = await prompt.question('Category (code-pattern/concept/api-reference/troubleshooting/comparison): ');
      queries.push({
        id: `manual-${queries.length + 1}`,
        query: newQuery.trim(),
        intent: newIntent.trim(),
        category: (newCategory.trim() || 'code-pattern') as CoreQuery['category'],
      });
    } else if (action === 'q' || action === 'quit') {
      prompt.close();
      console.log('Cancelled without saving.');
      return;
    }
  }

  // Save back
  const sets = listQuerySets();
  const setInfo = sets.find(s => s.name === setName);
  if (setInfo && setName !== 'all') {
    // Backup original
    const backup = readFileSync(setInfo.path, 'utf-8');
    writeFileSync(`${setInfo.path}.bak`, backup);

    querySet.queries = queries;
    writeFileSync(setInfo.path, JSON.stringify(querySet, null, 2));
    console.log(`\n✓ Saved ${queries.length} queries to ${setInfo.path}`);
    console.log(`  Backup: ${setInfo.path}.bak`);
  } else {
    console.log('Cannot save "all" - edits would need to be saved to individual sets.');
  }

  prompt.close();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const showList = args.includes('--list');
  const generateMode = args.includes('--generate');
  const reviewMode = args.includes('--review');
  const setArg = args.find(a => a.startsWith('--set='))?.split('=')[1]
    ?? args[args.indexOf('--set') + 1];

  if (showList || (!generateMode && !reviewMode && !setArg)) {
    const sets = listQuerySets();
    printQuerySets(sets);
    console.log('\nUsage:');
    console.log('  --generate [--set <seed>]   Generate new queries');
    console.log('  --review --set <name|all>   Review existing queries');
    return;
  }

  if (generateMode) {
    await generateQueries(setArg);
  } else if (reviewMode) {
    if (!setArg) {
      console.error('--review requires --set <name|all>');
      process.exit(1);
    }
    await reviewQueries(setArg);
  }
}

main().catch(console.error);
```

**Step 2: Commit**

```bash
git add tests/scripts/quality-queries.ts
git commit -m "feat(tests): add interactive query management script"
```

---

## Task 6: Create Review Script

**Files:**
- Create: `tests/scripts/quality-review.ts`

**Step 1: Create the review script**

```typescript
#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import {
  listRuns,
  printRuns,
  createPrompt,
  formatJudgmentPrompt,
  parseJudgment,
  ROOT_DIR,
} from './quality-shared.js';
import type {
  QueryEvaluation,
  RunSummary,
  HilJudgment,
  HilQueryData,
  HilReviewSummary,
  HIL_JUDGMENT_SCORES,
} from './search-quality.types.js';

const CLAUDE_CLI = process.env.CLAUDE_CLI || `${process.env.HOME}/.claude/local/claude`;

const JUDGMENT_SCORES: Record<HilJudgment, number> = {
  good: 1.0,
  okay: 0.7,
  poor: 0.4,
  terrible: 0.1,
};

interface ParsedRun {
  lines: Array<{ type: string; data?: unknown; timestamp?: string; runId?: string; config?: unknown }>;
  evaluations: QueryEvaluation[];
  summary: RunSummary | null;
}

function parseRunFile(path: string): ParsedRun {
  const content = readFileSync(path, 'utf-8');
  const lines = content.trim().split('\n').map(l => JSON.parse(l));

  const evaluations: QueryEvaluation[] = [];
  let summary: RunSummary | null = null;

  for (const line of lines) {
    if (line.type === 'query_evaluation') {
      evaluations.push(line.data as QueryEvaluation);
    } else if (line.type === 'run_summary') {
      summary = line.data as RunSummary;
    }
  }

  return { lines, evaluations, summary };
}

function shellEscape(str: string): string {
  return `'${str.replace(/'/g, "'\"'\"'")}'`;
}

async function reviewRun(runId: string): Promise<void> {
  const runs = listRuns();
  const run = runs.find(r => r.id === runId);

  if (!run) {
    console.error(`Run not found: ${runId}`);
    console.log('\nAvailable runs:');
    printRuns(runs);
    process.exit(1);
  }

  const prompt = createPrompt();
  const parsed = parseRunFile(run.path);

  console.log(`\n📊 Reviewing run: ${runId}`);
  console.log(`   ${parsed.evaluations.length} queries, overall=${run.overallScore.toFixed(2)}\n`);

  const hilData: Map<number, HilQueryData> = new Map();

  for (let i = 0; i < parsed.evaluations.length; i++) {
    const eval_ = parsed.evaluations[i];
    const progress = `[${i + 1}/${parsed.evaluations.length}]`;

    console.log(`\n${progress} "${eval_.query.query}"`);
    console.log(`  AI overall: ${eval_.evaluation.scores.overall.toFixed(2)}`);
    console.log(`\n  Results returned:`);

    for (const r of eval_.searchResults.slice(0, 5)) {
      console.log(`  → ${r.source}`);
      const snippet = r.snippet.slice(0, 80).replace(/\n/g, ' ');
      console.log(`       "${snippet}${r.snippet.length > 80 ? '...' : ''}"`);
    }

    console.log(`\n  How did the search do?`);
    console.log(`  ${formatJudgmentPrompt()}`);

    const input = await prompt.question('> ');
    const judgment = parseJudgment(input);

    if (judgment === 'skip') {
      hilData.set(i, { reviewed: false });
      continue;
    }

    const hil: HilQueryData = {
      reviewed: true,
      reviewedAt: new Date().toISOString(),
    };

    if (judgment !== 'note') {
      hil.judgment = judgment;
      hil.humanScore = JUDGMENT_SCORES[judgment];
    }

    const note = await prompt.question('  Note (optional): ');
    if (note.trim()) {
      hil.note = note.trim();
    }

    hilData.set(i, hil);
  }

  prompt.close();

  // Calculate summary stats
  const reviewed = [...hilData.values()].filter(h => h.reviewed);
  const scores = reviewed.filter(h => h.humanScore !== undefined).map(h => h.humanScore!);
  const humanAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const flagged = reviewed.filter(h => h.flagged).length;

  // Generate synthesis via Claude
  console.log('\n📝 Generating synthesis...');

  const synthesisPrompt = `Summarize this human review of search quality results:

AI average score: ${run.overallScore.toFixed(2)}
Human average score: ${humanAvg.toFixed(2)}
Queries reviewed: ${reviewed.length}/${parsed.evaluations.length}

Human judgments:
${[...hilData.entries()].filter(([_, h]) => h.reviewed).map(([i, h]) => {
  const q = parsed.evaluations[i].query.query;
  return `- "${q}": ${h.judgment ?? 'note only'}${h.note ? ` - "${h.note}"` : ''}`;
}).join('\n')}

Provide:
1. A 2-3 sentence synthesis of the human feedback
2. 2-4 specific action items for improving search quality

Return as JSON: { "synthesis": "...", "actionItems": ["...", "..."] }`;

  const result = execSync([
    CLAUDE_CLI,
    '-p', shellEscape(synthesisPrompt),
    '--output-format', 'json',
  ].join(' '), {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    timeout: 60000,
  });

  const synthResult = JSON.parse(result);
  const synthesis = synthResult.structured_output ?? JSON.parse(synthResult.result);

  // Build HIL review summary
  const hilReview: HilReviewSummary = {
    reviewedAt: new Date().toISOString(),
    queriesReviewed: reviewed.length,
    queriesSkipped: parsed.evaluations.length - reviewed.length,
    queriesFlagged: flagged,
    humanAverageScore: Math.round(humanAvg * 100) / 100,
    aiVsHumanDelta: Math.round((humanAvg - run.overallScore) * 100) / 100,
    synthesis: synthesis.synthesis,
    actionItems: synthesis.actionItems,
  };

  // Update the JSONL file with HIL data
  const updatedLines = parsed.lines.map((line, idx) => {
    if (line.type === 'query_evaluation') {
      const evalIdx = parsed.lines.slice(0, idx).filter(l => l.type === 'query_evaluation').length;
      const hil = hilData.get(evalIdx);
      if (hil) {
        return { ...line, data: { ...(line.data as object), hil } };
      }
    }
    if (line.type === 'run_summary') {
      return { ...line, data: { ...(line.data as object), hilReview } };
    }
    return line;
  });

  writeFileSync(run.path, updatedLines.map(l => JSON.stringify(l)).join('\n') + '\n');

  console.log(`\n✓ Review saved to ${run.path}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Human avg: ${humanAvg.toFixed(2)} (AI: ${run.overallScore.toFixed(2)}, delta: ${hilReview.aiVsHumanDelta >= 0 ? '+' : ''}${hilReview.aiVsHumanDelta.toFixed(2)})`);
  console.log(`   ${hilReview.synthesis}`);
  console.log(`\n🎯 Action items:`);
  hilReview.actionItems.forEach((item, i) => console.log(`   ${i + 1}. ${item}`));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const showList = args.includes('--list');
  const runId = args.find(a => !a.startsWith('--'));

  if (showList || !runId) {
    const runs = listRuns();
    printRuns(runs);
    console.log('\nUsage: npm run test:quality:review -- <run-id>');
    return;
  }

  await reviewRun(runId);
}

main().catch(console.error);
```

**Step 2: Commit**

```bash
git add tests/scripts/quality-review.ts
git commit -m "feat(tests): add post-run HIL review script"
```

---

## Task 7: Update package.json Scripts

**Files:**
- Modify: `package.json`

**Step 1: Add new npm scripts**

Find the scripts section and update:

```json
"scripts": {
  "build": "tsup",
  "dev": "tsup --watch",
  "start": "node dist/index.js",
  "test": "vitest",
  "test:run": "vitest run",
  "test:corpus:index": "npx tsx tests/scripts/corpus-index.ts",
  "test:quality": "npx tsx tests/scripts/search-quality.ts",
  "test:quality:explore": "npx tsx tests/scripts/search-quality.ts --explore",
  "test:quality:baseline": "npx tsx tests/scripts/search-quality.ts --update-baseline",
  "test:quality:queries": "npx tsx tests/scripts/quality-queries.ts",
  "test:quality:generate": "npx tsx tests/scripts/quality-queries.ts --generate",
  "test:quality:review": "npx tsx tests/scripts/quality-review.ts",
  "lint": "eslint src/",
  "typecheck": "tsc --noEmit"
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add HIL quality testing npm scripts"
```

---

## Task 8: Integration Test

**Step 1: Test query listing**

```bash
npm run test:quality:queries
```

Expected: Shows available query sets

**Step 2: Test verbose output**

```bash
npm run test:quality -- --quiet --set core
```

Expected: Runs with summary output per query

**Step 3: Test run listing**

```bash
npm run test:quality:review -- --list
```

Expected: Shows recent test runs

**Step 4: Final commit**

```bash
git add -A
git commit -m "test: verify HIL quality testing integration"
```
