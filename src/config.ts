// Waitlist signups go into a Supabase table that the public can add rows to
// but never read (see supabase/migrations/). These values are public by
// design: they end up in the page's JavaScript, and the database's
// row-level security is what keeps the list private.
export const WAITLIST = {
  supabaseUrl: (import.meta.env.PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/$/, ''),
  supabaseKey: (import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
  contactEmail: (import.meta.env.PUBLIC_CONTACT_EMAIL ?? '').trim(),
};

// The waitlist (form, buttons, privacy page) only appears once it can store
// a signup and tell people how to get it deleted. Until then the site
// builds without it, rather than showing a form that can't work.
export const WAITLIST_ON = Boolean(WAITLIST.supabaseUrl && WAITLIST.supabaseKey && WAITLIST.contactEmail);

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
  pricing: 'pricing',
  refuse: 'what-we-wont-do',
  faq: 'faq',
  waitlist: 'waitlist',
} as const;

// A link to a home-page section that also works from /privacy/.
export const sectionHref = (id: string) => path(`/#${id}`);

export const NAV_LINKS = [
  { label: 'How it works', href: sectionHref(SECTIONS.howItWorks) },
  { label: 'What you get', href: sectionHref(SECTIONS.whatYouGet) },
  { label: 'Pricing', href: sectionHref(SECTIONS.pricing) },
  { label: 'FAQ', href: sectionHref(SECTIONS.faq) },
];
