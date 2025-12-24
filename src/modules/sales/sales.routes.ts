import { Router } from 'express';
import { SalesController } from './sales.controller';
import { authMiddleware, organizationContextMiddleware } from '../auth/auth.middleware';

const router = Router();
const salesController = new SalesController();

router.use(authMiddleware, organizationContextMiddleware);

router.post('/', salesController.createSale);
router.get('/', salesController.getSales);
router.get('/:id', salesController.getSaleById);
router.put('/:id', salesController.updateSale);
router.delete('/:id', salesController.deleteSale);

export default router;