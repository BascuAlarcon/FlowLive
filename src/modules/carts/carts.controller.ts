import { Request, Response } from 'express';
import { CartsService } from './carts.service';
import {
  validateAddItemToCart,
  validateUpdateCartItem,
  validateUpdateCart,
  validateConfirmCart,
  validateGetActiveCartsQuery,
} from './carts.validation';

const cartsService = new CartsService();

interface RequestWithOrganization extends Request {
  organizationId?: string;
}

export class CartsController {
  /**
   * GET /carts - Obtener todos los carritos activos
   */
  async getActiveCarts(req: RequestWithOrganization, res: Response) {
    try {
      const filters = validateGetActiveCartsQuery(req.query);
      
      const carts = await cartsService.getActiveCarts(req.organizationId!, {
        customerId: filters.customerId,
        livestreamId: filters.livestreamId,
        hasNoLivestream: filters.hasNoLivestream,
        sellerId: filters.sellerId,
      });

      res.status(200).json(carts);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /carts/:id - Obtener un carrito específico
   */
  async getCartById(req: RequestWithOrganization, res: Response) {
    try {
      const cart = await cartsService.getCartById(req.params.id, req.organizationId!);
      
      if (!cart) {
        return res.status(404).json({ error: 'Carrito no encontrado o ya está cerrado' });
      }

      res.status(200).json(cart);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /carts/:id/items - Agregar item al carrito
   */
  async addItemToCart(req: RequestWithOrganization, res: Response) {
    try {
      const itemData = validateAddItemToCart(req.body);
      
      const item = await cartsService.addItemToCart(
        req.params.id,
        req.organizationId!,
        itemData
      );

      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * PATCH /carts/:id/items/:itemId - Actualizar item del carrito
   */
  async updateCartItem(req: RequestWithOrganization, res: Response) {
    try {
      const updateData = validateUpdateCartItem(req.body);
      
      const updatedItem = await cartsService.updateCartItem(
        req.params.id,
        req.params.itemId,
        req.organizationId!,
        updateData
      );

      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * DELETE /carts/:id/items/:itemId - Eliminar item del carrito
   */
  async removeCartItem(req: RequestWithOrganization, res: Response) {
    try {
      const result = await cartsService.removeCartItem(
        req.params.id,
        req.params.itemId,
        req.organizationId!
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * PATCH /carts/:id - Actualizar carrito (notas, descuento, livestream)
   */
  async updateCart(req: RequestWithOrganization, res: Response) {
    try {
      const updateData = validateUpdateCart(req.body);
      
      const updatedCart = await cartsService.updateCart(
        req.params.id,
        req.organizationId!,
        updateData
      );

      res.status(200).json(updatedCart);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /carts/:id/confirm - Confirmar carrito (convertir en venta confirmada)
   */
  async confirmCart(req: RequestWithOrganization, res: Response) {
    try {
      const paymentData = validateConfirmCart(req.body);
      
      const confirmedSale = await cartsService.confirmCart(
        req.params.id,
        req.organizationId!,
        paymentData
      );

      res.status(200).json(confirmedSale);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /carts/:id/cancel - Cancelar carrito
   */
  async cancelCart(req: RequestWithOrganization, res: Response) {
    try {
      const cancelledCart = await cartsService.cancelCart(
        req.params.id,
        req.organizationId!
      );

      res.status(200).json(cancelledCart);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /carts/old - Obtener carritos antiguos
   */
  async getOldCarts(req: RequestWithOrganization, res: Response) {
    try {
      const daysOld = req.query.daysOld ? parseInt(req.query.daysOld as string) : 7;
      
      const oldCarts = await cartsService.getOldCarts(req.organizationId!, daysOld);

      res.status(200).json(oldCarts);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}
