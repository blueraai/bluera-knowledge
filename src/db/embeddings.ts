import { homedir } from 'node:os';
import { join } from 'node:path';
import { pipeline, env, type FeatureExtractionPipeline } from '@huggingface/transformers';

// Set cache directory to ~/.cache/huggingface-transformers (outside node_modules)
// This allows CI caching and prevents model re-downloads on each npm install
env.cacheDir = join(homedir(), '.cache', 'huggingface-transformers');

export class EmbeddingEngine {
  private extractor: FeatureExtractionPipeline | null = null;
  // eslint-disable-next-line @typescript-eslint/prefer-readonly -- mutated in embed()
  private _dimensions: number | null = null;
  private readonly modelName: string;
  private readonly batchSize: number;

  constructor(modelName = 'Xenova/all-MiniLM-L6-v2', batchSize = 32) {
    this.modelName = modelName;
    this.batchSize = batchSize;
  }

  async initialize(): Promise<void> {
    if (this.extractor !== null) return;
    // @ts-expect-error TS2590: TypeScript can't represent the complex union type from pipeline()
    // This is a known limitation with @huggingface/transformers overloaded signatures
    this.extractor = await pipeline('feature-extraction', this.modelName, {
      dtype: 'fp32',
    });
  }

  async embed(text: string): Promise<number[]> {
    if (this.extractor === null) {
      await this.initialize();
    }
    if (this.extractor === null) {
      throw new Error('Failed to initialize embedding model');
    }
    const output = await this.extractor(text, {
      pooling: 'mean',
      normalize: true,
    });
    const result = Array.from(output.data);
    // Cache dimensions from first embedding result
    this._dimensions ??= result.length;
    return result.map((v) => Number(v));
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);

      // Process batch in parallel using Promise.all
      const batchResults = await Promise.all(batch.map((text) => this.embed(text)));

      results.push(...batchResults);

      // Small delay between batches to prevent memory issues
      if (i + this.batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get cached embedding dimensions. Throws if embed() hasn't been called yet.
   * Use ensureDimensions() if you need to guarantee dimensions are available.
   */
  getDimensions(): number {
    if (this._dimensions === null) {
      throw new Error('Cannot get dimensions before first embed() call');
    }
    return this._dimensions;
  }

  /**
   * Ensure dimensions are available, initializing the model if needed.
   * Returns the embedding dimensions for the current model.
   */
  async ensureDimensions(): Promise<number> {
    if (this._dimensions === null) {
      // Embed empty string to determine dimensions
      await this.embed('');
    }
    if (this._dimensions === null) {
      throw new Error('Failed to determine embedding dimensions');
    }
    return this._dimensions;
  }

  /**
   * Dispose the embedding pipeline to free resources.
   * Should be called before process exit to prevent ONNX runtime cleanup issues on macOS.
   */
  async dispose(): Promise<void> {
    if (this.extractor !== null) {
      await this.extractor.dispose();
      this.extractor = null;
    }
  }
}
