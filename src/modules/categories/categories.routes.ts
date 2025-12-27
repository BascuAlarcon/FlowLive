import { Router } from 'express';
import categoriesController from './categories.controller';
import attributesController from '../attributes/attributes.controller';

const router = Router();

// GET /api/categories - Obtener todas las categorías
router.get('/', categoriesController.getCategories.bind(categoriesController));

// GET /api/categories/:id - Obtener una categoría por ID (con sus atributos)
router.get('/:id', categoriesController.getCategoryById.bind(categoriesController));

// GET /api/categories/:categoryId/attributes - Obtener atributos de una categoría
router.get('/:categoryId/attributes', attributesController.getAttributesByCategory.bind(attributesController));

// POST /api/categories - Crear una categoría
router.post('/', categoriesController.createCategory.bind(categoriesController));

// PUT /api/categories/:id - Actualizar una categoría
router.put('/:id', categoriesController.updateCategory.bind(categoriesController));

// DELETE /api/categories/:id - Eliminar una categoría
router.delete('/:id', categoriesController.deleteCategory.bind(categoriesController));

export default router;
