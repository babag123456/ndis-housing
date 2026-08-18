# Home and living navigator

A guided navigator that helps a person with disability, a parent, a carer, a family
member or a professional work out which housing and support options may suit, what
may be funded, what evidence may be needed, and what to do next.

It is not an information website. It asks one question at a time, builds a
structured picture of the person's situation, and turns that into explained
options, an ordered pathway, and a plan.

**[CLAUDE.md](CLAUDE.md) is the governing product and engineering specification.**
This README describes what has been built against it and why.

---

## What it does not do

The product never states that anyone qualifies, is eligible, is approved, or will
receive funding or an amount. It says what may be relevant and what a request is
usually decided on. The NDIS makes the decision.

This is enforced, not just intended: tests reject eligibility language, unhedged
funding claims, and dollar figures anywhere in the content or in the reasons the
engine gives.

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm test` | Vitest — content, engine, roadmap, plan |
| `npm run test:e2e` | Playwright, against a production build |

> **Note on `next dev`:** on some machines Turbopack's dev server returns 403 for
> its own JS chunks, leaving the interactive screens stuck on their loading state.
> The production build is unaffected, which is why the Playwright suite runs
> `next build && next start` rather than the dev server.

---

## The four layers

The specification asks for four connected layers, and they are kept genuinely
separate — each one can be tested without the ones above it.

### 1. Understand me — `src/lib/navigator/`

A conditional question flow. Eleven questions, three of them skipped when earlier
answers make them pointless, and "I'm not sure" available wherever a person may
genuinely not know.

Questions are **data, not code** ([questions.ts](src/lib/navigator/questions.ts)):
each declares its conditions, the profile field it writes to, and how each answer
reads back in plain English.

### 2. Match options — `src/lib/decision-engine/`

Deterministic. No LLM, no randomness, no weights.
[rules.ts](src/lib/decision-engine/rules.ts) is explicit configuration where each
condition carries the sentence shown when it fires, so a reason and the logic that
produced it cannot drift apart. [evaluate-pathways.ts](src/lib/decision-engine/evaluate-pathways.ts)
is a pure function from profile to assessment.

Four states: `strong_match`, `worth_exploring`, `needs_more_information`,
`lower_relevance`. The resolution order **is** the policy, so it is written as one
readable sequence rather than spread across the rules.

### 3. My pathway — `src/lib/roadmap/`

Steps are data with declarative conditions, and order comes from the *stage* a step
belongs to. This is what makes urgency a **reordering rather than a relabelling**:
someone whose situation cannot hold gets "Sort out somewhere safe to stay now" as
step one; someone with a year does not get it at all.

### 4. My plan — `src/lib/plan/`

Derived, not stored. The evidence checklist gathers items from the options that may
suit, lists each **once**, and names which options need it.

---

## Architectural decisions worth knowing

**Answers are the only source of truth.** The profile, visible questions, thread,
pathway results, roadmap and plan are all derived on every read. There is no second
copy to go stale, changing an answer cannot leave a contradiction behind, and a
saved journey can be replayed after the question set changes.

**Nothing is deleted when a person goes back.** An answer that no longer applies
becomes inactive but is kept — they may change back. It is never applied to the
profile while inactive.

**One perspective layer, not two journeys.** Each phrase is authored once per
perspective ([perspective.ts](src/lib/copy/perspective.ts)) and resolved at render.
The engine and roadmap return unresolved copy so they can be tested without a
voice. Note this uses second person (`you` / `they`) rather than the
specification's sketched `I` / `they`, matching the specification's own examples.

**The four dimensions stay apart.** Where someone lives, how they are supported,
who provides it and who pays are four separate things in
[domain.ts](src/types/domain.ts). Most confusion in this system comes from treating
them as one.

**Functional needs only.** There is no diagnosis in the profile, so no rule can read
one. Every condition is about function, preference, timing or the building. A test
asserts high support needs do not imply a specialist building requirement.

**Sources cannot lie about themselves.** The source schema *refuses* a
`verified: true` without retrieved and reviewed dates, and a test proves the
refusal.

---

## Accessibility

Treated as the product, not a pass at the end. Native `fieldset` / `legend` /
`input` and native `details` / `summary` throughout rather than ARIA
reimplementations; the interface face is **Atkinson Hyperlegible**, designed by the
Braille Institute for readers with low vision; every text colour pair was measured
against WCAG 2.2 AA rather than guessed (the figures are in
[globals.css](src/app/globals.css)).

Nothing auto-advances — choosing and continuing are separate steps so a screen
reader user can hear every option first. Focus follows the person only after they
act, never on load, so the skip link is reachable. No information is conveyed by
colour alone. Reduced motion is respected.

---

## Structure

```
content/            Pathways, funding, organisations, roadmap steps, sources
src/app/            Routes: / /start /options /path /my-plan /funding /organisations /learn
src/components/     Presentation only
src/lib/
  conditions.ts     One shared way of asking a question of the profile
  copy/             The perspective layer
  navigator/        Question schema, questions, flow engine, store
  decision-engine/  Rules, evaluation, explanation
  roadmap/          Roadmap schema and builder
  plan/             Plan derivation, progress, persistence-backed ticks
  content/          Content schemas
  persistence/      The storage seam
src/types/          Domain dimensions and the participant profile
tests/              content · decision-engine · roadmap · plan · navigator · e2e
```

---

## Outstanding decisions

These need a person, not more code.

1. **The nine source URLs are unverified.** They are the canonical pages for their
   topics, but nobody has opened them and confirmed they support the wording here —
   `ndis.gov.au` returns 403 to non-browser requests, so it could not be checked
   automatically. Every screen says so. This is the largest gap between this build
   and real users, because the product's whole claim is that it does not invent NDIS
   rules. To verify one: open it, set `verified: true`, and fill in the dates.

2. **`localStorage` holds information about a person's disability in plain text** on
   the device — answers, life stage, and progress. Worth a decision before real
   users. The [storage seam](src/lib/persistence/journey-storage.ts) exists so this
   can move without touching the journey code.

3. **No named organisations.** [content/organisations](content/organisations/index.ts)
   describes *roles* rather than services, because a real directory needs verified,
   current, state-by-state data and an invented one would send someone to a number
   that may not answer. A test enforces this.

## Known limitations

- **JavaScript is required.** The interactive screens server-render a loading state
  while saved answers are read; there is no no-JS fallback. Real progressive
  enhancement needs server actions and form posts.
- **No notion of a confirmed longer-term home**, which is why Medium Term
  Accommodation cannot rise above "worth exploring". Asking that question is the
  clean fix and would sharpen both the engine and the roadmap.
- **Checklist ids derive from wording**, so editing an item's text loses its tick.
- **`shadcn/ui` is not installed.** Phase one needed one radio group, and native
  controls beat a Radix reimplementation for screen readers and voice control. The
  `cn()` helper and CSS-variable tokens are in place so it drops in unchanged.
