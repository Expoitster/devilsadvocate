You are building a STATIC marketing website for a product that is coming soon. The site's only job: make visitors understand the idea and the step-by-step journey they will get, then join a waitlist.

Waitlist storage (September 23, 2026): signups go into a Supabase table (`public.waitlist`, see `supabase/migrations/`). The browser writes to it directly with the public anon/publishable key; row-level security lets the public insert and nothing else, so the list is readable only from the Supabase dashboard. Never put a service-role key in the site. The waitlist (form, buttons, FAQ answer, privacy page) is built only when `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `PUBLIC_CONTACT_EMAIL` are all set (`WAITLIST_ON` in `src/config.ts`).

Hard scope rules:
- Static site only: no backend of our own, no API routes, no login, no pricing. The only database is the insert-only Supabase waitlist table.
- Do NOT build any product functionality. No working chatbot, no working microphone, no transcription. Any product screens shown on the page are illustrative mockups made of HTML and CSS.
- The only interactive pieces allowed: the hero animation, the "How it works" step-through, FAQ toggles, and the waitlist form (which writes to the Supabase waitlist table).

The site copy lives in `docs/copy.md` (the COPY section below, kept in sync).

# PRODUCT (for context; the site describes it, it does not build it)
Name: Devils Advocate
One-liner: A coming-soon chatbot you talk to (voice or text) that challenges your startup idea or big life decision with real evidence, then hands the decision back to you.

How the product will behave (describe this on the site):
- It asks up to 3 clarifying questions before it argues.
- It never agrees or disagrees outright. It first says what's genuinely strong in your case, then presents the strongest other side.
- Every counterpoint has receipts: a curated database of real failed startups, and the actual texts of philosophers, with every quote checked word for word.
- It never gives a verdict. The user always decides.

Two modes:
- Challenge my idea: startup ideas and work proposals. Main lens: survivorship bias.
- Challenge my decision: big life decisions and philosophy and beliefs. Evidence comes from what great thinkers argued, on both sides, with book and chapter.

Audience: MBA students, first-time founders, and young professionals in India. Smart, busy, allergic to fluff, and on their phones. Design mobile-first.

Launch status: private beta opens December 1, 2026. Waitlist members get in first.

# VOICE
Humorous, straightforward, warm. Think: the funny, sharp friend who asks "wait, why?" when everyone else says "go for it." Short sentences and plain words. The humor comes from honesty, not insults. Never mean to the reader, never smug.

Rules:
- Never invent social proof: no fake testimonials, no fake user counts, no "trusted by" logos.
- No pricing and no "free" claims.
- Sentence case everywhere. Buttons say exactly what happens ("Join the waitlist").

# DESIGN LANGUAGE: "Two voices on one page"
Concept: the page itself is a conversation between the reader and the devil's advocate. Every visual choice encodes WHO is speaking.

Typography, two families from Google Fonts (self-hosted via @fontsource or loaded with preconnect):
- Fraunces is the product's voice: headlines and anything Devils Advocate "says." Use its optical sizing.
- Bricolage Grotesque is the user's voice: the user's lines in mockups, plus body text, UI, and forms.
Set a real type scale (for example 1.25 ratio on mobile, 1.333 on desktop), body at 17–18px, line length under 70 characters, and serif lines slightly more open.

Color tokens (CSS variables, light and dark):
- --paper #F1F3F8 (cool page background)
- --surface #FFFFFF
- --ink #1A1F36 (text)
- --ink-muted #5A6078
- --devil #B3124E (deep raspberry: the product's voice, its speech marks, primary buttons)
- --you #13766A (deep teal: the user's voice and speech marks)
- --receipt #F5D547 (highlighter yellow: ONLY behind cited evidence)
Dark mode: --paper #141830, --surface #1D2240, --ink #E8EAF3, --ink-muted #A3A8C3, --devil #FF5C8A, --you #3CC9B5, --receipt #E8C63A at 35% opacity behind text.

Layout:
- Conversation as structure: user lines align left with a teal marker; product replies indent from the left and carry a raspberry marker. Use this in the hero, the journey, and the FAQ (questions are the user's voice, answers are the product's voice).
- Left-aligned text, generous whitespace between sections, and no card grids for regular content.
- Citations appear as small inline "receipt" chips, highlighted yellow.
- Spend boldness in one place: the hero's animated debate. Everything else stays quiet and disciplined.

Motion:
- ONE orchestrated moment: the hero debate plays once on load.
- The journey step-through changes only when the user clicks.
- No fade-in-on-scroll for every section. Respect prefers-reduced-motion by showing the final state instantly.

Avoid (these make a page look generated):
- All-caps eyebrow labels above headings.
- Highlighting one word of a headline in a different color or italic.
- Arrows appended to buttons.
- Monospace for labels.
- "A · B · C" meta strings.
- Identical rounded cards with the same soft shadow.
- Gradient washes.
- Cream and terracotta palettes.
- Stock illustrations or emoji as decoration.

Quality floor: responsive from 360px up, visible keyboard focus, WCAG AA contrast, semantic HTML, Lighthouse 90+ on mobile.

# TECH
- Astro (static output) with Tailwind CSS, mapping the tokens to Tailwind theme colors.
- Small vanilla TypeScript for the hero animation, step-through, mobile menu, and form. No React needed.
- Waitlist form: plain HTML form; `src/scripts/waitlist.ts` POSTs it to Supabase's REST API (`/rest/v1/waitlist`). No backend of our own.
- Deploy target: GitHub Pages (.github/workflows/pages.yml); any static host works.

# COPY (use it; you may tighten wording, but keep the tone and the facts)

## Nav
Logo: Devils Advocate (Fraunces). Links: How it works, What you get, FAQ. Button: Join the waitlist.

## Hero
Headline: Your idea sounds great. That's what worries us.
Subhead: Talk through your startup idea or big decision. Devils Advocate asks the awkward questions, brings receipts from failed startups and 2,000 years of philosophy, then hands the decision back to you. You're the boss. We just read the fine print.
Primary button: Join the waitlist
Secondary link: See how it works
Small print: Private beta opens December 1, 2026. No spam. We save the arguing for the product.

Hero debate animation script (an illustration; plays once):
1. USER (voice-note bubble with an animated waveform, which then turns into text): "I'm building food delivery for college hostels. Swiggy made it, so will I."
2. Devils Advocate: "Love the confidence. Quick question first: who's paying? The students, or their parents' UPI?"
3. Devils Advocate: "Also, Swiggy is one survivor. We found three hostel-delivery startups that didn't make it. Want to meet them?" plus a receipt chip: "3 similar startups, why they shut down, sources linked"
4. Devils Advocate: "Your call. Always."

## Why this exists
Heading: The people who love you are terrible at this.
Body: Your friends say it's genius. Your parents say be careful. LinkedIn says quit your job. Nobody shows their sources.
Body: For every Zomato, there's a graveyard of food apps nobody remembers. That's survivorship bias: you only hear from the ones who made it, because the ones who didn't aren't posting about it. We give tours of the graveyard, so you don't have to move in.

## Two modes
Heading: Two ways to get argued with (nicely)
Challenge my idea: For the startup, side project, or work proposal you're about to bet time and money on. We find who tried it before, how it ended, and what would have to be true for you to be different.
Challenge my decision: For the big calls. Skip placements? Take the offer? Move cities? We bring what the great thinkers argued on both sides, with the page number, so it's not just vibes.

## What you can bring
- Startup ideas: Before you pitch it, bury it (on paper).
- Big life decisions: Quit, stay, move, or marry the startup.
- Work proposals: Stress-test the strategy before your boss does.
- Philosophy and beliefs: Argue with Aristotle. He's had time to prepare.

## How it works (click-through, 7 steps, sequence numbers are appropriate here)
Heading: Here's exactly what will happen when you show up
Toggle above the steps: Challenge my idea / Challenge my decision (changes the example shown in each step)

1. Pick your fight. Choose a mode. That's it.
2. Talk it out. Hit the mic and ramble like you would to a friend. We transcribe it, and you fix anything we misheard. ("No, I said SaaS, not sass.") Prefer typing? Also fine.
3. We ask before we argue. Up to three questions, so we argue with what you actually mean, not what we assumed.
4. We name the real question. Under "should I quit?" there's usually something bigger, like "is security worth a regret?" Or a sneaky bias, like survivorship.
5. Receipts, both sides. First, what's genuinely strong in your case. Then the strongest other side: real failed startups, or real philosophers, every claim cited. No made-up quotes. We check.
6. Push back. Disagree with us? Good. Every round brings fresh evidence, never the same point twice.
7. You decide. You leave with a hand-back card and zero verdicts. Your life, your call.

Example content per step (shown inside a static phone-screen mockup):
IDEA MODE (hostel food delivery):
- Step 2 user line: "Food delivery for college hostels. Swiggy did it, so there's clearly demand."
- Step 3 questions: "Who pays, students or parents?" / "What happens to orders during vacations?" / "Why won't hostels just call the local dhaba?"
- Step 4: "The real question: does demand survive 3 months of holidays a year? Bias spotted: survivorship. You're looking at Swiggy, not the graveyard."
- Step 5 case for you: "Captive audience, dense delivery routes, cheap marketing through hostel groups." Other side, labeled "Illustrative examples for this demo": HostelBites (2017–2019) couldn't cover delivery costs on small orders; CampusCart (2018–2020) saw orders collapse every vacation; MessMate (2016–2018) lost to the hostel's own mess contract.
- Step 6 user pushback: "But we'll do breakfast subscriptions!" Reply: "Interesting. Subscriptions fix vacation dips only if parents prepay a semester. Would they?"
DECISION MODE (skipping placements to build a startup):
- Step 2 user line: "I'm skipping placements to build my startup full time."
- Step 3 questions: "What would you lose if it fails in 12 months?" / "Does anyone depend on your income?" / "Has anyone paid for the product yet?"
- Step 4: "The real question: is a secure path worth giving up for a chance you'd regret not taking?"
- Step 5 case for you: "Many traditions prize courage and writing your own story." Other side, as receipt chips: Aristotle, Nicomachean Ethics, Book VI: practical wisdom means weighing your circumstances, not just your desire. Seneca, Letters to Lucilius: rehearse the worst case before you act, so it can't ambush you. (Paraphrases, not quotes.)
- Step 6 user pushback: "But I'll regret it forever if I don't try." Reply: "Maybe. Could you keep one offer open while you test for 8 weeks? Regret has a cheaper version."

## What you get
Heading: The hand-back card
Body: Every session ends with one card that's yours to keep:
- Your position, in one line
- The 3 toughest counterpoints, each with its source
- What's genuinely strong in your case
- The open questions only you can answer
- The cheapest test you can run this month
Line under it: No verdict. We don't do verdicts. We do homework.
Show a designed static mock of the card, using the idea-mode example.

## What we won't do
Heading: Things we refuse to do
- Tell you what to do. We're a devil's advocate, not your dad.
- Disagree just for fun. We say what's good about your case first. Contrarian, not a troll.
- Make up quotes. Every quote is checked against the actual text.
- Argue about politics. We'd like to keep our friends.
- Replace real help. If you're going through something heavy, we drop the debate and point you to people who can help.

## FAQ (questions in the user's voice, answers in the product's voice)
- Isn't this just ChatGPT with an attitude? / Most chatbots are trained to be agreeable. We're built to find the other side, and we bring receipts: a curated database of failed startups and the actual texts of philosophers, with every quote checked.
- Does it just disagree with everything? / No. It tells you what's strong first, then the strongest other side. Then it steps aside.
- What if I'm actually right? / Then you walk away more sure, with the counterarguments already handled. That's a win.
- Do I have to talk? I'm shy. / Type if you prefer. The mic is for people who think out loud.
- Who is it for? / MBA students, first-time founders, and anyone about to make a call they'd hate to get wrong.
- Can I use it right now? / Not yet. Private beta opens December 1, 2026, and the waitlist gets in first.
- What do you do with my waitlist details? / We use them only to invite you to the beta. Email the contact address (PUBLIC_CONTACT_EMAIL) and we'll delete them.

## Waitlist (final section)
Heading: Got an idea you're completely sure about? Perfect.
Subhead: Join the waitlist. We'll argue with you on December 1.
Fields:
- Email (required)
- First name (optional)
- I am a (single select): MBA student / First-time founder / Working professional / Just curious
- What would you bring first? (multi-select chips): A startup idea / A life decision / A work proposal / A belief I want to test
- The idea or decision you'd bring (optional, one line, placeholder: "e.g. I'm skipping placements to start a pet-food brand")
Button: Join the waitlist
Success: You're in. We'll email you before the beta opens on December 1. Until then, practice: doubt one thing you believed this morning.
Invalid email: That email looks off. Check for typos and try again.
Send failed: Something broke on our side, and it's not your idea's fault. Try again in a minute.

## Footer
Built by Avinash G, an MBA student who heard "great idea" one too many times.
Links: Privacy (a short static page: we collect your email and waitlist answers only to invite you to the beta; they are stored in our database, hosted by Supabase; email the contact address to have them deleted).

# REPO NOTES (added during setup)
- Run `npm run dev` (http://localhost:4321), `npm run build`, and `npm run check`. `/_components` is a dev-only preview of the voice components.
- Tokens, type scale, and voice styles live in `src/styles/global.css`. Tailwind's default palette is cleared, so only the token colors exist as utilities (`bg-paper`, `text-devil`, `text-step-1`, `text-display`, ...).
- Use `UserLine`, `ProductLine`, `Receipt`, and `PhoneFrame` from `src/components/` for anything conversational. Don't restyle speech marks per section.
- Section ids and nav links live in `src/config.ts`. Use `path()` / `sectionHref()` from there for links: the site is served from a sub-path on GitHub Pages.
- Waitlist settings (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_CONTACT_EMAIL`) are GitHub Actions variables, passed to the build by the Pages workflow.
