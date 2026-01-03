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

    const livestreams = await prisma.livestream.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    // Calcular estadísticas para cada livestream
    const livestreamsWithStats = await Promise.all(
      livestreams.map(async (livestream) => {
        const stats = await this.calculateLivestreamStats(livestream);
        return {
          ...livestream,
          stats,
        };
      })
    );

    return livestreamsWithStats;
  }

  // Método helper para calcular estadísticas de un livestream
  private async calculateLivestreamStats(livestream: any) {
    // Obtener ventas del live
    const sales = await prisma.sale.findMany({
      where: {
        livestreamId: livestream.id,
        organizationId: livestream.organizationId,
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
      totalSales,
      confirmedSales,
      pendingSales,
      cancelledSales,
      totalRevenue,
      totalUnitsSold,
      averageTicket,
      durationMinutes,
      isActive: livestream.endedAt === null,
    };
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

    // Obtener todos los LiveItems asociados al livestream
    const liveItems = await prisma.liveItem.findMany({
      where: {
        livestreamId: id,
        organizationId,
      },
      include: {
        attributes: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
              },
            },
          },
        },
        category: true,
      },
    });

    // Obtener todas las ventas asociadas a este livestream
    // Usar Sale.livestreamId O Sale.lastLivestreamId para capturar todas las ventas
    const sales = await prisma.sale.findMany({
      where: {
        OR: [
          { livestreamId: id },
          { lastLivestreamId: id },
        ],
        organizationId,
      },
      include: {
        SaleItem: {
          include: {
            LiveItem: {
              include: {
                category: true,
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
            },
          },
        },
        Customer: true,
      },
    });

    // Aplanar todos los SaleItems de las ventas encontradas
    const saleItems = sales.flatMap(sale => 
      sale.SaleItem.map(item => ({
        ...item,
        Sale: {
          id: sale.id,
          status: sale.status,
          customerId: sale.customerId,
          Customer: sale.Customer,
          organizationId: sale.organizationId,
        },
      }))
    );

    // Filtrar solo ventas confirmadas y no canceladas
    const confirmedSaleItems = saleItems.filter(
      item => item.Sale.status === 'confirmed'
    );
    const allActiveSaleItems = saleItems.filter(
      item => item.Sale.status !== 'cancelled'
    );

    // Calcular estadísticas básicas
    const endTime = livestream.endedAt || new Date();
    const durationMinutes = Math.floor(
      (endTime.getTime() - livestream.startedAt.getTime()) / 1000 / 60
    );

    // Calcular métricas básicas usando las ventas
    const totalSales = sales.length;
    const confirmedSales = sales.filter(s => s.status === 'confirmed').length;
    const pendingSales = sales.filter(s => s.status === 'reserved').length;
    const cancelledSales = sales.filter(s => s.status === 'cancelled').length;

    const totalRevenue = sales
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    const totalUnitsSold = allActiveSaleItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Monto total estimado (todos los productos del live)
    const totalEstimatedAmount = liveItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    // Monto total cerrado (solo productos confirmados)
    const totalClosedAmount = confirmedSaleItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    // Monto promedio de carritos
    const averageCartAmount =
      totalSales > 0
        ? sales.filter(s => s.status !== 'cancelled')
          .reduce((sum, sale) => sum + Number(sale.totalAmount), 0) / totalSales
        : 0;

    // Cantidad de productos promedio de carritos
    const averageProductsPerCart =
      totalSales > 0
        ? allActiveSaleItems.reduce((sum, item) => sum + item.quantity, 0) / totalSales
        : 0;

    // Tasa de conversión
    const closureRate =
      totalSales > 0 ? (confirmedSales / totalSales) * 100 : 0;

    // Clientes únicos que compraron (confirmados o reservados)
    const uniqueCustomers = Array.from(
      new Set(allActiveSaleItems.map(item => item.Sale.customerId))
    );
    const totalCustomers = uniqueCustomers.length;

    // Cantidad de productos vendidos (confirmados o reservados)
    const totalProductsSold = allActiveSaleItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Promedio de productos por usuario
    const averageProductsPerCustomer =
      totalCustomers > 0 ? totalProductsSold / totalCustomers : 0;

    // === PRODUCTOS MÁS VENDIDOS ===
    const productSales: Record<
      string,
      {
        liveItemId: string;
        categoryName: string;
        price: number;
        quantity: number;
        totalRevenue: number;
        imageUrl: string | null;
      }
    > = {};

    allActiveSaleItems.forEach(item => {
      if (!productSales[item.liveItemId]) {
        productSales[item.liveItemId] = {
          liveItemId: item.liveItemId,
          categoryName: item.LiveItem.category.name,
          price: Number(item.unitPrice),
          quantity: 0,
          totalRevenue: 0,
          imageUrl: item.LiveItem.imageUrl,
        };
      }
      productSales[item.liveItemId].quantity += item.quantity;
      productSales[item.liveItemId].totalRevenue += Number(item.totalPrice);
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // === CLIENTES QUE MÁS COMPRARON ===
    const customerPurchases: Record<
      string,
      {
        customerId: string;
        customerName: string;
        totalPurchases: number;
        totalSpent: number;
        productsCount: number;
      }
    > = {};

    allActiveSaleItems.forEach(item => {
      const customerId = item.Sale.customerId;
      if (!customerPurchases[customerId]) {
        customerPurchases[customerId] = {
          customerId,
          customerName: item.Sale.Customer.name,
          totalPurchases: 0,
          totalSpent: 0,
          productsCount: 0,
        };
      }
      customerPurchases[customerId].totalPurchases += 1;
      customerPurchases[customerId].totalSpent += Number(item.totalPrice);
      customerPurchases[customerId].productsCount += item.quantity;
    });

    const topCustomers = Object.values(customerPurchases)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // === ATRIBUTOS MÁS COMPRADOS (para gráficos) ===
    const attributesSold: Record<
      string,
      Record<string, { count: number; revenue: number }>
    > = {};

    allActiveSaleItems.forEach(item => {
      let attributesToProcess: any[] = [];
      
      // Intentar usar el snapshot guardado
      const snapshot = item.attributesSnapshot as any;
      if (snapshot && Array.isArray(snapshot) && snapshot.length > 0) {
        attributesToProcess = snapshot;
      } else if (item.LiveItem && item.LiveItem.attributes && item.LiveItem.attributes.length > 0) {
        // Fallback: usar los atributos actuales del LiveItem si no hay snapshot
        attributesToProcess = item.LiveItem.attributes.map((attr: any) => ({
          name: attr.attributeValue?.attribute?.name || '',
          value: attr.attributeValue?.value || attr.textValue || attr.numberValue?.toString() || '',
          type: attr.attributeValue?.attribute?.type || 'text',
          hexCode: attr.attributeValue?.hexCode,
        }));
      }

      // Procesar atributos
      attributesToProcess.forEach((attr: any) => {
        const attrName = attr.name;
        const attrValue = attr.value;

        if (attrName && attrValue) {
          if (!attributesSold[attrName]) {
            attributesSold[attrName] = {};
          }
          if (!attributesSold[attrName][attrValue]) {
            attributesSold[attrName][attrValue] = { count: 0, revenue: 0 };
          }
          attributesSold[attrName][attrValue].count += item.quantity;
          attributesSold[attrName][attrValue].revenue += Number(item.totalPrice);
        }
      });
    });

    // Calcular porcentajes y ordenar por cantidad
    const attributesWithPercentages: Record<
      string,
      Array<{ value: string; count: number; revenue: number; percentage: number }>
    > = {};

    Object.keys(attributesSold).forEach(attrName => {
      const totalCount = Object.values(attributesSold[attrName]).reduce(
        (sum, data) => sum + data.count,
        0
      );

      attributesWithPercentages[attrName] = Object.entries(attributesSold[attrName])
        .map(([value, data]) => ({
          value,
          count: data.count,
          revenue: data.revenue,
          percentage: totalCount > 0 ? (data.count / totalCount) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);
    });

    return {
      livestream: {
        id: livestream.id,
        organizationId: livestream.organizationId,
        title: livestream.title,
        platform: livestream.platform,
        viewerCount: livestream.viewerCount,
        totalSalesAmount: livestream.totalSalesAmount,
        startedAt: livestream.startedAt,
        endedAt: livestream.endedAt,
        createdBy: livestream.createdBy,
        createdAt: livestream.createdAt,
        updatedAt: livestream.updatedAt,
      },
      stats: {
        // Métricas básicas (compatibilidad con versión anterior)
        totalSales,
        confirmedSales,
        pendingSales,
        cancelledSales,
        totalRevenue,
        totalUnitsSold,
        averageTicket,
        durationMinutes,
        isActive: livestream.endedAt === null,
        
        // Métricas financieras extendidas
        totalEstimatedAmount,
        totalClosedAmount,
        averageCartAmount,
        averageProductsPerCart,
        
        // Métricas de conversión
        closureRate,
        
        // Métricas de clientes
        totalCustomers,
        totalProductsSold,
        averageProductsPerCustomer,
      },
      // Tablas de datos para el frontend
      topProducts,
      topCustomers,
      attributesWithPercentages, // Incluye porcentajes para gráficos
    };
  }

  async getDetailedStats(id: string, organizationId: string) {
    const livestream = await this.getLivestreamById(id, organizationId);

    // Obtener todos los LiveItems asociados al livestream
    const liveItems = await prisma.liveItem.findMany({
      where: {
        livestreamId: id,
        organizationId,
      },
      include: {
        attributes: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
              },
            },
          },
        },
        category: true,
      },
    });

    // Obtener todos los SaleItems de este livestream (vendidos desde este live)
    const saleItems = await prisma.saleItem.findMany({
      where: {
        livestreamId: id,
      },
      include: {
        Sale: {
          include: {
            Customer: true,
          },
        },
        LiveItem: {
          include: {
            category: true,
          },
        },
      },
    });

    // Filtrar solo ventas confirmadas y reservadas (excluir canceladas)
    const confirmedSaleItems = saleItems.filter(
      item => item.Sale.status === 'confirmed'
    );
    const allActiveSaleItems = saleItems.filter(
      item => item.Sale.status !== 'cancelled'
    );

    // 1. PLATAFORMA
    const platform = livestream.platform;

    // 2. VENDEDOR
    const seller = livestream.createdBy;

    // 3. FECHA INICIO
    const startDate = livestream.startedAt;

    // 4. DURACIÓN LIVE (en minutos)
    const endTime = livestream.endedAt || new Date();
    const durationMinutes = Math.floor(
      (endTime.getTime() - livestream.startedAt.getTime()) / 1000 / 60
    );

    // 5. MONTO TOTAL ESTIMADO (todos los productos del live, incluso no vendidos)
    const totalEstimatedAmount = liveItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    // 6. MONTO TOTAL CERRADO (solo productos confirmados/pagados)
    const totalClosedAmount = confirmedSaleItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    // 7. MONTO PROMEDIO DE CARRITOS
    const uniqueSales = Array.from(
      new Set(allActiveSaleItems.map(item => item.saleId))
    );
    const carts = await prisma.sale.findMany({
      where: {
        id: { in: uniqueSales },
      },
    });
    const averageCartAmount =
      carts.length > 0
        ? carts.reduce((sum, cart) => sum + Number(cart.totalAmount), 0) /
          carts.length
        : 0;

    // 8. CANTIDAD DE PRODUCTOS PROMEDIO DE CARRITOS
    const averageProductsPerCart =
      carts.length > 0
        ? allActiveSaleItems.reduce((sum, item) => sum + item.quantity, 0) /
          carts.length
        : 0;

    // 9. TASA % DE COMPRAS CERRADAS
    const confirmedCartsCount = carts.filter(
      cart => cart.status === 'confirmed'
    ).length;
    const closureRate =
      carts.length > 0 ? (confirmedCartsCount / carts.length) * 100 : 0;

    // 10. CANTIDAD DE USUARIOS QUE COMPRARON
    const uniqueCustomers = Array.from(
      new Set(confirmedSaleItems.map(item => item.Sale.customerId))
    );
    const totalCustomers = uniqueCustomers.length;

    // 11. CANTIDAD DE PRODUCTOS QUE SE COMPRARON
    const totalProductsSold = confirmedSaleItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // 12. CANTIDAD DE PRODUCTOS PROMEDIO POR USUARIO
    const averageProductsPerCustomer =
      totalCustomers > 0 ? totalProductsSold / totalCustomers : 0;

    // 13. PRODUCTOS MÁS VENDIDOS
    const productSales: Record<
      string,
      {
        liveItemId: string;
        categoryName: string;
        price: number;
        quantity: number;
        totalRevenue: number;
        imageUrl: string | null;
      }
    > = {};

    confirmedSaleItems.forEach(item => {
      if (!productSales[item.liveItemId]) {
        productSales[item.liveItemId] = {
          liveItemId: item.liveItemId,
          categoryName: item.LiveItem.category.name,
          price: Number(item.unitPrice),
          quantity: 0,
          totalRevenue: 0,
          imageUrl: item.LiveItem.imageUrl,
        };
      }
      productSales[item.liveItemId].quantity += item.quantity;
      productSales[item.liveItemId].totalRevenue += Number(item.totalPrice);
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 14. USUARIOS QUE MÁS COMPRARON
    const customerPurchases: Record<
      string,
      {
        customerId: string;
        customerName: string;
        totalPurchases: number;
        totalSpent: number;
        productsCount: number;
      }
    > = {};

    confirmedSaleItems.forEach(item => {
      const customerId = item.Sale.customerId;
      if (!customerPurchases[customerId]) {
        customerPurchases[customerId] = {
          customerId,
          customerName: item.Sale.Customer.name,
          totalPurchases: 0,
          totalSpent: 0,
          productsCount: 0,
        };
      }
      customerPurchases[customerId].totalPurchases += 1;
      customerPurchases[customerId].totalSpent += Number(item.totalPrice);
      customerPurchases[customerId].productsCount += item.quantity;
    });

    const topCustomers = Object.values(customerPurchases)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // 15. ATRIBUTOS MÁS COMPRADOS (color, talla, etc.)
    const attributesSold: Record<
      string,
      Record<string, { count: number; revenue: number }>
    > = {};

    confirmedSaleItems.forEach(item => {
      const snapshot = item.attributesSnapshot as any;
      if (snapshot && Array.isArray(snapshot)) {
        snapshot.forEach((attr: any) => {
          const attrName = attr.name;
          const attrValue = attr.value;

          if (!attributesSold[attrName]) {
            attributesSold[attrName] = {};
          }
          if (!attributesSold[attrName][attrValue]) {
            attributesSold[attrName][attrValue] = { count: 0, revenue: 0 };
          }
          attributesSold[attrName][attrValue].count += item.quantity;
          attributesSold[attrName][attrValue].revenue += Number(item.totalPrice);
        });
      }
    });

    const topAttributes: Record<
      string,
      Array<{ value: string; count: number; revenue: number }>
    > = {};

    Object.keys(attributesSold).forEach(attrName => {
      topAttributes[attrName] = Object.entries(attributesSold[attrName])
        .map(([value, data]) => ({
          value,
          count: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    });

    return {
      livestream: {
        id: livestream.id,
        title: livestream.title,
        platform,
        seller,
        startDate,
        endDate: livestream.endedAt,
        durationMinutes,
        isActive: livestream.endedAt === null,
        viewerCount: livestream.viewerCount,
      },
      metrics: {
        totalEstimatedAmount,
        totalClosedAmount,
        averageCartAmount,
        averageProductsPerCart,
        closureRate,
        totalCustomers,
        totalProductsSold,
        averageProductsPerCustomer,
      },
      topProducts,
      topCustomers,
      topAttributes,
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
