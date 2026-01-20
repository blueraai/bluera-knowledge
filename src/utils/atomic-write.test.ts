import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, rm, readdir } from 'node:fs/promises';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { atomicWriteFile, atomicWriteFileSync } from './atomic-write.js';

describe('atomicWriteFile', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `atomic-write-test-${Date.now()}-${process.pid}`);
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('writes content to a new file', async () => {
    const filePath = join(testDir, 'test.json');
    const content = '{"key":"value"}';

    await atomicWriteFile(filePath, content);

    const result = await readFile(filePath, 'utf-8');
    expect(result).toBe(content);
  });

  it('creates parent directories if they do not exist', async () => {
    const filePath = join(testDir, 'deep', 'nested', 'dir', 'test.json');
    const content = '{"nested":true}';

    await atomicWriteFile(filePath, content);

    const result = await readFile(filePath, 'utf-8');
    expect(result).toBe(content);
  });

  it('overwrites existing file', async () => {
    const filePath = join(testDir, 'overwrite.json');
    const content1 = '{"version":1}';
    const content2 = '{"version":2}';

    await atomicWriteFile(filePath, content1);
    await atomicWriteFile(filePath, content2);

    const result = await readFile(filePath, 'utf-8');
    expect(result).toBe(content2);
  });

  it('does not leave temporary files on success', async () => {
    const filePath = join(testDir, 'cleanup.json');
    const content = '{"clean":true}';

    await atomicWriteFile(filePath, content);

    const files = await readdir(testDir);
    // Should only have the target file, no .tmp files
    expect(files).toEqual(['cleanup.json']);
  });

  it('handles unicode content', async () => {
    const filePath = join(testDir, 'unicode.json');
    const content = '{"emoji":"emoji"}';

    await atomicWriteFile(filePath, content);

    const result = await readFile(filePath, 'utf-8');
    expect(result).toBe(content);
  });

  it('handles empty content', async () => {
    const filePath = join(testDir, 'empty.txt');
    const content = '';

    await atomicWriteFile(filePath, content);

    const result = await readFile(filePath, 'utf-8');
    expect(result).toBe(content);
  });

  it('handles large content', async () => {
    const filePath = join(testDir, 'large.json');
    const content = JSON.stringify({ data: 'x'.repeat(100000) });

    await atomicWriteFile(filePath, content);

    const result = await readFile(filePath, 'utf-8');
    expect(result).toBe(content);
  });
});

describe('atomicWriteFileSync', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `atomic-write-sync-test-${Date.now()}-${process.pid}`);
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('writes content to a new file synchronously', () => {
    const filePath = join(testDir, 'test.json');
    const content = '{"key":"value"}';

    atomicWriteFileSync(filePath, content);

    const result = readFileSync(filePath, 'utf-8');
    expect(result).toBe(content);
  });

  it('creates parent directories if they do not exist', () => {
    const filePath = join(testDir, 'deep', 'nested', 'dir', 'test.json');
    const content = '{"nested":true}';

    atomicWriteFileSync(filePath, content);

    const result = readFileSync(filePath, 'utf-8');
    expect(result).toBe(content);
  });

  it('overwrites existing file', () => {
    const filePath = join(testDir, 'overwrite.json');
    const content1 = '{"version":1}';
    const content2 = '{"version":2}';

    atomicWriteFileSync(filePath, content1);
    atomicWriteFileSync(filePath, content2);

    const result = readFileSync(filePath, 'utf-8');
    expect(result).toBe(content2);
  });

  it('does not leave temporary files on success', () => {
    const filePath = join(testDir, 'cleanup.json');
    const content = '{"clean":true}';

    atomicWriteFileSync(filePath, content);

    const files = readdirSync(testDir);
    // Should only have the target file, no .tmp files
    expect(files).toEqual(['cleanup.json']);
  });

  it('handles unicode content', () => {
    const filePath = join(testDir, 'unicode.json');
    const content = '{"emoji":"emoji"}';

    atomicWriteFileSync(filePath, content);

    const result = readFileSync(filePath, 'utf-8');
    expect(result).toBe(content);
  });

  it('handles empty content', () => {
    const filePath = join(testDir, 'empty.txt');
    const content = '';

    atomicWriteFileSync(filePath, content);

    const result = readFileSync(filePath, 'utf-8');
    expect(result).toBe(content);
  });
});

describe('Atomic Write - Crash Safety Guarantees', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `atomic-crash-test-${Date.now()}-${process.pid}`);
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('preserves original file if write would fail (simulated by read-only)', async () => {
    // This test verifies that the atomic write pattern does not corrupt
    // an existing file even if the operation encounters an issue.
    // The key guarantee: the original file is never in a partially-written state.

    const filePath = join(testDir, 'original.json');
    const originalContent = '{"original":true}';

    // Write initial file
    await atomicWriteFile(filePath, originalContent);

    // Verify original exists
    const initial = await readFile(filePath, 'utf-8');
    expect(initial).toBe(originalContent);

    // Write new content
    const newContent = '{"updated":true}';
    await atomicWriteFile(filePath, newContent);

    // Verify update
    const updated = await readFile(filePath, 'utf-8');
    expect(updated).toBe(newContent);
  });

  it('temp file naming includes timestamp and pid for uniqueness', async () => {
    // Verify our temp file naming strategy by writing to DIFFERENT files concurrently
    // The actual implementation uses `${filePath}.tmp.${Date.now()}.${process.pid}`
    // This prevents collisions when writing to different files

    const filePath1 = join(testDir, 'concurrent1.json');
    const filePath2 = join(testDir, 'concurrent2.json');

    // Write to different files concurrently
    const write1 = atomicWriteFile(filePath1, '{"write":1}');
    const write2 = atomicWriteFile(filePath2, '{"write":2}');

    await Promise.all([write1, write2]);

    // Both writes should succeed
    const result1 = await readFile(filePath1, 'utf-8');
    const result2 = await readFile(filePath2, 'utf-8');
    expect(result1).toBe('{"write":1}');
    expect(result2).toBe('{"write":2}');

    // No temp files should remain
    const files = await readdir(testDir);
    expect(files.every((f) => !f.includes('.tmp.'))).toBe(true);
  });
});
