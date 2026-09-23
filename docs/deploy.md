# Deploying the site

The site builds to plain static files in `dist/`. There is no server code,
so any static host works. It's currently set up for GitHub Pages; Vercel
and Netlify steps are further down.

## GitHub Pages (current)

Live at **https://expoitster.github.io/devilsadvocate/**

`.github/workflows/pages.yml` builds and publishes the site on every push
to `claude/lucid-planck-8061mj` or `main`.

1. **One-time setup:** go to **Settings > Pages**. Under **Build and
   deployment > Source**, choose **GitHub Actions**. The workflow can't
   switch this on itself: GitHub doesn't let a workflow's own token change
   repository settings.
2. **Run it:** go to **Actions > Deploy to GitHub Pages**. Re-run the
   latest run, or use **Run workflow**. It takes about a minute. The URL
   appears on the run page and under **Settings > Pages**.
3. **Optional:** go to **Settings > Secrets and variables > Actions >
   Variables** and add `PUBLIC_CONTACT_EMAIL` (and later
   `PUBLIC_FORM_ENDPOINT`). They take effect on the next deploy.

The site is served from `/devilsadvocate/`. The workflow passes that path
to the build as `BASE_PATH`, so every link and asset is prefixed with it.
If you later add a custom domain under **Settings > Pages**, the workflow
picks up the new address automatically on the next run.

## Vercel or Netlify

### Before you deploy

1. **Merge the work into your main branch.** Hosts deploy one branch to
   production, usually `main`. Merge `claude/lucid-planck-8061mj` into it,
   or point the host at that branch in step 3 below.
2. **Check that the build passes locally:**
   ```sh
   npm install
   npm run build      # writes dist/
   npm run preview    # http://localhost:4321, serves dist/ exactly as a host would
   ```
3. **Have these values ready.** They go in the host's environment variables:

   | Variable | What it's for |
   | --- | --- |
   | `SITE_URL` | Your public address, e.g. `https://www.example.com`. Used for canonical links, the share image, and the sitemap. Until you have a domain you can leave it unset: both hosts pass their own URL to the build. |
   | `PUBLIC_CONTACT_EMAIL` | Shown in the FAQ and on `/privacy`. |
   | `PUBLIC_FORM_ENDPOINT` | The waitlist form's endpoint (for when the form is built). |

   Anything left unset shows up on the page as a literal `{{…}}`, so you'll
   spot it.

### Option A: Vercel

1. Sign in at vercel.com with GitHub.
2. Choose **Add New… > Project**, find `devilsadvocate`, and click **Import**.
   If the repo isn't listed, use **Adjust GitHub App Permissions** to give
   Vercel access to it.
3. Vercel detects Astro. `vercel.json` in the repo already sets:
   - build command: `npm run build`
   - output directory: `dist`
   - long-lived caching for the hashed files in `/_astro/`
4. Open **Environment Variables** and add the variables from the table
   above.
5. Click **Deploy**. You'll get a `*.vercel.app` address when it finishes.
6. To change the production branch: **Settings > Git > Production Branch**.

### Option B: Netlify

1. Sign in at app.netlify.com with GitHub.
2. Choose **Add new site > Import an existing project > GitHub**, then pick
   `devilsadvocate`.
3. `netlify.toml` in the repo already sets:
   - build command: `npm run build`
   - publish directory: `dist`
   - Node 22
   - caching headers
4. Before deploying, open **Add environment variables** and add the
   variables from the table above.
5. Click **Deploy**. You'll get a `*.netlify.app` address.
6. To change the production branch: **Site configuration > Build & deploy >
   Branches and deploy contexts**.

## Connect a custom domain

Do this from the host's dashboard, and copy the exact DNS records it shows
you. The values below are only the common ones, to show you what to expect.

### On Vercel

1. Go to **Project > Settings > Domains**, enter `example.com`, and click
   **Add**. When Vercel offers to add `www.example.com` too, accept it and
   choose which of the two redirects to the other.
2. At your domain registrar (GoDaddy, Namecheap, Hostinger, Cloudflare, …),
   add the records Vercel lists. Usually:
   - an **A** record for `@` (the bare domain), pointing to Vercel's IP;
   - a **CNAME** record for `www`, pointing to the `cname.vercel-dns…` value
     it shows.

   Alternatively, switch the domain's nameservers to Vercel's and let Vercel
   manage DNS.

### On Netlify

1. Go to **Domain management > Add a domain**, enter `example.com`, and
   verify that you own it.
2. Choose one:
   - **Netlify DNS (simplest):** switch your registrar's nameservers to the
     four Netlify nameservers it lists.
   - **Keep your registrar's DNS:** add a **CNAME** for `www` pointing to
     `your-site.netlify.app`. For the bare domain, add an **ALIAS/ANAME**
     record pointing to it, or, if your registrar doesn't support those, the
     **A** record Netlify shows.

### After DNS is set up (both hosts)

1. DNS usually takes minutes to a few hours to propagate. The dashboard
   shows the domain as valid when it's done.
2. HTTPS certificates are issued automatically (Let's Encrypt). Nothing to
   configure.
3. Set `SITE_URL` to the final address, e.g. `https://www.example.com`, and
   redeploy. Canonical links, the share image URL, and `sitemap.xml` then
   point at your domain.
4. Check it:
   - `https://your-domain/robots.txt` should list the sitemap.
   - `https://your-domain/sitemap.xml` should list `/` and `/privacy/`.
   - Paste the URL into a share preview tool (for example LinkedIn's Post
     Inspector) to see the 1200x630 card.

## Updating the site

Push to the production branch and the host rebuilds automatically. Each
pull request also gets its own preview URL on both hosts.

If you change the headline or the icon, re-render the share and icon
images. See the comment at the top of `scripts/render-images.cjs`.
