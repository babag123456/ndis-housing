# Multi-Track Navigator (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the navigator support multiple tracks over one shared profile, with housing moved into a track unchanged, so future tracks are additive.

**Architecture:** Replace the closed `PROFILE_FIELDS` enum and its two exhaustive `switch` statements with a registry of small typed field definitions composed from per-track groups. Introduce a `Track` that bundles questions, optional rules and roadmap steps. Thread the track through the flow, roadmap, engine and plan as a parameter, and allow the field registry to be injected so a synthetic track in a test can prove extensibility.

**Tech Stack:** Next 16 (App Router, Turbopack), React 19, TypeScript 6 strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`), Zod 4, zustand 5 + persist, Vitest 4, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-19-ndis-navigator-tracks-design.md`

## Global Constraints

- **Phase 1 is behaviour-preserving.** No content changes, no new questions, no
  UI copy changes. The gate is 159 unit tests and 49 e2e tests green *unchanged*.
  If a test needs editing to pass, the refactor is wrong — with the single
  exception of tests whose *import paths* move (Task 5), where only the import
  line may change.
- **Do not add the state question.** Spec §4.3 adds the `context.state` field.
  The question that fills it is Phase 2, because adding a question to the housing
  journey would change the journey and break the gate above.
- **Do not touch navigation.** The nav reduction from six items to five (spec
  §6.1) is Phase 2 — it exists to make room for `/team` and `/reports`.
- TypeScript strict mode. `noUncheckedIndexedAccess` is on: indexing a record
  yields `T | undefined` and must be narrowed.
- `verbatimModuleSyntax` is on: type-only imports must use `import type`.
- Australian English in all copy. Never state that anyone qualifies, is eligible,
  is approved, or will receive funding or an amount.
- Commit after each task. Run `npm run lint && npm run typecheck && npm test`
  before every commit.
- Path aliases: `@/*` → `./src/*`, `@content/*` → `./content/*`.

---

## File Structure

**Create:**

| File | Responsibility |
| --- | --- |
| `src/lib/profile/field.ts` | The field primitive: `FieldDef`, `defineField`, `FieldRegistry`, `composeFields`, `readFrom`, `writeTo`. Generic — knows nothing about tracks. |
| `src/lib/profile/fields.ts` | The binding point: composes `FIELDS`, derives `FieldId`, exports bound `readField` / `writeField`. |
| `src/lib/profile/shared-fields.ts` | Field group for fields every track may write: perspective and context. |
| `src/tracks/home-and-living/fields.ts` | Field group owned by the housing track. |
| `src/tracks/home-and-living/questions.ts` | Moved from `src/lib/navigator/questions.ts`. |
| `src/tracks/home-and-living/rules.ts` | Moved from `src/lib/decision-engine/rules.ts`. |
| `src/tracks/home-and-living/steps.ts` | Moved from `content/journeys/roadmap-steps.ts`. |
| `src/tracks/home-and-living/index.ts` | The `Track` object for housing. |
| `src/tracks/track.ts` | The `Track` type. Separate from the registry so track modules can import the type without a cycle. |
| `src/tracks/index.ts` | `TRACKS`, `TrackId`, `trackById`. |
| `tests/profile/field.test.ts` | Field primitive and registry behaviour. |
| `tests/tracks/registry.test.ts` | Registry integrity, question id uniqueness, track isolation. |
| `tests/tracks/extensibility.test.ts` | The synthetic-track contract test. |

**Modify:**

| File | Change |
| --- | --- |
| `src/types/profile.ts` | Add `context.state`; add its default to `createEmptyProfile()`. |
| `src/lib/navigator/question-schema.ts` | Drop `PROFILE_FIELDS`, `FIELD_VALUE_SCHEMAS`, `readProfileField`, `writeProfileField`. Keep the question schemas, retyped to `FieldId`. |
| `src/lib/conditions.ts` | Use `readField`; `ProfileCondition.field` becomes `FieldId`. |
| `src/lib/navigator/flow.ts` | `evaluateFlow(answers, track, registry?)`. |
| `src/lib/decision-engine/rule-schema.ts` | New: rule types extracted so `rules.ts` can move without a cycle. |
| `src/lib/decision-engine/evaluate-pathways.ts` | Take rules and questions as parameters. |
| `src/lib/roadmap/build.ts` | `buildRoadmap(profile, steps, registry?)`. |
| `src/lib/plan/build.ts` | `buildPlan(profile, track, …)`. |
| `src/lib/navigator/store.ts` | Per-track `activeQuestionId`, with migration. |
| Six `src/app/*/page.tsx` and their components | Pass the housing track. |

**Why this split:** the import graph must stay acyclic. `profile/field.ts` has no
track knowledge; track field groups import only it and the profile types;
`profile/fields.ts` composes them; `conditions.ts` imports the bound reader.
Nothing under `src/lib/` imports `src/tracks/index.ts` — the builders receive what
they need as parameters, which is also what makes them injectable for Task 8.

---

### Task 1: The field primitive and registry

**Files:**
- Create: `src/lib/profile/field.ts`
- Test: `tests/profile/field.test.ts`

**Interfaces:**
- Consumes: `ParticipantProfile` from `@/types/profile`.
- Produces:
  - `type FieldDef<T extends string> = { schema: z.ZodType<T>; read: (p: ParticipantProfile) => T | null; write: (p: ParticipantProfile, v: T) => void }`
  - `function defineField<T extends string>(def: FieldDef<T>): FieldDef<T>`
  - `type AnyFieldDef` — the value-type-erased shape the registry holds. **Not**
    `FieldDef<string>`: `write` takes `T` as a parameter, so under
    `strictFunctionTypes` a `FieldDef<'red' | 'blue'>` is not assignable to a
    `FieldDef<string>`, correctly. `defineField` performs the erasure, which is
    sound because every write through the registry parses with the field's own
    schema first.
  - `type FieldRegistry = Readonly<Record<string, AnyFieldDef>>`
  - `function composeFields<T extends readonly Record<string, AnyFieldDef>[]>(...groups: T): UnionToIntersection<T[number]>`
  - `function readFrom(registry: FieldRegistry, profile: ParticipantProfile, id: string): string | null`
  - `function writeTo(registry: FieldRegistry, profile: ParticipantProfile, id: string, raw: string): boolean`

- [ ] **Step 1: Write the failing test**

