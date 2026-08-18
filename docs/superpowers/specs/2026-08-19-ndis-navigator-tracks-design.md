# Design: from a housing navigator to a multi-track NDIS navigator

**Date:** 2026-08-19
**Status:** Approved for planning
**Supersedes:** nothing. Extends the four-layer architecture already built.

---

## 1. Why

There is a great deal of information online about how the NDIS works, and it is
unclear and confusing. The existing product answers one slice of it well — where
someone could live and how that might be supported — using a guided decision flow
rather than an explanation.

The request is to apply the same method to the rest of the confusion:

1. How do you get funding at all, and what kinds are there?
2. Who do you need in your team, and how do those people relate to each other?
3. What kinds of report do you need to access which kinds of funding?
4. How does someone act on behalf of a person with disability who cannot manage
   dealings with Medicare or a state agency themselves?

The insight that makes this tractable is that the existing pipeline is already
domain-agnostic:

```
answers → structured profile → deterministic rules → results → roadmap → plan
```

Nothing in that chain is about housing. Housing is hard-coded in exactly three
places: the fixed shape of `ParticipantProfile`, the single flat `QUESTIONS`
list, and the single instance each of `PATHWAY_RULES` and `ROADMAP_STEPS`.

So this is mostly an enabling refactor plus content, not a rebuild.

---

## 2. Scope

The request decomposes into five sub-projects. This spec covers **0, B and C**.

| | Sub-project | In this spec |
| --- | --- | --- |
| 0 | Multi-track navigator (enabling refactor) | Yes — Phase 1 |
| B | Your team, and how they relate | Yes — Phase 2 |
| C | Reports and evidence: what unlocks what | Yes — Phase 2 |
| A | Getting into the scheme, and how funding is structured | Deferred |
| D | Deciding, and acting for someone | Deferred |

B and C are specified together because they are one artifact. "Who do I need"
and "what does each of them write" are two views of a single graph, and
splitting them would mean building half a join.

### Non-goals

- No backend, CMS, authentication or LLM. `localStorage` remains the persistence
  layer, behind the existing storage seam.
- No change to housing content. Phase 1 must be behaviour-preserving.
- No directory of real organisations beyond the four already present.
- No jurisdiction content outside New South Wales.
- No graph-visualisation library.

---

## 3. Decisions already taken

Three forks were settled before design:

**First content track: B + C together.** They are one coherent story, they are
the connective tissue the user identified as most confusing, and they are the
best-sourceable of the four asks because they are largely structural rather than
policy claims.

**Jurisdiction: model it now, write NSW content only.** Adding a state field
later would mean retrofitting every piece of content and every condition. The
harm being prevented is concrete: confidently telling someone in Victoria to
apply to a New South Wales tribunal.

**Sources: proceed with the existing honest labelling.** Nine sources are
already unverified and every screen says so. This expansion may add roughly
thirty more, all carrying their source and the words "not yet checked by a
person". The gap grows but stays visible and auditable, and verification remains
a task for someone who can open the pages.

### What can actually be sourced

Probed on 2026-08-19:

| Source | Reachable | Consequence |
| --- | --- | --- |
| `ndis.gov.au` | No — 403 to non-browser requests | NDIS policy detail stays unverified, as today |
| `servicesaustralia.gov.au` | Yes, server-rendered | Acting arrangements and payments sourceable |
| `ncat.nsw.gov.au` | Yes, server-rendered | NSW guardianship process sourceable |
| `tag.nsw.gov.au` | Yes | NSW Trustee & Guardian sourceable |
| `idrs.org.au` | Yes | Referral body for intellectual disability and the law |
| `legalaid.nsw.gov.au` | Yes | Legal referral route |
| `ndiscommission.gov.au` | Yes | Register and compliance, already used |

This produces an asymmetry worth recording: the material raised last in the
request is the best-sourced, and the material raised first is the worst. Two
findings from the same probe also change content:

- Services Australia treats Medicare and Centrelink representation as **one**
  concept — "acting arrangements for Medicare, Centrelink, aged care or child
  support". The user experiences them as two problems. Collapsing them correctly
  is a simplification we can offer.
