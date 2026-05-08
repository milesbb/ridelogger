import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      include: ['src/**/*.test.ts'],
      exclude: ['src/contracts/**'],
      environment: 'node',
      globals: true,
    },
  },
  {
    test: {
      name: 'contracts',
      include: ['src/contracts/**/*.test.ts'],
      environment: 'node',
      globals: true,
    },
  },
])
