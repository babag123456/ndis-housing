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

  it('keeps a finished journey finished rather than restarting it', () => {
    // A stored null means "the journey is complete", which is different from
    // never having started. Losing that would send someone back to question one.
    const migrated = migrateNavigatorState({ answers: {}, activeQuestionId: null })
    expect(migrated.activeQuestionId).toEqual({})
  })
})
