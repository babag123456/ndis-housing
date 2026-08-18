import type { Source } from '@/lib/content/schema'

/**
 * Where a claim came from, and whether anyone has checked it.
 *
 * The verification line is the point. A link on its own implies an authority the
 * page has not earned until a person has opened it and confirmed it says what we
 * say it says.
 */
export function Sources({ sources }: { sources: readonly Source[] }) {
  const unchecked = sources.filter((source) => !source.verified)
  // The most recent date any of these pages was read. Reading a page is not the
  // same as a person confirming it says what we say it says, so both are shown.
  const retrievedOn = unchecked
    .map((source) => source.retrievedAt)
    .filter((date): date is string => date !== undefined)
    .sort()
    .at(-1)

  return (
    <footer className="text-[0.8125rem] leading-[1.5] text-moss">
      <p>
        {sources.length === 1 ? 'Source' : 'Sources'}:{' '}
        {sources.map((source, index) => (
          <span key={source.sourceUrl}>
            {index > 0 && ', '}
            <a
              href={source.sourceUrl}
              className="text-eucalypt underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              {source.sourceName}
            </a>
          </span>
        ))}
      </p>
      {unchecked.length > 0 && (
        <p className="mt-1">
          {retrievedOn
            ? `Read on ${retrievedOn}, but not yet checked by a person.`
            : unchecked.length === sources.length && sources.length > 1
              ? 'These pages have not been checked by a person yet.'
              : 'This page has not been checked by a person yet.'}
        </p>
      )}
    </footer>
  )
}
