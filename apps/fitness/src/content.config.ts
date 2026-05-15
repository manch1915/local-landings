import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const direction = z.enum(['functional', 'box', 'trx', 'stretch']);
const trainer = z.enum(['ilya', 'marina', 'artem']);

const page = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content' }),
  schema: z.object({
    site: z.object({
      name: z.string(),
      legalName: z.string(),
      city: z.string(),
      phone: z.string(),
      address: z.string(),
      postalCode: z.string(),
      hours: z.string(),
      geo: z.object({ lat: z.number(), lon: z.number() }),
      messengers: z.array(
        z.object({
          kind: z.enum(['telegram', 'max', 'whatsapp']),
          label: z.string(),
          url: z.url(),
        }),
      ),
    }),
    seo: z.object({
      title: z.string().max(75),
      description: z.string().max(175),
      ogAlt: z.string(),
    }),
    hero: z.object({
      title: z.string(),
      lead: z.string(),
      cta: z.string(),
      scheduleLink: z.string(),
      todayLabel: z.string(),
      nextLabel: z.string(),
    }),
    directions: z.array(
      z.object({
        id: direction,
        name: z.string(),
        short: z.string(),
        text: z.string(),
        level: z.string(),
      }),
    ),
    trainers: z.array(
      z.object({ id: trainer, name: z.string(), role: z.string(), text: z.string() }),
    ),
    schedule: z.array(
      z.object({
        day: z.number().int().min(1).max(7),
        time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'время в формате 07:30'),
        direction,
        trainer,
        minutes: z.number().int().positive(),
        spots: z.number().int().min(0).max(8),
      }),
    ),
    scheduleText: z.object({
      title: z.string(),
      lead: z.string(),
      all: z.string(),
      days: z.array(z.string()).length(7),
      daysShort: z.array(z.string()).length(7),
      full: z.string(),
      book: z.string(),
    }),
    plans: z.object({
      title: z.string(),
      lead: z.string(),
      items: z.array(
        z.object({
          name: z.string(),
          price: z.number().int().positive(),
          unit: z.string(),
          note: z.string(),
          featured: z.boolean().optional(),
        }),
      ),
      extras: z.array(z.object({ title: z.string(), text: z.string() })),
      choose: z.string(),
    }),
    results: z.object({
      title: z.string(),
      facts: z.array(z.object({ value: z.string(), label: z.string() })),
      items: z.array(z.object({ name: z.string(), result: z.string(), text: z.string() })),
    }),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })),
    lead: z.object({
      title: z.string(),
      text: z.string(),
      success: z.string(),
      mapLabel: z.string(),
    }),
  }),
});

export const collections = { page };
