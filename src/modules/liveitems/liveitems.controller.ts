import { Request, Response } from 'express';
import { LiveItemsService } from './liveitems.service';
import {
  validateCreateLiveItem,
  validateUpdateLiveItem,
  validateGetLiveItemsQuery,
  validateAddAttribute,
} from './liveitems.validation';

const liveItemsService = new LiveItemsService();

interface RequestWithOrganization extends Request {
  organizationId?: string;
}

export class LiveItemsController {
  /**
   * POST /liveitems - Crear un nuevo LiveItem
   */
  async createLiveItem(req: RequestWithOrganization, res: Response) {
    try {
      const data = validateCreateLiveItem(req.body);
      const item = await liveItemsService.createLiveItem(req.organizationId!, data);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /liveitems - Obtener LiveItems con filtros
   */
  async getLiveItems(req: RequestWithOrganization, res: Response) {
    try {
      const filters = validateGetLiveItemsQuery(req.query);
      const result = await liveItemsService.getLiveItems(req.organizationId!, filters);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /liveitems/stats - Obtener estadísticas de LiveItems
   */
  async getStats(req: RequestWithOrganization, res: Response) {
    try {
      const { livestreamId } = req.query;
      const stats = await liveItemsService.getStats(
        req.organizationId!,
        livestreamId as string
      );
      res.status(200).json(stats);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * GET /liveitems/:id - Obtener un LiveItem por ID
   */
  async getLiveItemById(req: RequestWithOrganization, res: Response) {
    try {
      const item = await liveItemsService.getLiveItemById(
        req.params.id,
        req.organizationId!
      );
      res.status(200).json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * PATCH /liveitems/:id - Actualizar un LiveItem
   */
  async updateLiveItem(req: RequestWithOrganization, res: Response) {
    try {
      const data = validateUpdateLiveItem(req.body);
      const item = await liveItemsService.updateLiveItem(
        req.params.id,
        req.organizationId!,
        data
      );
      res.status(200).json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * DELETE /liveitems/:id - Eliminar un LiveItem
   */
  async deleteLiveItem(req: RequestWithOrganization, res: Response) {
    try {
      const result = await liveItemsService.deleteLiveItem(
        req.params.id,
        req.organizationId!
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * POST /liveitems/:id/attributes - Agregar atributo a un LiveItem
   */
  async addAttribute(req: RequestWithOrganization, res: Response) {
    try {
      const data = validateAddAttribute(req.body);
      const attribute = await liveItemsService.addAttribute(
        req.params.id,
        req.organizationId!,
        data
      );
      res.status(201).json(attribute);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * DELETE /liveitems/:id/attributes/:attributeId - Eliminar atributo de un LiveItem
   */
  async removeAttribute(req: RequestWithOrganization, res: Response) {
    try {
      const result = await liveItemsService.removeAttribute(
        req.params.id,
        req.params.attributeId,
        req.organizationId!
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default new LiveItemsController();
