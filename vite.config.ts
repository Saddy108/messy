import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 600 },
  test: { testTimeout: 30000, include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'], environment: 'node' },
});
