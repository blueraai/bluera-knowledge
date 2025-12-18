import { Command } from 'commander';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { GlobalOptions } from '../program.js';

// ============================================================================
// Types (subset from tests/scripts/search-quality.types.ts)
// ============================================================================

interface Scores {
  relevance: number;
  ranking: number;
  coverage: number;
  snippetQuality: number;
  overall: number;
}

interface QueryEvaluation {
  timestamp: string;
  query: { id?: string; query: string; intent: string };
  searchResults: Array<{ source: string; snippet: string }>;
  evaluation: { scores: Scores };
  searchTimeMs: number;
}

interface RunSummary {
  timestamp: string;
  runId: string;
  config: { querySet: string; searchMode: string };
  totalQueries: number;
  averageScores: Scores;
  topSuggestions: string[];
  totalTimeMs: number;
  hilReview?: {
    humanAverageScore: number;
    aiVsHumanDelta: number;
    queriesReviewed: number;
    synthesis?: string;
  };
}

interface QuerySet {
  version: string;
  description: string;
  queries: Array<{ id: string; query: string; category: string }>;
  source?: 'curated' | 'ai-generated';
}

interface ParsedRun {
  runStart: { timestamp: string; runId: string; config: Record<string, unknown> };
  evaluations: QueryEvaluation[];
  summary: RunSummary | null;
}

interface QuerySetInfo {
  name: string;
  path: string;
  queryCount: number;
  source: 'curated' | 'ai-generated';
  version?: string;
}

interface RunInfo {
  id: string;
  path: string;
  querySet: string;
  queryCount: number;
  overallScore: number;
  hasHilReview: boolean;
  timestamp: string;
}

// ============================================================================
// Box-drawing table utilities
// ============================================================================

const BOX = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  leftT: '├',
  rightT: '┤',
  topT: '┬',
  bottomT: '┴',
  cross: '┼',
};

const BAR = {
  filled: '█',
  empty: '░',
};

