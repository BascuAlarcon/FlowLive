import { Router } from 'express';
import { CartsController } from './carts.controller';

const router = Router();
const cartsController = new CartsController();

// GET /carts - Obtener todos los carritos activos
router.get('/', cartsController.getActiveCarts.bind(cartsController));

// GET /carts/old - Obtener carritos antiguos (debe ir antes de /:id)
router.get('/old', cartsController.getOldCarts.bind(cartsController));

// GET /carts/:id - Obtener un carrito específico
router.get('/:id', cartsController.getCartById.bind(cartsController));

// POST /carts/:id/items - Agregar item al carrito
router.post('/:id/items', cartsController.addItemToCart.bind(cartsController));

// PATCH /carts/:id/items/:itemId - Actualizar item del carrito
router.patch('/:id/items/:itemId', cartsController.updateCartItem.bind(cartsController));

// DELETE /carts/:id/items/:itemId - Eliminar item del carrito
router.delete('/:id/items/:itemId', cartsController.removeCartItem.bind(cartsController));

// PATCH /carts/:id - Actualizar carrito (notas, descuento, livestream)
router.patch('/:id', cartsController.updateCart.bind(cartsController));

// POST /carts/:id/confirm - Confirmar carrito (convertir en venta confirmada)
router.post('/:id/confirm', cartsController.confirmCart.bind(cartsController));

// POST /carts/:id/cancel - Cancelar carrito
router.post('/:id/cancel', cartsController.cancelCart.bind(cartsController));

export default router;
