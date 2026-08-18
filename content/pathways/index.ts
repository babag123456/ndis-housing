import type { Pathway } from '@/lib/content/schema'
import {
  DISABILITY_SUPPORT_PENSION,
  NDIS_HOME_AND_LIVING,
  NDIS_HOME_MODIFICATIONS,
  NDIS_INDIVIDUALISED_LIVING_OPTIONS,
  NDIS_MEDIUM_TERM_ACCOMMODATION,
  NDIS_SPECIALIST_DISABILITY_ACCOMMODATION,
  NDIS_SUPPORTED_INDEPENDENT_LIVING,
  RENT_ASSISTANCE,
  SOCIAL_HOUSING,
} from '@content/sources/official'

/**
 * The seed pathways.
 *
 * Each one leads with what it means in plain English; the formal NDIS name is an
 * explanation of the option rather than the option itself. Housing pathways and
 * support pathways are separate entries even where people usually meet them
 * together, because they are separately chosen, separately assessed and
 * separately paid for.
 *
 * Nothing here states that anyone qualifies for anything. Every claim about
 * funding is written as "may".
 */
export const PATHWAYS: readonly Pathway[] = [
  {
    id: 'assistance-with-daily-life',
    dimension: 'support',
    plainName: 'Get regular help at home from paid workers',
    formalName: 'Assistance with Daily Life',
    fundingSources: ['ndis'],
    description: {
      simple:
        'Paid workers come to the home to help with everyday things. Nobody has to move.',
      tellMeMore:
        'Support is arranged around the hours help is actually needed — a morning routine, meals, medication prompts, or getting out of the house. It does not change who owns or rents the home, and it does not require moving.',
      detail:
        'In the NDIS this sits under Assistance with Daily Life. The amount of support is worked out from assessed functional need rather than from a diagnosis, and the National Disability Insurance Agency decides what a plan includes.',
    },
    mayNotFit: [
      'On its own this is usually not enough if someone needs a person available all through the night.',
      'It does not help with the cost of rent or a mortgage.',
    ],
    questionsToAsk: [
      'How many hours of support a week are we talking about, and at what times of day?',
      'Can the same workers come regularly, rather than someone new each time?',
    ],
    evidence: [
      'A description of a typical day, marking where help is needed',
      'Reports from allied health professionals about what help is needed day to day',
    ],
    fundingNotes: [
      'May be funded by the NDIS.',
      'Rent, food and household bills stay everyday living costs.',
    ],
    nextStep:
      'Write down a typical day, hour by hour, and mark where help is needed. Take it to the next planning conversation.',
    sources: [NDIS_HOME_AND_LIVING],
  },
  {
    id: 'individualised-living-options',
    dimension: 'support',
    plainName: 'Build a living arrangement around the person',
    formalName: 'Individualised Living Options',
    acronym: 'ILO',
    fundingSources: ['ndis', 'commonwealth_rent_assistance', 'disability_support_pension'],
    description: {
      simple:
        'Rather than moving into a set-up that already exists, the arrangement is designed from scratch: who is in the home, and how the days run.',
      tellMeMore:
        'This usually has two parts: working out the arrangement, then paying for the supports that make it work. It can cover living alone with help dropping in, living with a housemate, or living with a host family. Who else is in the home is chosen, not assigned.',
      detail:
        'Formally Individualised Living Options (ILO). It funds the support around a living arrangement rather than the housing itself, so a home still has to be found. It is for adults. The National Disability Insurance Agency decides what a plan includes.',
    },
    mayNotFit: [
      'It is for adults, so it is not available for a child.',
      'It does not pay rent, so somewhere to live still has to be found.',
      'Someone who wants the certainty of staff on site at all times may find a shared supported home fits better.',
    ],
    questionsToAsk: [
      'Who should be in the home, and has anyone actually been asked?',
      'Who helps design the arrangement, and is that stage funded separately?',
      'What happens if a housemate or host arrangement ends?',
    ],
    evidence: [
      'A description of the home and the week that are actually wanted',
      'What help family or friends can realistically keep giving, and for how long',
    ],
    fundingNotes: [
      'The supports may be funded by the NDIS.',
      'Rent may be helped by the Disability Support Pension and Commonwealth Rent Assistance.',
    ],
    nextStep:
      'Ask your support coordinator or NDIS contact about exploring Individualised Living Options, and what the design stage involves.',
    sources: [NDIS_INDIVIDUALISED_LIVING_OPTIONS, RENT_ASSISTANCE],
  },
  {
    id: 'supported-independent-living',
    dimension: 'support',
    plainName: 'Live in a shared home where support is always on hand',
    formalName: 'Supported Independent Living',
    acronym: 'SIL',
    fundingSources: ['ndis', 'disability_support_pension'],
    description: {
      simple:
        'A home shared with a small number of other people, with paid workers there through the day and overnight.',
      tellMeMore:
        'Support is shared between the people living there, which is what makes help at any hour workable. The trade-off is less choice about who else lives in the home, though who moves in should still be a shared decision.',
      detail:
        'Formally Supported Independent Living (SIL). It pays for the support, not the housing: rent is separate, and the building may or may not be purpose-built. It is generally for adults. The National Disability Insurance Agency decides what a plan includes.',
    },
    mayNotFit: [
      'Someone who wants to choose exactly who they live with may find this too fixed.',
      'It does not pay rent.',
      'It is generally for adults.',
    ],
    questionsToAsk: [
      'Who else lives in the home, and can we visit and meet them first?',
      'Is overnight support awake, or asleep on site?',
      'What happens if the arrangement does not work out?',
    ],
    evidence: [
      'How much help is needed at each part of the day and night',
      'What could go wrong if nobody were available at short notice',
    ],
    fundingNotes: [
      'The support may be funded by the NDIS.',
      'Rent and everyday living costs are paid privately, often from the Disability Support Pension with rent assistance.',
    ],
    nextStep:
      'Ask your NDIS contact what a request for shared supported living needs, and start visiting homes to see what they are actually like.',
    sources: [NDIS_SUPPORTED_INDEPENDENT_LIVING, DISABILITY_SUPPORT_PENSION],
  },
  {
    id: 'specialist-disability-accommodation',
    dimension: 'housing',
    plainName: 'Live in a home built for high physical support needs',
    formalName: 'Specialist Disability Accommodation',
    acronym: 'SDA',
    fundingSources: ['ndis'],
    description: {
      simple:
        'The building itself is designed or built for people with very high physical support or safety needs — reinforced ceilings, full wheelchair access, or emergency help on site.',
      tellMeMore:
        'This is about the house, not the help. Someone living in this kind of home almost always needs support funded separately as well. It is assessed on the building features a person needs, and relatively few people are funded for it.',
      detail:
        'Formally Specialist Disability Accommodation (SDA). It is a contribution towards the cost of the dwelling itself. Very high support needs or extreme functional impairment form part of how it is assessed, and the National Disability Insurance Agency makes the decision.',
    },
    mayNotFit: [
      'If the home does not need to be physically different, this is unlikely to be the right path.',
      'It does not cover support workers — that is funded separately.',
      'Waiting for a suitable vacancy in the right area can take a long time.',
    ],
    questionsToAsk: [
      'Which specific building features are needed, and why those ones?',
      'What is actually available in the preferred areas?',
      'Would an ordinary home with modifications do the same job?',
    ],
    evidence: [
      'An occupational therapy assessment of the housing features needed',
      'Evidence about why ordinary housing, even with changes, would not work',
    ],
    fundingNotes: [
      'The dwelling may be funded by the NDIS.',
      'A reasonable rent amount is still contributed from income.',
    ],
    nextStep:
      'Ask an occupational therapist to assess which housing features are needed, and get it in writing before any request is made.',
    sources: [NDIS_SPECIALIST_DISABILITY_ACCOMMODATION],
  },
  {
    id: 'home-modifications',
    dimension: 'home_modification',
    plainName: 'Change the home so it works better',
    formalName: 'Home modifications',
    fundingSources: ['ndis', 'state_housing_assistance'],
    description: {
      simple:
        'Alter the existing home — grab rails, a ramp, a wider doorway, or a bathroom rebuilt so it can be used safely.',
      tellMeMore:
        'Small changes are usually quick. Structural work needs assessment, quotes and often the property owner’s written consent, so starting early matters. Changing the building does not change how much help a person receives.',
      detail:
        'In the NDIS these are home modifications. An occupational therapy assessment is normally the starting point, and the National Disability Insurance Agency decides what a plan includes. Written consent from the owner is needed where the home is rented or is social housing.',
    },
    mayNotFit: [
      'If the home cannot reasonably be changed, moving may be the more useful conversation.',
      'It does not pay for support workers.',
    ],
    questionsToAsk: [
      'Has an occupational therapist assessed the building, and not only the support needs?',
      'If the home is rented, has the owner been asked in writing?',
      'How long will the work take, and where does everyone live while it happens?',
    ],
    evidence: [
      'An occupational therapy assessment of the housing features needed',
      'Quotes from builders for the work',
      'Written consent from the property owner where the home is not owned',
    ],
    fundingNotes: [
      'May be funded by the NDIS.',
      'Some state and territory schemes may also help with changes to a home.',
    ],
    nextStep:
      'Ask for an occupational therapy assessment of the home. If it is rented, start the consent conversation now rather than later.',
    sources: [NDIS_HOME_MODIFICATIONS],
  },
  {
    id: 'medium-term-accommodation',
    dimension: 'housing',
    plainName: 'Somewhere to stay while a longer-term home is sorted out',
    formalName: 'Medium Term Accommodation',
    acronym: 'MTA',
    fundingSources: ['ndis'],
    description: {
      simple:
        'A temporary place to live when the move is ready but the longer-term home is not.',
      tellMeMore:
        'It is a bridge rather than a destination, and it is time-limited. It is most relevant when a longer-term home has been found but is not ready, or when someone is leaving hospital with nowhere suitable to go.',
      detail:
        'Formally Medium Term Accommodation (MTA). It funds accommodation for a limited period, generally where a person cannot move into their longer-term home for reasons outside their control. The National Disability Insurance Agency decides what a plan includes.',
    },
    mayNotFit: [
      'If no longer-term home has been identified yet, this is usually not the answer.',
      'It is not meant for someone who simply wants to move sooner.',
      'It is time-limited, so it does not solve a shortage of housing.',
    ],
    questionsToAsk: [
      'What is the longer-term home, and what exactly is holding it up?',
      'What happens if the longer-term home falls through?',
    ],
    evidence: [
      'Evidence that a longer-term home has been identified',
      'Why staying in the current home is not workable',
    ],
    fundingNotes: [
      'The accommodation may be funded by the NDIS for a limited period.',
      'Everyday living costs are still paid privately.',
    ],
    nextStep:
      'Write down what the longer-term home is and what is delaying it. That is the case for a temporary place to stay.',
    sources: [NDIS_MEDIUM_TERM_ACCOMMODATION],
  },
  {
    id: 'private-rental',
    dimension: 'housing',
    plainName: 'Rent a place on the open market',
    fundingSources: [
      'commonwealth_rent_assistance',
      'disability_support_pension',
      'personal_income',
    ],
    description: {
      simple:
        'Rent a home the way anyone else does, and arrange any support separately.',
      tellMeMore:
        'This keeps the most choice about where the home is and who is in it. The barriers are usually cost and rental history rather than disability, and there is help with both.',
      detail:
        'This is mainstream housing, outside the NDIS. The NDIS does not pay rent. Commonwealth Rent Assistance and the Disability Support Pension are the usual help with cost, and some states run bond loan and rental support schemes. Support in the home can be funded by the NDIS separately.',
    },
    mayNotFit: [
      'Rents in the preferred area may simply be out of reach.',
      'Someone with no rental history can find it hard to be accepted.',
      'The home may need changes the owner will not agree to.',
    ],
    questionsToAsk: [
      'What is affordable each week once bills and food are counted?',
      'Is there help with a bond, or with rental history, in this state or territory?',
    ],
    evidence: [
      'Proof of income',
      'A rental history, or a guarantor where there is none',
    ],
    fundingNotes: [
      'Rent is not funded by the NDIS.',
      'Commonwealth Rent Assistance and the Disability Support Pension may help with the cost.',
      'Support in the home may be funded by the NDIS separately.',
    ],
    nextStep:
      'Work out a weekly budget including rent, bills and food, then check what that actually buys in the preferred areas.',
    sources: [RENT_ASSISTANCE, DISABILITY_SUPPORT_PENSION],
  },
  {
    id: 'social-and-community-housing',
    dimension: 'housing',
    plainName: 'Apply for social or community housing',
    fundingSources: ['state_housing_assistance', 'disability_support_pension'],
    description: {
      simple:
        'Longer-term rental housing run by a state government or a not-for-profit, where rent is usually set as a share of income.',
      tellMeMore:
        'Applications are managed by each state and territory, and waiting times can be long — which is why applying early matters even when nothing needs to change yet. Priority often goes to people whose current situation is unsafe or unstable.',
      detail:
        'This is mainstream housing, outside the NDIS. Each state and territory runs its own register with its own rules on who can apply and who gets priority, so the state authority is the source that matters. Support in the home can be funded by the NDIS separately.',
    },
    mayNotFit: [
      'Waiting lists can run for years.',
      'There may be little choice about location.',
      'Modifications need the housing provider’s consent.',
    ],
    questionsToAsk: [
      'How do we apply in this state, and is there a priority category that applies?',
      'Can the application stay on the list while other options are tried?',
    ],
    evidence: [
      'Proof of income',
      'Proof of identity',
      'Evidence about why the current housing is unsuitable or unsafe',
    ],
    fundingNotes: [
      'Rent is generally set as a proportion of income.',
      'Rent is not funded by the NDIS.',
      'Support in the home may be funded by the NDIS separately.',
    ],
    nextStep:
      'Find the housing register for your state or territory and start the application, even if a move is a long way off.',
    sources: [SOCIAL_HOUSING],
  },
]

export const PATHWAYS_BY_ID: ReadonlyMap<string, Pathway> = new Map(
  PATHWAYS.map((pathway) => [pathway.id, pathway]),
)
