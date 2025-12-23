import { Request, Response, NextFunction } from 'express';
import userService from './users.service';
import {
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
  addUserToOrganizationSchema,
  userIdSchema,
} from './users.validation';

export class UserController {
  // GET /api/users
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.findAll();
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/:id
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = userIdSchema.parse(req.params);
      const user = await userService.findByIdWithOrganizations(id);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/organization/:organizationId
  async getByOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.params;
      const users = await userService.findByOrganization(organizationId);
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/users
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await userService.create(data);
      res.status(201).json({
        success: true,
        data: user,
        message: 'Usuario creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/:id
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = userIdSchema.parse(req.params);
      const data = updateUserSchema.parse(req.body);
      const user = await userService.update(id, data);
      res.json({
        success: true,
        data: user,
        message: 'Usuario actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:id
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = userIdSchema.parse(req.params);
      await userService.delete(id);
      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/users/add-to-organization
  async addToOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const data = addUserToOrganizationSchema.parse(req.body);
      const result = await userService.addToOrganization(data);
      res.json({
        success: true,
        data: result,
        message: 'Usuario agregado a la organización exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/users/:id/role
  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = userIdSchema.parse(req.params);
      const data = updateUserRoleSchema.parse(req.body);
      const result = await userService.updateRole(id, data);
      res.json({
        success: true,
        data: result,
        message: 'Rol actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:id/organization/:organizationId
  async removeFromOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, organizationId } = req.params;
      await userService.removeFromOrganization(id, organizationId);
      res.json({
        success: true,
        message: 'Usuario removido de la organización exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
