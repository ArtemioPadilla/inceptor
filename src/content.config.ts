import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    // `splash` reserved for the /docs landing; default content pages omit it
    template: z.enum(['splash']).optional(),
    // For the landing page hero
    hero: z
      .object({
        tagline: z.string().optional(),
        actions: z
          .array(
            z.object({
              text: z.string(),
              link: z.string(),
              variant: z.enum(['primary', 'secondary']).default('primary'),
            }),
          )
          .optional(),
      })
      .optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    /** Author handle (kept generic so the scaffold doesn't presume a single author). */
    author: z.string().default('artemiopadilla'),
  }),
});

export const collections = { docs, blog };
