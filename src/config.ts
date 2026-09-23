// Values that must be filled in before launch. They render verbatim until
// then, so an unfilled placeholder is visible rather than silently wrong.
export const FORM_ENDPOINT = import.meta.env.PUBLIC_FORM_ENDPOINT || '{{FORM_ENDPOINT}}';
export const CONTACT_EMAIL = import.meta.env.PUBLIC_CONTACT_EMAIL || '{{CONTACT_EMAIL}}';

export const SITE = {
  name: 'Devils Advocate',
  description:
    'A coming-soon chatbot you talk to that challenges your startup idea or big decision with real evidence, then hands the decision back to you. Private beta opens December 1, 2026.',
};

// The in-page sections, in page order. Nav links point at these ids.
export const SECTIONS = {
  hero: 'top',
  why: 'why',
  modes: 'modes',
  bring: 'what-you-can-bring',
  howItWorks: 'how-it-works',
  whatYouGet: 'what-you-get',
  refuse: 'what-we-wont-do',
  faq: 'faq',
  waitlist: 'waitlist',
} as const;

export const NAV_LINKS = [
  { label: 'How it works', href: `#${SECTIONS.howItWorks}` },
  { label: 'What you get', href: `#${SECTIONS.whatYouGet}` },
  { label: 'FAQ', href: `#${SECTIONS.faq}` },
];
