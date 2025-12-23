import { Request, Response, NextFunction } from 'express';
import organizationService from './organizations.service';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationIdSchema,
} from './organizations.validation';

export class OrganizationController {
  // GET /api/organizations
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const organizations = await organizationService.findAll();
      res.json({
        success: true,
        data: organizations,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/organizations/:id
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = organizationIdSchema.parse(req.params);
      const organization = await organizationService.findById(id);
      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/organizations
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOrganizationSchema.parse(req.body);
      const organization = await organizationService.create(data);
      res.status(201).json({
        success: true,
        data: organization,
        message: 'Organización creada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/organizations/:id
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = organizationIdSchema.parse(req.params);
      const data = updateOrganizationSchema.parse(req.body);
      const organization = await organizationService.update(id, data);
      res.json({
        success: true,
        data: organization,
        message: 'Organización actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/organizations/:id
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = organizationIdSchema.parse(req.params);
      await organizationService.delete(id);
      res.json({
        success: true,
        message: 'Organización eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/organizations/:id/toggle-active
  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = organizationIdSchema.parse(req.params);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive debe ser un booleano',
        });
      }

      const organization = await organizationService.toggleActive(id, isActive);
      res.json({
        success: true,
        data: organization,
        message: `Organización ${isActive ? 'activada' : 'desactivada'} exitosamente`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrganizationController();
