import Link from 'next/link'

/**
 * Shown instead of results when there is not enough to say anything useful.
 *
 * Filling the gaps with assumptions would produce a worse answer than asking, so
 * the screen asks. One action, no partial results to misread.
 */
export function UnfinishedJourney({
  what,
  answeredCount,
  questionsRemaining,
}: {
  /** What this screen would have shown, e.g. "options" or "a pathway". */
  what: string
  answeredCount: number
  questionsRemaining: number
}) {
  const nothingAnswered = answeredCount === 0

  return (
    <div className="rise">
      <p className="eyebrow mb-6">Your {what}</p>
      <h1 className="measure font-display text-[clamp(1.75rem,1.1rem+2.4vw,2.625rem)] font-medium">
        {nothingAnswered
          ? `Answer a few questions and your ${what} will appear here`
          : `A few more answers and we can show your ${what}`}
      </h1>
      <p className="measure mt-5 text-lede text-ink-soft">
        {nothingAnswered
          ? `We build your ${what} from what you tell us, so there is nothing to show until you have answered some questions.`
          : `There ${
              questionsRemaining === 1
                ? 'is one question'
                : `are about ${questionsRemaining} questions`
            } left. Guessing on your behalf would give you a worse answer than asking.`}
      </p>
      <Link
        href="/start"
        className="mt-9 inline-block min-h-12 rounded-sm bg-eucalypt px-8 py-4 text-[1.0625rem] font-bold text-paper no-underline hover:bg-eucalypt-deep"
      >
        Continue the questions
      </Link>
    </div>
  )
}
