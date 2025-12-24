import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../config/jwt';

// Extender la interfaz de Express Request para agregar propiedades personalizadas
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      organizationId?: string;
      userRole?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
    }

    // El formato esperado es: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>',
      });
    }

    const token = parts[1];

    // Verificar y decodificar el token
    const decoded = verifyToken(token);

    // Agregar información del usuario a la request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.organizationId = decoded.organizationId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Token inválido',
    });
  }
};

// Middleware para verificar que el usuario tenga acceso a una organización específica
export const organizationContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationIdFromToken = req.organizationId;

    if (!organizationIdFromToken) {
      return res.status(403).json({
        success: false,
        message: 'No se encontró información de organización en el token',
      });
    }

    // Agregar la organización al contexto de la request
    // Esto asegura que todas las queries posteriores usen esta organizationId
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Error al validar contexto de organización',
    });
  }
};

// Middleware para verificar roles específicos
export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole;

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: 'No se encontró información de rol en el token',
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción',
      });
    }

    next();
  };
};
