// @ts-check
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://remont.narcisbin.com',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Geologica',
      cssVariable: '--font-geologica',
      weights: ['300 800'],
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
