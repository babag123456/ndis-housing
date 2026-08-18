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