Create `tests/profile/field.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  composeFields,
  defineField,
  readFrom,
  writeTo,
} from '@/lib/profile/field'
import { createEmptyProfile } from '@/types/profile'

const colourSchema = z.enum(['red', 'blue'])

const testFields = {
  'test.colour': defineField({
    schema: colourSchema,
    // The test profile has no colour branch, so this stands in for one by
    // borrowing a nullable string field. Real fields address real branches.
    read: (profile) => (profile.goals.change === null ? null : 'red'),
    write: () => {},
  }),
}

describe('defineField', () => {
  it('returns the definition unchanged, so it is only a typing helper', () => {
    expect(testFields['test.colour'].schema).toBe(colourSchema)
  })
})

describe('composeFields', () => {
  it('merges field groups into one registry', () => {
    const registry = composeFields(
      { a: testFields['test.colour'] },
      { b: testFields['test.colour'] },
    )
    expect(Object.keys(registry).sort()).toEqual(['a', 'b'])
  })

  it('rejects two groups claiming the same field id', () => {
    expect(() =>
      composeFields({ a: testFields['test.colour'] }, { a: testFields['test.colour'] }),
    ).toThrow(/already defined/i)
  })
})

describe('readFrom', () => {
  it('returns null for a field the registry does not have', () => {
    expect(readFrom({}, createEmptyProfile(), 'nope')).toBeNull()
  })
})

describe('writeTo', () => {
  const registry = {
    'goals.change': defineField({
      schema: z.enum(['more_independence', 'unsure']),
      read: (profile) => profile.goals.change as 'more_independence' | 'unsure' | null,
      write: (profile, value) => {
        profile.goals.change = value
      },
    }),
  }

  it('writes a valid value and reports success', () => {
    const profile = createEmptyProfile()
    expect(writeTo(registry, profile, 'goals.change', 'more_independence')).toBe(true)
    expect(profile.goals.change).toBe('more_independence')
  })

  it('refuses an invalid value and leaves the profile untouched', () => {
    const profile = createEmptyProfile()
    expect(writeTo(registry, profile, 'goals.change', 'nonsense')).toBe(false)
    expect(profile.goals.change).toBeNull()
  })

  it('refuses a field the registry does not have', () => {
    expect(writeTo({}, createEmptyProfile(), 'nope', 'x')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run tests/profile/field.test.ts`
Expected: FAIL — cannot resolve `@/lib/profile/field`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/profile/field.ts`:

```ts
import type { z } from 'zod'
import type { ParticipantProfile } from '@/types/profile'

/**
 * One profile field, defined in one place.
 *
 * This replaces a closed enum with two exhaustive switch statements over it.
 * The guarantee that mattered is kept: `schema` and `write` share the type
 * parameter, so a field cannot be given a value its schema rejects. The
 * guarantee that is lost — the compiler forcing a central switch to handle every
 * field — is replaced by a registry-integrity test, which is stronger, because it
 * also catches a field nothing ever asks about.
 */
export type FieldDef<T extends string> = {
  schema: z.ZodType<T>
  read: (profile: ParticipantProfile) => T | null
  write: (profile: ParticipantProfile, value: T) => void
}

/** Identity at runtime. It exists so `T` is inferred from `schema`. */
export function defineField<T extends string>(def: FieldDef<T>): FieldDef<T> {
  return def
}

/**
 * A field of unknown value type. Reading and writing go through the definition's
 * own schema, so erasing `T` at the registry boundary is safe.
 */
export type AnyFieldDef = FieldDef<string>

export type FieldRegistry = Readonly<Record<string, AnyFieldDef>>

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never

/**
 * Merges field groups into one registry.
 *
 * A function rather than an inline object literal so a test can compose a
 * registry containing a synthetic track. Extensibility we cannot construct in a
 * test is extensibility we cannot check.
 *
 * Duplicate ids throw rather than silently overwriting: two tracks claiming one
 * field would mean each quietly reading the other's answers.
 */
export function composeFields<
  const T extends readonly Record<string, AnyFieldDef>[],
>(...groups: T): UnionToIntersection<T[number]> {
  const merged: Record<string, AnyFieldDef> = {}
  for (const group of groups) {
    for (const [id, def] of Object.entries(group)) {
      if (id in merged) {
        throw new Error(`Profile field "${id}" is already defined by another group`)
      }
      merged[id] = def
    }
  }
  return merged as UnionToIntersection<T[number]>
}

/** The field's current value, or null when unanswered or unknown to the registry. */
export function readFrom(
  registry: FieldRegistry,
  profile: ParticipantProfile,
  id: string,
): string | null {
  const def = registry[id]
  if (def === undefined) return null
  return def.read(profile)
}

/**
 * Writes a validated value. Returns false when the value is not valid for the
 * field, so a stale saved answer is dropped rather than corrupting the profile.
 */
