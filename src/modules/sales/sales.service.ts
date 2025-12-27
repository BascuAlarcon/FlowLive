import prisma from '../../config/prisma';

export class SalesService {
  /**
   * Busca o crea un carrito para el cliente
   * Si el cliente ya tiene un carrito abierto (reserved), lo retorna
   * Si no, crea uno nuevo
   */
  async findOrCreateCart(customerId: string, organizationId: string, data: any) {
    // Buscar carrito activo del cliente
    const existingCart = await prisma.sale.findFirst({
      where: {
        customerId,
        organizationId,
        status: 'reserved',
      },
      include: {
        SaleItem: true,
      },
    });

    if (existingCart) {
      // Actualizar el carrito existente con el nuevo livestream si viene
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.livestreamId) {
        updateData.livestreamId = data.livestreamId;
        updateData.lastLivestreamId = data.livestreamId;
      }

      if (data.sellerId) {
        updateData.sellerId = data.sellerId;
      }

      await prisma.sale.update({
        where: { id: existingCart.id },
        data: updateData,
      });

      return existingCart;
    }

    // Crear nuevo carrito
    return prisma.sale.create({
      data: {
        ...data,
        organizationId,
        lastLivestreamId: data.livestreamId,
      },
      include: {
        SaleItem: true,
      },
    });
  }

  async createSale(data: any, organizationId: string) {
    return prisma.sale.create({
      data: {
        ...data,
        organizationId,
        lastLivestreamId: data.livestreamId,
      },
    });
  }

  async getSales(organizationId: string, filters?: {
    status?: string;
    livestreamId?: string;
    customerId?: string;
    includeAllCarts?: boolean; // Para mostrar carritos de todos los lives
  }) {
    const where: any = { organizationId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.livestreamId) {
      where.livestreamId = filters.livestreamId;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    return prisma.sale.findMany({
      where,
      include: {
        SaleItem: true,
      },
      orderBy: [
        { status: 'asc' }, // reserved primero
        { updatedAt: 'desc' }, // más recientes primero
      ],
    });
  }

  /**
   * Obtiene todos los carritos activos (reserved) de la organización
   */
  async getActiveCarts(organizationId: string, filters?: {
    customerId?: string;
    livestreamId?: string;
    hasNoLivestream?: boolean;
  }) {
    const where: any = {
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

    return prisma.sale.findMany({
      where,
      include: {
        SaleItem: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getSaleById(id: string, organizationId: string) {
    return prisma.sale.findFirst({
      where: { id, organizationId },
    });
  }

  async updateSale(id: string, data: any, organizationId: string) {
    // Si se actualiza el livestreamId, también actualizar lastLivestreamId
    const updateData = { ...data };
    if (data.livestreamId) {
      updateData.lastLivestreamId = data.livestreamId;
    }

    return prisma.sale.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteSale(id: string, organizationId: string) {
    return prisma.sale.delete({
      where: { id },
    });
  }
}