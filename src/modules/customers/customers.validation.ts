import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo'),
  username: z.string().max(100, 'El username es muy largo').optional().nullable(),
  contact: z.string().max(255, 'El contacto es muy largo').optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo').optional(),
  username: z.string().max(100, 'El username es muy largo').optional().nullable(),
  contact: z.string().max(255, 'El contacto es muy largo').optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const customerIdSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export const searchCustomerSchema = z.object({
  search: z.string().optional(),
  includeDeleted: z.string().optional(),
});

export default {
  createSchema: createCustomerSchema,
  updateSchema: updateCustomerSchema,
  idSchema: customerIdSchema,
  searchSchema: searchCustomerSchema,
};
