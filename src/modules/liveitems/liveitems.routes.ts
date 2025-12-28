import { Router } from 'express';
import { LiveItemsController } from './liveitems.controller';

const router = Router();
const liveItemsController = new LiveItemsController();

// GET /liveitems/stats - Obtener estadísticas (debe ir antes de /:id)
router.get('/stats', liveItemsController.getStats.bind(liveItemsController));

// GET /liveitems - Obtener todos los LiveItems
router.get('/', liveItemsController.getLiveItems.bind(liveItemsController));

// POST /liveitems - Crear un nuevo LiveItem
router.post('/', liveItemsController.createLiveItem.bind(liveItemsController));

// GET /liveitems/:id - Obtener un LiveItem por ID
router.get('/:id', liveItemsController.getLiveItemById.bind(liveItemsController));

// PATCH /liveitems/:id - Actualizar un LiveItem
router.patch('/:id', liveItemsController.updateLiveItem.bind(liveItemsController));

// DELETE /liveitems/:id - Eliminar un LiveItem
router.delete('/:id', liveItemsController.deleteLiveItem.bind(liveItemsController));

// POST /liveitems/:id/attributes - Agregar atributo a un LiveItem
router.post('/:id/attributes', liveItemsController.addAttribute.bind(liveItemsController));

// DELETE /liveitems/:id/attributes/:attributeId - Eliminar atributo de un LiveItem
router.delete('/:id/attributes/:attributeId', liveItemsController.removeAttribute.bind(liveItemsController));

export default router;
