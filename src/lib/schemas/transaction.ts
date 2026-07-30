import { z } from 'zod';

/**
 * Deliberately minimal — amount/category/direction parsing happens
 * server-side in the parse-transaction edge function. The only client-side
 * concern is "don't submit an empty (or whitespace-only) description."
 */
export const addTransactionSchema = z.object({
  description: z.string().trim().min(1, 'Describe what happened before adding it.'),
});

export type AddTransactionFormValues = z.infer<typeof addTransactionSchema>;
