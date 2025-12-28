import { Router } from 'express';
import { authMiddleware } from './modules/auth/auth.middleware';
import authRoutes from './modules/auth/auth.routes';
import organizationsRoutes from './modules/organizations/organizations.routes';
import usersRoutes from './modules/users/users.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import attributesRoutes from './modules/attributes/attributes.routes';
import liveItemsRoutes from './modules/liveitems/liveitems.routes';
import customersRoutes from './modules/customers/customers.routes';
import livestreamsRoutes from './modules/livestreams/livestreams.routes';
import salesRoutes from './modules/sales/sales.routes';
import metricsRoutes from './modules/metrics/metrics.routes';
import cartsRoutes from './modules/carts/carts.routes';

const router = Router();

// Rutas públicas (sin autenticación)
router.use('/auth', authRoutes);

// Aplicar middleware de autenticación a todas las rutas siguientes
router.use(authMiddleware);

// Rutas protegidas
router.use('/organizations', organizationsRoutes);
router.use('/users', usersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/attributes', attributesRoutes);
router.use('/liveitems', liveItemsRoutes);
router.use('/customers', customersRoutes);
router.use('/livestreams', livestreamsRoutes);
router.use('/sales', salesRoutes);
router.use('/metrics', metricsRoutes);
router.use('/carts', cartsRoutes);

export default router;