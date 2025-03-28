import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@disguise-one/designer-pythonapi': path.resolve(__dirname, 'src'),
    },
  }
});
