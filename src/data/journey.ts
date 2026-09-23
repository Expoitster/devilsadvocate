// "How it works": the seven steps and each mode's example, from
// docs/copy.md. Everything here is illustration for static mockups.

export type Mode = 'idea' | 'decision';
export const MODES: Mode[] = ['idea', 'decision'];

export const MODE_LABEL: Record<Mode, string> = {
  idea: 'Challenge my idea',
  decision: 'Challenge my decision',
};

export const STEPS = [
  { title: 'Pick your fight.', body: 'Choose a mode. That’s it.' },
  {
    title: 'Talk it out.',
    body: 'Hit the mic and ramble like you would to a friend. We transcribe it, and you fix anything we misheard. (“No, I said SaaS, not sass.”) Prefer typing? Also fine.',
  },
  {
    title: 'We ask before we argue.',
    body: 'Up to three questions, so we argue with what you actually mean, not what we assumed.',
  },
  {
    title: 'We name the real question.',
    body: 'Under “should I quit?” there’s usually something bigger, like “is security worth a regret?” Or a sneaky bias, like survivorship.',
  },
  {
    title: 'Receipts, both sides.',
    body: 'First, what’s genuinely strong in your case. Then the strongest other side: real failed startups, or real philosophers, every claim cited. No made-up quotes. We check.',
  },
  {
    title: 'Push back.',
    body: 'Disagree with us? Good. Every round brings fresh evidence, never the same point twice.',
  },
  {
    title: 'You decide.',
    body: 'You leave with a hand-back card and zero verdicts. Your life, your call.',
  },
] as const;

interface Example {
  /** Step 2: what the user said, as transcribed. */
  transcript: string;
  /** Step 3: up to three clarifying questions. */
  questions: string[];
  /** Step 4: the named question, and a bias if one was spotted. */
  realQuestion: { lead: string; text: string }[];
  /** Step 5 */
  caseFor: string;
  otherSideNote: string;
  receipts: { source: string; point: string }[];
  /** Step 6 */
  pushback: string;
  reply: string;
  /** Step 7: the mini hand-back card. `test` is not in docs/copy.md; each
      is drawn from that mode's step 6 exchange. */
  card: { counterpoints: string[]; test: string };
}

export const EXAMPLES: Record<Mode, Example> = {
  idea: {
    transcript: 'Food delivery for college hostels. Swiggy did it, so there’s clearly demand.',
    questions: [
      'Who pays, students or parents?',
      'What happens to orders during vacations?',
      'Why won’t hostels just call the local dhaba?',
    ],
    realQuestion: [
      { lead: 'The real question:', text: 'does demand survive 3 months of holidays a year?' },
      { lead: 'Bias spotted:', text: 'survivorship. You’re looking at Swiggy, not the graveyard.' },
    ],
    caseFor: 'Captive audience, dense delivery routes, cheap marketing through hostel groups.',
    otherSideNote: 'Illustrative examples for this demo',
    receipts: [
      { source: 'HostelBites, 2017–2019', point: 'Couldn’t cover delivery costs on small orders.' },
      { source: 'CampusCart, 2018–2020', point: 'Saw orders collapse every vacation.' },
      { source: 'MessMate, 2016–2018', point: 'Lost to the hostel’s own mess contract.' },
    ],
    pushback: 'But we’ll do breakfast subscriptions!',
    reply: 'Interesting. Subscriptions fix vacation dips only if parents prepay a semester. Would they?',
    card: {
      counterpoints: ['HostelBites, 2017–2019', 'CampusCart, 2018–2020', 'MessMate, 2016–2018'],
      test: 'Ask hostel parents if they’d prepay a semester of breakfasts.',
    },
  },
  decision: {
    transcript: 'I’m skipping placements to build my startup full time.',
    questions: [
      'What would you lose if it fails in 12 months?',
      'Does anyone depend on your income?',
      'Has anyone paid for the product yet?',
    ],
    realQuestion: [
      {
        lead: 'The real question:',
        text: 'is a secure path worth giving up for a chance you’d regret not taking?',
      },
    ],
    caseFor: 'Many traditions prize courage and writing your own story.',
    otherSideNote: 'Paraphrases, not quotes.',
    receipts: [
      {
        source: 'Aristotle, Nicomachean Ethics, Book VI',
        point: 'Practical wisdom means weighing your circumstances, not just your desire.',
      },
      {
        source: 'Seneca, Letters to Lucilius',
        point: 'Rehearse the worst case before you act, so it can’t ambush you.',
      },
    ],
    pushback: 'But I’ll regret it forever if I don’t try.',
    reply: 'Maybe. Could you keep one offer open while you test for 8 weeks? Regret has a cheaper version.',
    card: {
      counterpoints: ['Aristotle, Nicomachean Ethics, Book VI', 'Seneca, Letters to Lucilius'],
      test: 'Keep one offer open while you test for 8 weeks.',
    },
  },
};