- **Service NSW is largely the wrong body** for acting on someone's behalf. The
  relevant bodies are Services Australia federally, and NCAT's Guardianship
  Division, NSW Trustee & Guardian and the Public Guardian at state level.
  Correcting that is itself a feature, and belongs to sub-project D.

---

## 4. Architecture

### 4.1 The track model

A track bundles one area of a person's life. It owns questions and declares when
it is worth offering; it does not own logic.

```ts
type Track = {
  id: TrackId                        // 'home-and-living' | 'team-and-reports'
  plainName: string
  purpose: string                    // why this track exists, shown on request
  chooser: CopyVariants              // "Work out who you need around you"
  questions: readonly Question[]
  entryWhen?: ProfileCondition[]     // when offering it makes sense at all
}
```

Layout:

```
src/tracks/
  index.ts                    TRACKS registry, TrackId union
  home-and-living/
    fields.ts  questions.ts  rules.ts  steps.ts  index.ts
  team-and-reports/
    fields.ts  questions.ts  steps.ts  index.ts
```

Everything shared stays shared and gains a track parameter: `evaluateFlow`,
`buildRoadmap`, `buildHousingPlan` (renamed `buildPlan`). The decision engine is
unchanged in kind — `team-and-reports` simply has no pathway rules, because it
does not match a person to options; it tells them who and what they may need.

This is a deliberate asymmetry. Not every track produces a match assessment. The
match engine stays specific to tracks that compare options, and the roadmap and
plan are the parts every track uses.

### 4.2 The field registry

The blocker is `PROFILE_FIELDS`: a closed enum with two exhaustive `switch`
statements over it, currently 110 lines for 11 fields. That is honest
boilerplate at 11 and 400 lines of it at 40.

Replace with per-field definitions composed into one literal:

```ts
// src/lib/profile/field.ts
export type FieldDef<T extends string> = {
  schema: z.ZodType<T>
  read: (profile: ParticipantProfile) => T | null
  write: (profile: ParticipantProfile, value: T) => void
}

export function defineField<T extends string>(def: FieldDef<T>): FieldDef<T> {
  return def
}
```

```ts
// src/lib/profile/registry.ts
export function composeFields<const T extends readonly Record<string, FieldDef<never>>[]>(
  ...groups: T
): UnionOf<T> {
  return Object.assign({}, ...groups)
}
```

```ts
// src/tracks/index.ts
export const FIELDS = composeFields(
  sharedFields,
  homeAndLivingFields,
  teamAndReportsFields,
)

export type FieldId = keyof typeof FIELDS
```

Composition is a **function** rather than an inline object literal for one
specific reason: it lets a test compose its own registry containing a synthetic
track, which is what makes the extensibility contract test in §12.7 possible. A
hard-coded literal would make the production registry the only registry that can
exist, and extensibility would be a claim rather than something we check.

**Why this preserves the guarantee that matters.** Deriving `FieldId` from the
object literal keeps compile-time checking of every condition, clause and rule:
a reference to a field that does not exist still fails to typecheck, exactly as
the enum ensured. And because `schema` and `write` share the type parameter `T`,
a field still cannot be given a value its schema rejects.

What is lost is the compiler forcing a central switch to handle each new field.
That is replaced by a registry-integrity test (§7), which is a strictly stronger
check because it also catches a field that nothing ever asks about.

`readField` and `writeField` become four lines each, delegating to the
definition and parsing through its schema. `writeField` keeps its current
contract of returning `false` on an invalid value, so a stale saved answer is
dropped rather than corrupting the profile.

Three files import `profileFieldSchema` today — `conditions.ts`, `rules.ts` and
`question-schema.ts`. All three change to `FieldId`. The blast radius is
contained and mechanical.

### 4.3 Profile changes

The profile stays one explicitly typed object with named branches. CLAUDE.md
requires the dimensions be visible in the model, so nothing becomes a bag of
keys. New branches:

```ts
context: {
  lifeStage, timing, ndis,
  state: stateSchema.nullable(),          // NEW: 'nsw' | 'other' | 'unsure'
}
team: {
  coordination: coordinationSchema.nullable(),
  planManagement: planManagementSchema.nullable(),
  hasAlliedHealth: hasAlliedHealthSchema.nullable(),
  advocacyNeed: advocacyNeedSchema.nullable(),
}
evidence: {
  recentAssessment: recentAssessmentSchema.nullable(),
  requestInProgress: requestInProgressSchema.nullable(),
}
```

