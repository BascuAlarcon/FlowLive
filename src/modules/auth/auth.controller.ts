import { Request, Response, NextFunction } from 'express';
import authService from './auth.service';
import { loginSchema, registerSchema } from './auth.validation';

export class AuthController {
  // POST /api/auth/login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);  
      res.json({
        success: true,
        message: 'Login exitoso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/register
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await authService.register(validatedData);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me - Obtener información del usuario actual
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      // El middleware ya validó el token y agregó userId a req
      const userId = (req as any).userId;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const user = await authService.findById(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

const authController = new AuthController();
export default authController;
