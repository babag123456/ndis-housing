# CLAUDE.md

## Product

This repository contains a guided NDIS housing navigator.

The product exists to help a person with disability, parent, carer, family member, or professional understand realistic housing and support pathways, what may be funded, what evidence may be needed, and what to do next.

This is not primarily an information website. It is a guided decision and action system.

The core user questions are:

1. What could I do?
2. What might suit me or the person I support?
3. What might be funded?
4. What evidence or information is needed?
5. What do I do next?

Every major feature should help answer one or more of these questions.

---

## Product principles

### 1. Start with the person's goal, not NDIS terminology

Do not lead with acronyms, program names, policy language, or funding categories.

Bad:
- "Are you interested in SIL, SDA or ILO?"

Good:
- "How would you like to live?"
- "How much support is needed at home?"
- "Does the home need special physical features?"

Only introduce formal NDIS terms after the user's situation has been understood.

### 2. Avoid acronyms until they become useful

On first mention, always use the full term:
- Specialist Disability Accommodation
- Supported Independent Living
- Individualised Living Options

Only introduce the acronym in brackets after the full term:
- Specialist Disability Accommodation (SDA)

Once introduced within a journey, the acronym may be used where it improves readability.

Do not assume the user already knows NDIS terminology.

### 3. Adapt language to who the user is helping

The first part of the journey must establish who the user is:

- Person with disability / "I'm exploring for myself"
- Parent
- Carer
- Family member
- Support coordinator / professional / other supporter

After this is known, all subsequent questions, summaries and recommendations must adapt pronouns and perspective.

For a person exploring for themselves:
- "Where do you live now?"
- "How would you like to live?"
- "How much help do you need at home?"

For a parent, carer, family member or professional:
- "Where do they live now?"
- "How would they like to live?"
- "How much help do they need at home?"

Do not awkwardly repeat "the person you support" in every sentence. Use "they/them/their" after the relationship is established.

The application should store this as structured state, not solve it through hard-coded duplicate pages.

Suggested state:

```ts
type UserPerspective =
  | "self"
  | "parent"
  | "carer"
  | "family"
  | "professional"
  | "other";

type PronounContext = {
  subject: "I" | "they";
  object: "me" | "them";
  possessive: "my" | "their";
};
```

Prefer reusable copy helpers or structured copy variants over scattered conditional strings.

### 4. Progressive disclosure

Ask one clear question at a time.

Do not display long forms unless there is a strong usability reason.

Questions should:
- use plain English
- have a clear reason for being asked
- avoid clinical language where possible
- allow "I'm not sure"
- avoid requiring exact knowledge the user may not have
- progressively narrow the relevant pathways

Users should never need to understand the whole NDIS housing system before they can proceed.

### 5. Explain recommendations

Never present a pathway recommendation without explaining why.

Each result should support:

- Why am I seeing this?
- What did my answers suggest?
- What is uncertain?
- What could change this?
- What should I do next?
- Which official sources support this?

Good:
> This may be worth exploring because you told us they want to move from the family home, need regular support, and want more choice over who they live with.

Bad:
> You qualify for ILO.

### 6. Never make eligibility determinations

The application must not state that a person:
- qualifies
- is eligible
- is approved
- will receive funding
- will receive a particular amount

Use language such as:
- "may be relevant"
- "worth exploring"
- "appears less likely based on your answers"
- "the NDIS will make the final decision"
- "you may need more evidence"

The software is a navigator, not an eligibility assessor.

### 7. Functional needs before diagnosis

Do not infer housing pathways directly from diagnosis, age, wheelchair use, autism, intellectual disability, or another label.

Prioritise:
- functional needs
- frequency and intensity of support
- overnight support needs
- safety
- environmental requirements
- living preferences
- independence goals
- informal supports
- current living arrangements
- desired living arrangements
- specialist housing requirements

Diagnosis may provide context but must not directly determine pathway matching.

---

## Experience architecture

The product should have four connected layers.

### 1. Understand me

A guided question flow that captures the person's circumstances, needs, goals and preferences.

### 2. Match options

A deterministic rule engine assesses which pathways are:
- strong match
- worth exploring
- possible but more information needed
- lower relevance

### 3. My pathway

Generate a personalised roadmap showing:
- what to understand
- what to prepare
- what to do
- evidence that may be needed
- forms
- organisations
- conversations
- decisions
- funding considerations

### 4. Take action

Help the user act:
- official links
- forms
- evidence checklists
- questions to ask
- organisations and providers
- saved tasks
- progress tracking

---

## Core navigation

Prefer goal-based navigation over NDIS-category navigation.

Suggested primary navigation:

- Start
- My options
- My pathway
- Funding
- Organisations
- Learn
- My plan

Formal pathways may appear within "Learn" and in personalised results.

---

