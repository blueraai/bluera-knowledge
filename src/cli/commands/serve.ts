import { serve } from '@hono/node-server';
import { Command } from 'commander';
import { createApp } from '../../server/app.js';
import { createServices, destroyServices } from '../../services/index.js';
import type { GlobalOptions } from '../program.js';

export function createServeCommand(getOptions: () => GlobalOptions): Command {
  return new Command('serve')
    .description('Start HTTP API server for programmatic search access')
    .option('-p, --port <port>', 'Port to listen on (reads from config if not specified)')
    .option(
      '--host <host>',
      'Bind address (reads from config if not specified, use 0.0.0.0 for all interfaces)'
    )
    .action(async (options: { port?: string; host?: string }) => {
      const globalOpts = getOptions();
      const services = await createServices(
        globalOpts.config,
        globalOpts.dataDir,
        globalOpts.projectRoot
      );

      // Load config for defaults
      const appConfig = await services.config.load();
      const app = createApp(services, globalOpts.dataDir);

      // Use config defaults, CLI flags override
      let port: number;
      if (options.port !== undefined) {
        port = parseInt(options.port, 10);
        if (Number.isNaN(port)) {
          throw new Error(`Invalid value for --port: "${options.port}" is not a valid integer`);
        }
      } else {
        port = appConfig.server.port;
      }
      const host = options.host ?? appConfig.server.host;

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
