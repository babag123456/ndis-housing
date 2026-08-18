import type { MatchState } from '@/types/domain'

/**
 * How each result group is introduced.
 *
 * The wording is deliberate. None of it says a person qualifies, is eligible, or
 * has been assessed — it describes how well an option matches what they told us,
 * which is the only claim this product is entitled to make.
 */
export const MatchStateHeadingCopy: Record<
  MatchState,
  { heading: string; explanation: string }
> = {
  strong_match: {
    heading: 'Strong match',
    explanation:
      'These line up closely with what you told us. That makes them worth looking at first, not a decision.',
  },
  worth_exploring: {
    heading: 'Worth exploring',
    explanation:
      'These could suit. They are worth a conversation with the people who know the person.',
  },
  needs_more_information: {
    heading: 'More information needed',
    explanation:
      'We cannot say much about these yet. Each one names the question that would settle it.',
  },
  lower_relevance: {
    heading: 'Appears less relevant based on your answers',
    explanation:
      'These look further from what you asked for. Nothing here is ruled out — if your answers change, this can change too.',
  },
}
