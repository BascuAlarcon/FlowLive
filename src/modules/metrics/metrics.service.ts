import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

export class MetricsService {
  async getDashboardMetrics(organizationId: string) {
    // Métricas generales del dashboard
    const [
      totalSales,
      totalRevenue,
      totalProducts,
      totalCustomers,
      activeLivestream,
    ] = await Promise.all([
      // Total de ventas
      prisma.sale.count({
        where: { organizationId },
      }),
      
      // Revenue total (ventas confirmadas)
      prisma.sale.aggregate({
        where: {
          organizationId,
          status: 'confirmed',
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Total de items en vivo
      prisma.liveItem.count({
        where: {
          organizationId,
        },
      }),

      // Total de clientes
      prisma.customer.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),

      // Livestream activo
      prisma.livestream.findFirst({
        where: {
          organizationId,
          endedAt: null,
        },
      }),
    ]);

    // Ventas por estado
    const salesByStatus = await prisma.sale.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
      _sum: {
        totalAmount: true,
      },
    });

    return {
      totalSales,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      totalProducts,
      totalCustomers,
      hasActiveLivestream: !!activeLivestream,
      salesByStatus: salesByStatus.map(s => ({
        status: s.status,
        count: s._count,
        totalAmount: Number(s._sum.totalAmount || 0),
      })),
    };
  }

  async getSalesMetrics(organizationId: string, startDate?: Date, endDate?: Date) {
    const where: any = { organizationId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [sales, salesByDay] = await Promise.all([
      // Ventas totales y agregados
      prisma.sale.aggregate({
        where,
        _count: true,
        _sum: {
          totalAmount: true,
        },
        _avg: {
          totalAmount: true,
        },
      }),

      // Ventas agrupadas por día
      prisma.$queryRaw<Array<{ date: Date; count: bigint; total: Prisma.Decimal }>>`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count,
          SUM(totalAmount) as total
        FROM Sale
        WHERE organizationId = ${organizationId}
          ${startDate ? Prisma.sql`AND createdAt >= ${startDate}` : Prisma.empty}
          ${endDate ? Prisma.sql`AND createdAt <= ${endDate}` : Prisma.empty}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
        LIMIT 30
      `,
    ]);

    return {
      totalSales: sales._count,
      totalRevenue: Number(sales._sum.totalAmount || 0),
      averageTicket: Number(sales._avg.totalAmount || 0),
      salesByDay: salesByDay.map(d => ({
        date: d.date,
        count: Number(d.count),
        total: Number(d.total),
      })),
    };
  }

  async getTopProducts(organizationId: string, limit: number = 10) {
    // Top productos más vendidos
    const topProducts = await prisma.$queryRaw<Array<{
      productId: string;
      productName: string;
      totalQuantity: bigint;
      totalRevenue: Prisma.Decimal;
    }>>`
      SELECT 
        p.id as productId,
        p.name as productName,
        SUM(si.quantity) as totalQuantity,
        SUM(si.totalPrice) as totalRevenue
      FROM SaleItem si
      INNER JOIN Sale s ON si.saleId = s.id
      INNER JOIN Product p ON si.productId = p.id
      WHERE s.organizationId = ${organizationId}
        AND s.status != 'cancelled'
      GROUP BY p.id, p.name
      ORDER BY totalQuantity DESC
      LIMIT ${limit}
    `;

    return topProducts.map(p => ({
      productId: p.productId,
      productName: p.productName,
      totalQuantity: Number(p.totalQuantity),
      totalRevenue: Number(p.totalRevenue),
    }));
  }

  async getTopCustomers(organizationId: string, limit: number = 10) {
    // Top clientes por monto gastado
    const topCustomers = await prisma.$queryRaw<Array<{
      customerId: string;
      customerName: string;
      totalPurchases: bigint;
      totalSpent: Prisma.Decimal;
    }>>`
      SELECT 
        c.id as customerId,
        c.name as customerName,
        COUNT(s.id) as totalPurchases,
        SUM(s.totalAmount) as totalSpent
      FROM Customer c
      INNER JOIN Sale s ON c.id = s.customerId
      WHERE s.organizationId = ${organizationId}
        AND s.status != 'cancelled'
      GROUP BY c.id, c.name
      ORDER BY totalSpent DESC
      LIMIT ${limit}
    `;

    return topCustomers.map(c => ({
      customerId: c.customerId,
      customerName: c.customerName,
      totalPurchases: Number(c.totalPurchases),
      totalSpent: Number(c.totalSpent),
    }));
  }

  async getPaymentMetrics(organizationId: string) {
    // Métricas de pagos
    const [paymentsByStatus, paymentsByMethod] = await Promise.all([
      // Pagos por estado
      prisma.payment.groupBy({
        by: ['status'],
        where: {
          Sale: {
            organizationId,
          },
        },
        _count: true,
        _sum: {
          amount: true,
        },
      }),

      // Pagos por método
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          Sale: {
            organizationId,
          },
          status: 'paid',
        },
        _count: true,
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      byStatus: paymentsByStatus.map(p => ({
        status: p.status,
        count: p._count,
        totalAmount: Number(p._sum?.amount || 0),
      })),
      byMethod: paymentsByMethod.map(p => ({
        method: p.method,
        count: p._count,
        totalAmount: Number(p._sum?.amount || 0),
      })),
    };
  }

  async getLivestreamMetrics(organizationId: string, limit: number = 10) {
    // Métricas de livestreams
    const livestreams = await prisma.livestream.findMany({
      where: {
        organizationId,
        endedAt: { not: null },
      },
      orderBy: {
        totalSalesAmount: 'desc',
      },
      take: limit,
      select: {
        id: true,
        title: true,
        platform: true,
        startedAt: true,
        endedAt: true,
        totalSalesAmount: true,
        viewerCount: true,
      },
    });

    // Calcular duración para cada uno
    return livestreams.map(live => ({
      ...live,
      totalSalesAmount: Number(live.totalSalesAmount || 0),
      durationMinutes: live.endedAt
        ? Math.floor((live.endedAt.getTime() - live.startedAt.getTime()) / 1000 / 60)
        : null,
    }));
  }

  async getMonthlyMetrics(organizationId: string, month?: string) {
    // Si no se especifica mes, usar el actual
    const targetDate = month ? new Date(month + '-01') : new Date();
    const year = targetDate.getFullYear();
    const monthNum = targetDate.getMonth() + 1;

    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    const [salesData, paymentsData] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          organizationId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
        _sum: {
          totalAmount: true,
        },
        _avg: {
          totalAmount: true,
        },
      }),

      prisma.payment.aggregate({
        where: {
          Sale: {
            organizationId,
          },
          status: 'paid',
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      month: `${year}-${monthNum.toString().padStart(2, '0')}`,
      totalSales: salesData._count,
      totalRevenue: Number(salesData._sum.totalAmount || 0),
      averageTicket: Number(salesData._avg.totalAmount || 0),
      totalPaid: Number(paymentsData._sum?.amount || 0),
    };
  }
}

export default new MetricsService();
