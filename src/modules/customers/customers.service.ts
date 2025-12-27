import prisma from '../../config/prisma';

export class CustomersService {
  async createCustomer(data: any, organizationId: string) {
    return await prisma.customer.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async getCustomers(organizationId: string, search?: string, includeDeleted: boolean = false) {
    const where: any = { organizationId };
    
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { contact: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await prisma.customer.findMany({
      where,
      orderBy: [
        { lastPurchaseAt: 'desc' },
        { name: 'asc' },
      ],
      take: 100, // Limitar resultados para performance
    });
  }

  async getCustomerById(id: string, organizationId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new Error('Cliente no encontrado');
    }

    return customer;
  }

  async getCustomerByName(name: string, organizationId: string) {
    // Buscar cliente por nombre exacto
    return await prisma.customer.findFirst({
      where: {
        organizationId,
        name: name,
        deletedAt: null,
      },
    });
  }

  async findOrCreateCustomer(name: string, organizationId: string, additionalData?: any) {
    // Buscar cliente existente
    let customer = await this.getCustomerByName(name, organizationId);

    // Si no existe, crearlo
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          organizationId,
          ...additionalData,
        },
      });
    }

    return customer;
  }

  async updateCustomer(id: string, data: any, organizationId: string) {
    await this.getCustomerById(id, organizationId);

    return await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteCustomer(id: string, organizationId: string) {
    // Soft delete
    const result = await prisma.customer.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new Error('Cliente no encontrado');
    }

    return { message: 'Cliente eliminado exitosamente' };
  }

  async getCustomerStats(customerId: string, organizationId: string) {
    await this.getCustomerById(customerId, organizationId);

    // Obtener estadísticas del cliente
    const sales = await prisma.sale.findMany({
      where: {
        customerId,
        organizationId,
      },
      include: {
        _count: {
          select: { SaleItem: true },
        },
      },
    });

    const totalSales = sales.length;
    const totalSpent = sales
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    
    const confirmedSales = sales.filter(s => s.status === 'confirmed').length;
    const pendingSales = sales.filter(s => s.status === 'reserved').length;
    const cancelledSales = sales.filter(s => s.status === 'cancelled').length;

    return {
      totalSales,
      confirmedSales,
      pendingSales,
      cancelledSales,
      totalSpent,
      averageTicket: totalSales > 0 ? totalSpent / totalSales : 0,
    };
  }
}

export default new CustomersService();