Every new enum includes `unsure`, as all existing ones do.

---

## 5. Track B + C content model

Two new content types. The map the user asked for is a **view** over them, not a
third dataset.

### 5.1 Roles gain relationships

The existing `organisationSchema` models roles as kinds of help, which is right,
but has nowhere to record how roles relate. That is the actual question being
asked. Extend it:

```ts
type RoleRelationship = {
  to: RoleId
  kind:
    | 'funded_by'            // paid from a plan budget, or not paid at all
    | 'reports_to'           // who receives their written work
    | 'refers_to'            // who they send you to next
    | 'coordinates'          // who organises whom
    | 'independent_of'       // deliberately not connected
    | 'often_confused_with'  // the muddle, named
  note: string               // one line: what it means in practice
}
```

Two kinds do the heavy lifting and justify the whole addition:

- `often_confused_with` puts the Support Coordinator / Plan Manager / Local Area
  Coordinator muddle **in the data model** rather than in prose, where it can be
  rendered consistently everywhere those roles appear.
- `independent_of` exists because an advocate being independent of your
  providers *is* the point of an advocate, and that fact currently has nowhere
  to live.

Roles also gain:

```ts
whoPays: FundingSource[]      // dimension 4, kept separate as CLAUDE.md requires
writes: EvidenceId[]          // the join to reports
doesNotDo: string[]           // honest limits, mirroring pathway `mayNotFit`
```

`howToFind` and `questionsToAsk` stay. Roles still never name an organisation —
the existing test enforcing that remains.

### 5.2 Evidence becomes first-class

Today evidence is free-text strings on a pathway, deduplicated by wording. That
cannot answer "what does this report unlock", and it is why editing a checklist
item's text loses its tick. Promote it:

```ts
type EvidenceItem = {
  id: EvidenceId
  plainName: string           // "A report on what you can do day to day"
  formalName?: string         // "Functional Capacity Assessment"
  acronym?: string
  whatItShows: ThreeLevel
  whoCanWriteIt: RoleId[]     // joins back to roles
  supports: SupportedRequest[]
  howToGetOne: string[]
  whoPays: FundingSource[]
  mayNotBeNeededWhen?: ProfileCondition[]
  questionsToAsk: string[]
  jurisdiction?: 'nsw'
  sources: Source[]
}

type SupportedRequest = {
  requestId: RequestId
  relationship: 'usually_expected' | 'may_be_asked_for' | 'sometimes_helps'
  note: string
}
```

Two deliberate constraints:

**There is no `required`.** We do not get to state NDIS requirements.
`usually_expected` is the strongest thing the product ever says, and any use of
it must carry an official source. A test rejects requirement language in these
notes, extending the existing eligibility-language test.

**`mayNotBeNeededWhen` is not optional decoration.** A navigator that only ever
adds reports to someone's list is doing half a job — assessments cost money and
time, and telling someone they may not need one is as valuable as telling them
they might.

### 5.3 Requests

`RequestId` names the things a person actually lodges — an access request, a home
and living request, an assistive technology request, a plan review. These already
exist implicitly in roadmap steps and funding `howToApply`. Naming them gives the
evidence join something stable to point at.

### 5.4 The map is a view

From roles ⇄ evidence ⇄ requests, three renderings of one dataset:

| View | Question answered |
| --- | --- |
| Roles filtered by profile | Who might you need around you? |
| Evidence filtered by live requests | What might you be asked for? |
| Reverse index from an evidence item | What does this report help with? |

Bidirectional integrity is a test, not a convention: every `writes` has a
matching `whoCanWriteIt` and vice versa. Two halves of a hand-maintained join
drift silently otherwise.

---

## 6. Presentation

### 6.1 Routes

- `/start` gains a track chooser: what would you like to work out?
- `/team` — the roles that may matter, with relationships.
- `/reports` — what may be asked for, and what each report supports.
- `/my-plan` aggregates across tracks. It already derives everything, so this is
  gathering rather than new state.
