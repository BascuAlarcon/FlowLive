import { Router } from 'express';
import { CartsController } from './carts.controller';

const router = Router();
const cartsController = new CartsController();

// GET /carts - Obtener todos los carritos activos
router.get('/', cartsController.getActiveCarts.bind(cartsController));

// GET /carts/customer/:customerId - Obtener carrito de un cliente
router.get('/customer/:customerId', cartsController.getCustomerCart.bind(cartsController));

// POST /carts/items - Agregar item al carrito del cliente
router.post('/items', cartsController.addItemToCart.bind(cartsController));

// DELETE /carts/:cartId/items/:itemId - Eliminar item del carrito
router.delete('/:cartId/items/:itemId', cartsController.removeItemFromCart.bind(cartsController));

// POST /carts/:cartId/confirm - Confirmar carrito (cerrar venta)
router.post('/:cartId/confirm', cartsController.confirmCart.bind(cartsController));

// POST /carts/:cartId/cancel - Cancelar carrito (liberar items)
router.post('/:cartId/cancel', cartsController.cancelCart.bind(cartsController));

export default router;
