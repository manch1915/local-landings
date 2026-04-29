// Usage: node scripts/lighthouse.mjs <url> [--desktop] [--json out.json]
// Runs Lighthouse with Playwright's Chromium and prints the four category scores.
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [url, ...flags] = process.argv.slice(2);
if (!url) {
  console.error('Usage: node scripts/lighthouse.mjs <url> [--desktop] [--json out.json]');
  process.exit(1);
}
const desktop = flags.includes('--desktop');
const jsonIndex = flags.indexOf('--json');

const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox'],
});
try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    ...(desktop
      ? { preset: 'desktop', formFactor: 'desktop', screenEmulation: { disabled: true } }
      : {}),
  });
  const { categories, audits } = result.lhr;
  const scores = Object.fromEntries(
    Object.entries(categories).map(([key, category]) => [key, Math.round(category.score * 100)]),
  );
  console.log(url, desktop ? '(desktop)' : '(mobile)', scores);
  console.log(
    'LCP',
    audits['largest-contentful-paint'].displayValue,
    'TBT',
    audits['total-blocking-time'].displayValue,
    'CLS',
    audits['cumulative-layout-shift'].displayValue,
  );
  for (const audit of Object.values(audits)) {
    if (audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'informative') {
      console.log(`  - ${audit.id}: ${audit.title} ${audit.displayValue ?? ''}`);
    }
  }
  if (jsonIndex >= 0) await writeFile(flags[jsonIndex + 1], JSON.stringify(result.lhr));
} finally {
  await chrome.kill();
}
