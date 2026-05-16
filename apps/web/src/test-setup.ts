import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'vitest-axe/matchers'
expect.extend({ toHaveNoViolations })
