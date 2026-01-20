import { serve } from '@hono/node-server';
import { Command } from 'commander';
import { createApp } from '../../server/app.js';
import { createServices, destroyServices } from '../../services/index.js';
import type { GlobalOptions } from '../program.js';

export function createServeCommand(getOptions: () => GlobalOptions): Command {
  return new Command('serve')
    .description('Start HTTP API server for programmatic search access')
    .option('-p, --port <port>', 'Port to listen on (default: 3847)', '3847')
    .option(
      '--host <host>',
      'Bind address (default: 127.0.0.1, use 0.0.0.0 for all interfaces)',
      '127.0.0.1'
    )
    .action(async (options: { port: string; host: string }) => {
      const globalOpts = getOptions();
      const services = await createServices(
        globalOpts.config,
        globalOpts.dataDir,
        globalOpts.projectRoot
      );
      const app = createApp(services);

      const port = parseInt(options.port, 10);
      const host = options.host;

      console.log(`Starting server on http://${host}:${String(port)}`);

      const server = serve({
        fetch: app.fetch,
        port,
        hostname: host,
      });

      // Graceful shutdown: close HTTP server, then cleanup services.
      // Do NOT call process.exit() - let the event loop drain naturally
      // so native code (lancedb, ONNX) can clean up without mutex corruption.
      let shuttingDown = false;
      const shutdown = (): void => {
        if (shuttingDown) return; // Prevent double-shutdown
        shuttingDown = true;
        server.close(() => {
          void destroyServices(services);
        });
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    });
}
