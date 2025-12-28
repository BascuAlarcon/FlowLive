import prisma from '../../config/prisma';

export class LivestreamsService {
  async createLivestream(data: any, organizationId: string, userId: string) {
    // Verificar si ya hay un live activo
    const activeLive = await prisma.livestream.findFirst({
      where: {
        organizationId,
        endedAt: null,
      },
    });

    if (activeLive) {
      throw new Error('Ya existe un live activo. Cierra el live actual antes de iniciar uno nuevo.');
    }

    return await prisma.livestream.create({
      data: {
        ...data,
        organizationId,
        createdBy: userId,
        startedAt: new Date(),
      },
    });
  }

  async getLivestreams(
    organizationId: string,
    status?: string,
    platform?: string
  ) {
    const where: any = { organizationId };

    // Filtrar por status usando endedAt
    if (status === 'active') {
      where.endedAt = null;
    } else if (status === 'closed') {
      where.endedAt = { not: null };
    }

    if (platform) {
      where.platform = platform;
    }

    return await prisma.livestream.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  async getActiveLivestream(organizationId: string) {
    return await prisma.livestream.findFirst({
      where: {
        organizationId,
        endedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getLivestreamById(id: string, organizationId: string) {
    const livestream = await prisma.livestream.findFirst({
      where: { id, organizationId },
    });

    if (!livestream) {
      throw new Error('Livestream no encontrado');
    }

    return livestream;
  }

  async updateLivestream(id: string, data: any, organizationId: string) {
    await this.getLivestreamById(id, organizationId);

    // No permitir actualizar un live cerrado
    const livestream = await prisma.livestream.findUnique({
      where: { id },
    });

    if (livestream?.endedAt !== null) {
      throw new Error('No se puede actualizar un livestream cerrado');
    }

    return await prisma.livestream.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async closeLivestream(id: string, organizationId: string, viewerCount?: number) {
    const livestream = await this.getLivestreamById(id, organizationId);

    if (livestream.endedAt !== null) {
      throw new Error('El livestream ya está cerrado');
    }

    // Calcular métricas del live
    const sales = await prisma.sale.findMany({
      where: {
        livestreamId: id,
        organizationId,
      },
      include: {
        SaleItem: true,
      },
    });

    const totalSalesAmount = sales
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    const totalUnitsSold = sales
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, sale) => {
        return sum + sale.SaleItem.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
      }, 0);

    // Cerrar el live
    const closedLive = await prisma.livestream.update({
      where: { id },
      data: {
        endedAt: new Date(),
        totalSalesAmount,
        viewerCount: viewerCount ?? livestream.viewerCount,
      },
    });

    // Registrar en activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: livestream.createdBy,
        entityType: 'livestream',
        entityId: id,
        action: 'closed',
        metadata: {
          totalSalesAmount,
          totalUnitsSold,
          duration: Math.floor((new Date().getTime() - livestream.startedAt.getTime()) / 1000 / 60), // minutos
        },
      },
    });

    return closedLive;
  }

  async getLivestreamStats(id: string, organizationId: string) {
    const livestream = await this.getLivestreamById(id, organizationId);

    // Obtener ventas del live
    const sales = await prisma.sale.findMany({
      where: {
        livestreamId: id,
        organizationId,
      },
      include: {
        SaleItem: true,
      },
    });

    const totalSales = sales.length;
    const confirmedSales = sales.filter(s => s.status === 'confirmed').length;
    const pendingSales = sales.filter(s => s.status === 'reserved').length;
    const cancelledSales = sales.filter(s => s.status === 'cancelled').length;

    const totalRevenue = sales
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    const totalUnitsSold = sales
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, sale) => {
        return sum + sale.SaleItem.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
      }, 0);

    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calcular duración
    const endTime = livestream.endedAt || new Date();
    const durationMinutes = Math.floor((endTime.getTime() - livestream.startedAt.getTime()) / 1000 / 60);

    return {
      livestream,
      stats: {
        totalSales,
        confirmedSales,
        pendingSales,
        cancelledSales,
        totalRevenue,
        totalUnitsSold,
        averageTicket,
        durationMinutes,
        isActive: livestream.endedAt === null,
      },
    };
  }

  async deleteLivestream(id: string, organizationId: string) {
    const livestream = await this.getLivestreamById(id, organizationId);

    // Verificar que no tenga ventas asociadas
    const salesCount = await prisma.sale.count({
      where: { livestreamId: id },
    });

    if (salesCount > 0) {
      throw new Error('No se puede eliminar un livestream con ventas asociadas');
    }

    return await prisma.livestream.delete({
      where: { id },
    });
  }
}

export default new LivestreamsService();
