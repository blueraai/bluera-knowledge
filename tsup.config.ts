import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'mcp/server': 'src/mcp/server.ts',
    'workers/background-worker-cli': 'src/workers/background-worker-cli.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node20',
  shims: true,
});
