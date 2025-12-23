import { Request, Response } from 'express';
import { SalesService } from './sales.service'; 
import { validateSaleCreation } from './sales.validation';

const salesService = new SalesService();

// Extend Request type to include organizationId
interface RequestWithOrganization extends Request {
  organizationId?: string;
}

export class SalesController {
  async createSale(req: RequestWithOrganization, res: Response) {
    try {
      const validatedData = validateSaleCreation(req.body);
      const sale = await salesService.createSale(validatedData, req.organizationId!);
      res.status(201).json(sale);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getSales(req: RequestWithOrganization, res: Response) {
    try {
      const sales = await salesService.getSales(req.organizationId!);
      res.status(200).json(sales);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getSaleById(req: RequestWithOrganization, res: Response) {
    try {
      const sale = await salesService.getSaleById(req.params.id, req.organizationId!);
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }
      res.status(200).json(sale);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateSale(req: RequestWithOrganization, res: Response) {
    try {
      const updatedSale = await salesService.updateSale(req.params.id, req.body, req.organizationId!);
      res.status(200).json(updatedSale);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async deleteSale(req: RequestWithOrganization, res: Response) {
    try {
      await salesService.deleteSale(req.params.id, req.organizationId!);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}