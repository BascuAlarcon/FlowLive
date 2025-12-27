import { z } from 'zod';

export const createLivestreamSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255, 'El título es muy largo'),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'other'], {
    errorMap: () => ({ message: 'Plataforma inválida' }),
  }),
  moderatorId: z.string().cuid('ID de moderador inválido').optional().nullable(),
  viewerCount: z.number().int().min(0).optional().nullable(),
});

export const updateLivestreamSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255, 'El título es muy largo').optional(),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'other']).optional(),
  moderatorId: z.string().cuid('ID de moderador inválido').optional().nullable(),
  viewerCount: z.number().int().min(0).optional().nullable(),
});

export const closeLivestreamSchema = z.object({
  viewerCount: z.number().int().min(0).optional(),
});

export const livestreamIdSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export const livestreamFilterSchema = z.object({
  status: z.enum(['active', 'closed']).optional(),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'other']).optional(),
});

export default {
  createSchema: createLivestreamSchema,
  updateSchema: updateLivestreamSchema,
  closeSchema: closeLivestreamSchema,
  idSchema: livestreamIdSchema,
  filterSchema: livestreamFilterSchema,
};
