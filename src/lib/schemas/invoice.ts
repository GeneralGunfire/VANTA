import { z } from 'zod';

const lineItemSchema = z.object({
  description: z.string().trim().min(1, 'Enter a description.'),
  quantity: z
    .string()
    .trim()
    .min(1, 'Enter a quantity.')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a valid quantity.'),
  unit_price: z
    .string()
    .trim()
    .min(1, 'Enter a unit price.')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid unit price.'),
});

export const addInvoiceSchema = z.object({
  recipient_name: z.string().trim().min(1, 'Enter who this invoice is for.'),
  line_items: z.array(lineItemSchema).min(1, 'Add at least one line item.'),
});

export type AddInvoiceFormValues = z.infer<typeof addInvoiceSchema>;
