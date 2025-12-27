import { Router } from 'express';
import metricsController from './metrics.controller';

const router = Router();

// GET /api/metrics/dashboard - Métricas generales del dashboard
router.get('/dashboard', metricsController.getDashboardMetrics.bind(metricsController));

// GET /api/metrics/sales - Métricas de ventas (con rango de fechas opcional)
router.get('/sales', metricsController.getSalesMetrics.bind(metricsController));

// GET /api/metrics/products/top - Top productos más vendidos
router.get('/products/top', metricsController.getTopProducts.bind(metricsController));

// GET /api/metrics/customers/top - Top clientes por monto gastado
router.get('/customers/top', metricsController.getTopCustomers.bind(metricsController));

// GET /api/metrics/payments - Métricas de pagos (por estado y método)
router.get('/payments', metricsController.getPaymentMetrics.bind(metricsController));

// GET /api/metrics/livestreams - Métricas de livestreams
router.get('/livestreams', metricsController.getLivestreamMetrics.bind(metricsController));

// GET /api/metrics/monthly - Métricas mensuales
router.get('/monthly', metricsController.getMonthlyMetrics.bind(metricsController));

export default router;
