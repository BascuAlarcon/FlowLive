import { z } from 'zod';

export const addItemToCartSchema = z.object({
  productId: z.string(),
  productVariantId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().positive().optional(),
});

export const updateCartSchema = z.object({
  notes: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
  livestreamId: z.string().optional(),
});

export const confirmCartSchema = z.object({
  method: z.enum(['transfer', 'cash', 'mercadopago', 'paypal']),
  amount: z.number().positive(),
  reference: z.string().optional(),
});

export const getActiveCartsQuerySchema = z.object({
  customerId: z.string().optional(),
  livestreamId: z.string().optional(),
  hasNoLivestream: z.string().optional().transform(val => val === 'true'),
  sellerId: z.string().optional(),
  daysOld: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

export function validateAddItemToCart(data: unknown) {
  return addItemToCartSchema.parse(data);
}

export function validateUpdateCartItem(data: unknown) {
  return updateCartItemSchema.parse(data);
}

export function validateUpdateCart(data: unknown) {
  return updateCartSchema.parse(data);
}

export function validateConfirmCart(data: unknown) {
  return confirmCartSchema.parse(data);
}

export function validateGetActiveCartsQuery(data: unknown) {
  return getActiveCartsQuerySchema.parse(data);
}
