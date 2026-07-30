import { z } from 'zod';

/**
 * Manual "Add debtor/creditor" form — direct structured insert into the
 * `debts` table (not routed through the parse-transaction pipeline, since
 * there's no natural-language interpretation needed here).
 */
export const addDebtSchema = z.object({
  party_name: z.string().trim().min(1, 'Enter who owes or is owed.'),
  direction: z.enum(['owed_to_business', 'owed_by_business']),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter an amount.')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount greater than 0.'),
  description: z.string().trim().optional(),
});

export type AddDebtFormValues = z.infer<typeof addDebtSchema>;
