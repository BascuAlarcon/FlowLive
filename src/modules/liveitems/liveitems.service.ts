import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export class LiveItemsService {
  /**
   * Crea un nuevo LiveItem con sus atributos
   */
  async createLiveItem(
    organizationId: string,
    data: {
      categoryId: string;
      livestreamId?: string;
      price: number;
      quantity?: number;
      imageUrl?: string;
      notes?: string;
      attributes?: Array<{
        attributeValueId?: string;
        textValue?: string;
        numberValue?: number;
      }>;
    }
  ) {
    // Verificar que la categoría existe
    const category = await prisma.productCategory.findFirst({
      where: {
        id: data.categoryId,
        organizationId,
      },
    });

    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    // Verificar livestream si se proporciona
    if (data.livestreamId) {
      const livestream = await prisma.livestream.findFirst({
        where: {
          id: data.livestreamId,
          organizationId,
        },
      });

      if (!livestream) {
        throw new Error('Livestream no encontrado');
      }
    }

    return prisma.$transaction(async (tx) => {
      // Crear el LiveItem
      const liveItem = await tx.liveItem.create({
        data: {
          organizationId,
          categoryId: data.categoryId,
          livestreamId: data.livestreamId,
          price: data.price,
          quantity: data.quantity ?? 1,
          imageUrl: data.imageUrl,
          notes: data.notes,
          status: 'available',
        },
      });

      // Crear atributos si existen
      if (data.attributes && data.attributes.length > 0) {
        await tx.liveItemAttributeValue.createMany({
          data: data.attributes.map((attr) => ({
            liveItemId: liveItem.id,
            attributeValueId: attr.attributeValueId,
            textValue: attr.textValue,
            numberValue: attr.numberValue,
          })),
        });
      }

      // Retornar con atributos incluidos
      return tx.liveItem.findUnique({
        where: { id: liveItem.id },
        include: {
          category: true,
          livestream: true,
          attributes: {
            include: {
              attributeValue: {
                include: {
                  attribute: true,
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Obtiene LiveItems con filtros y paginación
   */
  async getLiveItems(
    organizationId: string,
    filters?: {
      categoryId?: string;
      livestreamId?: string;
      status?: 'available' | 'reserved' | 'sold';
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.LiveItemWhereInput = {
      organizationId,
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.livestreamId) {
      where.livestreamId = filters.livestreamId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [items, total] = await Promise.all([
      prisma.liveItem.findMany({
        where,
        include: {
          category: true,
          livestream: true,
          attributes: {
            include: {
              attributeValue: {
                include: {
                  attribute: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.liveItem.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene un LiveItem por ID
   */
  async getLiveItemById(id: string, organizationId: string) {
    const item = await prisma.liveItem.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        category: true,
        livestream: true,
        attributes: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new Error('LiveItem no encontrado');
    }

    return item;
  }

  /**
   * Actualiza un LiveItem
   */
  async updateLiveItem(
    id: string,
    organizationId: string,
    data: {
      price?: number;
      quantity?: number;
      status?: 'available' | 'reserved' | 'sold';
      imageUrl?: string;
      notes?: string;
      livestreamId?: string;
    }
  ) {
    await this.getLiveItemById(id, organizationId);

    return prisma.liveItem.update({
      where: { id },
      data,
      include: {
        category: true,
        livestream: true,
        attributes: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Elimina un LiveItem (solo si no está en una venta)
   */
  async deleteLiveItem(id: string, organizationId: string) {
    await this.getLiveItemById(id, organizationId);

    // Verificar que no esté en ninguna venta
    const inSale = await prisma.saleItem.findFirst({
      where: { liveItemId: id },
    });

    if (inSale) {
      throw new Error('No se puede eliminar el LiveItem porque está en una venta');
    }

    return prisma.$transaction(async (tx) => {
      // Eliminar atributos
      await tx.liveItemAttributeValue.deleteMany({
        where: { liveItemId: id },
      });

      // Eliminar el item
      await tx.liveItem.delete({
        where: { id },
      });

      return { success: true };
    });
  }

  /**
   * Agrega un atributo a un LiveItem
   */
  async addAttribute(
    liveItemId: string,
    organizationId: string,
    attributeData: {
      attributeValueId?: string;
      textValue?: string;
      numberValue?: number;
    }
  ) {
    await this.getLiveItemById(liveItemId, organizationId);

    return prisma.liveItemAttributeValue.create({
      data: {
        liveItemId,
        attributeValueId: attributeData.attributeValueId,
        textValue: attributeData.textValue,
        numberValue: attributeData.numberValue,
      },
      include: {
        attributeValue: {
          include: {
            attribute: true,
          },
        },
      },
    });
  }

  /**
   * Elimina un atributo de un LiveItem
   */
  async removeAttribute(
    liveItemId: string,
    attributeId: string,
    organizationId: string
  ) {
    await this.getLiveItemById(liveItemId, organizationId);

    const attribute = await prisma.liveItemAttributeValue.findFirst({
      where: {
        id: attributeId,
        liveItemId,
      },
    });

    if (!attribute) {
      throw new Error('Atributo no encontrado');
    }

    await prisma.liveItemAttributeValue.delete({
      where: { id: attributeId },
    });

    return { success: true };
  }

  /**
   * Obtiene estadísticas de LiveItems
   */
  async getStats(organizationId: string, livestreamId?: string) {
    const where: Prisma.LiveItemWhereInput = { organizationId };

    if (livestreamId) {
      where.livestreamId = livestreamId;
    }

    const [available, reserved, sold, totalValue] = await Promise.all([
      prisma.liveItem.count({
        where: { ...where, status: 'available' },
      }),
      prisma.liveItem.count({
        where: { ...where, status: 'reserved' },
      }),
      prisma.liveItem.count({
        where: { ...where, status: 'sold' },
      }),
      prisma.liveItem.aggregate({
        where: { ...where, status: 'sold' },
        _sum: {
          price: true,
        },
      }),
    ]);

    return {
      available,
      reserved,
      sold,
      total: available + reserved + sold,
      totalSalesValue: totalValue._sum.price ?? 0,
    };
  }
}

export default new LiveItemsService();
