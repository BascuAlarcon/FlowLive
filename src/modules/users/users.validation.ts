import { z } from 'zod';

// Schema para crear un usuario
export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo'),
  organizationId: z.string().cuid('Organization ID inválido'),
  role: z.enum(['owner', 'seller', 'moderator', 'logistics']).default('seller'),
});

// Schema para actualizar un usuario
export const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo').optional(),
});

// Schema para actualizar rol de usuario en organización
export const updateUserRoleSchema = z.object({
  organizationId: z.string().cuid('Organization ID inválido'),
  role: z.enum(['owner', 'seller', 'moderator', 'logistics']),
});

// Schema para agregar usuario a organización
export const addUserToOrganizationSchema = z.object({
  userId: z.string().cuid('User ID inválido'),
  organizationId: z.string().cuid('Organization ID inválido'),
  role: z.enum(['owner', 'seller', 'moderator', 'logistics']).default('seller'),
});

// Schema para ID de usuario
export const userIdSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export type UpdateUserRoleDTO = z.infer<typeof updateUserRoleSchema>;
export type AddUserToOrganizationDTO = z.infer<typeof addUserToOrganizationSchema>;
export type UserIdDTO = z.infer<typeof userIdSchema>;
