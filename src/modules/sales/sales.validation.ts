import { z } from 'zod';

export const saleSchema = z.object({
  customerId: z.string().cuid(),
  sellerId: z.string().cuid(),
  status: z.enum(['reserved', 'confirmed', 'cancelled']),
  totalAmount: z.number().positive(),
  discountAmount: z.number().nonnegative(),
  notes: z.string().optional(),
});

export function validateSaleCreation(data: any) {
  return saleSchema.parse(data);
}