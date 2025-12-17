import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { randomUUID } from 'node:crypto';

interface CrawlResult {
  pages: Array<{
    url: string;
    title: string;
    content: string;
    links: string[];
    crawledAt: string;
  }>;
}

export class PythonBridge {
  private process: ChildProcess | null = null;
  private pending: Map<string, { resolve: (v: CrawlResult) => void; reject: (e: Error) => void; timeout: NodeJS.Timeout }> = new Map();

  async start(): Promise<void> {
    if (this.process) return;

    this.process = spawn('python3', ['python/crawl_worker.py'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Add error handler for process spawn errors
    this.process.on('error', (err) => {
      console.error('Python bridge process error:', err);
      this.rejectAllPending(new Error(`Process error: ${err.message}`));
    });

    // Add exit handler to detect non-zero exits
    this.process.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error(`Python bridge process exited with code ${code}`);
        this.rejectAllPending(new Error(`Process exited with code ${code}`));
      } else if (signal) {
        console.error(`Python bridge process killed with signal ${signal}`);
        this.rejectAllPending(new Error(`Process killed with signal ${signal}`));
      }
      this.process = null;
    });

    // Add stderr logging
    if (this.process.stderr) {
      const stderrRl = createInterface({ input: this.process.stderr });
      stderrRl.on('line', (line) => {
        console.error('Python bridge stderr:', line);
      });
    }

    const rl = createInterface({ input: this.process.stdout! });
    rl.on('line', (line) => {
      try {
        const response = JSON.parse(line);
        const pending = this.pending.get(response.id);
        if (pending) {
          clearTimeout(pending.timeout);
          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
          this.pending.delete(response.id);
        }
      } catch (err) {
        console.error('Failed to parse JSON response from Python bridge:', err, 'Line:', line);
      }
    });
  }

  async crawl(url: string, timeoutMs: number = 30000): Promise<CrawlResult> {
    if (!this.process) await this.start();

    const id = randomUUID();
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'crawl',
      params: { url },
    };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        const pending = this.pending.get(id);
        if (pending) {
          this.pending.delete(id);
          reject(new Error(`Crawl timeout after ${timeoutMs}ms for URL: ${url}`));
        }
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timeout });
      this.process!.stdin!.write(JSON.stringify(request) + '\n');
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.rejectAllPending(new Error('Python bridge stopped'));
      this.process.kill();
      this.process = null;
    }
  }

  private rejectAllPending(error: Error): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
  }
}
