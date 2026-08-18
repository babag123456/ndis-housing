import type { FundingSourceContent } from '@/lib/content/schema'
import {
  DISABILITY_SUPPORT_PENSION,
  NDIS_HOME_AND_LIVING,
  RENT_ASSISTANCE,
  SOCIAL_HOUSING,
} from '@content/sources/official'

/**
 * Where the money comes from.
 *
 * The single most useful thing this section does is say what each source does
 * *not* pay for. Most of the disappointment in this system comes from assuming
 * one pot covers something another pot was always going to have to.
 */
export const FUNDING_SOURCES_CONTENT: readonly FundingSourceContent[] = [
  {
    id: 'ndis',
    plainName: 'NDIS funding',
    formalName: 'National Disability Insurance Scheme',
    description: {
      simple:
        'Pays for disability supports — the help someone needs because of their disability.',
      tellMeMore:
        'It pays for support and, in a small number of cases, towards a home built for very high physical support needs. It does not pay ordinary living costs, which is the distinction that surprises people most.',
      detail:
        'Funding sits in a plan, and what a plan includes is decided by the National Disability Insurance Agency based on assessed need. Home and living supports are a specific part of a plan; a plan can exist without them.',
    },
    pays: [
      'Support workers, and the help they give at home',
      'Occupational therapy and other allied health assessments',
      'Changes to a home where they are needed because of disability',
    ],
    doesNotPay: [
      'Rent, or a mortgage',
      'Food, power, water and other everyday household bills',
      'Things a person would need whether or not they had a disability',
    ],
    howToApply: {
      startWith: 'Phone the National Disability Insurance Agency on 1800 800 110.',
      steps: [
        'Make the request by phone, or complete an Access Request Form.',
        'A treating health professional completes the section of the form about disability, or existing reports and assessments can be sent instead.',
        'Provide information about age, residency and disability.',
        'If home and living supports are the goal, say so early — they are a specific part of a plan and are asked for separately.',
      ],
    },
    sources: [NDIS_HOME_AND_LIVING],
  },
  {
    id: 'disability_support_pension',
    plainName: 'The Disability Support Pension',
    description: {
      simple: 'A regular income payment, which is what most everyday living costs come out of.',
      tellMeMore:
        'It is income, not a disability support budget, so it is spent on rent, food and bills like any other income. It is assessed and paid by Services Australia, not by the NDIS.',
      detail:
        'It is a separate system with its own rules about who can claim and how much is paid. Receiving NDIS funding does not decide this, and receiving this does not decide NDIS funding.',
    },
    pays: ['Rent and household bills', 'Food and everyday costs'],
    doesNotPay: [
      'Disability supports, which the NDIS may fund instead',
      'The full cost of renting in most capital cities on its own',
    ],
    howToApply: {
      startWith: 'Services Australia, through myGov or by phone.',
      steps: [
        'Set up a myGov account linked to Centrelink if there is not one already.',
        'Start the claim and expect to provide medical evidence about how the condition affects daily function.',
        'Ask Services Australia what evidence they need before gathering it, rather than after.',
      ],
    },
    sources: [DISABILITY_SUPPORT_PENSION],
  },
  {
    id: 'commonwealth_rent_assistance',
    plainName: 'Help with the cost of rent',
    formalName: 'Commonwealth Rent Assistance',
    description: {
      simple: 'An extra amount added to an income payment for people who pay rent.',
      tellMeMore:
        'It is paid with a pension or allowance rather than claimed separately, and the amount depends on the rent and the living arrangement.',
      detail:
        'Administered by Services Australia alongside income support. It applies to private rent and to some community housing, and generally not to public housing.',
    },
    pays: ['Part of the rent, alongside other income'],
    doesNotPay: ['The whole rent', 'A mortgage'],
    howToApply: {
      startWith: 'Services Australia — usually alongside an existing payment.',
      steps: [
        'This is generally worked out with an income support payment rather than claimed on its own.',
        'Tell Services Australia the rent details, and tell them again whenever the rent or the living arrangement changes.',
      ],
    },
    sources: [RENT_ASSISTANCE],
  },
  {
    id: 'state_housing_assistance',
    plainName: 'State and territory housing help',
    description: {
      simple:
        'Each state and territory runs its own housing help — social housing, bond loans and rental support.',
      tellMeMore:
        'Rules, waiting lists and priority categories differ in every state, so the state authority is the one that matters. Applying early costs nothing and can save years.',
      detail:
        'These schemes sit entirely outside the NDIS. A person can hold an NDIS plan and a state housing application at the same time, and usually should.',
    },
    pays: [
      'Social and community housing, where rent is often set as a share of income',
      'Bond loans and some rental support, depending on the state',
      'Some changes to a home, depending on the state',
    ],
    doesNotPay: ['Disability supports', 'Costs in another state'],
    howToApply: {
      startWith: 'The housing authority for your state or territory.',
      steps: [
        'Find the housing register for the state or territory and apply, even if a move is a long way off.',
        'Ask whether any priority category applies, and what evidence it needs.',
        'Applying does not stop other options being tried at the same time.',
      ],
    },
    sources: [SOCIAL_HOUSING],
  },
  {
    id: 'personal_income',
    plainName: 'A person’s own income and savings',
    description: {
      simple: 'Wages, savings and family contributions.',
      tellMeMore:
        'Worth writing down honestly and early, because it decides which housing options are realistic more often than any funding decision does.',
      detail:
        'Paid work can affect income support payments. Services Australia can explain how before a decision is made rather than after.',
    },
    pays: ['Anything', 'The gap between what is funded and what things cost'],
    doesNotPay: ['Nothing in particular — but it runs out, which is why the gap matters'],
    sources: [DISABILITY_SUPPORT_PENSION],
  },
  {
    id: 'other_mainstream',
    plainName: 'Other mainstream services',
    description: {
      simple:
        'Health, education, transport and aged care services that everyone can use.',
      tellMeMore:
        'Some things people assume the NDIS pays for are actually the job of another system. Knowing which is which avoids months waiting on the wrong request.',
      detail:
        'The boundary between the NDIS and mainstream services is set by policy and does shift. Where a request is refused because it belongs to another system, that reason should be in writing.',
    },
    pays: [
      'Health care, including hospital and most clinical treatment',
      'Equipment and services other systems are responsible for',
    ],
    doesNotPay: ['Disability supports that are the NDIS’s responsibility'],
    sources: [NDIS_HOME_AND_LIVING],
  },
]

export const FUNDING_BY_ID: ReadonlyMap<string, FundingSourceContent> = new Map(
  FUNDING_SOURCES_CONTENT.map((source) => [source.id, source]),
)