## Guided journey

The opening journey should establish:

1. Who are you helping?
2. What is happening now?
3. What are you hoping to change?
4. What kind of living arrangement would be preferred?
5. What level of day-to-day support is needed?
6. Is overnight support needed?
7. Does someone need to be available most or all of the time?
8. Are specialist physical housing features likely to be needed?
9. What informal support is currently available?
10. Is there a time pressure or transition involved?
11. What NDIS planning/support context exists?
12. What is still uncertain?

Do not ask all of these if earlier answers make later questions irrelevant.

Use conditional branching.

Always provide a safe "I'm not sure" path.

---

## Pathway model

Initial pathways should include, at minimum:

- Assistance with Daily Life
- Individualised Living Options
- Supported Independent Living
- Specialist Disability Accommodation
- Home modifications
- Medium Term Accommodation where relevant
- Mainstream/private/community/social housing pathways where relevant

Do not treat housing, support, provider and funding source as the same concept.

Model these separately.

### Housing

Where the person lives:
- private rental
- owned home
- family home
- community/social housing
- Specialist Disability Accommodation
- other

### Support

How the person is supported:
- Assistance with Daily Life
- Individualised Living Options
- Supported Independent Living
- informal support
- other supports

### Provider

Who provides a service:
- registered providers
- platforms/providers such as Hireup
- independent workers where relevant
- housing providers
- advocates
- allied health professionals

### Funding

Who pays for what:
- NDIS
- Disability Support Pension
- Commonwealth Rent Assistance
- state housing assistance
- personal income
- other mainstream supports

Keep these dimensions independent in the data model.

---

## Decision engine

Pathway matching must be deterministic, explainable and testable.

Do not use an LLM to decide whether a pathway matches.

Recommended flow:

```text
User answers
  ↓
Structured participant profile
  ↓
Deterministic rule engine
  ↓
Pathway scores / states
  ↓
Reasons + uncertainties
  ↓
Personalised explanation
```

Rules must live outside React components.

Suggested types:

```ts
type MatchState =
  | "strong_match"
  | "worth_exploring"
  | "needs_more_information"
  | "lower_relevance";

type EvidenceSignal = {
  key: string;
  value: boolean | number | string | null;
  sourceQuestionId?: string;
};

type PathwayResult = {
  pathwayId: string;
  state: MatchState;
  reasons: string[];
  uncertainties: string[];
  nextQuestions?: string[];
};
```

Prefer explicit rule configuration to deeply nested conditional code.

All decision rules require automated tests.

---

## Content model

Content must be structured and source-aware.

Suggested structure:

```text
/content
  /pathways
  /journeys
  /funding
  /forms
  /evidence
  /organisations
  /providers
  /sources
```

Each substantive factual item should support metadata such as:

```ts
type SourceMetadata = {
  sourceUrl: string;
  sourceName: string;
  sourceType: "official" | "provider" | "advocacy" | "other";
  jurisdiction?: string;
  retrievedAt: string;
  reviewedAt: string;
};
```

Prefer official sources for policy and eligibility information.

Provider websites may describe their own services but should not be treated as authoritative sources for NDIS policy.

Keep source information visible to users where useful.

---

## Content design

Every important concept should support three levels of detail:

### Simple

One or two sentences in plain English.

### Tell me more

Enough information to understand the practical implications.

### Detail

Formal terminology, conditions, exceptions and official sources.

Do not force users through the detailed version.

---

## Personalised results

Results should be written in human terms first.

Example:

### Worth exploring

**Build a living arrangement around the person**

This may involve **Individualised Living Options (ILO)**.

Why this may fit:
- They want more choice over who they live with.
- They need regular support.
- A standard group-home model is not their preference.

Then provide:
- What this means
- Why it may fit
- What may not fit
- What to ask
- What evidence may be needed
- Funding considerations
- Official source

Formal NDIS names are explanations of the option, not the primary user-facing concept.

---

## My Housing Plan

The product should progressively build a persistent plan containing:

- About the person
- Current living situation
- Goals
- Preferences
- Support needs
- Possible pathways
- Lower-relevance pathways
- Questions still unanswered
- Evidence checklist
- Forms
- Organisations
- Questions to ask
- Next actions
- Progress

Initially this may use local storage.

Design the state model so persistence can later move to a backend without rewriting the core experience.

---

## Information architecture

Suggested app routes:

```text
/start
/explore
/options
/path
/funding
/organisations
/learn
/my-plan
```

Suggested source structure:

```text
/src
  /app
  /components
    /navigator
    /pathway
    /timeline
    /comparison
    /explainers
    /sources
    /plan
  /lib
    /decision-engine
    /content
    /copy
    /sources
    /validation
  /types
/content
/tests
  /decision-engine
```

---

## Technology

