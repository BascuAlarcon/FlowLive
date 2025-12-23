import { Router } from 'express';
import { ProductController } from './product.controller';

const router = Router();
const productController = new ProductController();

// GET /api/products - Obtener todos los productos
router.get('/', productController.getProducts.bind(productController));

// GET /api/products/:id - Obtener un producto por ID
router.get('/:id', productController.getProductById.bind(productController));

// POST /api/products - Crear un producto
router.post('/', productController.createProduct.bind(productController));

// PUT /api/products/:id - Actualizar un producto
router.put('/:id', productController.updateProduct.bind(productController));

// DELETE /api/products/:id - Eliminar (soft delete) un producto
router.delete('/:id', productController.deleteProduct.bind(productController));

export default router;