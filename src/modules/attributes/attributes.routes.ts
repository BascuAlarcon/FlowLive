import { Router } from 'express';
import attributesController from './attributes.controller';

const router = Router();

// ==================== CategoryAttribute Routes ====================

// GET /api/attributes/:id - Obtener un atributo por ID
router.get('/:id', attributesController.getAttributeById.bind(attributesController));

// POST /api/attributes - Crear un atributo
router.post('/', attributesController.createAttribute.bind(attributesController));

// PUT /api/attributes/:id - Actualizar un atributo
router.put('/:id', attributesController.updateAttribute.bind(attributesController));

// DELETE /api/attributes/:id - Eliminar un atributo
router.delete('/:id', attributesController.deleteAttribute.bind(attributesController));

// ==================== AttributeValue Routes ====================

// GET /api/attributes/:attributeId/values - Obtener valores de un atributo
router.get('/:attributeId/values', attributesController.getValuesByAttribute.bind(attributesController));

// POST /api/attributes/values - Crear un valor
router.post('/values', attributesController.createValue.bind(attributesController));

// GET /api/attributes/values/:id - Obtener un valor por ID
router.get('/values/:id', attributesController.getValueById.bind(attributesController));

// PUT /api/attributes/values/:id - Actualizar un valor
router.put('/values/:id', attributesController.updateValue.bind(attributesController));

// DELETE /api/attributes/values/:id - Eliminar un valor
router.delete('/values/:id', attributesController.deleteValue.bind(attributesController));

export default router;
