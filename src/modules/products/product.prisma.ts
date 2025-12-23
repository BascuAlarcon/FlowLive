import { PrismaClient } from '@prisma/client';

export class ProductPrisma {
  async createProduct(prisma: PrismaClient, data: any, organizationId: string) {
    return prisma.product.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async getProducts(prisma: PrismaClient, organizationId: string) {
    return prisma.product.findMany({
      where: { organizationId, deletedAt: null },
    });
  }

  async getProductById(prisma: PrismaClient, id: string, organizationId: string) {
    return prisma.product.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  async updateProduct(prisma: PrismaClient, id: string, data: any, organizationId: string) {
    return prisma.product.updateMany({
      where: { id, organizationId, deletedAt: null },
      data,
    });
  }

  async deleteProduct(prisma: PrismaClient, id: string, organizationId: string) {
    const result = await prisma.product.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }
}