import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: [
    { find: '@/component', replacement: fileURLToPath(new URL('./app/component', import.meta.url)) },
    { find: '@', replacement: fileURLToPath(new URL('./', import.meta.url)) },
  ] },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    restoreMocks: true,
    maxWorkers: 2,
  },
})
