# Devils Advocate: coming-soon site

A static marketing site built with Astro and Tailwind CSS. There is no backend: the waitlist form posts to an external form service.

The brief is in `CLAUDE.md`, and all page copy is in `docs/copy.md`.

## Run it

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
```

While `npm run dev` is running, `/_components` shows every voice component. That page is dev-only and is left out of the build.

## Before launch

Copy `.env.example` to `.env` and set `PUBLIC_FORM_ENDPOINT` and `PUBLIC_CONTACT_EMAIL`. Until you do, the page shows the literal `{{…}}` placeholders.

## Where things live

| Path | What it is |
| --- | --- |
| `src/styles/global.css` | color tokens (light and dark), type scale, Tailwind theme mapping, voice styles |
| `src/layouts/Base.astro` | document shell, self-hosted fonts, nav, footer |
| `src/components/UserLine.astro` | the user's voice: Bricolage, teal mark, flush left |
| `src/components/ProductLine.astro` | the product's voice: Fraunces, raspberry mark, indented |
| `src/components/Receipt.astro` | inline citation chip, the only thing that is yellow |
| `src/components/PhoneFrame.astro` | static phone screen for mockups |
| `src/pages/index.astro` | the page's sections, in order |
| `src/config.ts` | section ids, nav links, placeholders |
