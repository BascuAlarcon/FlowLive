import { Router } from 'express';
import organizationController from './organizations.controller';

const router = Router();

// GET /api/organizations - Obtener todas las organizaciones
router.get('/', organizationController.getAll.bind(organizationController));

// GET /api/organizations/:id - Obtener una organización por ID
router.get('/:id', organizationController.getById.bind(organizationController));

// POST /api/organizations - Crear una organización
router.post('/', organizationController.create.bind(organizationController));

// PUT /api/organizations/:id - Actualizar una organización
router.put('/:id', organizationController.update.bind(organizationController));

// DELETE /api/organizations/:id - Eliminar (soft delete) una organización
router.delete('/:id', organizationController.delete.bind(organizationController));

// PATCH /api/organizations/:id/toggle-active - Activar/desactivar una organización
router.patch('/:id/toggle-active', organizationController.toggleActive.bind(organizationController));

export default router;