Preferred MVP stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zod for schemas and content validation
- Zustand or similarly lightweight state management
- localStorage for first-pass persistence
- Vitest for decision-engine tests
- Playwright for key journey tests

Do not introduce a database, CMS or AI dependency unless the feature being implemented actually requires it.

Potential later architecture:
- Supabase Auth
- Supabase/Postgres
- secure document storage
- LLM layer for explanation and document understanding

Keep those later additions decoupled from the rule engine.

---

## Accessibility

Accessibility is a core product requirement, not a polish task.

Target WCAG 2.2 AA or better.

Requirements:
- keyboard navigable
- strong focus states
- semantic HTML
- screen-reader labels
- no information conveyed by colour alone
- large touch targets
- plain language
- restrained animation
- respects reduced-motion preferences
- high contrast
- scalable type
- no unnecessarily dense layouts
- clear progress indicators
- error messages that explain how to recover
- never remove the user's entered data because of a validation error

Consider cognitive accessibility in every interaction.

Avoid:
- walls of text
- large matrices
- jargon-heavy labels
- unexplained acronyms
- hidden requirements
- complex multi-column layouts for core decision tasks

---

## Visual design

The interface should feel:
- calm
- adult
- reassuring without being sentimental
- clear
- contemporary
- trustworthy
- non-institutional
- non-clinical

Avoid:
- clichéd disability imagery
- childish illustration styles
- excessive gradients
- generic SaaS dashboard aesthetics
- government-form visual language
- dense card grids
- decorative visual noise

Prioritise:
- typography
- whitespace
- hierarchy
- one primary action per screen
- clear progress
- concise supporting language

---

## Writing style

Use Australian English.

Prefer:
- home
- support
- help
- option
- next step
- living arrangement
- "what this means"

Avoid where possible:
- solution
- consumer
- case
- subject
- sufferer
- special needs
- jargon without explanation

Do not infantilise the user.

Do not use inspirational disability clichés.

Do not overpromise certainty.

---

## Forms and questions

Every question must have:
- unique ID
- purpose
- response type
- available options
- optional help text
- conditions controlling when it appears
- mapping into participant profile fields

Example:

```ts
{
  id: "support-frequency",
  profileField: "support.frequency",
  question: {
    self: "How often do you need help at home?",
    other: "How often do they need help at home?"
  },
  type: "single-select",
  options: [
    "occasionally",
    "every_day",
    "several_times_daily",
    "overnight",
    "continuous_availability",
    "unsure"
  ]
}
```

Do not duplicate whole journeys for each perspective.

---

## Testing

Decision-engine changes are incomplete until tests are updated.

Test:
- common scenarios
- boundary cases
- contradictory answers
- missing information
- "I'm not sure" responses
- role/pronoun switching
- no diagnosis-to-pathway shortcuts
- recommendation explanations
- pathway exclusions or lower relevance

Also add end-to-end tests for:

1. Person exploring for themselves
2. Parent exploring for their adult child
3. Carer/supporter journey
4. User unsure about several questions
5. User returning to a saved journey

---

## Safety and trust

Never:
- diagnose
- give legal advice
- promise funding
- promise eligibility
- fabricate NDIS rules
- invent funding amounts
- hide uncertainty
- present provider marketing as official NDIS guidance

Where information may change, show the source and review date.

If a factual policy claim cannot be supported by the current structured knowledge base, do not invent it. Mark it as needing verification.

---

## AI usage

LLMs may later be used for:
- plain-English explanation
- summarisation
- answering questions from verified source material
- generating meeting questions
- explaining uploaded documents
- extracting structured information from documents

LLMs must not be the source of truth for:
- eligibility
- pathway matching
- funding rules
- official process requirements

Verified structured data and deterministic rules remain the source of truth.

---

## Engineering principles

- TypeScript strict mode.
- Prefer small, composable components.
- Separate domain logic from presentation.
- Do not bury business logic in JSX.
- Do not duplicate policy strings throughout the UI.
- Validate structured content at build time.
- Keep decision rules pure where possible.
- Write tests before refactoring decision logic.
- Avoid dependencies unless they clearly reduce complexity.
- Make incremental, reviewable changes.
- Preserve existing working behaviour unless the task explicitly changes it.

When asked to implement a feature, first identify which layer it belongs to:
1. participant profile
2. question flow
3. decision engine
4. content
5. personalised pathway
6. persistence
7. presentation

Implement it in the correct layer rather than patching the UI.

---

## Definition of done

A feature is not complete merely because it renders.

It is complete when:
- the experience is understandable without NDIS knowledge
- role-aware language works correctly
- acronyms are delayed and explained
- decision logic is outside the UI
- recommendations are explainable
- uncertain cases remain uncertain
- accessibility has been considered
- relevant tests pass
- factual content is sourced
- the next action is clear
