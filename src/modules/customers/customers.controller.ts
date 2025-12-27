import { Request, Response, NextFunction } from 'express';
import customersService from './customers.service';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdSchema,
  searchCustomerSchema,
} from './customers.validation';

interface CustomRequest extends Request {
  organizationId?: string;
}

export class CustomersController {
  // GET /api/customers
  async getCustomers(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const { search, includeDeleted } = searchCustomerSchema.parse(req.query);
      const customers = await customersService.getCustomers(
        organizationId,
        search,
        includeDeleted === 'true'
      );
      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/customers/:id
  async getCustomerById(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = customerIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      const customer = await customersService.getCustomerById(id, organizationId);
      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/customers/:id/stats
  async getCustomerStats(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = customerIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      const stats = await customersService.getCustomerStats(id, organizationId);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/customers
  async createCustomer(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const data = createCustomerSchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const customer = await customersService.createCustomer(data, organizationId);
      res.status(201).json({
        success: true,
        data: customer,
        message: 'Cliente creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/customers/:id
  async updateCustomer(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = customerIdSchema.parse(req.params);
      const data = updateCustomerSchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const customer = await customersService.updateCustomer(id, data, organizationId);
      res.json({
        success: true,
        data: customer,
        message: 'Cliente actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/customers/:id
  async deleteCustomer(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = customerIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      await customersService.deleteCustomer(id, organizationId);
      res.json({
        success: true,
        message: 'Cliente eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomersController();
