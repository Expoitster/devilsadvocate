// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// A dev-only page that shows every voice component side by side. It is
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

export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [devComponentsPage],
  vite: {
    plugins: [tailwindcss()],
  },
});