interface Column {
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

interface TableConfig {
  title?: string;
  columns: Column[];
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + '...';
}

function pad(str: string, width: number, align: 'left' | 'right' | 'center' = 'left'): string {
  const truncated = truncate(str, width);
  const padding = width - truncated.length;
  if (padding <= 0) return truncated;

  switch (align) {
    case 'right':
      return ' '.repeat(padding) + truncated;
    case 'center':
      const left = Math.floor(padding / 2);
      return ' '.repeat(left) + truncated + ' '.repeat(padding - left);
    default:
      return truncated + ' '.repeat(padding);
  }
}

function drawLine(widths: number[], left: string, mid: string, right: string): string {
  const segments = widths.map(w => BOX.horizontal.repeat(w + 2));
  return left + segments.join(mid) + right;
}

function drawRow(cells: string[], widths: number[], aligns: ('left' | 'right' | 'center')[]): string {
  const padded = cells.map((cell, i) => pad(cell, widths[i] ?? 10, aligns[i] ?? 'left'));
  return BOX.vertical + ' ' + padded.join(' ' + BOX.vertical + ' ') + ' ' + BOX.vertical;
}

function drawTable(config: TableConfig, rows: string[][]): string {
  const widths = config.columns.map(c => c.width);
  const aligns = config.columns.map(c => c.align || 'left');
  const headers = config.columns.map(c => c.header);

  const lines: string[] = [];

  if (config.title) {
    const totalWidth = widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * 3 + 4;
    lines.push(drawLine(widths, BOX.topLeft, BOX.topT, BOX.topRight));
    lines.push(BOX.vertical + ' ' + pad(config.title, totalWidth - 4, 'left') + ' ' + BOX.vertical);
    lines.push(drawLine(widths, BOX.leftT, BOX.cross, BOX.rightT));
  } else {
    lines.push(drawLine(widths, BOX.topLeft, BOX.topT, BOX.topRight));
  }

  lines.push(drawRow(headers, widths, aligns));
  lines.push(drawLine(widths, BOX.leftT, BOX.cross, BOX.rightT));

  for (const row of rows) {
    lines.push(drawRow(row, widths, aligns));
  }

  lines.push(drawLine(widths, BOX.bottomLeft, BOX.bottomT, BOX.bottomRight));

  return lines.join('\n');
}

function drawBox(title: string, lines: string[], width: number): string {
  const output: string[] = [];

  output.push(BOX.topLeft + BOX.horizontal.repeat(width - 2) + BOX.topRight);
  output.push(BOX.vertical + ' ' + pad(title, width - 4) + ' ' + BOX.vertical);
  output.push(BOX.leftT + BOX.horizontal.repeat(width - 2) + BOX.rightT);

  for (const line of lines) {
    output.push(BOX.vertical + ' ' + pad(line, width - 4) + ' ' + BOX.vertical);
  }

  output.push(BOX.bottomLeft + BOX.horizontal.repeat(width - 2) + BOX.bottomRight);

  return output.join('\n');
}

function drawBar(value: number, max: number = 1, width: number = 40): string {
  const ratio = Math.min(Math.max(value / max, 0), 1);
  const filled = Math.round(ratio * width);
  return BAR.filled.repeat(filled) + BAR.empty.repeat(width - filled);
}

function formatScore(score: number, decimals: number = 2): string {
  return score.toFixed(decimals);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m${remaining}s`;
}

function getTrend(current: number, previous: number): string {
  const delta = current - previous;
  if (Math.abs(delta) < 0.005) return '  —';
  const sign = delta > 0 ? '▲' : '▼';
  return `${sign} ${delta > 0 ? '+' : ''}${delta.toFixed(2)}`;
}

function shortPath(fullPath: string, maxLen: number = 20): string {
  const match = fullPath.match(/corpus\/(.+)/);
  if (match && match[1]) {
    return truncate(match[1], maxLen);
  }
  const parts = fullPath.split('/');
  return truncate(parts[parts.length - 1] ?? fullPath, maxLen);
}

// ============================================================================
// Path helpers - find test directories from project root
// ============================================================================

function getProjectRoot(): string {
  // Start from cwd and look for package.json
  let dir = process.cwd();
  while (dir !== '/') {
    if (existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    dir = join(dir, '..');
  }
  return process.cwd();
}

function getResultsDir(): string {
  return join(getProjectRoot(), 'tests', 'quality-results');
}

function getQueriesDir(): string {
  return join(getProjectRoot(), 'tests', 'fixtures', 'queries');
}

function getCorpusDir(): string {
  return join(getProjectRoot(), 'tests', 'fixtures', 'corpus');
}

// ============================================================================
// Data Loading Helpers
// ============================================================================

function parseRunFile(path: string): ParsedRun {
  const content = readFileSync(path, 'utf-8');
  const lines = content.trim().split('\n').map(l => JSON.parse(l));

  const evaluations: QueryEvaluation[] = [];
  let summary: RunSummary | null = null;
  let runStart: ParsedRun['runStart'] = { timestamp: '', runId: '', config: {} };

  for (const line of lines) {
    if (line.type === 'run_start') {
      runStart = { timestamp: line.timestamp, runId: line.runId, config: line.config };
    } else if (line.type === 'query_evaluation') {
      evaluations.push(line.data as QueryEvaluation);
    } else if (line.type === 'run_summary') {
      summary = line.data as RunSummary;
    }
  }

  return { runStart, evaluations, summary };
}

function countFilesRecursive(dir: string): number {
  if (!existsSync(dir)) return 0;
  let count = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += countFilesRecursive(join(dir, entry.name));
    } else if (!entry.name.startsWith('.')) {
      count++;
    }
  }
  return count;
}

function listQuerySets(): QuerySetInfo[] {
  const sets: QuerySetInfo[] = [];
  const queriesDir = getQueriesDir();

  // Curated sets (top-level .json files)
  if (existsSync(queriesDir)) {
    const files = readdirSync(queriesDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const path = join(queriesDir, file);
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
  const generatedDir = join(queriesDir, 'generated');
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

function loadQuerySet(name: string): QuerySet {
  const sets = listQuerySets();
  const set = sets.find(s => s.name === name);
  if (!set) {
    throw new Error(`Query set not found: ${name}`);
  }
  return JSON.parse(readFileSync(set.path, 'utf-8')) as QuerySet;
}

function listRuns(): RunInfo[] {
  const runs: RunInfo[] = [];
  const resultsDir = getResultsDir();

  if (!existsSync(resultsDir)) return runs;

  const files = readdirSync(resultsDir)
    .filter(f => f.endsWith('.jsonl'))
    .sort()
    .reverse();

  for (const file of files) {
    const path = join(resultsDir, file);
    const lines = readFileSync(path, 'utf-8').trim().split('\n');

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

// ============================================================================
// Display Commands
// ============================================================================

function showCorpus(): void {
  const corpusDir = getCorpusDir();
  const versionPath = join(corpusDir, 'VERSION.md');
  let version = 'unknown';
  let updated = 'unknown';

  if (existsSync(versionPath)) {
    const content = readFileSync(versionPath, 'utf-8');
    const versionMatch = content.match(/Current Version:\s*(\S+)/);
    const updatedMatch = content.match(/Last Updated\s*\n(\d{4}-\d{2}-\d{2})/);
    if (versionMatch && versionMatch[1]) version = versionMatch[1];
    if (updatedMatch && updatedMatch[1]) updated = updatedMatch[1];
  }

  const directories = [
    { name: 'oss-repos/vue', desc: 'Vue.js core (full repo)' },
    { name: 'oss-repos/express', desc: 'Express.js (full repo)' },
    { name: 'oss-repos/hono', desc: 'Hono (full repo)' },
    { name: 'documentation', desc: 'Express/Node excerpts' },
    { name: 'articles', desc: 'React, TypeScript, JWT' },
  ];

  const rows: string[][] = [];
  let totalFiles = 0;

  for (const dir of directories) {
    const path = join(corpusDir, dir.name);
    const count = countFilesRecursive(path);
    totalFiles += count;
    rows.push([dir.name, `${count} files`, dir.desc]);
  }

  console.log();
  console.log(drawTable({
    title: `Corpus v${version}                             Updated: ${updated}`,
    columns: [
      { header: 'Directory', width: 18 },
      { header: 'Files', width: 10, align: 'right' },
      { header: 'Description', width: 30 },
    ],
  }, rows));

  console.log(`\n  Total: ${totalFiles} files indexed\n`);
}

function showQueries(verbose: boolean = false): void {
  const sets = listQuerySets();

  if (sets.length === 0) {
    console.log('\n  No query sets found.\n');
    return;
  }

  if (!verbose) {
    const rows = sets.map(s => [
      s.name,
      String(s.queryCount),
      `${s.source === 'curated' ? 'Curated' : 'AI-generated'} (v${s.version || '?'})`,
    ]);

    console.log();
    console.log(drawTable({
      title: 'Query Sets',
      columns: [
        { header: 'Name', width: 20 },
        { header: 'Count', width: 6, align: 'right' },
        { header: 'Source', width: 35 },
      ],
    }, rows));

    for (const set of sets.filter(s => s.source === 'curated')) {
      const data = loadQuerySet(set.name);
      const categories: Record<string, number> = {};
      for (const q of data.queries) {
        categories[q.category] = (categories[q.category] || 0) + 1;
      }

      const breakdown = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, count]) => `${cat} (${count})`)
        .join(', ');

      console.log(`\n  ${set.name} categories: ${breakdown}`);
    }
    console.log();
  } else {
    for (const set of sets) {
      const data = loadQuerySet(set.name);

      const rows = data.queries.map(q => [
        q.id,
        q.category,
        truncate(q.query, 50),
      ]);

      console.log();
      console.log(drawTable({
        title: `${set.name} (${data.queries.length} queries)`,
        columns: [
          { header: 'ID', width: 12 },
          { header: 'Category', width: 14 },
          { header: 'Query', width: 50 },
        ],
      }, rows));
    }
    console.log();
  }
}

function showRuns(): void {
  const runs = listRuns();

  if (runs.length === 0) {
    console.log('\n  No test runs found.\n');
    return;
  }

  const rows = runs.slice(0, 15).map(r => {
    const parsed = parseRunFile(r.path);
    const scores = parsed.summary?.averageScores;

    const scoreStr = scores
      ? `${formatScore(scores.relevance)}/${formatScore(scores.ranking)}/${formatScore(scores.coverage)}/${formatScore(scores.snippetQuality)}`
      : '—';

    return [
      r.id,
      String(r.queryCount),
      formatScore(r.overallScore),
      scoreStr,
      r.hasHilReview ? '✓ reviewed' : '—',
    ];
  });

  console.log();
  console.log(drawTable({
    title: `Test Runs                                              (${runs.length} total)`,
    columns: [
      { header: 'Run ID', width: 21 },
      { header: 'Queries', width: 7, align: 'right' },
      { header: 'Overall', width: 7, align: 'right' },
      { header: 'Scores (R/Rk/C/S)', width: 20 },
      { header: 'HIL Status', width: 12 },
    ],
  }, rows));

  console.log('\n  Legend: R=Relevance, Rk=Ranking, C=Coverage, S=SnippetQuality');

  const baselinePath = join(getResultsDir(), 'baseline.json');
  if (existsSync(baselinePath)) {
    const baseline = JSON.parse(readFileSync(baselinePath, 'utf-8'));
    console.log(`  Baseline: ${formatScore(baseline.scores?.overall || 0)} overall (set ${baseline.updatedAt?.slice(0, 10) || 'unknown'})`);
  }
  console.log();
}

function showRunDetail(runId: string): void {
  const runs = listRuns();
  const run = runs.find(r => r.id === runId || r.id.includes(runId));

  if (!run) {
    console.log(`\n  Run not found: ${runId}`);
    console.log('  Available runs:');
    runs.slice(0, 5).forEach(r => console.log(`    ${r.id}`));
    console.log();
    return;
  }

  const parsed = parseRunFile(run.path);
  const summary = parsed.summary;

  if (!summary) {
    console.log(`\n  Run ${run.id} has no summary data.\n`);
    return;
  }

  const scores = summary.averageScores;
  const config = summary.config;

  console.log();
  const headerLines = [
    `Overall: ${formatScore(scores.overall)}   Duration: ${formatDuration(summary.totalTimeMs)}   Queries: ${summary.totalQueries}   Query Set: ${config.querySet}`,
  ];

  console.log(drawBox(`Run: ${run.id}`, headerLines, 80));

  console.log();
  console.log('  Scores by Dimension:');
  console.log(`  ${drawBar(scores.relevance, 1, 30)} Relevance      ${formatScore(scores.relevance)}`);
  console.log(`  ${drawBar(scores.ranking, 1, 30)} Ranking        ${formatScore(scores.ranking)}`);
  console.log(`  ${drawBar(scores.coverage, 1, 30)} Coverage       ${formatScore(scores.coverage)}`);
  console.log(`  ${drawBar(scores.snippetQuality, 1, 30)} SnippetQual    ${formatScore(scores.snippetQuality)}`);

  const sortedEvals = [...parsed.evaluations].sort(
    (a, b) => b.evaluation.scores.overall - a.evaluation.scores.overall
  );

  const rows = sortedEvals.map(e => {
    const topResult = e.searchResults[0];
    return [
      e.query.id || '—',
      formatScore(e.evaluation.scores.overall),
      truncate(e.query.query, 40),
      topResult ? shortPath(topResult.source, 14) : '—',
    ];
  });

  console.log();
  console.log(drawTable({
    title: 'Query Results (sorted by score)',
    columns: [
      { header: 'ID', width: 12 },
      { header: 'Score', width: 6, align: 'right' },
      { header: 'Query', width: 40 },
      { header: 'Top Result', width: 14 },
    ],
  }, rows));

  if (summary.topSuggestions && summary.topSuggestions.length > 0) {
    console.log('\n  Top Suggestions:');
    summary.topSuggestions.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. ${truncate(s, 75)}`);
    });
  }

  const hilReview = summary.hilReview;
  if (hilReview) {
    console.log('\n  HIL Review:');
    console.log(`    Human avg: ${formatScore(hilReview.humanAverageScore)} (AI: ${formatScore(scores.overall)}, delta: ${hilReview.aiVsHumanDelta >= 0 ? '+' : ''}${formatScore(hilReview.aiVsHumanDelta)})`);
    console.log(`    Queries reviewed: ${hilReview.queriesReviewed}/${summary.totalQueries}`);
    if (hilReview.synthesis) {
      console.log(`    Summary: ${truncate(hilReview.synthesis, 70)}`);
    }
  }

  console.log();
}

