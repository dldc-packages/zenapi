import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: { setupFiles: './tests/globalSetup.ts' },
});
