import type { PlanProgress } from '@/lib/plan'

/**
 * Progress as a count of real things, not a percentage bar on its own.
 *
 * The number is meaningless without knowing what it counts, so the counts lead
 * and the bar supports them. The bar is hidden from assistive technology because
 * it repeats what the text already says.
 */
export function ProgressReadout({ progress }: { progress: PlanProgress }) {
  return (
    <section aria-labelledby="progress-heading">
      <h2 id="progress-heading" className="eyebrow mb-4">
        Progress
      </h2>
      <p className="text-[0.9375rem] leading-[1.5] text-ink-soft">
        {progress.stepsDone} of {progress.stepsTotal} steps done.
      </p>
      <p className="text-[0.9375rem] leading-[1.5] text-ink-soft">
        {progress.evidenceDone} of {progress.evidenceTotal} things gathered.
      </p>
      <div
        aria-hidden="true"
        className="mt-4 h-[3px] w-full bg-hairline-strong"
      >
        <div
          className="h-full bg-eucalypt"
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>
      <p className="mt-2 text-[0.8125rem] text-moss">
        Nothing here is a deadline. It is a list you can work through.
      </p>
    </section>
  )
}
