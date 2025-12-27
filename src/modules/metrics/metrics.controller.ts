import { Request, Response, NextFunction } from 'express';
import metricsService from './metrics.service';
import { dateRangeSchema, monthYearSchema } from './metrics.validation';

interface CustomRequest extends Request {
  organizationId?: string;
}

export class MetricsController {
  // GET /api/metrics/dashboard
  async getDashboardMetrics(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const metrics = await metricsService.getDashboardMetrics(organizationId);
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/metrics/sales
  async getSalesMetrics(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const { startDate, endDate } = dateRangeSchema.parse(req.query);
      
      const metrics = await metricsService.getSalesMetrics(
        organizationId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/metrics/products/top
  async getTopProducts(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const limit = parseInt(req.query.limit as string) || 10;
      const topProducts = await metricsService.getTopProducts(organizationId, limit);
      res.json({
        success: true,
        data: topProducts,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/metrics/customers/top
  async getTopCustomers(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const limit = parseInt(req.query.limit as string) || 10;
      const topCustomers = await metricsService.getTopCustomers(organizationId, limit);
      res.json({
        success: true,
        data: topCustomers,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/metrics/payments
  async getPaymentMetrics(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const metrics = await metricsService.getPaymentMetrics(organizationId);
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/metrics/livestreams
  async getLivestreamMetrics(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const limit = parseInt(req.query.limit as string) || 10;
      const metrics = await metricsService.getLivestreamMetrics(organizationId, limit);
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/metrics/monthly
  async getMonthlyMetrics(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const { month } = monthYearSchema.parse(req.query);
      const metrics = await metricsService.getMonthlyMetrics(organizationId, month);
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MetricsController();
