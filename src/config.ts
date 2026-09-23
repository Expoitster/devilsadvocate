export const SITE = {
  name: 'Devils Advocate',
  title: 'Devils Advocate: challenge your idea before reality does',
  description:
    'A coming-soon chatbot that challenges your startup idea or big decision with receipts from failed startups and 2,000 years of philosophy, then hands the decision back to you. Private beta opens December 1, 2026.',
  ogImageAlt:
    'Devils Advocate. “I’m skipping placements to build my startup full time.” “Your idea sounds great. That’s what worries us.” Private beta opens December 1, 2026.',
};

// Site-relative URL that respects Astro's `base` (e.g. /devilsadvocate on
// GitHub Pages). Pass a path starting with "/".
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const path = (p: string) => `${BASE}${p}`;

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
} as const;

// A link to a home-page section, prefixed with the base path.
export const sectionHref = (id: string) => path(`/#${id}`);

export const NAV_LINKS = [
  { label: 'How it works', href: sectionHref(SECTIONS.howItWorks) },
  { label: 'What you get', href: sectionHref(SECTIONS.whatYouGet) },
  { label: 'FAQ', href: sectionHref(SECTIONS.faq) },
];
