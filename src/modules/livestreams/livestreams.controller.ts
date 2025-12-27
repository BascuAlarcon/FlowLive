import { Request, Response, NextFunction } from 'express';
import livestreamsService from './livestreams.service';
import {
  createLivestreamSchema,
  updateLivestreamSchema,
  closeLivestreamSchema,
  livestreamIdSchema,
  livestreamFilterSchema,
} from './livestreams.validation';

interface CustomRequest extends Request {
  organizationId?: string;
  userId?: string;
}

export class LivestreamsController {
  // GET /api/livestreams
  async getLivestreams(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const { status, platform } = livestreamFilterSchema.parse(req.query);
      const livestreams = await livestreamsService.getLivestreams(
        organizationId,
        status,
        platform
      );
      res.json({
        success: true,
        data: livestreams,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/livestreams/active
  async getActiveLivestream(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId || '';
      const livestream = await livestreamsService.getActiveLivestream(organizationId);
      res.json({
        success: true,
        data: livestream,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/livestreams/:id
  async getLivestreamById(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = livestreamIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      const livestream = await livestreamsService.getLivestreamById(id, organizationId);
      res.json({
        success: true,
        data: livestream,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/livestreams/:id/stats
  async getLivestreamStats(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = livestreamIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      const stats = await livestreamsService.getLivestreamStats(id, organizationId);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/livestreams
  async createLivestream(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const data = createLivestreamSchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const userId = req.userId || '';
      const livestream = await livestreamsService.createLivestream(data, organizationId, userId);
      res.status(201).json({
        success: true,
        data: livestream,
        message: 'Livestream iniciado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/livestreams/:id
  async updateLivestream(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = livestreamIdSchema.parse(req.params);
      const data = updateLivestreamSchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const livestream = await livestreamsService.updateLivestream(id, data, organizationId);
      res.json({
        success: true,
        data: livestream,
        message: 'Livestream actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/livestreams/:id/close
  async closeLivestream(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = livestreamIdSchema.parse(req.params);
      const { viewerCount } = closeLivestreamSchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const livestream = await livestreamsService.closeLivestream(id, organizationId, viewerCount);
      res.json({
        success: true,
        data: livestream,
        message: 'Livestream cerrado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/livestreams/:id
  async deleteLivestream(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = livestreamIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      await livestreamsService.deleteLivestream(id, organizationId);
      res.json({
        success: true,
        message: 'Livestream eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new LivestreamsController();
