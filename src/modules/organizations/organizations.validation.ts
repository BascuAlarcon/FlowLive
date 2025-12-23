import { z } from 'zod';

// Schema para crear una organización
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo'),
  plan: z.enum(['free', 'pro', 'brand']).optional().default('free'),
});

// Schema para actualizar una organización
export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo').optional(),
  plan: z.enum(['free', 'pro', 'brand']).optional(),
  isActive: z.boolean().optional(),
});

// Schema para ID de organización
export const organizationIdSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export type CreateOrganizationDTO = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationDTO = z.infer<typeof updateOrganizationSchema>;
export type OrganizationIdDTO = z.infer<typeof organizationIdSchema>;
