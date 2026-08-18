'use client'

import { useState } from 'react'
import { FUNDING_BY_ID } from '@content/funding'
import type { ExplainedPathway } from '@/lib/decision-engine'
import type { PathwayDimension } from '@/lib/content/schema'

/**
 * Comparing options side by side.
 *
 * A real table, because this is genuinely tabular: the same questions asked of
 * each option. It is capped at three columns and kept behind a disclosure rather
 * than shown by default, because a wide matrix is exactly what makes this system
 * hard to read in the first place. Row headers stay in place while the columns
 * scroll, so a person never loses which question they are looking at.
 */
const MAX_COMPARED = 3

const DIMENSION_LABEL: Record<PathwayDimension, string> = {
  support: 'The help someone gets',
  housing: 'Where someone lives',
  home_modification: 'A change to the building',
}

function fundingNames(pathway: ExplainedPathway['pathway']): readonly string[] {
  return pathway.fundingSources.map((id) => FUNDING_BY_ID.get(id)?.plainName ?? id)
}

export function PathwayComparison({ options }: { options: readonly ExplainedPathway[] }) {
  const [selected, setSelected] = useState<readonly string[]>(() =>
    options.slice(0, 2).map((option) => option.pathway.id),
  )

  const compared = options.filter((option) => selected.includes(option.pathway.id))
  const atCap = selected.length >= MAX_COMPARED

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((candidate) => candidate !== id)
        : current.length < MAX_COMPARED
          ? [...current, id]
          : current,
    )
  }

  const rows: {
    label: string
    value: (option: ExplainedPathway) => string | readonly string[]
  }[] = [
    { label: 'What it is', value: (option) => option.pathway.description.simple },
    {
      label: 'What it decides',
      value: (option) => DIMENSION_LABEL[option.pathway.dimension],
    },
    { label: 'Who may pay', value: (option) => fundingNames(option.pathway) },
    {
      label: 'The formal name',
      value: (option) =>
        option.pathway.formalName
          ? `${option.pathway.formalName}${
              option.pathway.acronym ? ` (${option.pathway.acronym})` : ''
            }`
          : 'This is mainstream housing, so it has no NDIS name.',
    },
    {
      label: 'What may not fit',
      value: (option) => option.pathway.mayNotFit[0] ?? '',
    },
    { label: 'The next step', value: (option) => option.pathway.nextStep },
  ]

  return (
    <div>
      <fieldset className="border-0 p-0">
        <legend className="eyebrow mb-3">Choose up to three to compare</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {options.map((option) => {
            const isSelected = selected.includes(option.pathway.id)
            const isDisabled = !isSelected && atCap
            return (
              <label
                key={option.pathway.id}
                className={
                  isDisabled
                    ? 'flex cursor-not-allowed items-start gap-3 text-[0.9375rem] text-moss'
                    : 'flex cursor-pointer items-start gap-3 text-[0.9375rem]'
                }
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggle(option.pathway.id)}
                  className="mt-[0.2rem] h-[1.15rem] w-[1.15rem] shrink-0 accent-[var(--color-eucalypt)]"
                />
                <span className="max-w-[18rem]">{option.pathway.plainName}</span>
              </label>
            )
          })}
        </div>
        {atCap && (
          <p className="mt-3 text-[0.8125rem] text-moss">
            Three is the most that stays readable. Uncheck one to swap it for another.
          </p>
        )}
      </fieldset>

      {compared.length < 2 ? (
        <p className="mt-8 text-[0.9375rem] text-ink-soft">
          Choose at least two options to compare them.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              {compared.map((option) => option.pathway.plainName).join(' compared with ')}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="w-32 border-b border-ink px-3 py-3 align-bottom">
                  <span className="eyebrow">Question</span>
                </th>
                {compared.map((option) => (
                  <th
                    key={option.pathway.id}
                    scope="col"
                    className="min-w-48 border-b border-ink px-3 py-3 align-bottom font-display text-[1.0625rem] leading-[1.25] font-medium"
                  >
                    {option.pathway.plainName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-hairline">
                  <th
                    scope="row"
                    className="px-3 py-4 align-top text-[0.8125rem] font-bold text-moss"
                  >
                    {row.label}
                  </th>
                  {compared.map((option) => {
                    const value = row.value(option)
                    return (
                      <td
                        key={option.pathway.id}
                        className="px-3 py-4 align-top text-[0.9375rem] leading-[1.5] text-ink-soft"
                      >
                        {Array.isArray(value) ? (
                          <ul className="space-y-1">
                            {value.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          value
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
