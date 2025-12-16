import { Command } from 'commander';
import { createServices } from '../../services/index.js';
import type { GlobalOptions } from '../program.js';
import type { StoreType } from '../../types/store.js';

export function createStoreCommand(getOptions: () => GlobalOptions): Command {
  const store = new Command('store').description('Manage knowledge stores');

  store
    .command('list')
    .description('List all stores')
    .option('-t, --type <type>', 'Filter by store type (file, repo, web)')
    .action(async (options: { type?: StoreType }) => {
      const globalOpts = getOptions();
      const services = await createServices(globalOpts.config, globalOpts.dataDir);
      const stores = await services.store.list(options.type);

      if (globalOpts.format === 'json') {
        console.log(JSON.stringify(stores, null, 2));
      } else {
        if (stores.length === 0) {
          console.log('No stores found.');
        } else {
          console.log('\nStores:\n');
          for (const s of stores) {
            console.log(`  ${s.name} (${s.type}) - ${s.id}`);
          }
          console.log('');
        }
      }
    });

  store
    .command('create <name>')
    .description('Create a new store')
    .requiredOption('-t, --type <type>', 'Store type (file, repo, web)')
    .requiredOption('-s, --source <path>', 'Source path or URL')
    .option('-d, --description <desc>', 'Store description')
    .option('--tags <tags>', 'Comma-separated tags')
    .action(async (name: string, options: {
      type: StoreType;
      source: string;
      description?: string;
      tags?: string;
    }) => {
      const globalOpts = getOptions();
      const services = await createServices(globalOpts.config, globalOpts.dataDir);

      const result = await services.store.create({
        name,
        type: options.type,
        path: options.type !== 'web' ? options.source : undefined,
        url: options.type === 'web' ? options.source : undefined,
        description: options.description,
        tags: options.tags?.split(',').map((t) => t.trim()),
      });

      if (result.success) {
        if (globalOpts.format === 'json') {
          console.log(JSON.stringify(result.data, null, 2));
        } else {
          console.log(`\nCreated store: ${result.data.name} (${result.data.id})\n`);
        }
      } else {
        console.error(`Error: ${result.error.message}`);
        process.exit(1);
      }
    });

  store
    .command('info <store>')
    .description('Show store details')
    .action(async (storeIdOrName: string) => {
      const globalOpts = getOptions();
      const services = await createServices(globalOpts.config, globalOpts.dataDir);
      const s = await services.store.getByIdOrName(storeIdOrName);

      if (s === undefined) {
        console.error(`Store not found: ${storeIdOrName}`);
        process.exit(3);
      }

      if (globalOpts.format === 'json') {
        console.log(JSON.stringify(s, null, 2));
      } else {
        console.log(`\nStore: ${s.name}`);
        console.log(`  ID: ${s.id}`);
        console.log(`  Type: ${s.type}`);
        if ('path' in s) console.log(`  Path: ${s.path}`);
        if ('url' in s) console.log(`  URL: ${s.url}`);
        if (s.description !== undefined) console.log(`  Description: ${s.description}`);
        console.log(`  Created: ${s.createdAt.toISOString()}`);
        console.log(`  Updated: ${s.updatedAt.toISOString()}`);
        console.log('');
      }
    });

  store
    .command('delete <store>')
    .description('Delete a store')
    .option('-f, --force', 'Skip confirmation')
    .action(async (storeIdOrName: string, options: { force?: boolean }) => {
      const globalOpts = getOptions();
      const services = await createServices(globalOpts.config, globalOpts.dataDir);
      const s = await services.store.getByIdOrName(storeIdOrName);

      if (s === undefined) {
        console.error(`Store not found: ${storeIdOrName}`);
        process.exit(3);
      }

      const result = await services.store.delete(s.id);

      if (result.success) {
        console.log(`Deleted store: ${s.name}`);
      } else {
        console.error(`Error: ${result.error.message}`);
        process.exit(1);
      }
    });

  return store;
}
