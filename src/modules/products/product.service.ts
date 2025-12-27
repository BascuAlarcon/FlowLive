import prisma from '../../config/prisma';

export class ProductService {
  async createProduct(data: any, organizationId: string) {
    // Verificar que la categoría existe y pertenece a la organización
    const category = await prisma.productCategory.findFirst({
      where: {
        id: data.categoryId,
        organizationId,
      },
    });

    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    // Verificar que el SKU es único en la organización
    const existingSku = await prisma.product.findFirst({
      where: {
        organizationId,
        sku: data.sku,
        deletedAt: null,
      },
    });

    if (existingSku) {
      throw new Error('Ya existe un producto con ese SKU');
    }

    return await prisma.product.create({
      data: {
        ...data,
        organizationId,
      },
      include: {
        category: true,
        ProductVariant: {
          where: { deletedAt: null },
          include: {
            attributeValues: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getProducts(organizationId: string, filters?: { categoryId?: string; isActive?: boolean }) {
    const where: any = { organizationId, deletedAt: null };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        _count: {
          select: {
            ProductVariant: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  async getProductById(id: string, organizationId: string) {
    const product = await prisma.product.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        category: {
          include: {
            attributes: {
              orderBy: { order: 'asc' },
              include: {
                values: {
                  where: { isActive: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        ProductVariant: {
          where: { deletedAt: null },
          include: {
            attributeValues: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    return product;
  }

  async updateProduct(id: string, data: any, organizationId: string) {
    await this.getProductById(id, organizationId);

    // Si se está actualizando la categoría, verificar que existe y pertenece a la organización
    if (data.categoryId) {
      const category = await prisma.productCategory.findFirst({
        where: {
          id: data.categoryId,
          organizationId,
        },
      });

      if (!category) {
        throw new Error('Categoría no encontrada');
      }
    }

    // Si se está actualizando el SKU, verificar que es único
    if (data.sku) {
      const existingSku = await prisma.product.findFirst({
        where: {
          organizationId,
          sku: data.sku,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existingSku) {
        throw new Error('Ya existe un producto con ese SKU');
      }
    }

    return await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        ProductVariant: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async deleteProduct(id: string, organizationId: string) {
    const result = await prisma.product.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new Error('Producto no encontrado');
    }

    // También marcar como eliminadas todas las variantes
    await prisma.productVariant.updateMany({
      where: { productId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return true;
  }
}

export default new ProductService();