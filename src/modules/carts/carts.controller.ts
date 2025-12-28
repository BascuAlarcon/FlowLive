import { Request, Response } from 'express';
import { CartsService } from './carts.service';

const cartsService = new CartsService();

interface RequestWithOrganization extends Request {
  organizationId?: string;
  userId?: string;
}

export class CartsController {
  /**
   * GET /carts - Obtener todos los carritos activos
   */
  async getActiveCarts(req: RequestWithOrganization, res: Response) {
    try {
      const { customerId, livestreamId, sellerId } = req.query;
      
      const carts = await cartsService.getActiveCarts(req.organizationId!, {
        customerId: customerId as string,
        livestreamId: livestreamId as string,
        sellerId: sellerId as string,
      });

      res.status(200).json(carts);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /carts/customer/:customerId - Obtener carrito de un cliente
   */
  async getCustomerCart(req: RequestWithOrganization, res: Response) {
    try {
      const cart = await cartsService.getCustomerCart(
        req.params.customerId,
        req.organizationId!
      );

      if (!cart) {
        return res.status(404).json({ error: 'El cliente no tiene carrito activo' });
      }

      res.status(200).json(cart);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /carts/items - Agregar item al carrito del cliente
   */
  async addItemToCart(req: RequestWithOrganization, res: Response) {
    try {
      const { customerId, liveItemId, quantity, livestreamId } = req.body;

      if (!customerId || !liveItemId || !quantity) {
        return res.status(400).json({ 
          error: 'customerId, liveItemId y quantity son requeridos' 
        });
      }

      const item = await cartsService.addItemToCart(
        customerId,
        req.organizationId!,
        req.userId!, // sellerId
        liveItemId,
        Number(quantity),
        livestreamId
      );

      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * DELETE /carts/:cartId/items/:itemId - Eliminar item del carrito
   */
  async removeItemFromCart(req: RequestWithOrganization, res: Response) {
    try {
      const result = await cartsService.removeItemFromCart(
        req.params.cartId,
        req.params.itemId,
        req.organizationId!
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /carts/:cartId/confirm - Confirmar carrito (cerrar venta)
   */
  async confirmCart(req: RequestWithOrganization, res: Response) {
    try {
      const cart = await cartsService.confirmCart(
        req.params.cartId,
        req.organizationId!
      );

      res.status(200).json(cart);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /carts/:cartId/cancel - Cancelar carrito (liberar items)
   */
  async cancelCart(req: RequestWithOrganization, res: Response) {
    try {
      const cart = await cartsService.cancelCart(
        req.params.cartId,
        req.organizationId!
      );

      res.status(200).json(cart);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default new CartsController();