- `/learn` becomes an index of reference material.
- Existing housing routes unchanged.

**Navigation does not grow with the number of tracks.** This is a hard
constraint, and it comes from evidence rather than taste: `SiteNav` already
carries six items, and adding the sixth is what crushed the wordmark on mobile
and needed fixing in its own pull request. Eight would break it again, and a
navigation bar that gains an item per track cannot survive four more tracks.

So the primary navigation is reduced to the four layers plus one reference area,
and becomes fixed:

| Before (6) | After (5) |
| --- | --- |
| Your situation · Your options · Your pathway · Your plan · Funding · Who can help | Your situation · Your options · Your pathway · Your plan · Learn |

`/funding`, `/organisations`, `/team` and `/reports` are reached from `/learn`
and from contextual links inside the pathway and the plan, where they are
actually relevant. This is better on its own terms — reference material belongs
next to the decision it informs, not in a top-level bar — and it means primary
navigation stays constant no matter how many tracks exist.

### 6.2 Relationships are not a diagram

A force-directed graph is the tempting answer and it is the wrong one. It fails
as a primary representation under WCAG 2.2 AA, and CLAUDE.md rules out large
matrices and dense grids for core decision tasks.

Relationships render as short labelled lists beneath each role:

> **Often confused with** a plan manager — a plan manager pays invoices from
> your plan; a support coordinator helps you decide what to spend it on.

Screen-reader native, keyboard native, and it carries the same information a
diagram would. `often_confused_with` is rendered as a contrast pair because that
is the only form in which the distinction is actually useful.

### 6.3 Naming

The product is currently titled "Home and living navigator", which stops being
true when housing is one track of several. Retitle to **NDIS navigator**. The
repository name stays `ndis-housing`; renaming it would break the deployment for
no user benefit.

---

## 7. Testing

Phase 1 gate — all existing tests pass unchanged. 208 tests, no housing content
edits. If Phase 1 needs a housing content change to go green, the refactor is
wrong.

New tests:

| Test | What it prevents |
| --- | --- |
| Registry integrity | A field referenced by a question, clause or step that does not exist; a registered field nothing asks about |
| Round-trip per field | A field whose `read` and `write` disagree |
| Role ⇄ evidence integrity | The two halves of the join drifting apart |
| No requirement language | "required", "must provide", "you need to have" in evidence notes |
| No jurisdiction leakage | NSW-tagged content reaching a non-NSW profile |
| Track isolation | A track's questions writing to a field owned by another track. Shared fields — perspective, context — are writable by any track; another track's own fields are not. |
| Relationship targets resolve | A relationship pointing at a role that does not exist |
| Question id uniqueness | Two tracks claiming the same question id, silently sharing an answer |
| **Adding a track** (§12.7) | Extensibility regressing — a new track needing edits to shared modules |

New personas, added to `tests/fixtures/personas.ts` and reused by Playwright:

- Someone with no NDIS plan yet, exploring what team they would need.
- A parent trying to act for their adult child, unsure of everything.
- Someone with a plan and a coordinator, wanting to know what report unlocks a
  home and living request.

---

## 8. Persistence and migration

`NAVIGATOR_STORAGE_KEY` stays at `ndis-housing.journey.v1`. Housing question ids
do not change, so existing saved answers stay valid, and the store already drops
answers that fail to parse. Bumping the key would discard saved journeys, and "a
user returning to a saved journey" is one of CLAUDE.md's required end-to-end
tests.

The store's single `activeQuestionId` becomes **per track**:

```ts
activeQuestionId: Partial<Record<TrackId, string | null>>
```

Someone part-way through two tracks should resume each where they left it, not be
dropped back to one shared position. Migration is one line: an existing scalar
`activeQuestionId` belongs to the home-and-living track, since that is the only
track that existed when it was written.

Answers stay in one flat map keyed by question id, which requires **question ids
to be globally unique across tracks**. New tracks prefix their ids with the track
name (`team-coordination`, `team-plan-management`); the existing housing ids stay
unprefixed because renaming them would discard saved journeys for no benefit. A
uniqueness test guards the convention, since the failure is silent — two tracks
would quietly share one answer.

