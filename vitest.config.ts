import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
  },
})
