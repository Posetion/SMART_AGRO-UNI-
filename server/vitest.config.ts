import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 60000,
    hookTimeout: 600000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'src/utils/**',
        'src/middleware/**',
        'src/validators/**',
        'src/services/auth.service.ts',
        'src/services/token.service.ts',
        'src/services/heatmap.service.ts',
        'src/services/knowledge.service.ts',
        'src/services/social.service.ts',
        'src/services/detection.service.ts',
      ],
    },
  },
});
