import { z } from 'zod';

/**
 * Add/edit inventory item form — direct structured insert/update into the
 * `inventory_items` table.
 */
export const inventoryItemSchema = z.object({
  item_name: z.string().trim().min(1, 'Enter an item name.'),
  quantity: z
    .string()
    .trim()
    .min(1, 'Enter a quantity.')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid quantity (0 or more).'),
  cost_price: z
    .string()
    .trim()
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Enter a valid cost price.')
    .optional(),
  sale_price: z
    .string()
    .trim()
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Enter a valid sale price.')
    .optional(),
  reorder_threshold: z
    .string()
    .trim()
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Enter a valid reorder threshold.')
    .optional(),
});

export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;
