import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export class CartsService {
  /**
   * Obtiene todos los carritos activos (reserved) de la organización
   */
  async getActiveCarts(
    organizationId: string,
    filters?: {
      customerId?: string;
      livestreamId?: string;
      hasNoLivestream?: boolean;
      sellerId?: string;
      updatedAfter?: Date;
      updatedBefore?: Date;
    }
  ) {
    const where: Prisma.SaleWhereInput = {
      organizationId,
      status: 'reserved',
    };

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.livestreamId) {
      where.livestreamId = filters.livestreamId;
    }

    if (filters?.hasNoLivestream) {
      where.livestreamId = null;
    }

    if (filters?.sellerId) {
      where.sellerId = filters.sellerId;
    }

    if (filters?.updatedAfter || filters?.updatedBefore) {
      where.updatedAt = {};
      if (filters.updatedAfter) {
        where.updatedAt.gte = filters.updatedAfter;
      }
      if (filters.updatedBefore) {
        where.updatedAt.lte = filters.updatedBefore;
      }
    }

    return prisma.sale.findMany({
      where,
      include: {
        SaleItem: {
          include: {
            ProductVariant: {
              include: {
                Product: true,
                color: true,
                size: true,
              },
            },
          },
        },
        Customer: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Obtiene un carrito específico por ID
   */
  async getCartById(id: string, organizationId: string) {
    return prisma.sale.findFirst({
      where: {
        id,
        organizationId,
        status: 'reserved',
      },
      include: {
        SaleItem: {
          include: {
            ProductVariant: {
              include: {
                Product: true,
                color: true,
                size: true,
              },
            },
          },
        },
        Customer: true,
      },
    });
  }

  /**
   * Agrega un producto al carrito
   */
  async addItemToCart(
    cartId: string,
    organizationId: string,
    itemData: {
      productId: string;
      productVariantId: string;
      quantity: number;
      unitPrice: number;
    }
  ) {
    // Verificar que el carrito existe y está en estado reserved
    const cart = await prisma.sale.findFirst({
      where: {
        id: cartId,
        organizationId,
        status: 'reserved',
      },
      include: {
        SaleItem: true,
      },
    });

    if (!cart) {
      throw new Error('Carrito no encontrado o ya está cerrado');
    }

    // Verificar stock disponible
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: itemData.productVariantId,
        organizationId,
      },
    });

    if (!variant) {
      throw new Error('Variante de producto no encontrada');
    }

    // Usar transacción para agregar el item y actualizar stock
    return prisma.$transaction(async (tx) => {
      // Crear el sale item
      const totalPrice = itemData.quantity * itemData.unitPrice;
      const saleItem = await tx.saleItem.create({
        data: {
          saleId: cartId,
          productId: itemData.productId,
          productVariantId: itemData.productVariantId,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice,
        },
      });

      // Crear movimiento de stock (reserva)
      await tx.stockMovement.create({
        data: {
          productVariantId: itemData.productVariantId,
          organizationId,
          type: 'reserve',
          quantity: -itemData.quantity,
          referenceType: 'sale',
          referenceId: cartId,
          notes: `Reserva para carrito ${cartId}`,
        },
      });

      // Recalcular el total del carrito
      const allItems = await tx.saleItem.findMany({
        where: { saleId: cartId },
      });

      const newTotal = allItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

      // Actualizar el carrito
      await tx.sale.update({
        where: { id: cartId },
        data: {
          totalAmount: newTotal,
          updatedAt: new Date(),
        },
      });

      return saleItem;
    });
  }

  /**
   * Actualiza un item del carrito
   */
  async updateCartItem(
    cartId: string,
    itemId: string,
    organizationId: string,
    updateData: {
      quantity?: number;
      unitPrice?: number;
    }
  ) {
    // Verificar que el carrito existe y está en estado reserved
    const cart = await prisma.sale.findFirst({
      where: {
        id: cartId,
        organizationId,
        status: 'reserved',
      },
    });

    if (!cart) {
      throw new Error('Carrito no encontrado o ya está cerrado');
    }

    // Obtener el item actual
    const currentItem = await prisma.saleItem.findFirst({
      where: {
        id: itemId,
        saleId: cartId,
      },
    });

    if (!currentItem) {
      throw new Error('Item no encontrado en el carrito');
    }

    return prisma.$transaction(async (tx) => {
      const newQuantity = updateData.quantity ?? currentItem.quantity;
      const newUnitPrice = updateData.unitPrice ?? Number(currentItem.unitPrice);
      const newTotalPrice = newQuantity * newUnitPrice;

      // Si cambió la cantidad, ajustar el stock
      if (updateData.quantity && updateData.quantity !== currentItem.quantity) {
        const quantityDiff = updateData.quantity - currentItem.quantity;

        await tx.stockMovement.create({
          data: {
            productVariantId: currentItem.productVariantId,
            organizationId,
            type: quantityDiff > 0 ? 'reserve' : 'cancel',
            quantity: -quantityDiff, // negativo para reserve, positivo para cancel
            referenceType: 'sale',
            referenceId: cartId,
            notes: `Ajuste de cantidad en carrito ${cartId}`,
          },
        });
      }

      // Actualizar el item
      const updatedItem = await tx.saleItem.update({
        where: { id: itemId },
        data: {
          quantity: newQuantity,
          unitPrice: newUnitPrice,
          totalPrice: newTotalPrice,
        },
      });

      // Recalcular el total del carrito
      const allItems = await tx.saleItem.findMany({
        where: { saleId: cartId },
      });

      const newTotal = allItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

      await tx.sale.update({
        where: { id: cartId },
        data: {
          totalAmount: newTotal,
          updatedAt: new Date(),
        },
      });

      return updatedItem;
    });
  }

  /**
   * Elimina un item del carrito
   */
  async removeCartItem(cartId: string, itemId: string, organizationId: string) {
    // Verificar que el carrito existe y está en estado reserved
    const cart = await prisma.sale.findFirst({
      where: {
        id: cartId,
        organizationId,
        status: 'reserved',
      },
    });

    if (!cart) {
      throw new Error('Carrito no encontrado o ya está cerrado');
    }

    // Obtener el item
    const item = await prisma.saleItem.findFirst({
      where: {
        id: itemId,
        saleId: cartId,
      },
    });

    if (!item) {
      throw new Error('Item no encontrado en el carrito');
    }

    return prisma.$transaction(async (tx) => {
      // Liberar el stock reservado
      await tx.stockMovement.create({
        data: {
          productVariantId: item.productVariantId,
          organizationId,
          type: 'cancel',
          quantity: item.quantity,
          referenceType: 'sale',
          referenceId: cartId,
          notes: `Item eliminado del carrito ${cartId}`,
        },
      });

      // Eliminar el item
      await tx.saleItem.delete({
        where: { id: itemId },
      });

      // Recalcular el total del carrito
      const remainingItems = await tx.saleItem.findMany({
        where: { saleId: cartId },
      });

      const newTotal = remainingItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

      await tx.sale.update({
        where: { id: cartId },
        data: {
          totalAmount: newTotal,
          updatedAt: new Date(),
        },
      });

      return { success: true, remainingItems: remainingItems.length };
    });
  }

  /**
   * Actualiza el carrito (notas, descuento, livestream)
   */
  async updateCart(
    cartId: string,
    organizationId: string,
    updateData: {
      notes?: string;
      discountAmount?: number;
      livestreamId?: string;
    }
  ) {
    const cart = await prisma.sale.findFirst({
      where: {
        id: cartId,
        organizationId,
        status: 'reserved',
      },
    });

    if (!cart) {
      throw new Error('Carrito no encontrado o ya está cerrado');
    }

    const data: any = {
      updatedAt: new Date(),
    };

    if (updateData.notes !== undefined) {
      data.notes = updateData.notes;
    }

    if (updateData.discountAmount !== undefined) {
      data.discountAmount = updateData.discountAmount;
    }

    if (updateData.livestreamId) {
      data.livestreamId = updateData.livestreamId;
      data.lastLivestreamId = updateData.livestreamId;
    }

    return prisma.sale.update({
      where: { id: cartId },
      data,
    });
  }

  /**
   * Confirma un carrito (lo convierte en venta confirmada)
   */
  async confirmCart(
    cartId: string,
    organizationId: string,
    paymentData: {
      method: string;
      amount: number;
      reference?: string;
    }
  ) {
    const cart = await prisma.sale.findFirst({
      where: {
        id: cartId,
        organizationId,
        status: 'reserved',
      },
      include: {
        SaleItem: true,
      },
    });

    if (!cart) {
      throw new Error('Carrito no encontrado o ya está cerrado');
    }

    return prisma.$transaction(async (tx) => {
      // Crear el pago
      await tx.payment.create({
        data: {
          saleId: cartId,
          method: paymentData.method as any,
          amount: paymentData.amount,
          status: 'paid',
          reference: paymentData.reference,
          paidAt: new Date(),
        },
      });

      // Crear movimientos de stock para confirmar la venta
      for (const item of cart.SaleItem) {
        // Movimiento de venta (confirma)
        await tx.stockMovement.create({
          data: {
            productVariantId: item.productVariantId,
            organizationId,
            type: 'sale',
            quantity: -item.quantity,
            referenceType: 'sale',
            referenceId: cartId,
            notes: `Venta confirmada ${cartId}`,
          },
        });

        // Liberar la reserva
        await tx.stockMovement.create({
          data: {
            productVariantId: item.productVariantId,
            organizationId,
            type: 'cancel',
            quantity: item.quantity,
            referenceType: 'sale',
            referenceId: cartId,
            notes: `Liberar reserva al confirmar ${cartId}`,
          },
        });
      }

      // Actualizar el carrito a confirmado
      return tx.sale.update({
        where: { id: cartId },
        data: {
          status: 'confirmed',
          updatedAt: new Date(),
        },
      });
    });
  }

  /**
   * Cancela un carrito
   */
  async cancelCart(cartId: string, organizationId: string) {
    const cart = await prisma.sale.findFirst({
      where: {
        id: cartId,
        organizationId,
        status: 'reserved',
      },
      include: {
        SaleItem: true,
        Payment: true,
      },
    });

    if (!cart) {
      throw new Error('Carrito no encontrado o ya está cerrado');
    }

    // Verificar que no tenga pagos confirmados
    const hasPaidPayments = cart.Payment.some((p) => p.status === 'paid');
    if (hasPaidPayments) {
      throw new Error('No se puede cancelar un carrito con pagos confirmados');
    }

    return prisma.$transaction(async (tx) => {
      // Liberar todo el stock reservado
      for (const item of cart.SaleItem) {
        await tx.stockMovement.create({
          data: {
            productVariantId: item.productVariantId,
            organizationId,
            type: 'cancel',
            quantity: item.quantity,
            referenceType: 'sale',
            referenceId: cartId,
            notes: `Carrito cancelado ${cartId}`,
          },
        });
      }

      // Actualizar el carrito a cancelado
      return tx.sale.update({
        where: { id: cartId },
        data: {
          status: 'cancelled',
          updatedAt: new Date(),
        },
      });
    });
  }

  /**
   * Obtiene carritos antiguos (no actualizados en X días)
   */
  async getOldCarts(organizationId: string, daysOld: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return prisma.sale.findMany({
      where: {
        organizationId,
        status: 'reserved',
        updatedAt: {
          lt: cutoffDate,
        },
      },
      include: {
        Customer: true,
        SaleItem: true,
      },
      orderBy: {
        updatedAt: 'asc',
      },
    });
  }
}
