export interface ChunkConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export interface Chunk {
  content: string;
  chunkIndex: number;
  totalChunks: number;
  startOffset: number;
  endOffset: number;
}

export class ChunkingService {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(config: ChunkConfig) {
    this.chunkSize = config.chunkSize;
    this.chunkOverlap = config.chunkOverlap;
  }

  chunk(text: string): Chunk[] {
    if (text.length <= this.chunkSize) {
      return [{
        content: text,
        chunkIndex: 0,
        totalChunks: 1,
        startOffset: 0,
        endOffset: text.length,
      }];
    }

    const chunks: Chunk[] = [];
    const step = this.chunkSize - this.chunkOverlap;
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      chunks.push({
        content: text.slice(start, end),
        chunkIndex: chunks.length,
        totalChunks: 0, // Will be set after
        startOffset: start,
        endOffset: end,
      });
      start += step;
      if (end === text.length) break;
    }

    // Set totalChunks
    for (const chunk of chunks) {
      chunk.totalChunks = chunks.length;
    }

    return chunks;
  }
}
