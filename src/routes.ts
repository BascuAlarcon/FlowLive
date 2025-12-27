import { Router } from 'express';
import { authMiddleware } from './modules/auth/auth.middleware';
import productRoutes from './modules/products/product.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import attributesRoutes from './modules/attributes/attributes.routes';
import customersRoutes from './modules/customers/customers.routes';
import livestreamsRoutes from './modules/livestreams/livestreams.routes';
import metricsRoutes from './modules/metrics/metrics.routes';
import cartsRoutes from './modules/carts/carts.routes';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
// router.use(authMiddleware);

router.use('/products', productRoutes);
router.use('/categories', categoriesRoutes);
router.use('/attributes', attributesRoutes);
router.use('/customers', customersRoutes);
router.use('/livestreams', livestreamsRoutes);
router.use('/metrics', metricsRoutes);
router.use('/carts', cartsRoutes);

export default router;