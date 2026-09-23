/**
 * Renders the static share and icon images into public/:
 *   og.png                1200x630 Open Graph image
 *   apple-touch-icon.png  180x180
 *   favicon.ico           16 + 32 px, for browsers that skip favicon.svg
 *
 * Run it only when the headline or icon changes; the output is committed.
 * Needs Playwright (not a project dependency):
 *   npm i --no-save playwright && npx playwright install chromium
 *   node scripts/render-images.cjs
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pub = (f) => path.join(root, 'public', f);
// Inlined as data URIs: a setContent() page can't load file:// fonts.
const font = (pkg, file) =>
  'data:font/woff2;base64,' +
  fs.readFileSync(path.join(root, 'node_modules/@fontsource-variable', pkg, 'files', file)).toString('base64');
const FRAUNCES = font('fraunces', 'fraunces-latin-opsz-normal.woff2');
const BRICOLAGE = font('bricolage-grotesque', 'bricolage-grotesque-latin-opsz-normal.woff2');

const OG_HTML = `<!doctype html><html><head><style>
  @font-face { font-family: Fraunces; src: url(${FRAUNCES}) format('woff2'); font-weight: 100 900; }
  @font-face { font-family: Bricolage; src: url(${BRICOLAGE}) format('woff2'); font-weight: 200 800; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #F1F3F8; color: #1A1F36; font-optical-sizing: auto;
         padding: 68px 80px 60px; display: flex; flex-direction: column; }
  .mark { font-family: Fraunces; font-weight: 700; line-height: 1; }
  main { margin-block: auto; }
  .you { display: flex; gap: 18px; align-items: flex-start; font-family: Bricolage; font-size: 32px; font-weight: 500; }
  .you .mark { font-family: Bricolage; color: #13766A; font-size: 60px; margin-top: -4px; }
  .us { display: flex; gap: 22px; margin: 38px 0 0 56px; }
  .us .mark { color: #B3124E; font-size: 118px; margin-top: 2px; }
  h1 { font-family: Fraunces; font-size: 100px; font-weight: 580; line-height: 1.02; letter-spacing: -0.025em; }
  footer { display: flex; justify-content: space-between; align-items: baseline;
           font-family: Bricolage; font-size: 26px; color: #5A6078; }
  footer b { font-family: Fraunces; font-weight: 600; font-size: 32px; color: #1A1F36; }
</style></head><body>
  <main>
  <div class="you"><span class="mark">“</span><span>I’m skipping placements to build my startup full time.</span></div>
  <div class="us"><span class="mark">“</span><h1>Your idea sounds great.<br>That’s what worries us.</h1></div>
  </main>
  <footer><b>Devils Advocate</b><span>Private beta opens December 1, 2026.</span></footer>
</body></html>`;

// An .ico file may hold PNG images directly (Vista and later).
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const o = 6 + 16 * i;
    header.writeUInt8(size, o);
    header.writeUInt8(size, o + 1);
    header.writeUInt16LE(1, o + 4);
    header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(data.length, o + 8);
    header.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(OG_HTML, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: pub('og.png') });

  const svg = fs.readFileSync(pub('favicon.svg'), 'utf8');
  const icon = async (size, pad = 0) => {
    const p = await browser.newPage({ viewport: { width: size, height: size } });
    // The touch icon gets square corners; iOS applies its own mask.
    const body = pad ? svg.replace('rx="7"', 'rx="0"') : svg;
    await p.setContent(`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${body}`);
    const data = await p.screenshot({ omitBackground: true });
    await p.close();
    return data;
  };
  fs.writeFileSync(pub('apple-touch-icon.png'), await icon(180, 1));
  fs.writeFileSync(pub('favicon.ico'), ico([{ size: 16, data: await icon(16) }, { size: 32, data: await icon(32) }]));
  await browser.close();
  console.log('wrote public/og.png, public/apple-touch-icon.png, public/favicon.ico');
})();
