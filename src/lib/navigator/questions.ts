import type { Question } from './question-schema'

/**
 * The opening journey.
 *
 * Ten questions, one per screen, no NDIS terminology until the last one — where
 * the person is being asked about their plan and the formal name is genuinely
 * the clearer word. Two questions are skipped when earlier answers make them
 * pointless.
 */
export const QUESTIONS: readonly Question[] = [
  {
    id: 'perspective',
    purpose:
      'Everything after this reads differently depending on whether you are exploring for yourself or for someone else.',
    type: 'single-select',
    profileField: 'perspective',
    question: {
      self: 'Who are you exploring housing options for?',
      other: 'Who are you exploring housing options for?',
    },
    threadLabel: { self: 'Exploring for', other: 'Exploring for' },
    options: [
      {
        value: 'self',
        label: { self: 'Myself', other: 'Myself' },
        statement: {
          self: "You're exploring options for yourself.",
          other: "You're exploring options for yourself.",
        },
      },
      {
        value: 'parent',
        label: { self: 'My child', other: 'My child' },
        statement: {
          self: "You're exploring options for your child.",
          other: "You're exploring options for your child.",
        },
      },
      {
        value: 'carer',
        label: { self: 'Someone I care for', other: 'Someone I care for' },
        statement: {
          self: "You're exploring options for someone you care for.",
          other: "You're exploring options for someone you care for.",
        },
      },
      {
        value: 'family',
        label: { self: 'A family member', other: 'A family member' },
        statement: {
          self: "You're exploring options for a family member.",
          other: "You're exploring options for a family member.",
        },
      },
      {
        value: 'professional',
        label: {
          self: 'Someone I support professionally',
          other: 'Someone I support professionally',
        },
        statement: {
          self: "You're exploring options for someone you support professionally.",
          other: "You're exploring options for someone you support professionally.",
        },
      },
      {
        value: 'other',
        label: { self: 'Someone else', other: 'Someone else' },
        statement: {
          self: "You're exploring options for someone else.",
          other: "You're exploring options for someone else.",
        },
      },
    ],
  },
  {
    id: 'current-living',
    purpose:
      'Where someone lives now shapes which options are a change of home, and which are a change of support in the same home.',
    type: 'single-select',
    profileField: 'housing.current',
    question: {
      self: 'Where do you live now?',
      other: 'Where do they live now?',
    },
    threadLabel: { self: 'Living now', other: 'Living now' },
    options: [
      {
        value: 'family_home',
        label: { self: 'In the family home', other: 'In the family home' },
        statement: {
          self: 'You live in the family home.',
          other: 'They live in the family home.',
        },
      },
      {
        value: 'own_rental',
        label: { self: 'In a place I rent', other: 'In a place they rent' },
        statement: {
          self: 'You rent where you live.',
          other: 'They rent where they live.',
        },
      },
      {
        value: 'own_home',
        label: { self: 'In a home I own', other: 'In a home they own' },
        statement: {
          self: 'You own your home.',
          other: 'They own their home.',
        },
      },
      {
        value: 'social_housing',
        label: {
          self: 'In social or community housing',
          other: 'In social or community housing',
        },
        statement: {
          self: 'You live in social or community housing.',
          other: 'They live in social or community housing.',
        },
      },
      {
        value: 'shared_with_support',
        label: {
          self: 'In a shared home with support staff',
          other: 'In a shared home with support staff',
        },
        statement: {
          self: 'You live in a shared home with support staff.',
          other: 'They live in a shared home with support staff.',
        },
      },
      {
        value: 'specialist_housing',
        label: {
          self: 'In housing built for people with disability',
          other: 'In housing built for people with disability',
        },
        statement: {
          self: 'You live in housing built for people with disability.',
          other: 'They live in housing built for people with disability.',
        },
      },
      {
        value: 'no_stable_home',
        label: {
          self: 'I have no stable home at the moment',
          other: 'They have no stable home at the moment',
        },
        hint: {
          self: 'Including hospital, respite, or staying with different people.',
          other: 'Including hospital, respite, or staying with different people.',
        },
        statement: {
          self: 'You have no stable home at the moment.',
          other: 'They have no stable home at the moment.',
        },
      },
      {
        value: 'other',
        label: { self: 'Somewhere else', other: 'Somewhere else' },
        statement: {
          self: 'You live somewhere not listed here.',
          other: 'They live somewhere not listed here.',
        },
      },
    ],
  },
  {
    id: 'desired-change',
    purpose:
      'The change someone wants matters more than their current arrangement. It tells us what the pathway has to achieve.',
    type: 'single-select',
    profileField: 'goals.change',
    question: {
      self: 'What would you most like to change?',
      other: 'What would they most like to change?',
    },
    threadLabel: { self: 'Wants to change', other: 'Wants to change' },
    options: [
      {
        value: 'move_out_of_family_home',
        label: {
          self: 'Move out of the family home',
          other: 'Move out of the family home',
        },
        statement: {
          self: 'You want to move out of the family home.',
          other: 'They want to move out of the family home.',
        },
      },
      {
        value: 'more_independence',
        label: {
          self: 'Do more for myself, where I am',
          other: 'Do more for themselves, where they are',
        },
        statement: {
          self: 'You want to do more for yourself.',
          other: 'They want to do more for themselves.',
        },
      },
      {
        value: 'more_support_where_they_are',
        label: {
          self: 'Get more support in my current home',
          other: 'Get more support in their current home',
        },
        statement: {
          self: 'You want more support where you already live.',
          other: 'They want more support where they already live.',
        },
        implies: [{ field: 'housing.desired', value: 'stay_where_they_are' }],
      },
      {
        value: 'change_who_they_live_with',
        label: {
          self: 'Change who I live with',
          other: 'Change who they live with',
        },
        statement: {
          self: 'You want to change who you live with.',
          other: 'They want to change who they live with.',
        },
      },
      {
        value: 'leave_unsuitable_arrangement',
        label: {
          self: 'Leave an arrangement that is not working',
          other: 'Leave an arrangement that is not working',
        },
        statement: {
          self: 'You want to leave an arrangement that is not working.',
          other: 'They want to leave an arrangement that is not working.',
        },
      },
      {
        value: 'plan_for_the_future',
        label: {
          self: 'Nothing yet — I want to plan ahead',
          other: 'Nothing yet — we want to plan ahead',
        },
        statement: {
          self: "You're planning ahead rather than changing things now.",
          other: "You're planning ahead rather than changing things now.",
        },
      },
      {
        value: 'unsure',
        label: { self: "I'm not sure", other: "I'm not sure" },
        unsure: true,
        statement: {
          self: "You're not sure yet what you want to change.",
          other: "You're not sure yet what they want to change.",
        },
      },
    ],
  },
  {
    id: 'desired-living',
    purpose:
      'How someone wants to live is the strongest signal we have. It separates living alone, living with chosen people, and shared arrangements.',
    type: 'single-select',
    profileField: 'housing.desired',
    question: {
      self: 'How would you like to live?',
      other: 'How would they like to live?',
    },
    help: {
      self: 'Think about the arrangement you would choose, not what you think is available.',
      other:
        'Think about the arrangement they would choose, not what you think is available.',
    },
    threadLabel: { self: 'Would like to live', other: 'Would like to live' },
    showWhen: [
      { field: 'goals.change', notOneOf: ['more_support_where_they_are'] },
    ],
    options: [
      {
        value: 'own_place_alone',
        label: { self: 'In my own place, on my own', other: 'In their own place, on their own' },
        statement: {
          self: "You'd like your own place, living on your own.",
          other: "They'd like their own place, living on their own.",
        },
      },
      {
        value: 'own_place_with_chosen_people',
        label: {
          self: 'In my own place, with people I choose',
          other: 'In their own place, with people they choose',
        },
        hint: {
          self: 'A partner, a friend, a housemate, or a host family.',
          other: 'A partner, a friend, a housemate, or a host family.',
        },
        statement: {
          self: "You'd like your own place, with people you choose.",
          other: "They'd like their own place, with people they choose.",
        },
      },
      {
        value: 'shared_home_with_support',
        label: {
          self: 'In a shared home where support is always on hand',
          other: 'In a shared home where support is always on hand',
        },
        statement: {
          self: "You'd like a shared home where support is always on hand.",
          other: "They'd like a shared home where support is always on hand.",
        },
      },
      {
        value: 'stay_where_they_are',
        label: {
          self: 'Stay where I am, with things set up better',
          other: 'Stay where they are, with things set up better',
        },
        statement: {
          self: "You'd like to stay where you are, set up better.",
          other: "They'd like to stay where they are, set up better.",
        },
      },
      {
        value: 'unsure',
        label: { self: "I'm not sure", other: "I'm not sure" },
        unsure: true,
        statement: {
          self: "You're not sure yet how you'd like to live.",
          other: "You're not sure yet how they'd like to live.",
        },
      },
    ],
  },
  {
    id: 'life-stage',
    purpose:
      'A few options are only open to adults. Asking keeps us from suggesting something that is not available yet.',
    type: 'single-select',
    profileField: 'context.lifeStage',
    question: {
      self: 'Are you 18 or over?',
      other: 'Are they 18 or over?',
    },
    threadLabel: { self: 'Age', other: 'Age' },
    showWhen: [
      { field: 'goals.change', notOneOf: ['more_support_where_they_are'] },
    ],
    options: [
      {
        value: 'adult',
        label: { self: 'Yes, 18 or over', other: 'Yes, 18 or over' },
        statement: {
          self: 'You are 18 or over.',
          other: 'They are 18 or over.',
        },
      },
      {
        value: 'under_18',
        label: { self: 'No, under 18', other: 'No, under 18' },
        statement: {
          self: 'You are under 18.',
          other: 'They are under 18.',
        },
      },
      {
        value: 'unsure',
        label: { self: "I'm not sure", other: "I'm not sure" },
        unsure: true,
        statement: {
          self: "You're not sure whether you are 18 or over.",
          other: "You're not sure whether they are 18 or over.",
        },
      },
    ],
  },
  {
    id: 'support-intensity',
    purpose:
      'How much help is needed through the day is one of the two facts that most affects which support options are realistic.',
    type: 'single-select',
    profileField: 'support.dailyIntensity',
    question: {
      self: 'How much help do you need day to day?',
      other: 'How much help do they need day to day?',
    },
    help: {
      self: 'Include help with things like cooking, personal care, medication, getting organised, or staying safe.',
      other:
        'Include help with things like cooking, personal care, medication, getting organised, or staying safe.',
    },
    threadLabel: { self: 'Help day to day', other: 'Help day to day' },
    options: [
      {
        value: 'occasional',
        label: { self: 'Now and then', other: 'Now and then' },
        statement: {
          self: 'You need help now and then.',
          other: 'They need help now and then.',
        },
      },
      {
        value: 'daily_brief',
        label: { self: 'A little help most days', other: 'A little help most days' },
        statement: {
          self: 'You need a little help most days.',
          other: 'They need a little help most days.',
        },
      },
      {
        value: 'daily_extensive',
        label: { self: 'A lot of help most days', other: 'A lot of help most days' },
        statement: {
          self: 'You need a lot of help most days.',
          other: 'They need a lot of help most days.',
        },
      },
      {
        value: 'several_times_daily',
        label: {
          self: 'Help at several points through the day',
          other: 'Help at several points through the day',
        },
        statement: {
          self: 'You need help at several points through the day.',
          other: 'They need help at several points through the day.',
        },
      },
      {
        value: 'unsure',
        label: { self: "I'm not sure", other: "I'm not sure" },
        unsure: true,
        statement: {
          self: "You're not sure how much help you need day to day.",
          other: "You're not sure how much help they need day to day.",
        },
      },
    ],
  },
  {
    id: 'overnight-support',
    purpose:
      'Overnight need is the other decisive fact. It changes which living arrangements can work at all.',
    type: 'single-select',
    profileField: 'support.overnight',
    question: {
      self: 'Is help needed overnight?',
      other: 'Is help needed overnight?',
    },
    threadLabel: { self: 'Overnight', other: 'Overnight' },
    options: [
      {
        value: 'none',
        label: { self: 'No', other: 'No' },
        statement: {
          self: 'You do not need help overnight.',
          other: 'They do not need help overnight.',
        },
      },
      {
        value: 'occasional',
        label: { self: 'Occasionally', other: 'Occasionally' },
        statement: {
          self: 'You occasionally need help overnight.',
          other: 'They occasionally need help overnight.',
        },
      },
      {
        value: 'most_nights',
        label: { self: 'Most nights', other: 'Most nights' },
        statement: {
          self: 'You need help most nights.',
          other: 'They need help most nights.',
        },
      },
      {
        value: 'someone_always_available',
        label: {
          self: 'Someone needs to be available at all times',
          other: 'Someone needs to be available at all times',
        },
        hint: {
          self: 'Awake or asleep, but always there and able to help.',
          other: 'Awake or asleep, but always there and able to help.',
        },
        statement: {
          self: 'Someone needs to be available to you at all times.',
          other: 'Someone needs to be available to them at all times.',
        },
      },
      {
        value: 'unsure',
        label: { self: "I'm not sure", other: "I'm not sure" },
        unsure: true,
        statement: {
          self: "You're not sure about overnight help.",
          other: "You're not sure about overnight help.",
        },
      },
    ],
  },
  {
    id: 'housing-features',
    purpose:
      'Whether the building itself has to change is a separate question from how much support someone needs. Keeping them apart avoids assuming one from the other.',
    type: 'single-select',
    profileField: 'housing.featureNeeds',
    question: {
      self: 'Does the home itself need to be different?',
      other: 'Does the home itself need to be different?',
    },
    help: {
      self: 'This is about the building — doorways, bathrooms, ceiling hoists — not about the help you receive.',
      other:
        'This is about the building — doorways, bathrooms, ceiling hoists — not about the help they receive.',
    },
    threadLabel: { self: 'The home itself', other: 'The home itself' },
    options: [
      {
        value: 'none_known',
        label: {
          self: 'No changes I know of',
          other: 'No changes we know of',
        },
        statement: {
          self: 'The home does not need physical changes that you know of.',
          other: 'The home does not need physical changes that you know of.',
        },
      },
      {
        value: 'small_changes',
        label: {
          self: 'Small changes, like grab rails or a ramp',
          other: 'Small changes, like grab rails or a ramp',
        },
        statement: {
          self: 'The home needs small physical changes.',
          other: 'The home needs small physical changes.',
        },
      },
      {
        value: 'substantial_changes',
        label: {
          self: 'Bigger changes, like rebuilding a bathroom',
          other: 'Bigger changes, like rebuilding a bathroom',
        },
        statement: {
          self: 'The home needs substantial physical changes.',
          other: 'The home needs substantial physical changes.',
        },
      },
      {
        value: 'purpose_built',
        label: {
          self: 'A home designed or built for high physical support needs',
          other: 'A home designed or built for high physical support needs',
        },
        hint: {
          self: 'Reinforced ceilings, full wheelchair access throughout, or on-site emergency support.',
          other:
            'Reinforced ceilings, full wheelchair access throughout, or on-site emergency support.',
        },
        statement: {
          self: 'You may need a home designed for high physical support needs.',
          other: 'They may need a home designed for high physical support needs.',
        },
      },
      {
        value: 'unsure',
        label: { self: "I'm not sure", other: "I'm not sure" },
        unsure: true,
        statement: {
          self: "You're not sure whether the home needs physical changes.",
          other: "You're not sure whether the home needs physical changes.",
        },
      },
    ],
  },
  {
    id: 'informal-support',
    purpose:
      'Family and friends already doing the work is a real part of the picture, and it changes over time. Only asked when there is daily support to account for.',
    type: 'single-select',
    profileField: 'support.informal',
    question: {
      self: 'Who helps you now, apart from paid workers?',
      other: 'Who helps them now, apart from paid workers?',
    },
    threadLabel: { self: 'Help from family or friends', other: 'Help from family or friends' },
    showWhen: [{ field: 'support.dailyIntensity', notOneOf: ['occasional'] }],
    options: [
      {
        value: 'strong_and_ongoing',
        label: {
          self: 'Family or friends help a lot, and can keep going',
          other: 'Family or friends help a lot, and can keep going',
        },
        statement: {
          self: 'Family or friends help a lot and can keep going.',
          other: 'Family or friends help a lot and can keep going.',
        },
      },
      {
        value: 'some',
        label: { self: 'Some help from family or friends', other: 'Some help from family or friends' },
        statement: {
          self: 'You get some help from family or friends.',
          other: 'They get some help from family or friends.',
        },
      },
      {
        value: 'very_little',
        label: {
          self: 'Very little, or it cannot continue',
          other: 'Very little, or it cannot continue',
        },
        hint: {
          self: 'Including where the people helping are ageing or unwell.',
          other: 'Including where the people helping are ageing or unwell.',
        },
        statement: {
          self: 'Help from family or friends is limited or cannot continue.',
          other: 'Help from family or friends is limited or cannot continue.',
        },
      },
      {
        value: 'none',
        label: { self: 'No one', other: 'No one' },
        statement: {
          self: 'No family or friends are helping now.',
          other: 'No family or friends are helping now.',
        },
      },
      {
        value: 'unsure',
        label: { self: "I'm not sure", other: "I'm not sure" },
        unsure: true,
        statement: {
          self: "You're not sure what help family or friends can give.",
          other: "You're not sure what help family or friends can give.",
        },
      },
    ],
  },
  {
    id: 'timing',
    purpose:
      'Urgency changes the order of the steps ahead, and which short-term options are worth knowing about.',
    type: 'single-select',
    profileField: 'context.timing',
    question: {
      self: 'When does this need to happen?',
      other: 'When does this need to happen?',
    },
    threadLabel: { self: 'Timing', other: 'Timing' },
    options: [
      {
        value: 'urgent',
        label: { self: 'Soon — the current situation cannot hold', other: 'Soon — the current situation cannot hold' },
        statement: {
          self: 'The current situation cannot hold for long.',
          other: 'The current situation cannot hold for long.',
        },
      },
      {
        value: 'within_a_year',
        label: { self: 'Within the next year', other: 'Within the next year' },
        statement: {
          self: "You'd like this sorted within the next year.",
          other: "You'd like this sorted within the next year.",
        },
      },
      {
        value: 'planning_ahead',
        label: { self: 'No set time — planning ahead', other: 'No set time — planning ahead' },
        statement: {
          self: "There's no set time. You're planning ahead.",
          other: "There's no set time. You're planning ahead.",
        },
      },
      {
        value: 'unsure',
        label: { self: "I'm not sure", other: "I'm not sure" },
        unsure: true,
        statement: {
          self: "You're not sure about timing yet.",
          other: "You're not sure about timing yet.",
        },
      },
    ],
  },
  {
    id: 'ndis-context',
    purpose:
      'What is already in the NDIS plan decides whether the next step is a request, a review, or a conversation about access.',
    type: 'single-select',
    profileField: 'context.ndis',
    question: {
      self: 'What is happening with your NDIS plan right now?',
      other: 'What is happening with their NDIS plan right now?',
    },
    help: {
      self: 'Housing and support funding sits in a part of the plan called home and living supports.',
      other:
        'Housing and support funding sits in a part of the plan called home and living supports.',
    },
    threadLabel: { self: 'NDIS plan', other: 'NDIS plan' },
    options: [
      {
        value: 'no_ndis_plan',
        label: { self: 'I do not have an NDIS plan', other: 'They do not have an NDIS plan' },
        statement: {
          self: 'You do not have an NDIS plan.',
          other: 'They do not have an NDIS plan.',
        },
      },
      {
        value: 'plan_without_home_and_living',
        label: {
          self: 'I have a plan, without home and living supports',
          other: 'They have a plan, without home and living supports',
        },
        statement: {
          self: 'You have a plan without home and living supports.',
          other: 'They have a plan without home and living supports.',
        },
      },
      {
        value: 'plan_with_home_and_living',
        label: {
          self: 'I have a plan that already includes home and living supports',
          other: 'They have a plan that already includes home and living supports',
        },
        statement: {
          self: 'Your plan already includes home and living supports.',
          other: 'Their plan already includes home and living supports.',
        },
      },
      {
        value: 'plan_under_review',
        label: { self: 'My plan is being reviewed', other: 'Their plan is being reviewed' },
        statement: {
          self: 'Your plan is being reviewed.',
          other: 'Their plan is being reviewed.',
        },
      },
      {
        value: 'unsure',
        label: { self: "I'm not sure", other: "I'm not sure" },
        unsure: true,
        statement: {
          self: "You're not sure what the plan currently includes.",
          other: "You're not sure what the plan currently includes.",
        },
      },
    ],
  },
]

export const QUESTIONS_BY_ID: ReadonlyMap<string, Question> = new Map(
  QUESTIONS.map((question) => [question.id, question]),
)
