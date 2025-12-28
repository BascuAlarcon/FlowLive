import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export class CartsService {
  /**
   * Obtiene o crea el carrito activo de un cliente
   * Un cliente solo puede tener un carrito activo (reserved) a la vez
   */
  async getOrCreateCart(
    customerId: string,
    organizationId: string,
    sellerId: string,
    livestreamId?: string
  ) {
    // Buscar carrito activo del cliente
    let cart = await prisma.sale.findFirst({
      where: {
        customerId,
        organizationId,
        status: 'reserved',
      },
      include: {
        SaleItem: {
          include: {
            LiveItem: {
              include: {
                category: true,
                attributes: {
                  include: {
                    attributeValue: true,
                  },
                },
              },
            },
          },
        },
        Customer: true,
      },
    });

    // Si no existe, crear uno nuevo
    if (!cart) {
      cart = await prisma.sale.create({
        data: {
          customerId,
          organizationId,
          sellerId,
          livestreamId,
          status: 'reserved',
          totalAmount: 0,
          lastLivestreamId: livestreamId,
        },
        include: {
          SaleItem: {
            include: {
              LiveItem: {
                include: {
                  category: true,
                  attributes: {
                    include: {
                      attributeValue: true,
                    },
                  },
                },
              },
            },
          },
          Customer: true,
        },
      });
    } else if (livestreamId && cart.lastLivestreamId !== livestreamId) {
      // Actualizar el último livestream si cambió
      cart = await prisma.sale.update({
        where: { id: cart.id },
        data: { lastLivestreamId: livestreamId },
        include: {
          SaleItem: {
            include: {
              LiveItem: {
                include: {
                  category: true,
                  attributes: {
                    include: {
                      attributeValue: true,
                    },
                  },
                },
              },
            },
          },
          Customer: true,
        },
      });
    }

    return cart;
  }

  /**
   * Obtiene todos los carritos activos de la organización
   */
  async getActiveCarts(
    organizationId: string,
    filters?: {
      customerId?: string;
      livestreamId?: string;
      sellerId?: string;
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
      where.lastLivestreamId = filters.livestreamId;
    }

    if (filters?.sellerId) {
      where.sellerId = filters.sellerId;
    }

    return prisma.sale.findMany({
      where,
      include: {
        SaleItem: {
          include: {
            LiveItem: {
              include: {
                category: true,
                attributes: {
                  include: {
                    attributeValue: true,
                  },
                },
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
   * Agrega un LiveItem al carrito del cliente
   */
  async addItemToCart(
    customerId: string,
    organizationId: string,
    sellerId: string,
    liveItemId: string,
    quantity: number,
    livestreamId?: string
  ) {
    // Verificar que el LiveItem existe y está disponible
    const liveItem = await prisma.liveItem.findFirst({
      where: {
        id: liveItemId,
        organizationId,
        status: 'available',
      },
    });

    if (!liveItem) {
      throw new Error('Item no encontrado o no disponible');
    }

    // Verificar que la cantidad solicitada no excede la disponible
    if (quantity > liveItem.quantity) {
      throw new Error(`Solo hay ${liveItem.quantity} unidades disponibles`);
    }

    // Obtener o crear el carrito
    const cart = await this.getOrCreateCart(customerId, organizationId, sellerId, livestreamId);

    // Usar transacción para agregar el item y actualizar el LiveItem
    return prisma.$transaction(async (tx) => {
      // Marcar el LiveItem como reservado
      await tx.liveItem.update({
        where: { id: liveItemId },
        data: {
          status: 'reserved',
          quantity: liveItem.quantity - quantity,
        },
      });

      // Crear el sale item
      const totalPrice = quantity * Number(liveItem.price);
      const saleItem = await tx.saleItem.create({
        data: {
          saleId: cart.id,
          liveItemId,
          quantity,
          unitPrice: liveItem.price,
          totalPrice,
        },
        include: {
          LiveItem: {
            include: {
              category: true,
              attributes: {
                include: {
                  attributeValue: true,
                },
              },
            },
          },
        },
      });

      // Recalcular el total del carrito
      const allItems = await tx.saleItem.findMany({
        where: { saleId: cart.id },
      });

      const newTotal = allItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

      // Actualizar el carrito
      await tx.sale.update({
        where: { id: cart.id },
        data: {
          totalAmount: newTotal,
          updatedAt: new Date(),
        },
      });

      return saleItem;
    });
  }

  /**
   * Elimina un item del carrito
   */
  async removeItemFromCart(
    cartId: string,
    itemId: string,
    organizationId: string
  ) {
    // Verificar que el carrito existe
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

    // Buscar el item
    const saleItem = await prisma.saleItem.findFirst({
      where: {
        id: itemId,
        saleId: cartId,
      },
      include: {
        LiveItem: true,
      },
    });

    if (!saleItem) {
      throw new Error('Item no encontrado en el carrito');
    }

    // Usar transacción para eliminar el item y liberar el LiveItem
    return prisma.$transaction(async (tx) => {
      // Liberar el LiveItem (devolver al estado available)
      await tx.liveItem.update({
        where: { id: saleItem.liveItemId },
        data: {
          status: 'available',
          quantity: saleItem.LiveItem.quantity + saleItem.quantity,
        },
      });

      // Eliminar el sale item
      await tx.saleItem.delete({
        where: { id: itemId },
      });

      // Recalcular el total del carrito
      const remainingItems = await tx.saleItem.findMany({
        where: { saleId: cartId },
      });

      const newTotal = remainingItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

      // Actualizar el carrito
      await tx.sale.update({
        where: { id: cartId },
        data: {
          totalAmount: newTotal,
          updatedAt: new Date(),
        },
      });

      return { success: true };
    });
  }

  /**
   * Confirma el carrito (cierra la venta)
   */
  async confirmCart(cartId: string, organizationId: string) {
    const cart = await prisma.sale.findFirst({
      where: {
        id: cartId,
        organizationId,
        status: 'reserved',
      },
      include: {
        SaleItem: {
          include: {
            LiveItem: true,
          },
        },
      },
    });

    if (!cart) {
      throw new Error('Carrito no encontrado o ya está cerrado');
    }

    if (cart.SaleItem.length === 0) {
      throw new Error('El carrito está vacío');
    }

    return prisma.$transaction(async (tx) => {
      // Marcar todos los LiveItems como vendidos
      for (const item of cart.SaleItem) {
        await tx.liveItem.update({
          where: { id: item.liveItemId },
          data: { status: 'sold' },
        });
      }

      // Actualizar el estado de la venta
      const updatedCart = await tx.sale.update({
        where: { id: cartId },
        data: {
          status: 'confirmed',
          updatedAt: new Date(),
        },
        include: {
          SaleItem: {
            include: {
              LiveItem: {
                include: {
                  category: true,
                  attributes: {
                    include: {
                      attributeValue: true,
                    },
                  },
                },
              },
            },
          },
          Customer: true,
          Payment: true,
        },
      });

      return updatedCart;
    });
  }

  /**
   * Cancela el carrito (libera todos los items)
   */
  async cancelCart(cartId: string, organizationId: string) {
    const cart = await prisma.sale.findFirst({
      where: {
        id: cartId,
        organizationId,
        status: 'reserved',
      },
      include: {
        SaleItem: {
          include: {
            LiveItem: true,
          },
        },
      },
    });

    if (!cart) {
      throw new Error('Carrito no encontrado o ya está cerrado');
    }

    return prisma.$transaction(async (tx) => {
      // Liberar todos los LiveItems
      for (const item of cart.SaleItem) {
        await tx.liveItem.update({
          where: { id: item.liveItemId },
          data: {
            status: 'available',
            quantity: item.LiveItem.quantity + item.quantity,
          },
        });
      }

      // Eliminar todos los items del carrito
      await tx.saleItem.deleteMany({
        where: { saleId: cartId },
      });

      // Actualizar el estado de la venta a cancelado
      const updatedCart = await tx.sale.update({
        where: { id: cartId },
        data: {
          status: 'cancelled',
          totalAmount: 0,
          updatedAt: new Date(),
        },
      });

      return updatedCart;
    });
  }

  /**
   * Obtiene el carrito de un cliente específico
   */
  async getCustomerCart(customerId: string, organizationId: string) {
    return prisma.sale.findFirst({
      where: {
        customerId,
        organizationId,
        status: 'reserved',
      },
      include: {
        SaleItem: {
          include: {
            LiveItem: {
              include: {
                category: true,
                attributes: {
                  include: {
                    attributeValue: true,
                  },
                },
              },
            },
          },
        },
        Customer: true,
      },
    });
  }
}

export default new CartsService();