The `localStorage` privacy question is unchanged by this work and remains open,
but it gets worse in kind: the profile will now hold information about someone's
decision-making capacity and team. That is more sensitive than housing
preferences, and it strengthens the existing argument for addressing the storage
question before real users.

---

## 9. Risks

**Scale.** Phase 1 plus Phase 2 is more code than any previous phase. Mitigated
by the hard gate between them: the refactor lands and proves itself green before
any new content is written, so if the registry approach is wrong we find out
before it is carrying content.

**Unverified content grows threefold.** Accepted deliberately (§3). The honesty
labelling is load-bearing rather than cosmetic, and the source-schema refusal to
mark anything verified without dates continues to enforce it.

**Evidence content is the most likely to be quietly wrong.** Which report
supports which request is exactly the kind of claim that sounds authoritative
and changes without notice. Hence no `required`, mandatory sources on
`usually_expected`, and `mayNotBeNeededWhen`.

**Role relationships encode opinion.** Saying a support coordinator is "often
confused with" a plan manager is a claim about people, not policy. These notes
must describe the distinction rather than advise which to choose.

---

## 10. Phasing

**Phase 1 — Multi-track navigator.** Field registry; `Track` model; housing
moved to `src/tracks/home-and-living` unchanged; `context.state` added; flow,
roadmap and plan take a track. Gate: 208 existing tests green, no content change,
lint and typecheck clean.

**Phase 2 — Team and reports.** Role relationships; evidence promoted to
first-class content; requests named; `/team` and `/reports`; plan aggregates
across tracks; new personas and tests; retitle to NDIS navigator.

---

## 11. Deferred, and why

**A — Getting in, and how funding is structured.** Access request process, the
core / capacity building / capital budget structure, and plan management
(agency-managed, plan-managed, self-managed) as its own axis. Deferred because it
is the worst-sourced part of the request: `ndis.gov.au` blocks automated reading,
so nearly all of it would be unverified. Some of it exists already at `/funding`.

**D — Deciding, and acting for someone.** Deferred as its own spec because it
carries the most risk, not because it matters least — it is the best-sourced of
the four asks.

Its design position is settled in advance: the track is ordered
**least-restrictive first**. Supported decision-making, then informal help, then
an NDIS nominee or a Services Australia acting arrangement, and only then
enduring guardianship, an enduring power of attorney, or an NCAT guardianship or
financial management order.

The reason is that the framing in the original request — managing things on
behalf of someone who cannot understand them — assumes substitution is the
answer, and frequently it is not. A tool that presents guardianship alongside
lighter options as equivalent choices will push people toward it. The track must
be as willing to tell someone they may not need an order as to explain how to
seek one.

It also cannot advise. Guardianship, financial management and powers of attorney
are legal instruments, and CLAUDE.md forbids legal advice. The track explains
processes, names the responsible bodies, and routes to the Intellectual
Disability Rights Service and Legal Aid NSW. It never recommends an instrument.

---

## 12. Adding a track later

Sub-projects A and D are already known, and others will follow. So the cost of
adding a track is itself a design requirement, not something to discover on the
third one. The target is that a new track is **additive**: new files, plus a
handful of one-line registrations, and nothing else.

### 12.1 The registration points

Adding a track means editing exactly these, and this list is meant to be
exhaustive:

| # | File | Edit |
| --- | --- | --- |
| 1 | `src/tracks/<id>/` | New directory: `fields.ts`, `questions.ts`, `steps.ts`, `index.ts`, and `rules.ts` only if the track compares options |
| 2 | `src/types/profile.ts` | One new branch, and its default in `createEmptyProfile()` |
| 3 | `src/tracks/index.ts` | One argument to `composeFields`, one entry in `TRACKS` |
| 4 | `src/app/<route>/page.tsx` | Only if the track needs its own presentation |

Four touch points, three of them a single line. `TrackId` and `FieldId` are both
derived, so neither is a separate edit.

The profile branch in (2) is the one irreducible coupling. The alternative — a
per-track bag of untyped keys — would remove the edit but cost the typed profile
and the visible dimensions that CLAUDE.md requires. One explicit branch per track
is the right trade.

### 12.2 What must not change

