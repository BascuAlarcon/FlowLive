import { Router } from 'express';
import customersController from './customers.controller';

const router = Router();

// GET /api/customers - Obtener todos los clientes (con búsqueda opcional)
router.get('/', customersController.getCustomers.bind(customersController));

// GET /api/customers/:id - Obtener un cliente por ID
router.get('/:id', customersController.getCustomerById.bind(customersController));

// GET /api/customers/:id/stats - Obtener estadísticas del cliente
router.get('/:id/stats', customersController.getCustomerStats.bind(customersController));

// POST /api/customers - Crear un cliente
router.post('/', customersController.createCustomer.bind(customersController));

// PUT /api/customers/:id - Actualizar un cliente
router.put('/:id', customersController.updateCustomer.bind(customersController));

// DELETE /api/customers/:id - Eliminar (soft delete) un cliente
router.delete('/:id', customersController.deleteCustomer.bind(customersController));

export default router;
