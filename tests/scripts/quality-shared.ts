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
