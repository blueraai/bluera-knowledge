import { Command } from 'commander';
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

      console.log(`\nIndexing store: ${store.name}...\n`);

      await services.lance.initialize(store.id);

      const result = await services.index.indexStore(store);

      if (result.success) {
        if (globalOpts.format === 'json') {
          console.log(JSON.stringify(result.data, null, 2));
        } else {
          console.log(`Indexed ${result.data.documentsIndexed} documents`);
          console.log(`Created ${result.data.chunksCreated} chunks`);
          console.log(`Time: ${result.data.timeMs}ms\n`);
        }
      } else {
        console.error(`Error: ${result.error.message}`);
        process.exit(4);
      }
    });

  return index;
}