function showQueryPerformance(queryId: string): void {
  const runs = listRuns();

  if (runs.length === 0) {
    console.log('\n  No test runs found.\n');
    return;
  }

  const queryData: Array<{
    runId: string;
    timestamp: string;
    scores: Scores;
    topResult: string;
  }> = [];

  for (const run of runs) {
    const parsed = parseRunFile(run.path);
    const evaluation = parsed.evaluations.find(
      e => e.query.id === queryId || (e.query.id && e.query.id.includes(queryId))
    );

    if (evaluation) {
      queryData.push({
        runId: run.id,
        timestamp: run.timestamp,
        scores: evaluation.evaluation.scores,
        topResult: evaluation.searchResults[0]?.source || '—',
      });
    }
  }

  if (queryData.length === 0) {
    console.log(`\n  Query not found: ${queryId}`);

    const firstRunInfo = runs[0];
    if (firstRunInfo) {
      const parsed = parseRunFile(firstRunInfo.path);
      console.log('  Available queries in latest run:');
      parsed.evaluations.slice(0, 10).forEach(e => {
        console.log(`    ${e.query.id || 'unnamed'}: ${truncate(e.query.query, 50)}`);
      });
    }
    console.log();
    return;
  }

  const matchingRun = runs.find(r => r.id === queryData[0]?.runId);
  if (!matchingRun) {
    console.log(`\n  Could not find run data.\n`);
    return;
  }
  const firstRun = parseRunFile(matchingRun.path);
  const queryEval = firstRun.evaluations.find(e => e.query.id === queryId || e.query.id?.includes(queryId));
  const queryText = queryEval?.query.query || queryId;

  console.log();
  console.log(`  Query: ${queryId}`);
  console.log(`  "${truncate(queryText, 70)}"`);
  console.log();

  const rows = queryData.map((d, i) => {
    const prev = queryData[i + 1];
    const trend = prev ? getTrend(d.scores.overall, prev.scores.overall) : '—';

    return [
      d.runId.slice(0, 19),
      formatScore(d.scores.overall),
      formatScore(d.scores.relevance),
      formatScore(d.scores.ranking),
      shortPath(d.topResult, 18),
      trend,
    ];
  });

  console.log(drawTable({
    title: `Performance History (${queryData.length} runs)`,
    columns: [
      { header: 'Run', width: 19 },
      { header: 'Overall', width: 7, align: 'right' },
      { header: 'Rel', width: 5, align: 'right' },
      { header: 'Rank', width: 5, align: 'right' },
      { header: 'Top Result', width: 18 },
      { header: 'Trend', width: 8 },
    ],
  }, rows));

  console.log();
}

