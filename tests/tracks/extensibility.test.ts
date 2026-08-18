import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { composeFields, defineField } from '@/lib/profile/field'
import { SHARED_FIELDS } from '@/lib/profile/shared-fields'
import type { FieldId } from '@/lib/profile/fields'
import { HOME_AND_LIVING_FIELDS } from '@/tracks/home-and-living/fields'
import { evaluateFlow } from '@/lib/navigator/flow'
import { buildRoadmap } from '@/lib/roadmap/build'
import { HOME_AND_LIVING } from '@/tracks/home-and-living'
import type { Track } from '@/tracks/track'
import type { Question } from '@/lib/navigator/question-schema'
import type { RoadmapStep } from '@/lib/roadmap/schema'

/**
 * A track that exists only here.
 *
 * The point is that adding a track needs new files and a registration, and
 * nothing else. If this test ever needs a change to a shared module to pass,
 * extensibility has regressed — and that is the finding, not a reason to edit
 * the test.
 *
 * It writes into the `goals.change` branch to stand in for a branch of its own,
 * because the production profile has no synthetic branch. Everything else — its
 * questions, its steps, its field id — is its own.
 */
const fixtureSchema = z.enum(['yes', 'no', 'unsure'])

const FIXTURE_FIELDS = {
  'fixture.answer': defineField({
    schema: fixtureSchema,
    read: (profile) => {
      if (profile.goals.change === 'more_independence') return 'yes'
      if (profile.goals.change === 'plan_for_the_future') return 'no'
      if (profile.goals.change === 'unsure') return 'unsure'
      return null
    },
    write: (profile, value) => {
      profile.goals.change =
        value === 'yes' ? 'more_independence' : value === 'no' ? 'plan_for_the_future' : 'unsure'
    },
  }),
} as const

const REGISTRY = composeFields(SHARED_FIELDS, HOME_AND_LIVING_FIELDS, FIXTURE_FIELDS)

const v = (text: string) => ({ self: text, other: text })

/**
 * The fixture owns a field the production `FieldId` union does not contain,
 * which is the whole point. Casting through unknown says so plainly.
 */
const FIXTURE_FIELD = 'fixture.answer' as unknown as FieldId

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
    profileField: FIXTURE_FIELD,
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
