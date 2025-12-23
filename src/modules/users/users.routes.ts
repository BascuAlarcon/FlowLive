import { Router } from 'express';
import userController from './users.controller';

const router = Router();

// GET /api/users - Obtener todos los usuarios
router.get('/', userController.getAll.bind(userController));

// GET /api/users/organization/:organizationId - Obtener usuarios de una organización
router.get('/organization/:organizationId', userController.getByOrganization.bind(userController));

// GET /api/users/:id - Obtener un usuario por ID
router.get('/:id', userController.getById.bind(userController));

// POST /api/users - Crear un usuario
router.post('/', userController.create.bind(userController));

// POST /api/users/add-to-organization - Agregar usuario a organización
router.post('/add-to-organization', userController.addToOrganization.bind(userController));

// PUT /api/users/:id - Actualizar un usuario
router.put('/:id', userController.update.bind(userController));

// PATCH /api/users/:id/role - Actualizar rol de usuario en organización
router.patch('/:id/role', userController.updateRole.bind(userController));

// DELETE /api/users/:id - Eliminar un usuario
router.delete('/:id', userController.delete.bind(userController));

// DELETE /api/users/:id/organization/:organizationId - Remover usuario de organización
router.delete('/:id/organization/:organizationId', userController.removeFromOrganization.bind(userController));

export default router;