function showTrends(limit: number = 10): void {
  const runs = listRuns().slice(0, limit);

  if (runs.length < 2) {
    console.log('\n  Need at least 2 runs to show trends.\n');
    return;
  }

  const trendData: Array<{
    runId: string;
    scores: Scores;
  }> = [];

  for (const run of runs) {
    const parsed = parseRunFile(run.path);
    if (parsed.summary) {
      trendData.push({
        runId: run.id,
        scores: parsed.summary.averageScores,
      });
    }
  }

  const rows = trendData.map((d, i) => {
    const prev = trendData[i + 1];
    const trend = prev ? getTrend(d.scores.overall, prev.scores.overall) : 'baseline';

    return [
      d.runId.replace('T', ' ').slice(0, 16),
      formatScore(d.scores.overall),
      formatScore(d.scores.relevance),
      formatScore(d.scores.ranking),
      formatScore(d.scores.coverage),
      trend,
    ];
  });

  console.log();
  console.log(drawTable({
    title: `Score Trends (last ${trendData.length} runs)`,
    columns: [
      { header: 'Date', width: 16 },
      { header: 'Overall', width: 7, align: 'right' },
      { header: 'Rel', width: 5, align: 'right' },
      { header: 'Rank', width: 5, align: 'right' },
      { header: 'Cov', width: 5, align: 'right' },
      { header: 'Trend', width: 10 },
    ],
  }, rows));

  const firstEntry = trendData[trendData.length - 1];
  const lastEntry = trendData[0];
  if (trendData.length >= 2 && firstEntry && lastEntry) {
    const first = firstEntry.scores.overall;
    const last = lastEntry.scores.overall;
    const delta = last - first;
    const pct = ((delta / first) * 100).toFixed(1);

    console.log();
    console.log(`  Overall trend: ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} (${delta >= 0 ? '+' : ''}${pct}%) over ${trendData.length} runs`);
  }

  console.log();
}

// ============================================================================
// Command Factory
// ============================================================================

export function createQualityCommand(_getOptions: () => GlobalOptions): Command {
  const quality = new Command('quality')
    .description('View search quality test results and metrics');

  quality
    .command('corpus')
    .description('Show corpus/fixtures info')
    .action(() => {
      showCorpus();
    });

  quality
    .command('queries')
    .description('Show query sets')
    .option('-v, --verbose', 'Show all queries in detail')
    .action((options: { verbose?: boolean }) => {
      showQueries(options.verbose);
    });

  quality
    .command('runs')
    .description('Show test runs overview')
    .action(() => {
      showRuns();
    });

  quality
    .command('run <id>')
    .description('Show detailed run results')
    .action((id: string) => {
      showRunDetail(id);
    });

  quality
    .command('query <id>')
    .description('Show query performance across runs')
    .action((id: string) => {
      showQueryPerformance(id);
    });

  quality
    .command('trends')
    .description('Show score trends over time')
    .option('-l, --limit <n>', 'Number of runs to show', '10')
    .action((options: { limit?: string }) => {
      showTrends(parseInt(options.limit || '10', 10));
    });

  return quality;
}
