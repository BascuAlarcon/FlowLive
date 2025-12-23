import prisma from '../../config/prisma';

export class ProductService {
  async createProduct(data: any, organizationId: string) {
    return await prisma.product.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async getProducts(organizationId: string) {
    return await prisma.product.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductById(id: string, organizationId: string) {
    const product = await prisma.product.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    return product;
  }

  async updateProduct(id: string, data: any, organizationId: string) {
    await this.getProductById(id, organizationId);

    return await prisma.product.update({
      where: { id },
      data,
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

    return true;
  }
}

export default new ProductService();