import { Request, Response, NextFunction } from 'express';
import categoriesService from './categories.service';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from './categories.validation';

interface CustomRequest extends Request {
  organizationId?: string;
}

export class CategoriesController {
  // GET /api/categories
  async getCategories(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await categoriesService.getCategories(organizationId, includeInactive);
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/categories/:id
  async getCategoryById(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = categoryIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      const category = await categoriesService.getCategoryById(id, organizationId);
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/categories
  async createCategory(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const category = await categoriesService.createCategory(data, organizationId);
      res.status(201).json({
        success: true,
        data: category,
        message: 'Categoría creada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/categories/:id
  async updateCategory(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = categoryIdSchema.parse(req.params);
      const data = updateCategorySchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const category = await categoriesService.updateCategory(id, data, organizationId);
      res.json({
        success: true,
        data: category,
        message: 'Categoría actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/categories/:id
  async deleteCategory(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = categoryIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      await categoriesService.deleteCategory(id, organizationId);
      res.json({
        success: true,
        message: 'Categoría eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoriesController();
