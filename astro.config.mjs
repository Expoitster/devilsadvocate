// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { writeFile } from 'node:fs/promises';

// The public URL, for canonical links, the share image, and the sitemap.
// Set SITE_URL once you have a domain. Until then, Netlify's URL and
// Vercel's production URL are picked up automatically at build time.
const SITE_URL =
  process.env.SITE_URL ||
  process.env.URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  undefined;

// Serve from a sub-path, e.g. /devilsadvocate for a GitHub Pages project
// site. The Pages workflow sets this; Vercel and Netlify serve from /.
const BASE_PATH = process.env.BASE_PATH || '/';

// A dev-only page that shows every conversation component side by side. It is
// injected only under `astro dev`, so it never ships in the static build.
/** @type {import('astro').AstroIntegration} */
const devComponentsPage = {
  name: 'dev-components-page',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') {
        injectRoute({ pattern: '/_components', entrypoint: './src/dev/components.astro' });
      }
    },
  },
};

// Writes robots.txt and sitemap.xml into the build. Plain files written
// once at build time; nothing runs on a server.
/** @type {import('astro').AstroIntegration} */
const crawlerFiles = {
  name: 'crawler-files',
  hooks: {
    'astro:build:done': async ({ dir, pages, logger }) => {
      /** @param {string} name */
      const out = (name) => new URL(name, dir);
      if (!SITE_URL) {
        await writeFile(out('robots.txt'), 'User-agent: *\nAllow: /\n');
        logger.warn('SITE_URL is not set: wrote robots.txt without a sitemap, and skipped sitemap.xml.');
        return;
      }
      const base = SITE_URL.replace(/\/$/, '') + BASE_PATH.replace(/\/$/, '');
      const urls = pages
        .map((p) => `${base}/${p.pathname}`)
        .sort()
        .map((loc) => `  <url><loc>${loc}</loc></url>`)
        .join('\n');
      await writeFile(
        out('sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      );
      await writeFile(out('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
    },
  },
};

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [devComponentsPage, crawlerFiles],
  vite: {
    plugins: [tailwindcss()],
  },
});
