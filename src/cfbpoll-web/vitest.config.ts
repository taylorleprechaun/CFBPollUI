import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // Node 25+ defines its own global localStorage (undefined without --localstorage-file),
    // which shadows jsdom's. Disable it so tests use the jsdom implementation.
    execArgv: ['--no-experimental-webstorage'],
    setupFiles: './src/test-setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'src/main.tsx',
      ],
    },
  },
})
