import { z } from 'zod';

// Schemas para CategoryAttribute
export const createAttributeSchema = z.object({
  categoryId: z.string().cuid('Category ID inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  type: z.enum(['select', 'text', 'number'], {
    errorMap: () => ({ message: 'Tipo de atributo inválido. Debe ser: select, text o number' }),
  }),
  isRequired: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const updateAttributeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo').optional(),
  type: z.enum(['select', 'text', 'number']).optional(),
  isRequired: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const attributeIdSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export const categoryIdSchema = z.object({
  categoryId: z.string().cuid('Category ID inválido'),
});

// Schemas para AttributeValue
export const createValueSchema = z.object({
  attributeId: z.string().cuid('Attribute ID inválido'),
  value: z.string().min(1, 'El valor es requerido').max(100, 'El valor es muy largo'),
  hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Formato de color hexadecimal inválido (ej: #FF0000)').optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateValueSchema = z.object({
  value: z.string().min(1, 'El valor es requerido').max(100, 'El valor es muy largo').optional(),
  hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Formato de color hexadecimal inválido (ej: #FF0000)').optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const valueIdSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export const attributeIdParamSchema = z.object({
  attributeId: z.string().cuid('Attribute ID inválido'),
});

export default {
  createAttributeSchema,
  updateAttributeSchema,
  attributeIdSchema,
  categoryIdSchema,
  createValueSchema,
  updateValueSchema,
  valueIdSchema,
  attributeIdParamSchema,
};
