import type { Provider } from '@/lib/content/schema'
import {
  HIREUP_SITE,
  HIREUP_SUBMISSION,
  HOUSING_HUB_SITE,
  MABLE_SITE,
  SILC_SITE,
} from '@content/sources/providers'

/**
 * Named organisations, as examples of the roles described in `organisations`.
 *
 * Deliberately a small set rather than a directory. Every entry is what the
 * organisation says about itself, and `worthKnowing` holds the things that would
 * actually change a decision — who employs the workers, who governs the home —
 * rather than anything that reads like a selling point.
 *
 * Ordered alphabetically so the order implies nothing. The authoritative list of
 * registered providers is the NDIS provider finder, which the roles point to.
 */
export const PROVIDERS: readonly Provider[] = [
  {
    id: 'hireup',
    name: 'Hireup',
    url: 'https://hireup.com.au/',
    kind: 'support_platform',
    roles: ['support-provider'],
    describesItselfAs:
      'A platform for finding and booking local disability support workers, where the workers are employed by Hireup rather than working as contractors.',
    worthKnowing: [
      'Support workers are directly employed as casual employees, with award wages, superannuation and workers compensation.',
      'Because the workers are employed rather than contracted, the employment obligations sit with Hireup rather than with the person receiving support.',
    ],
    coverage: 'Australia-wide, subject to workers being available in a given area.',
    questionsToAsk: [
      'Are there enough workers in our area, and what happens when the regular worker is away?',
      'How does the hourly rate compare with what is in the plan for this support?',
    ],
    sources: [HIREUP_SITE, HIREUP_SUBMISSION],
  },
  {
    id: 'housing-hub',
    name: 'Housing Hub',
    url: 'https://www.housinghub.org.au/',
    kind: 'housing_provider',
    roles: ['housing-search-service'],
    describesItselfAs:
      'A national listing platform for accessible and NDIS housing, bringing Specialist Disability Accommodation, Supported Independent Living, Individualised Living Options, private rental and properties for sale together in one place.',
    worthKnowing: [
      'It lists homes from many different providers rather than owning or running any of them.',
      'A free seeker profile can be created, and it emails when a home matching the preferences is listed.',
      'It separated from the Summer Foundation on 1 July 2024 and is now its own entity.',
    ],
    coverage: 'Listings from across Australia.',
    questionsToAsk: [
      'How recently was this listing updated, and is it still available?',
      'Who actually owns and runs this home, and are they separate from the support provider?',
    ],
    sources: [HOUSING_HUB_SITE],
  },
  {
    id: 'mable',
    name: 'Mable',
    url: 'https://mable.com.au/',
    kind: 'support_platform',
    roles: ['support-provider'],
    describesItselfAs:
      'A platform for finding and booking independent support workers, who are self-employed and run their own small businesses through the platform.',
    worthKnowing: [
      'Workers are self-employed independent contractors and are not employed by Mable.',
      'Rates are agreed directly with each worker rather than set by the platform, which can make them lower than a registered provider’s.',
    ],
    coverage: 'Australia-wide, subject to workers being available in a given area.',
    questionsToAsk: [
      'Given how the plan is managed, can an unregistered worker be paid for from it?',
      'Who is responsible if a worker is injured, or does not turn up?',
    ],
    sources: [MABLE_SITE],
  },
  {
    id: 'silc',
    name: 'Supporting Independent Living Co-operative (SILC)',
    url: 'https://www.silc.coop/',
    kind: 'registered_provider',
    roles: ['support-coordinator', 'housing-provider'],
    describesItselfAs:
      'A co-operative that helps create homes for people living with disability by connecting families and communities, with families involved in governing the homes and designing the home life.',
    worthKnowing: [
      'It is a co-operative, and families take part in governing the homes rather than only receiving a service.',
      'It offers support coordination and help with setting a house up, as well as the accommodation itself.',
    ],
    coverage: 'Head office in Sydney. The site does not state which regions it serves.',
    questionsToAsk: [
      'What does the family’s role in governing the home involve, in practice and in hours?',
      'Do you work in our area, and is there an existing home or would one need establishing?',
    ],
    sources: [SILC_SITE],
  },
]

export const PROVIDERS_BY_ID: ReadonlyMap<string, Provider> = new Map(
  PROVIDERS.map((provider) => [provider.id, provider]),
)

/** The providers offering to play a given role. */
export function providersForRole(roleId: string): readonly Provider[] {
  return PROVIDERS.filter((provider) => provider.roles.includes(roleId))
}
