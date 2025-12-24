import prisma from '../../config/prisma';

export class SalesService {
  async createSale(data: any, organizationId: string) {
    return prisma.sale.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async getSales(organizationId: string) {
    return prisma.sale.findMany({
      where: { organizationId },
    });
  }

  async getSaleById(id: string, organizationId: string) {
    return prisma.sale.findFirst({
      where: { id, organizationId },
    });
  }

  async updateSale(id: string, data: any, organizationId: string) {
    return prisma.sale.update({
      where: { id },
      data,
    });
  }

  async deleteSale(id: string, organizationId: string) {
    return prisma.sale.delete({
      where: { id },
    });
  }
}