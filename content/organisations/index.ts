import type { Organisation } from '@/lib/content/schema'
import { NDIS_HOME_AND_LIVING, SOCIAL_HOUSING } from '@content/sources/official'

/**
 * Who can help.
 *
 * Kinds of help rather than named services. A directory of real organisations
 * needs verified, current, state-by-state data; publishing an invented one would
 * be worse than publishing none. Each entry says what the role is actually good
 * for and how to find one, and appears only when the person's answers make it
 * relevant.
 */
export const ORGANISATIONS: readonly Organisation[] = [
  {
    id: 'support-coordinator',
    plainName: 'A support coordinator',
    kind: 'registered_provider',
    description: {
      simple:
        'Someone funded in a plan to help put the plan into practice and connect things up.',
      tellMeMore:
        'For a housing change they are usually the most useful person to have on side: they know what a request needs and they can chase things that stall.',
      detail:
        'Support coordination is funded in a plan when it is included. A person can ask for it, and can change coordinator without changing anything else.',
    },
    helpsWith: [
      'Working out what a home and living request needs',
      'Finding providers and arranging the first meetings',
      'Following up when something has stopped moving',
    ],
    questionsToAsk: [
      'Have you supported someone through a home and living change before?',
      'What will you do in the first month, specifically?',
    ],
    howToFind:
      'Check whether support coordination is already funded in the plan. If it is, the plan manager or the NDIS contact can help find one.',
    showWhen: [
      {
        field: 'context.ndis',
        oneOf: ['plan_without_home_and_living', 'plan_with_home_and_living', 'plan_under_review'],
      },
    ],
    sources: [NDIS_HOME_AND_LIVING],
  },
  {
    id: 'local-area-coordinator',
    plainName: 'A local area coordinator',
    kind: 'registered_provider',
    description: {
      simple: 'A local contact who can explain the NDIS and help get started.',
      tellMeMore:
        'Useful before a plan exists, or when nobody is quite sure who to call. They can explain what an access request involves and what happens next.',
      detail:
        'Local area coordination is delivered by partner organisations on behalf of the National Disability Insurance Agency, and does not need to be funded in a plan.',
    },
    helpsWith: [
      'Understanding how to start with the NDIS',
      'Working out who is responsible for what',
    ],
    questionsToAsk: [
      'What does an access request need, and how long does it usually take?',
      'Who should we be talking to about housing specifically?',
    ],
    howToFind: 'Search for the National Disability Insurance Agency partner in your area.',
    showWhenAny: [{ field: 'context.ndis', oneOf: ['no_ndis_plan', 'unsure'] }],
    sources: [NDIS_HOME_AND_LIVING],
  },
  {
    id: 'occupational-therapist',
    plainName: 'An occupational therapist',
    kind: 'allied_health',
    description: {
      simple:
        'The professional who assesses what a person can do, and what a building needs to be like for them to do it.',
      tellMeMore:
        'Their written assessment is what most housing and modification requests rest on, and it is often the longest thing to wait for. Booking early is the single most useful thing to do.',
      detail:
        'An occupational therapy report describes function and the environment together. It is evidence for a request, not a decision about one.',
    },
    helpsWith: [
      'Assessing what needs to change about a home',
      'Writing the evidence a request is decided on',
    ],
    questionsToAsk: [
      'Have you written housing assessments before, and can we see an example structure?',
      'How long is the wait, and how long will the report take after the visit?',
    ],
    howToFind:
      'Ask a GP, a support coordinator, or search a professional association register for one who does housing assessments.',
    showWhenAny: [
      {
        field: 'housing.featureNeeds',
        oneOf: ['small_changes', 'substantial_changes', 'purpose_built', 'unsure'],
      },
      { field: 'support.dailyIntensity', oneOf: ['daily_extensive', 'several_times_daily'] },
    ],
    sources: [NDIS_HOME_AND_LIVING],
  },
  {
    id: 'advocacy-organisation',
    plainName: 'An advocacy organisation',
    kind: 'advocate',
    description: {
      simple:
        'An independent organisation that helps a person be heard, and pushes back when a decision looks wrong.',
      tellMeMore:
        'Advocates are independent of providers and of the NDIS, which is exactly why they are useful when a decision needs reviewing or a provider is not listening.',
      detail:
        'Disability advocacy is generally free and funded separately from the NDIS. Using an advocate does not affect a plan.',
    },
    helpsWith: [
      'Reviewing a decision that does not look right',
      'Being heard when a provider or an agency is not listening',
    ],
    questionsToAsk: [
      'Can you help with a review of a home and living decision?',
      'What are the time limits we need to know about?',
    ],
    howToFind: 'Search for disability advocacy in your state or territory.',
    sources: [NDIS_HOME_AND_LIVING],
  },
  {
    id: 'tenancy-service',
    plainName: 'A tenants’ advice service',
    kind: 'advocate',
    description: {
      simple: 'Free advice about renting, leases and what a landlord can and cannot do.',
      tellMeMore:
        'Worth talking to before signing anything, and essential if modifications will need the owner’s consent or a lease is at risk.',
      detail:
        'Tenancy law is state and territory law, so advice has to come from the right jurisdiction.',
    },
    helpsWith: [
      'Understanding a lease before signing it',
      'Getting an owner’s consent for changes to a home',
      'What to do when a tenancy is at risk',
    ],
    questionsToAsk: [
      'What does the owner have to agree to in writing?',
      'What are our rights if the lease ends before the housing is sorted?',
    ],
    howToFind: 'Search for the tenants’ union or tenancy advice service in your state or territory.',
    showWhenAny: [
      { field: 'housing.current', oneOf: ['own_rental', 'social_housing', 'no_stable_home'] },
      {
        field: 'housing.desired',
        oneOf: ['own_place_alone', 'own_place_with_chosen_people'],
      },
    ],
    sources: [SOCIAL_HOUSING],
  },
  {
    id: 'housing-provider',
    plainName: 'A housing provider',
    kind: 'housing_provider',
    description: {
      simple: 'An organisation that owns or manages homes, rather than providing support in them.',
      tellMeMore:
        'A housing provider is the landlord. Keeping them separate from the support provider means a person can change one without losing the other, which matters more than it sounds.',
      detail:
        'Community housing providers and specialist disability accommodation providers are registered separately from support providers, and are regulated differently.',
    },
    helpsWith: ['Finding an actual home', 'Explaining what is available and when'],
    questionsToAsk: [
      'If we change support provider, does the housing stay?',
      'What is the real waiting time for something suitable?',
    ],
    howToFind:
      'For social and community housing, start with the state or territory housing register.',
    showWhen: [{ field: 'housing.desired', notOneOf: ['stay_where_they_are'] }],
    sources: [SOCIAL_HOUSING],
  },
  {
    id: 'housing-search-service',
    plainName: 'A housing listing service',
    kind: 'housing_provider',
    description: {
      simple:
        'A website that gathers homes from many different providers so they can be searched in one place.',
      tellMeMore:
        'A listing service does not own or run the homes — it lists what others have. That makes it the fastest way to see what actually exists in an area, and it is worth checking who runs any home before going further.',
      detail:
        'Listings cover Specialist Disability Accommodation, shared supported homes, Individualised Living Options arrangements and ordinary rental. Availability changes constantly, so a listing is a starting point for a conversation rather than an offer.',
    },
    helpsWith: [
      'Seeing what accessible housing actually exists in an area',
      'Being told when something new is listed, instead of checking repeatedly',
    ],
    questionsToAsk: [
      'Is this listing still current?',
      'Who owns and runs this home, and is that the same organisation as the support provider?',
    ],
    howToFind:
      'Use a national listing service for accessible and NDIS housing. Creating a search profile is usually free.',
    showWhen: [{ field: 'housing.desired', notOneOf: ['stay_where_they_are'] }],
    sources: [SOCIAL_HOUSING],
  },
  {
    id: 'support-provider',
    plainName: 'A support provider',
    kind: 'registered_provider',
    description: {
      simple: 'The organisation whose workers give the day-to-day help.',
      tellMeMore:
        'This is the decision people live with most closely, and it can be changed. Meeting more than one before choosing is normal and expected.',
      detail:
        'Providers may be registered or unregistered, which affects what they can be paid for depending on how a plan is managed.',
    },
    helpsWith: ['Providing the actual support', 'Setting up a routine that works'],
    questionsToAsk: [
      'How do you match workers to people, and what happens if it is not working?',
      'What is your turnover like in this area?',
    ],
    howToFind:
      'Ask a support coordinator, or search the provider finder for your area and shortlist a few.',
    sources: [NDIS_HOME_AND_LIVING],
  },
]

export const ORGANISATIONS_BY_ID: ReadonlyMap<string, Organisation> = new Map(
  ORGANISATIONS.map((organisation) => [organisation.id, organisation]),
)
