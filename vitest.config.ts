import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/tests/**/*.test.ts'],
    globals: true,
    environment: 'node',
  },
  // Mirrors the alias in vite.config.ts so tests can import real source modules
  // instead of re-implementing the logic they mean to cover.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
