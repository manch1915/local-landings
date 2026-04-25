import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const scopeMap = <T extends z.ZodType>(value: T) =>
  z.object({ cosmetic: value, capital: value, design: value });

const money = z.number().int().nonnegative();

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
      title: z.string().max(70),
      description: z.string().max(170),
      ogAlt: z.string(),
    }),
    hero: z.object({
      title: z.string(),
      lead: z.string(),
      cta: z.string(),
      stamp: z.array(z.object({ label: z.string(), value: z.string() })).length(4),
    }),
    calculator: z.object({
      title: z.string(),
      lead: z.string(),
      note: z.string(),
      cta: z.string(),
      defaults: z.object({ area: z.number(), bathrooms: z.number() }),
      prices: z.object({
        perSquareMeter: scopeMap(money),
        bathroom: scopeMap(money),
        secondaryFactor: z.number().min(1).max(2),
        extras: z.object({
          demolition: money,
          wiring: money,
          heatedFloor: money,
          designProject: money,
          materials: scopeMap(money),
        }),
        duration: scopeMap(z.object({ base: z.number(), perWeek: z.number().positive() })),
        spread: z.number().min(0).max(0.5),
      }),
      labels: z.object({
        property: z.object({ new: z.string(), secondary: z.string() }),
        scope: scopeMap(z.string()),
        extras: z.object({
          demolition: z.string(),
          wiring: z.string(),
          heatedFloor: z.string(),
          designProject: z.string(),
          materials: z.string(),
        }),
      }),
    }),
    levels: z.array(
      z.object({
        id: z.enum(['cosmetic', 'capital', 'design']),
        name: z.string(),
        fits: z.string(),
        includes: z.array(z.string()),
      }),
    ),
    stages: z.array(z.object({ title: z.string(), time: z.string(), text: z.string() })),
    promises: z.array(z.object({ title: z.string(), text: z.string() })),
    cases: z.array(
      z.object({
        title: z.string(),
        property: z.string(),
        area: z.number(),
        scope: z.string(),
        weeks: z.number(),
        budget: z.string(),
        plan: z.enum(['studio', 'two', 'three']),
        story: z.string(),
      }),
    ),
    reviews: z.array(
      z.object({ name: z.string(), place: z.string(), object: z.string(), text: z.string() }),
    ),
    about: z.object({
      title: z.string(),
      text: z.array(z.string()),
      facts: z.array(z.object({ value: z.string(), label: z.string() })),
    }),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })),
    lead: z.object({ title: z.string(), text: z.string(), success: z.string() }),
  }),
});

export const collections = { page };