export function writeTo(
  registry: FieldRegistry,
  profile: ParticipantProfile,
  id: string,
  raw: string,
): boolean {
  const def = registry[id]
  if (def === undefined) return false
  const parsed = def.schema.safeParse(raw)
  if (!parsed.success) return false
  def.write(profile, parsed.data)
  return true
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run tests/profile/field.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Verify nothing else broke, then commit**

```bash
npm run lint && npm run typecheck && npm test
git add src/lib/profile/field.ts tests/profile/field.test.ts
git commit -m "Add profile field primitive and composable registry

Replaces a closed enum plus two exhaustive switches, which is honest
boilerplate at 11 fields and 400 lines of it at 40.

Composition is a function rather than an object literal so a test can
build a registry containing a synthetic track. Duplicate field ids throw:
two tracks sharing one field would each quietly read the other's answers."
```

---

### Task 2: Add `context.state` to the profile

**Files:**
- Modify: `src/types/profile.ts`
- Test: `tests/profile/field.test.ts` (extend)

**Interfaces:**
- Produces: `stateSchema = z.enum(['nsw', 'other', UNSURE])`, `type AustralianState`; `profile.context.state: AustralianState | null`.

Adding the field only. The question that fills it is Phase 2 — see Global Constraints.

- [ ] **Step 1: Write the failing test**

Append to `tests/profile/field.test.ts`:

```ts
import { createEmptyProfile as emptyProfile } from '@/types/profile'

describe('context.state', () => {
  it('starts unanswered, because nobody has been asked yet', () => {
    expect(emptyProfile().context.state).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run tests/profile/field.test.ts`
Expected: FAIL — `Property 'state' does not exist on type`.

- [ ] **Step 3: Write the implementation**

In `src/types/profile.ts`, after `ndisContextSchema`:

```ts
/**
 * Where the person lives, only as far as the content needs.
 *
 * State-specific bodies differ — a New South Wales tribunal has no standing
 * elsewhere — so jurisdiction-tagged content is filtered on this. Only New South
 * Wales is written, and everyone else is told so plainly rather than shown
 * nothing.
 */
export const stateSchema = z.enum(['nsw', 'other', UNSURE])
export type AustralianState = z.infer<typeof stateSchema>
```

In `participantProfileSchema`, add to the `context` object:

```ts
    state: stateSchema.nullable(),
```

In `createEmptyProfile()`, change the context default to:

```ts
    context: { lifeStage: null, timing: null, ndis: null, state: null },
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test`
Expected: PASS, 160 unit tests. No existing test changes.

- [ ] **Step 5: Commit**

```bash
npm run lint && npm run typecheck && npm test
git add src/types/profile.ts tests/profile/field.test.ts
git commit -m "Add context.state to the profile

The field only. The question that fills it belongs to Phase 2, because
adding a question to the housing journey would change that journey and
Phase 1 has to be behaviour-preserving.

State-specific bodies do not transfer between states, so jurisdiction-
tagged content needs something to filter on."
```

---

### Task 3: Field groups, and the binding point

**Files:**
- Create: `src/lib/profile/shared-fields.ts`, `src/tracks/home-and-living/fields.ts`, `src/lib/profile/fields.ts`
- Test: `tests/tracks/registry.test.ts`

**Interfaces:**
- Consumes: `defineField`, `composeFields`, `readFrom`, `writeTo` from Task 1; the enum schemas from `@/types/profile`.
- Produces:
  - `SHARED_FIELDS` — `perspective`, `context.lifeStage`, `context.timing`, `context.ndis`, `context.state`
  - `HOME_AND_LIVING_FIELDS` — `housing.current`, `housing.desired`, `housing.featureNeeds`, `support.dailyIntensity`, `support.overnight`, `support.informal`, `goals.change`
  - `FIELDS`, `type FieldId = keyof typeof FIELDS`, `readField(profile, id)`, `writeField(profile, id, raw)`

**Which fields are shared:** perspective and everything under `context` — they
describe the person and their circumstances rather than one subject area, and any
track may need them. Housing, support and goals belong to the housing track;
`goals.change` is housing-flavoured (`move_out_of_family_home`) so it goes with
the track, not the shared group.

- [ ] **Step 1: Write the failing test**

Create `tests/tracks/registry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { FIELDS, readField, writeField } from '@/lib/profile/fields'
import { createEmptyProfile } from '@/types/profile'

describe('the field registry', () => {
  it('covers every field the profile can hold', () => {
    expect(Object.keys(FIELDS).sort()).toEqual([
      'context.lifeStage',
      'context.ndis',
      'context.state',
      'context.timing',
      'goals.change',
      'housing.current',
      'housing.desired',
      'housing.featureNeeds',
      'perspective',
      'support.dailyIntensity',
      'support.overnight',
      'support.informal',
    ])
  })

  it('round-trips every field, so read and write cannot disagree', () => {
    for (const [id, def] of Object.entries(FIELDS)) {
      const profile = createEmptyProfile()
      expect(readField(profile, id), `${id} should start unanswered`).toBeNull()

      // Every field's schema is a Zod enum, so its first option is a valid
      // value. `FieldDef.schema` is typed as the general `z.ZodType`, which has
      // no `.options`, so this needs a two-step cast.
      const options = (def.schema as unknown as z.ZodEnum<[string, ...string[]]>).options
      const value = options[0]
      expect(value, `${id} should have at least one option`).toBeDefined()
      if (value === undefined) continue

      expect(writeField(profile, id, value), `${id} should accept ${value}`).toBe(true)
      expect(readField(profile, id), `${id} should read back what was written`).toBe(value)
    }
  })

  it('refuses a value that is not valid for the field', () => {
    const profile = createEmptyProfile()
    expect(writeField(profile, 'housing.current', 'a_castle')).toBe(false)
    expect(profile.housing.current).toBeNull()
  })
})
```

Note: `def.schema.options` requires the schemas to be Zod enums. They all are.
Cast is needed because `FieldDef.schema` is typed as `z.ZodType`.

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run tests/tracks/registry.test.ts`
Expected: FAIL — cannot resolve `@/lib/profile/fields`.

- [ ] **Step 3: Write the three files**

Create `src/lib/profile/shared-fields.ts`:

```ts
import { defineField } from './field'
import {
  lifeStageSchema,
  ndisContextSchema,
  stateSchema,
  timingSchema,
  userPerspectiveSchema,
} from '@/types/profile'

/**
 * Fields any track may write to.
 *
 * These describe the person and their circumstances rather than one subject
 * area, so a second track should not have to ask again. Everything else belongs
 * to the track that asks about it.
 */
export const SHARED_FIELDS = {
  perspective: defineField({
    schema: userPerspectiveSchema,
    read: (profile) => profile.perspective,
    write: (profile, value) => {
      profile.perspective = value
    },
  }),
  'context.lifeStage': defineField({
    schema: lifeStageSchema,
    read: (profile) => profile.context.lifeStage,
    write: (profile, value) => {
      profile.context.lifeStage = value
    },
  }),
  'context.timing': defineField({
    schema: timingSchema,
    read: (profile) => profile.context.timing,
    write: (profile, value) => {
      profile.context.timing = value
    },
  }),
  'context.ndis': defineField({
    schema: ndisContextSchema,
    read: (profile) => profile.context.ndis,
    write: (profile, value) => {
      profile.context.ndis = value
    },
  }),
  'context.state': defineField({
    schema: stateSchema,
    read: (profile) => profile.context.state,
    write: (profile, value) => {
      profile.context.state = value
    },
  }),
} as const
```

Create `src/tracks/home-and-living/fields.ts`:

```ts
import { defineField } from '@/lib/profile/field'
import {
  currentLivingSchema,
  desiredChangeSchema,
  desiredLivingSchema,
  housingFeatureNeedSchema,
  informalSupportSchema,
  overnightSupportSchema,
  supportIntensitySchema,
} from '@/types/profile'

/**
 * Fields owned by the home and living track.
 *
 * `goals.change` lives here rather than in the shared group because its values
 * are about housing — moving out of the family home, changing who someone lives
 * with. A second track wanting a goal should define its own.
 */
export const HOME_AND_LIVING_FIELDS = {
  'housing.current': defineField({
    schema: currentLivingSchema,
    read: (profile) => profile.housing.current,
    write: (profile, value) => {
      profile.housing.current = value
    },
  }),
  'housing.desired': defineField({
    schema: desiredLivingSchema,
    read: (profile) => profile.housing.desired,
    write: (profile, value) => {
      profile.housing.desired = value
    },
  }),
  'housing.featureNeeds': defineField({
    schema: housingFeatureNeedSchema,
    read: (profile) => profile.housing.featureNeeds,
    write: (profile, value) => {
      profile.housing.featureNeeds = value
    },
  }),
  'support.dailyIntensity': defineField({
    schema: supportIntensitySchema,
    read: (profile) => profile.support.dailyIntensity,
    write: (profile, value) => {
      profile.support.dailyIntensity = value
    },
  }),
  'support.overnight': defineField({
    schema: overnightSupportSchema,
    read: (profile) => profile.support.overnight,
    write: (profile, value) => {
      profile.support.overnight = value
    },
  }),
  'support.informal': defineField({
    schema: informalSupportSchema,
    read: (profile) => profile.support.informal,
    write: (profile, value) => {
      profile.support.informal = value
    },
  }),
  'goals.change': defineField({
    schema: desiredChangeSchema,
    read: (profile) => profile.goals.change,
    write: (profile, value) => {
      profile.goals.change = value
    },
  }),
} as const
```

Create `src/lib/profile/fields.ts`:

```ts
import type { ParticipantProfile } from '@/types/profile'
import { HOME_AND_LIVING_FIELDS } from '@/tracks/home-and-living/fields'
import { composeFields, readFrom, writeTo, type FieldRegistry } from './field'
import { SHARED_FIELDS } from './shared-fields'

/**
 * The one place field groups are composed.
 *
 * Adding a track means adding one argument here. `FieldId` is derived, so a
 * condition, clause or roadmap step referencing a field that does not exist
 * still fails to typecheck — the guarantee the old enum provided.
 *
 * This module imports track *field groups* only, never whole track modules, so
 * the import graph stays acyclic: field groups depend on nothing but the
 * primitive and the profile types.
 */
export const FIELDS = composeFields(SHARED_FIELDS, HOME_AND_LIVING_FIELDS)

export type FieldId = keyof typeof FIELDS

export const FIELD_IDS = Object.keys(FIELDS) as readonly FieldId[]

/** Bound to the production registry. Pass a registry explicitly to override. */
export function readField(
  profile: ParticipantProfile,
  id: string,
  registry: FieldRegistry = FIELDS,
): string | null {
  return readFrom(registry, profile, id)
}

export function writeField(
  profile: ParticipantProfile,
  id: string,
  raw: string,
  registry: FieldRegistry = FIELDS,
): boolean {
  return writeTo(registry, profile, id, raw)
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run tests/tracks/registry.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
npm run lint && npm run typecheck && npm test
git add src/lib/profile src/tracks tests/tracks/registry.test.ts
git commit -m "Split profile fields into shared and track-owned groups

Perspective and context are shared because they describe the person
rather than one subject area, so a second track should not have to ask
again. Housing, support and goals belong to the housing track.

The round-trip test is the one that earns its place: it catches a field
whose read and write disagree, which the old switch statement could not."
```

---

### Task 4: The Track type and registry

**Files:**
- Create: `src/tracks/track.ts`, `src/tracks/index.ts`
- Move: `src/lib/navigator/questions.ts` → `src/tracks/home-and-living/questions.ts`
- Move: `src/lib/decision-engine/rules.ts` → `src/tracks/home-and-living/rules.ts`
- Move: `content/journeys/roadmap-steps.ts` → `src/tracks/home-and-living/steps.ts`
- Create: `src/lib/decision-engine/rule-schema.ts`
- Create: `src/tracks/home-and-living/index.ts`

**Interfaces:**
- Produces:
  - `type Track = { id: string; plainName: string; purpose: string; chooser: CopyVariants; questions: readonly Question[]; rules?: readonly PathwayRules[]; steps: readonly RoadmapStep[]; entryWhen?: readonly ProfileCondition[] }`
  - `HOME_AND_LIVING: Track`
  - `TRACKS: readonly Track[]`, `type TrackId = 'home-and-living'`, `trackById(id: string): Track | undefined`

**Why `rule-schema.ts`:** `rules.ts` currently lives inside
`src/lib/decision-engine/` and imports its own Zod schemas from itself. Moving it
into the track would make `src/tracks/…/rules.ts` import from
`src/lib/decision-engine/`, and `evaluate-pathways.ts` must not import from
`src/tracks/`. Extracting the schemas into a leaf module keeps the graph acyclic.

- [ ] **Step 1: Extract the rule schemas**

Create `src/lib/decision-engine/rule-schema.ts` containing, moved verbatim from
`rules.ts`: `clauseSchema`, `Clause`, `signalSchema`, `counterSignalSchema`,
`pathwayRulesSchema`, `PathwayRules`, and the local `copyVariantsSchema`. Change
`field: profileFieldSchema` to `field: z.string().min(1)` in `clauseSchema`, and
type `Clause` as:

```ts
export type Clause = { field: FieldId; oneOf: readonly string[] }
```

with `import type { FieldId } from '@/lib/profile/fields'`. The runtime schema is
structural; the compile-time type is what constrains the field name. Keep the
existing doc comments.

- [ ] **Step 2: Move the three content modules**

```bash
git mv src/lib/navigator/questions.ts src/tracks/home-and-living/questions.ts
git mv src/lib/decision-engine/rules.ts src/tracks/home-and-living/rules.ts
git mv content/journeys/roadmap-steps.ts src/tracks/home-and-living/steps.ts
rmdir content/journeys
```

Then fix imports in the moved files:
- `questions.ts`: `import type { Question } from './question-schema'` becomes `import type { Question } from '@/lib/navigator/question-schema'`.
- `rules.ts`: delete the schema definitions now in `rule-schema.ts` and import them; change `import { profileFieldSchema, type ProfileField }` to `import type { FieldId } from '@/lib/profile/fields'`; change the local helper `const field = (name: ProfileField, …)` to `(name: FieldId, …)`.
- `steps.ts`: imports become `@/lib/roadmap/schema`.

- [ ] **Step 3: Write the failing test**

Append to `tests/tracks/registry.test.ts`:

```ts
import { TRACKS, trackById } from '@/tracks'

describe('the track registry', () => {
  it('has the home and living track', () => {
    expect(trackById('home-and-living')?.plainName).toBe('Home and living')
  })

  it('gives every question a globally unique id', () => {
    const seen = new Map<string, string>()
    for (const track of TRACKS) {
      for (const question of track.questions) {
        const owner = seen.get(question.id)
        expect(owner, `"${question.id}" is claimed by ${owner} and ${track.id}`).toBeUndefined()
        seen.set(question.id, track.id)
      }
    }
  })

  it('only lets a track write to its own fields or shared ones', () => {
    const shared = Object.keys(SHARED_FIELDS)
    const ownership = new Map<string, string>([
      ...Object.keys(HOME_AND_LIVING_FIELDS).map(
        (id) => [id, 'home-and-living'] as const,
      ),
    ])

    for (const track of TRACKS) {
      for (const question of track.questions) {
        const fields = [
          question.profileField,
          ...question.options.flatMap((option) =>
            (option.implies ?? []).map((implied) => implied.field),
          ),
        ]
        for (const field of fields) {
          if (shared.includes(field)) continue
          expect(
            ownership.get(field),
            `${track.id} writes to ${field}, which it does not own`,
          ).toBe(track.id)
        }
      }
    }
  })

  it('references only fields that exist', () => {
    for (const track of TRACKS) {
      for (const question of track.questions) {
        expect(FIELD_IDS, `question ${question.id}`).toContain(question.profileField)
        for (const condition of question.showWhen ?? []) {
          expect(FIELD_IDS, `condition on ${question.id}`).toContain(condition.field)
        }
      }
      for (const rule of track.rules ?? []) {
        for (const clause of rule.supports.flatMap((signal) => signal.when)) {
          expect(FIELD_IDS, `rule ${rule.pathwayId}`).toContain(clause.field)
        }
      }
      for (const step of track.steps) {
        for (const condition of [...(step.showWhen ?? []), ...(step.showWhenAny ?? [])]) {
          expect(FIELD_IDS, `step ${step.id}`).toContain(condition.field)
        }
      }
    }
  })

  it('asks about every registered field, so none is dead weight', () => {
    const asked = new Set(
      TRACKS.flatMap((track) => track.questions.map((question) => question.profileField)),
    )
    // context.state is registered ahead of the question that fills it, which
    // arrives with the jurisdiction content in Phase 2.
    const expectedUnasked = ['context.state']
    const unasked = FIELD_IDS.filter((id) => !asked.has(id))
    expect(unasked.sort()).toEqual(expectedUnasked)
  })
})
```

Add to the imports at the top of the file:

```ts
import { FIELD_IDS } from '@/lib/profile/fields'
import { SHARED_FIELDS } from '@/lib/profile/shared-fields'
import { HOME_AND_LIVING_FIELDS } from '@/tracks/home-and-living/fields'
```

- [ ] **Step 4: Run the test and verify it fails**

Run: `npx vitest run tests/tracks/registry.test.ts`
Expected: FAIL — cannot resolve `@/tracks`.

- [ ] **Step 5: Write the Track type and registry**

Create `src/tracks/track.ts`:

```ts
import type { CopyVariants } from '@/lib/copy/perspective'
import type { ProfileCondition } from '@/lib/conditions'
import type { PathwayRules } from '@/lib/decision-engine/rule-schema'
import type { Question } from '@/lib/navigator/question-schema'
import type { RoadmapStep } from '@/lib/roadmap/schema'
import type { FieldId } from '@/lib/profile/fields'

/**
 * One area of a person's life the navigator can help with.
 *
 * A track owns questions, optionally rules, and roadmap steps. It owns no logic:
 * the flow, engine, roadmap and plan are shared and take a track as a parameter.
 *
 * `rules` is optional on purpose. Not every track compares options — a track can
 * exist to tell someone who and what they may need, with nothing to score.
 */
export type Track = {
  id: string
  plainName: string
  /** Why this track exists, in the person's terms. Shown on request. */
  purpose: string
  /** How the track offers itself on the chooser. */
  chooser: CopyVariants
  questions: readonly Question[]
  rules?: readonly PathwayRules[]
  steps: readonly RoadmapStep[]
  /** When offering this track makes sense at all. Always offered when absent. */
  entryWhen?: readonly ProfileCondition[]
}
```

Create `src/tracks/home-and-living/index.ts`:

```ts
import type { Track } from '../track'
import { QUESTIONS } from './questions'
import { PATHWAY_RULES } from './rules'
import { ROADMAP_STEPS } from './steps'

export const HOME_AND_LIVING: Track = {
  id: 'home-and-living',
  plainName: 'Home and living',
  purpose:
    'Work out where you could live, how that could be supported, and what to do next.',
  chooser: {
    self: 'Where I could live, and how it could be supported',
    other: 'Where they could live, and how it could be supported',
  },
  questions: QUESTIONS,
  rules: PATHWAY_RULES,
  steps: ROADMAP_STEPS,
}
```

Create `src/tracks/index.ts`:

```ts
import { HOME_AND_LIVING } from './home-and-living'
import type { Track } from './track'

export type { Track } from './track'

/**
 * Every track, in the order they are offered.
 *
 * Adding a track means one entry here and one argument to `composeFields`.
 * Nothing under `src/lib/` imports this module — the builders take what they
 * need as parameters, which keeps the graph acyclic and lets a test substitute a
 * synthetic track.
 */
export const TRACKS: readonly Track[] = [HOME_AND_LIVING]

export type TrackId = 'home-and-living'

export const DEFAULT_TRACK_ID: TrackId = 'home-and-living'

export function trackById(id: string): Track | undefined {
  return TRACKS.find((track) => track.id === id)
}
```

- [ ] **Step 6: Run the test and verify it passes**

Run: `npx vitest run tests/tracks/registry.test.ts`
Expected: PASS, 8 tests. Other suites will still fail to compile — Task 5 fixes them.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Introduce the Track model and move housing into a track

A track owns questions, optionally rules, and steps. It owns no logic.

Rules are optional because not every track compares options: a track can
exist to tell someone who and what they may need, with nothing to score.

Rule schemas move to their own leaf module so a track can define rules
without the engine having to import from src/tracks, which would be a
cycle."
```

---

### Task 5: Thread the track through the shared machinery

**Files:**
- Modify: `src/lib/navigator/question-schema.ts`, `src/lib/conditions.ts`, `src/lib/navigator/flow.ts`, `src/lib/decision-engine/evaluate-pathways.ts`, `src/lib/decision-engine/explain-result.ts`, `src/lib/decision-engine/index.ts`, `src/lib/roadmap/build.ts`, `src/lib/plan/build.ts`
- Modify (import paths only): `tests/decision-engine/evaluate.test.ts`, `tests/navigator/flow.test.ts`, `tests/navigator/personas.test.ts`, `tests/navigator/questions.test.ts`, `tests/plan/build.test.ts`, `tests/roadmap/build.test.ts`, `tests/roadmap/steps.test.ts`, `tests/fixtures/personas.ts`

**Interfaces:**
- Produces:
  - `evaluateFlow(answers: AnswerMap, track?: Track, registry?: FieldRegistry): FlowState` — defaults to `HOME_AND_LIVING` so existing call sites keep working
  - `conditionHolds(profile, condition, registry?): boolean`
  - `buildRoadmap(profile, steps, registry?): readonly RoadmapStep[]`
  - `evaluatePathways(profile, rules, questions): readonly PathwayAssessment[]`
  - `buildPlan(profile, voice, thread, track): Plan`

**The defaulted track parameter is deliberate.** It keeps this task mechanical:
every existing call site compiles unchanged, and the 208 tests prove the refactor
preserved behaviour before any caller is asked to be explicit.

- [ ] **Step 1: Strip the field machinery from `question-schema.ts`**

Delete `PROFILE_FIELDS`, `profileFieldSchema`, `ProfileField`,
`FIELD_VALUE_SCHEMAS`, `readProfileField`, `writeProfileField`, and the now-unused
schema imports. Replace field typing:

```ts
import type { FieldId } from '@/lib/profile/fields'

// In questionOptionSchema.implies and conditionSchema:
//   field: profileFieldSchema   →   field: z.string().min(1)
```

Then declare the compile-time types explicitly, so the runtime schema stays
structural while the field name is still checked:

```ts
export type Condition = {
  field: FieldId
  oneOf?: readonly string[]
  notOneOf?: readonly string[]
  isUnanswered?: boolean
}

export type QuestionOption = Omit<z.infer<typeof questionOptionSchema>, 'implies'> & {
  implies?: readonly { field: FieldId; value: string }[]
}

export type Question = Omit<z.infer<typeof questionSchema>, 'profileField' | 'options' | 'showWhen'> & {
  profileField: FieldId
  options: readonly QuestionOption[]
  showWhen?: readonly Condition[]
}
```

- [ ] **Step 2: Point `conditions.ts` at the registry**

```ts
import { readField, type FieldId } from '@/lib/profile/fields'
import type { FieldRegistry } from '@/lib/profile/field'

export const profileConditionSchema = z.object({
  field: z.string().min(1),
  oneOf: z.array(z.string().min(1)).min(1).optional(),
  notOneOf: z.array(z.string().min(1)).min(1).optional(),
})

export type ProfileCondition = {
  field: FieldId
  oneOf?: readonly string[]
  notOneOf?: readonly string[]
}

export function conditionHolds(
  profile: ParticipantProfile,
  condition: ProfileCondition,
  registry?: FieldRegistry,
): boolean {
  const value = readField(profile, condition.field, registry)
  if (value === null) return false
  if (condition.oneOf && !condition.oneOf.includes(value)) return false
  if (condition.notOneOf && condition.notOneOf.includes(value)) return false
  return true
}
```

Thread the optional `registry` through `allConditionsHold` and `anyConditionHolds`
in the same way. Keep every existing doc comment.

- [ ] **Step 3: Give `evaluateFlow` a track**

In `src/lib/navigator/flow.ts`:

```ts
import { HOME_AND_LIVING } from '@/tracks/home-and-living'
import type { Track } from '@/tracks/track'
import type { FieldRegistry } from '@/lib/profile/field'
import { readField, writeField } from '@/lib/profile/fields'

export function evaluateFlow(
  answers: AnswerMap,
  track: Track = HOME_AND_LIVING,
  registry?: FieldRegistry,
): FlowState {
```

Replace the loop header `for (const question of QUESTIONS)` with
`for (const question of track.questions)`, and swap `readProfileField(profile, …)`
for `readField(profile, …, registry)` and `writeProfileField(profile, …)` for
`writeField(profile, …, registry)`. `evaluateCondition` and `evaluateVisibility`
each take the registry as an extra parameter. Delete the `./questions` import.

- [ ] **Step 4: Make the engine take its inputs**

In `evaluate-pathways.ts`, replace the module-level `PATHWAY_RULES` and
`QUESTIONS` imports with parameters:

```ts
export function evaluatePathways(
  profile: ParticipantProfile,
  rules: readonly PathwayRules[],
  questions: readonly Question[],
): readonly PathwayAssessment[] {
  const questionForField = new Map<string, Question>(
    questions.map((question) => [question.profileField, question]),
  )
  …
}
```

`isUnknown` uses `readField`. Update `explain-result.ts` so `explainPathways`
takes a `Track` and passes `track.rules ?? []` and `track.questions` through, and
re-export from `decision-engine/index.ts`. Add a defaulted `track: Track =
HOME_AND_LIVING` on `explainPathways` so existing call sites compile unchanged.

- [ ] **Step 5: Make the roadmap and plan take their inputs**

`buildRoadmap(profile, steps: readonly RoadmapStep[] = HOME_AND_LIVING.steps, registry?)`
and `explainRoadmap(profile, voice, steps?, registry?)`. Delete the
`@content/journeys/roadmap-steps` import.

In `src/lib/plan/build.ts`, rename `buildHousingPlan` to `buildPlan` and
`HousingPlan` to `Plan`, add `track: Track = HOME_AND_LIVING` as the last
parameter, and pass it to `explainPathways` and `explainRoadmap`. Re-export the
old names as deprecated aliases so `src/lib/plan/index.ts` consumers and the plan
store compile unchanged:

```ts
/** @deprecated Use `buildPlan`. Kept so Phase 1 stays behaviour-preserving. */
export const buildHousingPlan = buildPlan
export type HousingPlan = Plan
```

- [ ] **Step 6: Fix test import paths only**

The three moved modules change path. Update these imports and nothing else:

```
'@/lib/navigator/questions'            → '@/tracks/home-and-living/questions'
'@/lib/decision-engine/rules'          → '@/tracks/home-and-living/rules'
'@content/journeys/roadmap-steps'      → '@/tracks/home-and-living/steps'
```

Run to find every occurrence:

```bash
grep -rn "navigator/questions\|decision-engine/rules\|journeys/roadmap-steps" tests src
```

No assertion, no test name and no expected value may change in this step. If one
has to, stop — the refactor is not behaviour-preserving and the cause needs
finding first.

- [ ] **Step 7: Verify the gate**

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e
```

Expected: all green — the 159 pre-existing unit tests plus everything added in
Tasks 1 to 4, and 49 e2e tests. The number matters less than the shape: confirm
with `git diff --stat` that no test file shows changes beyond import lines, and
with `git log -p -- tests/` that no assertion or expected value moved.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Thread the track through flow, engine, roadmap and plan

Each builder now takes what it needs as a parameter rather than importing
one hard-coded instance, with the housing track as the default so every
existing call site compiles unchanged. That is what lets the 208 tests
prove the refactor preserved behaviour.

Removes PROFILE_FIELDS and its two exhaustive switches. Conditions stay
compile-time checked because FieldId is derived from the composed
registry, so a condition naming a field that does not exist still fails
to typecheck."
```

---

### Task 6: Per-track resume state in the store

**Files:**
- Modify: `src/lib/navigator/store.ts`
- Test: `tests/navigator/store.test.ts` (create)

**Interfaces:**
- Produces: `activeQuestionId: Partial<Record<string, string | null>>` keyed by track id; `answer(questionId, value, trackId?)`, `goTo(questionId, trackId?)`, `goBack(trackId?)`, `activeFor(trackId)`.

- [ ] **Step 1: Write the failing test**

Create `tests/navigator/store.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { migrateNavigatorState } from '@/lib/navigator/store'

describe('migrateNavigatorState', () => {
  it('moves a pre-track active question onto the home and living track', () => {
    const migrated = migrateNavigatorState({
      answers: { perspective: 'self' },
      activeQuestionId: 'current-living',
    })
    expect(migrated.activeQuestionId).toEqual({ 'home-and-living': 'current-living' })
    expect(migrated.answers).toEqual({ perspective: 'self' })
  })

  it('leaves already-migrated state alone', () => {
    const state = {
      answers: {},
      activeQuestionId: { 'home-and-living': 'life-stage' },
    }
    expect(migrateNavigatorState(state).activeQuestionId).toEqual(state.activeQuestionId)
  })

  it('survives state with no active question at all', () => {
    expect(migrateNavigatorState({ answers: {} }).activeQuestionId).toEqual({})
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run tests/navigator/store.test.ts`
Expected: FAIL — `migrateNavigatorState` is not exported.

- [ ] **Step 3: Implement**

In `src/lib/navigator/store.ts`, change the state shape and add the migration:

```ts
type PersistedShape = {
  answers?: Record<string, string>
  /** A bare string is pre-track state: it belonged to home and living. */
  activeQuestionId?: string | Partial<Record<string, string | null>> | null
}

/**
 * Brings stored state forward.
 *
 * The storage key stays at v1 on purpose. Housing question ids did not change,
 * so saved answers are still valid, and bumping the key would discard journeys —
 * "a user returning to a saved journey" is a required end-to-end test.
 */
export function migrateNavigatorState(stored: PersistedShape): {
  answers: Record<string, string>
  activeQuestionId: Partial<Record<string, string | null>>
} {
  const answers = stored.answers ?? {}
  const active = stored.activeQuestionId
  if (typeof active === 'string') {
    return { answers, activeQuestionId: { [DEFAULT_TRACK_ID]: active } }
  }
  return { answers, activeQuestionId: active ?? {} }
}
```

Give the store `version: 1` and `migrate: (stored) => migrateNavigatorState(stored as PersistedShape)`
in the `persist` options, and add a `trackId: string = DEFAULT_TRACK_ID` last
parameter to `answer`, `goTo` and `goBack`, each reading and writing
`activeQuestionId[trackId]` and passing `trackById(trackId)` into `evaluateFlow`.
Add `activeFor(trackId: string): string | null`.

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test`
Expected: PASS. Then `npm run test:e2e` — 49 green, including the saved-journey spec.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Make resume state per track

Someone part-way through two tracks should resume each where they left
it, not be dropped back to one shared position.

The storage key stays at v1 and a migration maps the old scalar active
question onto the home and living track, which is the only track that
existed when it was written. Bumping the key would discard saved
journeys."
```

---

### Task 7: Make call sites explicit

**Files:**
- Modify: `src/app/options/page.tsx`, `src/app/path/page.tsx`, `src/app/my-plan/page.tsx`, `src/app/start/page.tsx`, and the components under `src/components/` that call `evaluateFlow`, `explainPathways`, `explainRoadmap` or `buildHousingPlan`

- [ ] **Step 1: Find every implicit call site**

```bash
grep -rn "evaluateFlow(\|explainPathways(\|explainRoadmap(\|buildHousingPlan(\|buildPlan(" src/app src/components
```

- [ ] **Step 2: Pass the track explicitly at each one**

Import `HOME_AND_LIVING` from `@/tracks/home-and-living` and pass it. The
defaults exist so Task 5 could be mechanical; leaving them in place at call sites
would hide which track a screen is showing, which is the thing Phase 2 needs to
vary.

- [ ] **Step 3: Rename the plan aliases at their call sites**

Replace `buildHousingPlan` with `buildPlan` and `HousingPlan` with `Plan`
throughout `src/components/plan/` and `src/lib/plan/`, then delete the deprecated
aliases added in Task 5 Step 5.

- [ ] **Step 4: Verify the gate**

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e
```
Expected: all green, with no test assertions changed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Pass the track explicitly at every call site

The defaults let the previous commit be mechanical. Leaving them in place
would hide which track a screen is showing, which is exactly what needs
to vary next.

Also drops the deprecated buildHousingPlan and HousingPlan aliases now
that nothing uses them."
```

---

### Task 8: The extensibility contract test

**Files:**
- Create: `tests/tracks/extensibility.test.ts`

This is the task the whole refactor exists to make possible. Everything in spec
§12 is convention, and conventions decay; this is the check.

**Interfaces:**
- Consumes: `defineField`, `composeFields` from `@/lib/profile/field`; `evaluateFlow`; `buildRoadmap`; `allConditionsHold`; `Track`.

- [ ] **Step 1: Write the failing test**

Create `tests/tracks/extensibility.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { composeFields, defineField } from '@/lib/profile/field'
import { SHARED_FIELDS } from '@/lib/profile/shared-fields'
import { HOME_AND_LIVING_FIELDS } from '@/tracks/home-and-living/fields'
import { evaluateFlow } from '@/lib/navigator/flow'
import { buildRoadmap } from '@/lib/roadmap/build'
import { HOME_AND_LIVING } from '@/tracks/home-and-living'
import type { Track } from '@/tracks/track'
import type { Question } from '@/lib/navigator/question-schema'
import type { RoadmapStep } from '@/lib/roadmap/schema'
import type { FieldId } from '@/lib/profile/fields'

/**
 * A track that exists only here.
 *
 * The point is that adding a track needs new files and a registration, and
 * nothing else. If this test ever needs a change to a shared module to pass,
 * extensibility has regressed and that is the finding — not a reason to edit the
 * test.
 *
 * It borrows `goals.change` to stand in for a field of its own, because the
 * production profile has no synthetic branch to write to. Everything else is its
 * own.
 */
const fixtureSchema = z.enum(['yes', 'no', 'unsure'])

const FIXTURE_FIELDS = {
  'fixture.answer': defineField({
    schema: fixtureSchema,
    read: (profile) => (profile.goals.change === null ? null : 'yes'),
    write: (profile, value) => {
      profile.goals.change = value === 'yes' ? 'more_independence' : 'unsure'
    },
  }),
} as const

const REGISTRY = composeFields(SHARED_FIELDS, HOME_AND_LIVING_FIELDS, FIXTURE_FIELDS)

const v = (text: string) => ({ self: text, other: text })

const FIXTURE_QUESTIONS: readonly Question[] = [
  {
    id: 'fixture-perspective',
    purpose: 'Establishes the voice, exactly as a real track would.',
    type: 'single-select',
    profileField: 'perspective',
    question: v('Who are you asking for?'),
    threadLabel: v('Asking for'),
    options: [
      { value: 'self', label: v('Myself'), statement: v('You are asking for yourself.') },
      { value: 'parent', label: v('My child'), statement: v('You are asking for your child.') },
    ],
  },
  {
    id: 'fixture-answer',
    purpose: 'A question owned by the fixture track, conditional on a shared field.',
    type: 'single-select',
    // The fixture owns a field the production FieldId union does not contain,
    // which is the whole point. Casting through unknown says so plainly.
    profileField: 'fixture.answer' as unknown as FieldId,
    question: v('Is this thing true?'),
    threadLabel: v('This thing'),
    options: [
      { value: 'yes', label: v('Yes'), statement: v('It is true.') },
      { value: 'no', label: v('No'), statement: v('It is not true.') },
      { value: 'unsure', label: v("I'm not sure"), statement: v('Not sure yet.'), unsure: true },
    ],
    showWhen: [{ field: 'perspective', oneOf: ['self'] }],
  },
]

const FIXTURE_STEPS: readonly RoadmapStep[] = [
  {
    id: 'fixture-later',
    stage: 'review',
    title: v('Check back later'),
    why: v('Because the stage order should put this last.'),
    understand: [v('Something to understand.')],
    prepare: [v('Something to prepare.')],
    doNow: [v('Something to do.')],
  },
  {
    id: 'fixture-now',
    stage: 'now',
    title: v('Do this first'),
    why: v('Because the stage order should put this first.'),
    understand: [v('Something to understand.')],
    prepare: [v('Something to prepare.')],
    doNow: [v('Something to do.')],
    showWhen: [{ field: 'perspective', oneOf: ['self'] }],
  },
]

const FIXTURE_TRACK: Track = {
  id: 'fixture',
  plainName: 'Fixture',
  purpose: 'Proves a track can be added without touching shared code.',
  chooser: v('A fixture track'),
  questions: FIXTURE_QUESTIONS,
  steps: FIXTURE_STEPS,
}

describe('adding a track', () => {
  it('asks the track its own questions and no others', () => {
    const flow = evaluateFlow({}, FIXTURE_TRACK, REGISTRY)
    expect(flow.visible.map((question) => question.id)).toEqual(['fixture-perspective'])
    expect(flow.current?.id).toBe('fixture-perspective')
  })

  it('reveals a conditional question once the shared field is answered', () => {
    const flow = evaluateFlow({ 'fixture-perspective': 'self' }, FIXTURE_TRACK, REGISTRY)
    expect(flow.visible.map((question) => question.id)).toEqual([
      'fixture-perspective',
      'fixture-answer',
    ])
  })

  it('skips it when the shared field says so, rather than leaving it undetermined', () => {
    const flow = evaluateFlow({ 'fixture-perspective': 'parent' }, FIXTURE_TRACK, REGISTRY)
    expect(flow.visible.map((question) => question.id)).toEqual(['fixture-perspective'])
    expect(flow.current).toBeNull()
  })

  it('writes its own field through the registry and reads it back on the thread', () => {
    const flow = evaluateFlow(
      { 'fixture-perspective': 'self', 'fixture-answer': 'yes' },
      FIXTURE_TRACK,
      REGISTRY,
    )
    expect(flow.thread.map((entry) => entry.statement)).toEqual([
      'You are asking for yourself.',
      'It is true.',
    ])
    expect(flow.answeredCount).toBe(2)
  })

  it('records an unsure answer as an uncertainty', () => {
    const flow = evaluateFlow(
      { 'fixture-perspective': 'self', 'fixture-answer': 'unsure' },
      FIXTURE_TRACK,
      REGISTRY,
    )
    expect(flow.profile.uncertainties).toContain('fixture-answer')
  })

  it('builds its roadmap in shared stage order, not declaration order', () => {
    const flow = evaluateFlow({ 'fixture-perspective': 'self' }, FIXTURE_TRACK, REGISTRY)
    const steps = buildRoadmap(flow.profile, FIXTURE_TRACK.steps, REGISTRY)
    expect(steps.map((step) => step.id)).toEqual(['fixture-now', 'fixture-later'])
  })

  it('omits a step whose condition does not hold', () => {
    const flow = evaluateFlow({ 'fixture-perspective': 'parent' }, FIXTURE_TRACK, REGISTRY)
    const steps = buildRoadmap(flow.profile, FIXTURE_TRACK.steps, REGISTRY)
    expect(steps.map((step) => step.id)).toEqual(['fixture-later'])
  })

  it('leaves the real track untouched by its presence', () => {
    const flow = evaluateFlow({}, HOME_AND_LIVING, REGISTRY)
    expect(flow.current?.id).toBe('perspective')
    expect(flow.visible.some((question) => question.id.startsWith('fixture-'))).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test and verify it fails for the right reason**

Run: `npx vitest run tests/tracks/extensibility.test.ts`
Expected: FAIL. If it fails because a shared module cannot accept a track or a
registry, that is the real finding — go back and fix the seam rather than the
test. If it passes first time, confirm the fixture track is genuinely being
exercised by breaking one assertion deliberately, then restore it.

- [ ] **Step 3: Fix whatever seam the test exposes**

Likely candidates: a builder still importing a hard-coded module rather than
taking a parameter, or a registry parameter not threaded all the way through
`evaluateCondition`. No new production behaviour should be needed.

- [ ] **Step 4: Run the full suite**

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e
```
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Prove a track can be added without touching shared code

Defines a synthetic track in the test file only, composes it into its own
registry, and asserts it flows through questions, profile, thread and
roadmap while leaving the real track alone.

Everything in the spec's extensibility section is convention, and
conventions decay. This is the check. If it ever needs a shared-module
change to pass, extensibility has regressed and that is the finding
rather than a reason to edit the test."
```

---

### Task 9: Update the README and close out Phase 1

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite the structure and layers sections**

Update the `## Structure` tree to show `src/tracks/`, the split of shared versus
track-owned content, and `src/lib/profile/`. Add a short section under
"Architectural decisions worth knowing":

> **Tracks, not one journey.** Housing is one track of several planned. A track
> owns questions, optionally rules, and roadmap steps; it owns no logic. Adding
> one means new files plus one entry in `TRACKS` and one argument to
> `composeFields` — and a test proves it, by defining a synthetic track and
> asserting it flows end to end without a shared module changing.

Remove the `content/journeys` line from the structure tree, since that directory
is gone.

- [ ] **Step 2: Verify and commit**

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e
git add README.md
git commit -m "Document the track model in the README"
```

- [ ] **Step 3: Confirm the Phase 1 gate**

Check all of the following before Phase 2 begins:

- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm test` — all green, and `git log -p` shows no test assertion changed
      except import paths
- [ ] `npm run test:e2e` — 49 green
- [ ] `npm run build` compiles
- [ ] `npm audit` — 0 vulnerabilities
- [ ] No content file changed: `git diff --stat main -- content/` shows only the
      `roadmap-steps.ts` move

---

## Phase 2

Phase 2 — team roles with relationships, evidence as first-class content, the
`/team` and `/reports` screens, the state question, and the navigation reduction —
gets its own plan, written after this gate passes. The spec's §10 requires that
separation: if the registry approach turns out wrong, we find out before it is
carrying content.
