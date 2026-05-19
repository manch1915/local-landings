// Renders 1200×630 Open Graph images from the first screen of each running site.
// Usage: node scripts/og-images.mjs   (dev servers on 4321-4323 must be running)
import { chromium } from 'playwright';

const targets = [
  { url: 'http://localhost:4322/', out: 'apps/repair/public/og.png' },
  { url: 'http://localhost:4321/', out: 'apps/tutor/public/og.png' },
  { url: 'http://localhost:4321/en/', out: 'apps/tutor/public/og-en.png' },
  { url: 'http://localhost:4323/', out: 'apps/fitness/public/og.png' },
];

const browser = await chromium.launch();
for (const { url, out } of targets) {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // The sticky header is noise in a link preview.
  await page.addStyleTag({ content: 'header { display: none !important; }' });
  await page.screenshot({ path: out });
  await page.close();
  console.log('saved', out);
}
await browser.close();
