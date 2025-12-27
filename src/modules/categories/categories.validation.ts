import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  description: z.string().max(500, 'La descripción es muy larga').optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo').optional(),
  description: z.string().max(500, 'La descripción es muy larga').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const categoryIdSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export default {
  createSchema: createCategorySchema,
  updateSchema: updateCategorySchema,
  idSchema: categoryIdSchema,
};
