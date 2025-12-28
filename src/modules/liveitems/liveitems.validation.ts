import { z } from 'zod';

export const createLiveItemSchema = z.object({
  categoryId: z.string().min(1, 'categoryId es requerido'),
  livestreamId: z.string().optional(),
  price: z.number().positive('El precio debe ser mayor a 0'),
  quantity: z.number().int().positive().default(1),
  imageUrl: z.string().url().optional(),
  notes: z.string().optional(),
  attributes: z.array(
    z.object({
      attributeValueId: z.string().optional(),
      textValue: z.string().optional(),
      numberValue: z.number().optional(),
    })
  ).optional(),
});

export const updateLiveItemSchema = z.object({
  price: z.number().positive().optional(),
  quantity: z.number().int().positive().optional(),
  status: z.enum(['available', 'reserved', 'sold']).optional(),
  imageUrl: z.string().url().optional(),
  notes: z.string().optional(),
  livestreamId: z.string().optional(),
});

export const getLiveItemsQuerySchema = z.object({
  categoryId: z.string().optional(),
  livestreamId: z.string().optional(),
  status: z.enum(['available', 'reserved', 'sold']).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

export const addAttributeSchema = z.object({
  attributeValueId: z.string().optional(),
  textValue: z.string().optional(),
  numberValue: z.number().optional(),
});

export function validateCreateLiveItem(data: unknown) {
  return createLiveItemSchema.parse(data);
}

export function validateUpdateLiveItem(data: unknown) {
  return updateLiveItemSchema.parse(data);
}

export function validateGetLiveItemsQuery(data: unknown) {
  return getLiveItemsQuerySchema.parse(data);
}

export function validateAddAttribute(data: unknown) {
  return addAttributeSchema.parse(data);
}
