import { Command } from 'commander';
import { createServices } from '../../services/index.js';
import type { GlobalOptions } from '../program.js';
import type { SearchMode } from '../../types/search.js';
import { createStoreId } from '../../types/brands.js';

export function createSearchCommand(getOptions: () => GlobalOptions): Command {
  const search = new Command('search')
    .description('Search across knowledge stores')
    .argument('<query>', 'Search query')
    .option('-s, --stores <stores>', 'Comma-separated store IDs/names')
    .option('-m, --mode <mode>', 'Search mode: vector | fts | hybrid', 'hybrid')
    .option('-n, --limit <number>', 'Max results', '10')
    .option('-t, --threshold <number>', 'Minimum relevance score 0-1')
    .option('--include-content', 'Include full content in results')
    .action(async (query: string, options: {
      stores?: string;
      mode?: SearchMode;
      limit?: string;
      threshold?: string;
      includeContent?: boolean;
    }) => {
      const globalOpts = getOptions();
      const services = await createServices(globalOpts.config, globalOpts.dataDir);

      // Get store IDs
      let storeIds = (await services.store.list()).map((s) => s.id);

      if (options.stores !== undefined) {
        const requestedStores = options.stores.split(',').map((s) => s.trim());
        const resolvedStores = [];

        for (const requested of requestedStores) {
          const store = await services.store.getByIdOrName(requested);
          if (store !== undefined) {
            resolvedStores.push(store.id);
          } else {
            console.error(`Store not found: ${requested}`);
            process.exit(3);
          }
        }

        storeIds = resolvedStores;
      }

      if (storeIds.length === 0) {
        console.error('No stores to search. Create a store first.');
        process.exit(1);
      }

      // Initialize LanceDB for each store
      for (const storeId of storeIds) {
        await services.lance.initialize(storeId);
      }

      const results = await services.search.search({
        query,
        stores: storeIds,
        mode: options.mode ?? 'hybrid',
        limit: parseInt(options.limit ?? '10', 10),
        threshold: options.threshold !== undefined ? parseFloat(options.threshold) : undefined,
        includeContent: options.includeContent,
      });

      if (globalOpts.format === 'json') {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(`\nSearch: "${query}"`);
        console.log(`Mode: ${results.mode} | Stores: ${results.stores.length} | Results: ${results.totalResults} | Time: ${results.timeMs}ms\n`);

        if (results.results.length === 0) {
          console.log('No results found.\n');
        } else {
          for (let i = 0; i < results.results.length; i++) {
            const r = results.results[i]!;
            const path = r.metadata.path ?? r.metadata.url ?? 'unknown';
            console.log(`${i + 1}. [${r.score.toFixed(2)}] ${path}`);
            // Use query-aware highlight if available, otherwise fall back to content preview
            const preview = r.highlight ?? r.content.slice(0, 150).replace(/\n/g, ' ') + (r.content.length > 150 ? '...' : '');
            console.log(`   ${preview}\n`);
          }
        }
      }
    });

  return search;
}
