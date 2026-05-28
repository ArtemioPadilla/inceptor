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

export const collections = { docs };
