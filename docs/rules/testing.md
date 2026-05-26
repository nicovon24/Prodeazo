# Rules: Testing

## What Requires Tests

### Required (block merge without)
- **Pure business logic functions** — `calculatePredictionPoints`, any new pure function in `services/`
- **Zod schemas** — at least one happy path and one failure case per schema

### Expected (flag in review if missing)
- **New API endpoints** — at minimum a documented manual test with curl or HTTP file
- **Auth flow changes** — manual walkthrough documented in the PR

### Not Required
- Controller wiring (Express routing)
- DB model functions (tested implicitly through integration)
- Seed scripts

## Testing Stack

- **Unit tests:** Vitest (`pnpm test` from `backend/`)
- **E2E:** Playwright (installed in `frontend/`, not yet written — Phase 2+)
- **Manual API testing:** `.http` files or curl commands documented in PR description

## Test File Location

```
backend/src/services/scoring.test.ts     ← unit tests for scoring.ts
backend/src/services/*.test.ts           ← unit tests for any service
```

## Scoring Test Cases (mandatory)

Every change to `scoring.ts` must keep these cases green:

| Prediction | Result | Expected Points |
|-----------|--------|----------------|
| 2-1 | 2-1 | 5 (exact) |
| 2-1 | 3-1 | 3 (correct winner) |
| 2-1 | 1-2 | 0 (wrong winner) |
| 0-0 | 0-0 | 5 (exact) |
| 1-1 | 2-2 | 1 (correct draw) |
| 1-1 | 1-0 | 0 (draw guessed, winner scored) |
| 3-0 | 1-0 | 3 (correct winner, wrong score) |

## Test Style

```typescript
import { describe, it, expect } from 'vitest'
import { calculatePredictionPoints } from './scoring'

describe('calculatePredictionPoints', () => {
  it('exact score returns 5', () => {
    expect(calculatePredictionPoints({ home: 2, away: 1 }, { home: 2, away: 1 })).toBe(5)
  })
})
```

- No mocks for pure functions — pass data directly
- Descriptive test names: `'correct winner returns 3'`, not `'test 1'`
- Group related cases with `describe`

## What Not to Do

- Do not mock the database in integration paths — if you need DB, use a test DB or test the function at the pure layer
- Do not write tests for things that are already validated by TypeScript types
- Do not test framework internals (Express routing, Drizzle query building)
