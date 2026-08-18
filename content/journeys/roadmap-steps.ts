import type { RoadmapStep } from '@/lib/roadmap/schema'

/**
 * The roadmap steps.
 *
 * Written as things a person does, in the order a person does them. Nothing here
 * promises an outcome: a step can say what a request needs, never what a request
 * will get.
 */

/** A phrase that differs by perspective. */
const v = (self: string, other: string) => ({ self, other })
/** A phrase that reads the same either way. */
const same = (text: string) => ({ self: text, other: text })

export const ROADMAP_STEPS: readonly RoadmapStep[] = [
  {
    id: 'somewhere-safe-now',
    stage: 'now',
    title: same('Sort out somewhere safe to stay now'),
    why: same('Everything else on this list takes months. This part cannot wait for it.'),
    understand: [
      v(
        'Somewhere to stay this month is a different question from where you will live long term. Solving one does not commit you to the other.',
        'Somewhere to stay this month is a different question from where they will live long term. Solving one does not commit anyone to the other.',
      ),
    ],
    prepare: [
      same('A short, factual note on why the current situation is not safe or cannot continue.'),
    ],
    doNow: [
      v(
        'Tell your support coordinator or local area coordinator today that this is urgent, and say so in writing as well.',
        'Tell their support coordinator or local area coordinator today that this is urgent, and say so in writing as well.',
      ),
    ],
    showWhenAny: [
      { field: 'housing.current', oneOf: ['no_stable_home'] },
      { field: 'context.timing', oneOf: ['urgent'] },
    ],
  },
  {
    id: 'understand-the-options',
    stage: 'understand',
    title: same('Understand the options'),
    why: same('The conversations ahead go better when you already know roughly what exists.'),
    understand: [
      same(
        'Where someone lives, how they are supported, and who pays for each are three separate questions. Most confusion comes from treating them as one.',
      ),
      same('Options combine. A home and the support inside it are arranged separately.'),
    ],
    prepare: [
      v(
        'The options we have suggested, and a note on which ones sound like you.',
        'The options we have suggested, and a note on which ones sound like them.',
      ),
    ],
    doNow: [
      same(
        'Read the two closest options in full, including what they may not fit. The limits are usually more useful than the description.',
      ),
    ],
  },
  {
    id: 'decide-how-to-live',
    stage: 'decide',
    title: v('Decide how you want to live', 'Decide how they want to live'),
    why: same('This decision shapes every step after it, so it is worth taking time over.'),
    understand: [
      v(
        'Who you live with usually matters as much as where the home is.',
        'Who they live with usually matters as much as where the home is.',
      ),
    ],
    prepare: [
      v(
        'A description of an ordinary good week — where you are, who is around, what you do.',
        'A description of an ordinary good week — where they are, who is around, what they do.',
      ),
    ],
    doNow: [
      v(
        'Write down what you want in your own words, and take the same page to every meeting.',
        'Ask them what they want, write it in their words, and take the same page to every meeting.',
      ),
    ],
    showWhen: [{ field: 'housing.desired', notOneOf: ['stay_where_they_are'] }],
  },
  {
    id: 'check-ndis-access',
    stage: 'talk',
    title: v('Find out about getting an NDIS plan', 'Find out about getting them an NDIS plan'),
    why: same('Home and living supports sit inside a plan, so this comes before the rest.'),
    understand: [
      same(
        'Getting access to the NDIS is a separate decision from what a plan later includes. One does not settle the other.',
      ),
    ],
    prepare: [
      v(
        'Reports describing what you can and cannot do day to day.',
        'Reports describing what they can and cannot do day to day.',
      ),
    ],
    doNow: [
      same(
        'Contact the National Disability Insurance Agency or a local area coordinator and ask what an access request needs.',
      ),
    ],
    showWhen: [{ field: 'context.ndis', oneOf: ['no_ndis_plan'] }],
  },
  {
    id: 'find-out-what-the-plan-includes',
    stage: 'talk',
    title: v('Find out what your plan includes now', 'Find out what their plan includes now'),
    why: same('What to do next depends on what is already funded, so check before asking for anything.'),
    understand: [
      same(
        'Home and living supports are a specific part of a plan. A plan can exist without them.',
      ),
    ],
    prepare: [
      v(
        'Your plan document, or the login you use to see it.',
        'Their plan document, or the login used to see it.',
      ),
    ],
    doNow: [
      v(
        'Ask your plan manager or support coordinator for a current copy, and read the home and living section.',
        'Ask their plan manager or support coordinator for a current copy, and read the home and living section.',
      ),
    ],
    showWhen: [{ field: 'context.ndis', oneOf: ['unsure'] }],
  },
  {
    id: 'talk-to-your-ndis-contact',
    stage: 'talk',
    title: v('Talk to your NDIS contact', 'Talk to their NDIS contact'),
    why: same('The people who know the plan can tell you what a request needs before you make it.'),
    understand: [
      same(
        'A support coordinator, a plan manager and a local area coordinator do different jobs. It is worth knowing which one you are talking to.',
      ),
    ],
    prepare: [
      v(
        'One page: what you want to change, and why now.',
        'One page: what they want to change, and why now.',
      ),
    ],
    doNow: [same('Book the conversation, and send the page before it rather than reading it out.')],
    showWhen: [{ field: 'context.ndis', notOneOf: ['no_ndis_plan', 'unsure'] }],
  },
  {
    id: 'gather-evidence',
    stage: 'evidence',
    title: same('Gather the information you will need'),
    why: same('Requests are decided on what is written down, which is where most of the work sits.'),
    understand: [
      same(
        'Evidence is about function — what someone can do, and with what help — rather than about a diagnosis.',
      ),
    ],
    prepare: [
      v(
        'The evidence checklist in your plan, which is built from the options that may suit you.',
        'The evidence checklist in the plan, which is built from the options that may suit them.',
      ),
    ],
    doNow: [
      same(
        'Book the assessments with the longest waits first. If the home may need changes, start with occupational therapy.',
      ),
    ],
  },
  {
    id: 'request-home-and-living-supports',
    stage: 'request',
    title: same('Ask for home and living supports'),
    why: v(
      'This is the formal request that puts your housing and support question in front of a decision-maker.',
      'This is the formal request that puts their housing and support question in front of a decision-maker.',
    ),
    understand: [
      same(
        'A request explains what is needed and why the alternatives would not work. The second half is the part people leave out.',
      ),
    ],
    prepare: [same('The evidence, and a plain statement of the arrangement being asked for.')],
    doNow: [
      v(
        'Submit it with your NDIS contact, and keep a dated copy of everything you send.',
        'Submit it with their NDIS contact, and keep a dated copy of everything you send.',
      ),
    ],
    showWhen: [
      { field: 'context.ndis', oneOf: ['no_ndis_plan', 'plan_without_home_and_living'] },
    ],
  },
  {
    id: 'review-home-and-living-supports',
    stage: 'request',
    title: same('Review the home and living supports already funded'),
    why: v(
      'Something is already funded, so the question is whether it still matches what you need.',
      'Something is already funded, so the question is whether it still matches what they need.',
    ),
    understand: [
      same(
        'A change can be asked for when circumstances change, not only when a plan is reassessed.',
      ),
    ],
    prepare: [
      v(
        'What is working, what is not, and what you would change.',
        'What is working, what is not, and what they would change.',
      ),
    ],
    doNow: [
      same(
        'List the gaps between what is funded and what is actually needed, with dates and specific examples.',
      ),
    ],
    showWhen: [
      { field: 'context.ndis', oneOf: ['plan_with_home_and_living', 'plan_under_review'] },
    ],
  },
  {
    id: 'get-a-decision',
    stage: 'decision',
    title: same('Get the decision and read it properly'),
    why: same('A decision can be partly what was asked for, and it can be reviewed.'),
    understand: [
      same(
        'If a decision is not what was expected there is a formal review process, and it has time limits. Find out what they are early.',
      ),
    ],
    prepare: [same('The decision letter, and the request it responded to.')],
    doNow: [
      same('Compare the decision against the request line by line, and write down anything missing.'),
    ],
  },
  {
    id: 'find-a-home',
    stage: 'find',
    title: same('Find the home'),
    why: same('The home and the support in it are found separately, and the home usually takes longer.'),
    understand: [
      same(
        'Rent is generally not funded by the NDIS, so what the home costs is its own question with its own answers.',
      ),
    ],
    prepare: [
      v(
        'A weekly budget including bills and food, and the areas you actually want to live in.',
        'A weekly budget including bills and food, and the areas they actually want to live in.',
      ),
    ],
    doNow: [
      same('Join any waiting lists now. They run long, and being on one costs nothing.'),
    ],
    showWhen: [{ field: 'housing.desired', notOneOf: ['stay_where_they_are'] }],
  },
  {
    id: 'find-providers',
    stage: 'find',
    title: same('Find the people who will provide the support'),
    why: v(
      'Who supports you day to day matters more than which option it is funded under.',
      'Who supports them day to day matters more than which option it is funded under.',
    ),
    understand: [same('Providers can be changed later, and so can individual workers.')],
    prepare: [same('The questions to ask, taken from the options in the plan.')],
    doNow: [
      same('Meet at least two providers before choosing, and ask each of them the same questions.'),
    ],
  },
  {
    id: 'arrange-home-changes',
    stage: 'setup',
    title: same('Arrange the changes to the home'),
    why: same(
      'Building work needs an assessment, quotes and often the owner’s written consent, so it starts earlier than people expect.',
    ),
    understand: [
      same(
        'Written consent from the property owner is needed where the home is rented or is social housing.',
      ),
    ],
    prepare: [
      same('An occupational therapy report, builders’ quotes, and consent if the home is not owned.'),
    ],
    doNow: [
      same(
        'Ask for the occupational therapy assessment of the home itself, and start the consent conversation now.',
      ),
    ],
    showWhen: [
      {
        field: 'housing.featureNeeds',
        oneOf: ['small_changes', 'substantial_changes', 'purpose_built', 'unsure'],
      },
    ],
  },
  {
    id: 'set-up-supports',
    stage: 'setup',
    title: same('Set the support up'),
    why: same('The first few weeks set the pattern, so it pays to be specific from the start.'),
    understand: [
      same(
        'A service agreement says what will happen, how often, and what to do when it does not happen.',
      ),
    ],
    prepare: [
      v(
        'A description of your routine, detailed enough for a worker who has never met you to follow it.',
        'A description of their routine, detailed enough for a worker who has never met them to follow it.',
      ),
    ],
    doNow: [same('Go through the routine with the provider before the first shift, not after it.')],
  },
  {
    id: 'move-in',
    stage: 'move',
    title: same('Make the move'),
    why: same('Moving is the step most often underestimated. Give it its own plan.'),
    understand: [
      same('Support needs to be in place from the first day, rather than organised once someone is there.'),
    ],
    prepare: [same('A moving date agreed with everyone involved, including the support provider.')],
    doNow: [same('Confirm in writing who is doing what, on which day.')],
    showWhen: [{ field: 'housing.desired', notOneOf: ['stay_where_they_are'] }],
  },
  {
    id: 'review-how-it-is-working',
    stage: 'review',
    title: same('Check how it is working, and change it if it is not'),
    why: same('The first arrangement is rarely the final one. That is normal, not a failure.'),
    understand: [
      same(
        'Supports can be changed when circumstances change, without waiting for a plan reassessment.',
      ),
    ],
    prepare: [same('Notes on what has worked and what has not, with dates.')],
    doNow: [
      same('Put a date three months out in the calendar now, and treat it as a real review.'),
    ],
  },
]
