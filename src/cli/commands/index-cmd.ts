import { Command } from 'commander';
import ora, { type Ora } from 'ora';
import { createServices, destroyServices } from '../../services/index.js';
import type { GlobalOptions } from '../program.js';

export function createIndexCommand(getOptions: () => GlobalOptions): Command {
  const index = new Command('index')
    .description('Scan store files, chunk text, generate embeddings, save to LanceDB')
    .argument('<store>', 'Store ID or name')
    .option('--force', 'Re-index all files even if unchanged')
    .action(async (storeIdOrName: string, options: { force?: boolean }) => {
      const globalOpts = getOptions();
      const services = await createServices(
        globalOpts.config,
        globalOpts.dataDir,
        globalOpts.projectRoot
      );
      let exitCode = 0;
      try {
        indexLogic: {
          const store = await services.store.getByIdOrName(storeIdOrName);

          if (store === undefined) {
            console.error(`Error: Store not found: ${storeIdOrName}`);
            exitCode = 3;

            break indexLogic;
          }

          // Use spinner in interactive mode (not quiet, not json output)
          const isInteractive =
            process.stdout.isTTY && globalOpts.quiet !== true && globalOpts.format !== 'json';
          let spinner: Ora | undefined;

          if (isInteractive) {
            spinner = ora(`Indexing store: ${store.name}`).start();
          } else if (globalOpts.quiet !== true && globalOpts.format !== 'json') {
            console.log(`Indexing store: ${store.name}`);
          }

          await services.lance.initialize(store.id);

          // Use full re-index with --force, otherwise incremental (default)
          const progressCallback = (event: {
            type: string;
            current: number;
            total: number;
            message: string;
          }): void => {
            if (event.type === 'progress') {
              if (spinner) {
                spinner.text = `Indexing: ${String(event.current)}/${String(event.total)} files - ${event.message}`;
              }
            }
          };

          const result =
            options.force === true
              ? await services.index.indexStore(store, progressCallback)
              : await services.index.indexStoreIncremental(store, progressCallback);

          if (result.success) {
            if (globalOpts.format === 'json') {
              console.log(JSON.stringify(result.data, null, 2));
            } else {
              const message = `Indexed ${String(result.data.filesIndexed)} documents, ${String(result.data.chunksCreated)} chunks in ${String(result.data.timeMs)}ms`;
              if (spinner !== undefined) {
                spinner.succeed(message);
              } else if (globalOpts.quiet !== true) {
                console.log(message);
              }
            }
          } else {
            const message = `Error: ${result.error.message}`;
            if (spinner !== undefined) {
              spinner.fail(message);
            } else {
              console.error(message);
            }
            exitCode = 4;

            break indexLogic;
          }
        }
      } finally {
        await destroyServices(services);
      }

      if (exitCode !== 0) {
        // Using process.exitCode avoids mutex crashes from native code (LanceDB, tree-sitter)
        process.exitCode = exitCode;
      }
    });

  index
    .command('watch <store>')
    .description('Watch store directory; re-index when files change')
    .option(
      '--debounce <ms>',
      'Wait N ms after last change before re-indexing (default: 1000)',
      '1000'
    )
    .action(async (storeIdOrName: string, options: { debounce: string }) => {
      const globalOpts = getOptions();
      const services = await createServices(
        globalOpts.config,
        globalOpts.dataDir,
        globalOpts.projectRoot
      );

      const store = await services.store.getByIdOrName(storeIdOrName);
      if (store === undefined || (store.type !== 'file' && store.type !== 'repo')) {
        console.error(`Error: File/repo store not found: ${storeIdOrName}`);
        // Cleanup services before exiting (using exitCode avoids mutex crashes)
        await destroyServices(services);
        process.exitCode = 3;
        return;
      }

      const appConfig = await services.config.load();
      const { WatchService } = await import('../../services/watch.service.js');
      const watchService = new WatchService(services.index, services.lance, {
        ignorePatterns: appConfig.indexing.ignorePatterns,
      });

      const debounceMs = parseInt(options.debounce, 10);
      if (Number.isNaN(debounceMs)) {
        throw new Error(
          `Invalid value for --debounce: "${options.debounce}" is not a valid integer`
        );
      }

      if (globalOpts.quiet !== true) {
        console.log(`Watching ${store.name} for changes...`);
      }
      await watchService.watch(
        store,
        debounceMs,
        () => {
          if (globalOpts.quiet !== true) {
            console.log(`Re-indexed ${store.name}`);
          }
        },
        (error: Error) => {
          console.error(`Watch error: ${error.message}`);
        }
      );

      // Keep process alive
      process.on('SIGINT', () => {
        void (async (): Promise<void> => {
          await watchService.unwatchAll();
          process.exit(0);
        })().catch(() => {
          // Error during shutdown - process.exit already called
        });
      });
    });

  return index;
}
