import { Command } from 'commander';
import ora, { type Ora } from 'ora';
import { createServices } from '../../services/index.js';
import type { GlobalOptions } from '../program.js';

export function createIndexCommand(getOptions: () => GlobalOptions): Command {
  const index = new Command('index')
    .description('Index a knowledge store')
    .argument('<store>', 'Store ID or name')
    .option('--force', 'Force reindex all files')
    .action(async (storeIdOrName: string, options: { force?: boolean }) => {
      const globalOpts = getOptions();
      const services = await createServices(globalOpts.config, globalOpts.dataDir);

      const store = await services.store.getByIdOrName(storeIdOrName);

      if (store === undefined) {
        console.error(`Store not found: ${storeIdOrName}`);
        process.exit(3);
      }

      // Use spinner in interactive mode, simple output otherwise
      const isInteractive = process.stdout.isTTY;
      let spinner: Ora | undefined;

      if (isInteractive) {
        spinner = ora(`Indexing store: ${store.name}`).start();
      } else {
        console.log(`Indexing store: ${store.name}`);
      }

      await services.lance.initialize(store.id);

      const result = await services.index.indexStore(store, (event) => {
        if (event.type === 'progress') {
          if (spinner) {
            spinner.text = `Indexing: ${event.current}/${event.total} files - ${event.message}`;
          }
        }
      });

      if (result.success) {
        const message = `Indexed ${result.data.documentsIndexed} documents, ${result.data.chunksCreated} chunks in ${result.data.timeMs}ms`;
        if (spinner) {
          spinner.succeed(message);
        } else {
          console.log(message);
        }
        if (globalOpts.format === 'json') {
          console.log(JSON.stringify(result.data, null, 2));
        }
      } else {
        const message = `Error: ${result.error.message}`;
        if (spinner) {
          spinner.fail(message);
        } else {
          console.error(message);
        }
        process.exit(4);
      }
    });

  return index;
}
