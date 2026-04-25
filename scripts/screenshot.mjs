// Usage: node scripts/screenshot.mjs <url> <out-prefix> [--full]
// Saves <out-prefix>-desktop.png (1440 wide) and <out-prefix>-mobile.png (390 wide).
import { chromium } from 'playwright';

const [url, prefix, ...flags] = process.argv.slice(2);
if (!url || !prefix) {
  console.error('Usage: node scripts/screenshot.mjs <url> <out-prefix> [--full]');
  process.exit(1);
}
const fullPage = flags.includes('--full');

const viewports = [
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

const browser = await chromium.launch();
for (const { name, ...viewport } of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    isMobile: viewport.isMobile ?? false,
    hasTouch: viewport.hasTouch ?? false,
    reducedMotion: 'reduce',
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${prefix}-${name}.png`, fullPage });
  await page.close();
}
await browser.close();
