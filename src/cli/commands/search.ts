import { Command } from 'commander';
import { createServices, destroyServices } from '../../services/index.js';
import type { SearchMode, DetailLevel } from '../../types/search.js';
import type { GlobalOptions } from '../program.js';

export function createSearchCommand(getOptions: () => GlobalOptions): Command {
  const search = new Command('search')
    .description('Search indexed documents using vector similarity + full-text matching')
    .argument('<query>', 'Search query')
    .option(
      '-s, --stores <stores>',
      'Limit search to specific stores (comma-separated IDs or names)'
    )
    .option(
      '-m, --mode <mode>',
      'vector (embeddings only), fts (text only), hybrid (both, default)',
      'hybrid'
    )
    .option('-n, --limit <count>', 'Maximum results to return (default: 10)', '10')
    .option('-t, --threshold <score>', 'Minimum score 0-1; omit low-relevance results')
    .option(
      '--min-relevance <score>',
      'Minimum raw cosine similarity 0-1; returns empty if no results meet threshold'
    )
    .option(
      '--detail <level>',
      'Context detail: minimal, contextual, full (default: minimal)',
      'minimal'
    )
    .action(
      async (
        query: string,
        options: {
          stores?: string;
          mode: SearchMode;
          limit: string;
          threshold?: string;
          minRelevance?: string;
          detail: DetailLevel;
        }
      ) => {
        const globalOpts = getOptions();
        const services = await createServices(
          globalOpts.config,
          globalOpts.dataDir,
          globalOpts.projectRoot
        );
        let exitCode = 0;
        try {
          // Get store IDs
          let storeIds = (await services.store.list()).map((s) => s.id);

          searchLogic: {
            if (options.stores !== undefined) {
              const requestedStores = options.stores.split(',').map((s) => s.trim());
              const resolvedStores = [];

              for (const requested of requestedStores) {
                const store = await services.store.getByIdOrName(requested);
                if (store !== undefined) {
                  resolvedStores.push(store.id);
                } else {
                  console.error(`Error: Store not found: ${requested}`);
                  exitCode = 3;

                  break searchLogic;
                }
              }

              storeIds = resolvedStores;
            }

            if (storeIds.length === 0) {
              console.error('No stores to search. Create a store first.');
              exitCode = 1;

              break searchLogic;
            }

            // Initialize LanceDB for each store
            for (const storeId of storeIds) {
              await services.lance.initialize(storeId);
            }

            // Validate numeric options
            const limit = parseInt(options.limit, 10);
            if (Number.isNaN(limit)) {
              throw new Error(
                `Invalid value for --limit: "${options.limit}" is not a valid integer`
              );
            }

            let threshold: number | undefined;
            if (options.threshold !== undefined) {
              threshold = parseFloat(options.threshold);
              if (Number.isNaN(threshold)) {
                throw new Error(
                  `Invalid value for --threshold: "${options.threshold}" is not a valid number`
                );
              }
            }

            let minRelevance: number | undefined;
            if (options.minRelevance !== undefined) {
              minRelevance = parseFloat(options.minRelevance);
              if (Number.isNaN(minRelevance)) {
                throw new Error(
                  `Invalid value for --min-relevance: "${options.minRelevance}" is not a valid number`
                );
              }
            }

            const results = await services.search.search({
              query,
              stores: storeIds,
              mode: options.mode,
              limit,
              threshold,
              minRelevance,
              detail: options.detail,
            });

            if (globalOpts.format === 'json') {
              console.log(JSON.stringify(results, null, 2));
            } else if (globalOpts.quiet === true) {
              // Quiet mode: just list matching paths/URLs, one per line
              for (const r of results.results) {
                const path = r.metadata.path ?? r.metadata.url ?? 'unknown';
                console.log(path);
              }
            } else {
              console.log(`\nSearch: "${query}"`);

              // Build status line with optional confidence info
              let statusLine = `Mode: ${results.mode} | Detail: ${options.detail} | Stores: ${String(results.stores.length)} | Results: ${String(results.totalResults)} | Time: ${String(results.timeMs)}ms`;
              if (results.confidence !== undefined) {
                statusLine += ` | Confidence: ${results.confidence}`;
              }
              if (results.maxRawScore !== undefined) {
                statusLine += ` | MaxRaw: ${results.maxRawScore.toFixed(3)}`;
              }
              console.log(`${statusLine}\n`);

              if (results.results.length === 0) {
                if (results.confidence === 'low') {
                  console.log('No sufficiently relevant results found.\n');
                } else {
                  console.log('No results found.\n');
                }
              } else {
                for (let i = 0; i < results.results.length; i++) {
                  const r = results.results[i];
                  if (r === undefined) continue;

                  if (r.summary) {
                    console.log(
                      `${String(i + 1)}. [${r.score.toFixed(2)}] ${r.summary.type}: ${r.summary.name}`
                    );
                    console.log(`   ${r.summary.location}`);
                    console.log(`   ${r.summary.purpose}`);

                    // Contextual: Show imports, concepts, and usage stats
                    if (r.context && options.detail !== 'minimal') {
                      if (r.context.keyImports.length > 0) {
                        console.log(`   Imports: ${r.context.keyImports.slice(0, 3).join(', ')}`);
                      }
                      if (r.context.relatedConcepts.length > 0) {
                        console.log(
                          `   Related: ${r.context.relatedConcepts.slice(0, 3).join(', ')}`
                        );
                      }
                      // Show usage stats from code graph
                      const { calledBy, calls } = r.context.usage;
                      if (calledBy > 0 || calls > 0) {
                        console.log(
                          `   Usage: Called by ${String(calledBy)} | Calls ${String(calls)}`
                        );
                      }
                    }

                    // Full: Show complete code and documentation
                    if (r.full && options.detail === 'full') {
                      if (r.full.completeCode) {
                        console.log(`   ---`);
                        const codeLines = r.full.completeCode.split('\n');
                        console.log(`   ${codeLines.slice(0, 10).join('\n   ')}`);
                        if (codeLines.length > 10) {
                          console.log(`   ... (truncated)`);
                        }
                      }
                      if (r.full.documentation) {
                        console.log(`   Doc: ${r.full.documentation.slice(0, 100)}`);
                      }
                    }

                    console.log();
                  } else {
                    // Display without summary
                    const path = r.metadata.path ?? r.metadata.url ?? 'unknown';
                    console.log(`${String(i + 1)}. [${r.score.toFixed(2)}] ${path}`);
                    const preview =
                      r.highlight ??
                      r.content.slice(0, 150).replace(/\n/g, ' ') +
                        (r.content.length > 150 ? '...' : '');
                    console.log(`   ${preview}\n`);
                  }
                }
              }
            }
          }
        } finally {
          await destroyServices(services);
        }

        if (exitCode !== 0) {
          // Set exit code and let Node.js exit naturally after event loop drains
          // Using process.exit() causes mutex crashes from native code (LanceDB, tree-sitter)
          process.exitCode = exitCode;
        }
      }
    );

  return search;
}
