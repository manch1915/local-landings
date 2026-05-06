// @ts-check
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://tutor.narcisbin.com',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    routing: { prefixDefaultLocale: false },
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Nunito',
      cssVariable: '--font-nunito',
      weights: ['600 900'],
      styles: ['normal'],
      subsets: ['cyrillic', 'latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Golos Text',
      cssVariable: '--font-golos',
      weights: ['400 600'],
      styles: ['normal'],
      subsets: ['cyrillic', 'latin'],
      fallbacks: ['sans-serif'],
    },
  ],
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      i18n: { defaultLocale: 'ru', locales: { ru: 'ru-RU', en: 'en-US' } },
    }),
  ],
  build: { inlineStylesheets: 'always' },
  vite: {
    plugins: [tailwindcss()],
    server: { proxy: { '/api': process.env.LEADS_API_URL ?? 'http://localhost:8787' } },
  },
});
