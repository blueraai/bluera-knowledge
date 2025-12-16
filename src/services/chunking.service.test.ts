import { describe, it, expect } from 'vitest';
import { ChunkingService } from './chunking.service.js';

describe('ChunkingService', () => {
  const chunker = new ChunkingService({ chunkSize: 100, chunkOverlap: 20 });

  it('splits text into chunks', () => {
    const text = 'A'.repeat(250);
    const chunks = chunker.chunk(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(c => c.content.length <= 100)).toBe(true);
  });

  it('preserves overlap between chunks', () => {
    const text = 'word '.repeat(50); // 250 chars
    const chunks = chunker.chunk(text);
    if (chunks.length >= 2) {
      const end1 = chunks[0]!.content.slice(-20);
      const start2 = chunks[1]!.content.slice(0, 20);
      expect(end1).toBe(start2);
    }
  });

  it('returns single chunk for small text', () => {
    const text = 'small text';
    const chunks = chunker.chunk(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.content).toBe(text);
  });

  it('assigns chunk indices', () => {
    const text = 'A'.repeat(300);
    const chunks = chunker.chunk(text);
    expect(chunks[0]!.chunkIndex).toBe(0);
    expect(chunks[1]!.chunkIndex).toBe(1);
    expect(chunks.every(c => c.totalChunks === chunks.length)).toBe(true);
  });
});
