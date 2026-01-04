import { defineConfig } from 'vitest/config';

// Lower thresholds in CI where IndexService tests are skipped (requires ONNX model download)
const isCI = process.env.CI === 'true';
const coverageThreshold = isCI ? 76 : 80;

export default defineConfig({
  test: {
    // Separate unit and integration tests with different isolation settings
    // Unit tests: fast parallel execution without isolation (use mocks only)
    // Integration tests: safe execution with isolation (spawn processes, use filesystem)
    projects: [
      {
        test: {
          name: { label: 'unit', color: 'cyan' },
          globals: true,
          environment: 'node',
          include: ['src/**/*.test.ts'],
          // Exclude tests that spawn processes or have mock state conflicts
          exclude: [
            'src/crawl/bridge.test.ts',
            'src/plugin/git-clone.test.ts',
            'src/services/project-root.service.test.ts',
          ],
          // Use forks pool for onnxruntime-node compatibility
          pool: 'forks',
          maxWorkers: '75%',
          // Fast: no isolation needed for unit tests (all use mocks)
          isolate: false,
        },
      },
      {
        test: {
          name: { label: 'integration', color: 'magenta' },
          globals: true,
          environment: 'node',
          // Include all integration tests + tests that need isolation
          include: [
            'tests/**/*.test.ts',
            'src/crawl/bridge.test.ts',
            'src/plugin/git-clone.test.ts',
            'src/services/project-root.service.test.ts',
          ],
          // Use forks pool for onnxruntime-node compatibility
          pool: 'forks',
          maxWorkers: '75%',
          // Safe: isolation required (spawns processes, uses temp dirs)
          isolate: true,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/index.ts',
        'src/types/index.ts', // Barrel exports
        'src/services/index.ts',
        'src/db/index.ts',
      ],
      thresholds: {
        lines: coverageThreshold,
        branches: coverageThreshold,
        functions: coverageThreshold,
        statements: coverageThreshold,
      },
    },
  },
});
