import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo'),
  basePrice: z.number().positive('El precio debe ser positivo'),
  sku: z.string().min(1, 'El SKU es requerido').max(50, 'El SKU es muy largo'),
  imageUrl: z.string().url('Debe ser una URL válida').optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo').optional(),
  basePrice: z.number().positive('El precio debe ser positivo').optional(),
  sku: z.string().min(1, 'El SKU es requerido').max(50, 'El SKU es muy largo').optional(),
  imageUrl: z.string().url('Debe ser una URL válida').optional(),
  isActive: z.boolean().optional(),
});

export const productIdSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export default {
  createSchema: createProductSchema,
  updateSchema: updateProductSchema,
  idSchema: productIdSchema,
};