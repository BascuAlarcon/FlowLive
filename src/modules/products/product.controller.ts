import { Request, Response, NextFunction } from 'express';
import productService from './product.service';
import {
    createProductSchema,
    updateProductSchema,
    productIdSchema,
} from './product.validations';

interface CustomRequest extends Request {
  organizationId?: string;
}

export class ProductController {
  // GET /api/products
  async getProducts(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const products = await productService.getProducts(organizationId);
      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/products/:id
  async getProductById(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = productIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      const product = await productService.getProductById(id, organizationId);
      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/products
  async createProduct(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const product = await productService.createProduct(data, organizationId);
      res.status(201).json({
        success: true,
        data: product,
        message: 'Producto creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/products/:id
  async updateProduct(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = productIdSchema.parse(req.params);
      const data = updateProductSchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const product = await productService.updateProduct(id, data, organizationId);
      res.json({
        success: true,
        data: product,
        message: 'Producto actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/products/:id
  async deleteProduct(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = productIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      await productService.deleteProduct(id, organizationId);
      res.json({
        success: true,
        message: 'Producto eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();