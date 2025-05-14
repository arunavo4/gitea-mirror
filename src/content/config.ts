import { defineCollection, z } from 'astro:content';

// Define a schema for the documentation collection
const docsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().optional(),
    updatedDate: z.date().optional(),
  }),
});

// Export the collections
export const collections = {
  'docs': docsCollection,
};
