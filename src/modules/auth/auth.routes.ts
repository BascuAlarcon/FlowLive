import { Router } from 'express';
import authController from './auth.controller';
import { authMiddleware } from './auth.middleware';

const router = Router();

// POST /api/auth/login - Login de usuario
router.post('/login', authController.login.bind(authController));

// POST /api/auth/register - Registro de usuario
router.post('/register', authController.register.bind(authController));

// GET /api/auth/me - Obtener información del usuario actual (requiere autenticación)
router.get('/me', authMiddleware, authController.me.bind(authController));

export default router;
