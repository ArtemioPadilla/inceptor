// Astro 5 requires a content config file to be present and export `collections`.
// No content collections are defined yet; this satisfies the generated types
// in .astro/content.d.ts without defining any collections.
import { defineCollection } from 'astro:content';

export const collections = {} satisfies Record<string, ReturnType<typeof defineCollection>>;
