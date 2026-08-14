import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const options = <K extends string>(keys: readonly [K, ...K[]]) =>
  z.object(Object.fromEntries(keys.map((key) => [key, z.string()])) as Record<K, z.ZodString>);

const question = <K extends string>(keys: readonly [K, ...K[]]) =>
  z.object({ text: z.string(), options: options(keys) });

const courseId = z.enum(['speaking', 'business', 'ielts', 'club', 'school', 'teens']);

const page = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content' }),
  schema: z.object({
    locale: z.enum(['ru', 'en']),
    currency: z.enum(['RUB', 'USD']),
    site: z.object({
      name: z.string(),
      role: z.string(),
      phone: z.string(),
      city: z.string(),
      address: z.string(),
      postalCode: z.string(),
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
      description: z.string().max(170),
      ogAlt: z.string(),
    }),
    nav: z.object({
      courses: z.string(),
      lessons: z.string(),
      reviews: z.string(),
      faq: z.string(),
      cta: z.string(),
      langSwitch: z.string(),
      skip: z.string(),
    }),
    hero: z.object({
      title: z.string(),
      lead: z.string(),
      credentials: z.array(z.string()),
      cta: z.string(),
    }),
    quiz: z.object({
      title: z.string(),
      status: z.string(),
      greeting: z.string(),
      questions: z.object({
        goal: question(['work', 'relocation', 'exam', 'kid', 'travel']),
        exam: question(['ielts', 'school']),
        level: question(['zero', 'basic', 'middle', 'confident']),
        format: question(['solo', 'pair', 'club']),
        perWeek: question(['1', '2', '3']),
      }),
      result: z.object({
        intro: z.string(),
        price: z.string(),
        perWeek: z.array(z.string()).length(3),
        adjusted: z.string(),
        cta: z.string(),
        restart: z.string(),
      }),
      summary: z.string(),
    }),
    pricing: z.object({
      pairShare: z.number().min(0.3).max(1),
      packageDiscount: z.number().min(0).max(0.5),
    }),
    audiences: z.array(
      z.object({ id: z.enum(['adults', 'teens']), title: z.string(), text: z.string() }),
    ),
    courses: z
      .array(
        z.object({
          id: courseId,
          audience: z.enum(['adults', 'teens']),
          name: z.string(),
          format: z.string(),
          price: z.number().positive(),
          points: z.array(z.string()),
        }),
      )
      .length(6),
    coursesMeta: z.object({ packageNote: z.string(), priceSuffix: z.string() }),
    lessons: z.object({
      title: z.string(),
      points: z.array(z.object({ title: z.string(), text: z.string() })),
      correctionsTitle: z.string(),
      correctionsNext: z.string(),
      corrections: z.array(z.object({ wrong: z.string(), right: z.string(), note: z.string() })),
    }),
    about: z.object({
      title: z.string(),
      text: z.array(z.string()),
      facts: z.array(z.object({ value: z.string(), label: z.string() })),
    }),
    reviews: z.object({
      title: z.string(),
      items: z.array(
        z.object({ name: z.string(), role: z.string(), result: z.string(), text: z.string() }),
      ),
    }),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })),
    lead: z.object({
      title: z.string(),
      text: z.string(),
      success: z.string(),
      online: z.string(),
      mapLabel: z.string(),
    }),
    footer: z.object({ privacy: z.string(), credit: z.string(), author: z.string() }),
    privacy: z.object({ title: z.string(), body: z.array(z.string()) }),
  }),
});

export const collections = { page };