A new track must not require edits to any of these. If it does, the model has
failed and the fix belongs in the model rather than the track:

`conditions.ts` · `navigator/flow.ts` · `navigator/store.ts` ·
`decision-engine/*` · `roadmap/build.ts` · `plan/build.ts` ·
`copy/perspective.ts` · `lib/content/schema.ts` · `components/SiteNav.tsx` ·
any existing track.

`SiteNav` is on that list deliberately. See §6.1: navigation is fixed-size, and a
track earning a nav item is exactly how this stops scaling.

### 12.3 Shared content, and content a track owns

The split matters more than it first appears:

| Shared — `content/` | Owned by a track — `src/tracks/<id>/` |
| --- | --- |
| `sources` · `funding` · `organisations` (roles) · `evidence` · `requests` · `providers` | `pathways` · `rules` · `steps` |

Roles and evidence are **shared**, not owned by the team-and-reports track. That
track presents them; it does not own them. A support coordinator matters to
housing as much as to team planning, and a housing-specific report belongs in
shared evidence tagged to the housing request, not buried inside the housing
track.

Getting this backwards would mean the second track that needs a role has to
either duplicate it or reach into another track's directory, and both are how
this kind of model rots.

### 12.4 Question ids and resume

Covered in §8: ids are globally unique and new tracks prefix them; resume state is
per track. Both are consequences of one flat answer map, which is worth keeping
because it is what lets a saved journey be replayed after the question set
changes.

### 12.5 The stage vocabulary stays shared

`ROADMAP_STAGES` remains one ordered list used by every track, rather than each
track defining its own. The reason is `/my-plan`: it aggregates across tracks, and
two private orderings cannot be reconciled into one coherent sense of what comes
first.

Unused stages are simply invisible, so `move` being housing-flavoured costs a
team track nothing. Adding a stage is a deliberate cross-track act and should be
rare.

Roadmaps are presented **per track**. The plan aggregates the flat lists —
evidence, questions to ask, next actions — rather than interleaving two roadmaps
into a single sequence that implies an order nobody designed.

### 12.6 Navigation

See §6.1. Primary navigation is fixed at five items and does not grow with
tracks. Track pages are reached from `/learn` and from contextual links where
they are relevant.

### 12.7 The contract test

Everything above is convention, and conventions decay. The guarantee is a test.

`tests/tracks/extensibility.test.ts` defines a **synthetic track** that exists
only in the test file — two questions, two profile fields, two roadmap steps, no
rules — composes it into a registry alongside the real tracks, and asserts it
flows end to end:

1. Its questions appear in `evaluateFlow` for its own track and in no other.
2. Answering them writes to the profile through `writeField`.
3. Its conditions can read a shared field (`perspective`) and its own fields.
4. Its roadmap steps build and sort correctly against the shared stages.
5. Its contributions reach the aggregated plan.
6. The real tracks are unaffected by its presence.

The test imports nothing from `src/tracks/<real track>/` and adds no production
code. If a future change makes the synthetic track need a shared-module edit to
work, this test fails, and that failure is the signal that extensibility has
regressed.

This is why §4.2 composes the field registry through a function rather than an
inline literal: a test cannot add a track to a hard-coded object.

### 12.8 Known limits of the model

Honest about what a future track may strain:

- **Question types.** `type` is currently `z.literal('single-select')`. A track
  needing multi-select, a number, or free text is the most likely first strain.
  The schema is shaped to be widened by adding a variant, but no other type is
  designed or tested yet, so the first track needing one carries that work.
- **Cross-track rules.** Cross-track *conditions* are safe, because there is one
  profile and an unanswered field never satisfies a condition. Cross-track
  *scoring* — a pathway in one track whose match depends on another track being
  finished — is not modelled, and would need a way to express "this assessment is
  incomplete until you have also done that track".
- **Jurisdiction beyond NSW.** `context.state` distinguishes NSW from elsewhere
  but does not model other states. Covering a second state means content, not
  architecture.
- **One flat answer map.** Fine at tens of questions across a handful of tracks.
  If the question set grows by an order of magnitude, per-track namespacing in
  storage becomes worth doing, and the storage seam is where that would happen.
