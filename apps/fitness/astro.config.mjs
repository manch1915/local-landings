// @ts-check
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://fitness.narcisbin.com',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Unbounded',
      cssVariable: '--font-unbounded',
      // Headings only use 800; a static file is a third of the variable one.
      weights: [800],
      styles: ['normal'],
      subsets: ['cyrillic', 'latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Onest',
      cssVariable: '--font-onest',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['cyrillic', 'latin'],
      fallbacks: ['sans-serif'],
    },
  ],
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  build: { inlineStylesheets: 'always' },
  vite: {
    plugins: [tailwindcss()],
    server: { proxy: { '/api': process.env.LEADS_API_URL ?? 'http://localhost:8787' } },
  },
});
