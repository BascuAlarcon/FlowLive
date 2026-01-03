import { Request, Response, NextFunction } from 'express';
import attributesService from './attributes.service';
import {
  createAttributeSchema,
  updateAttributeSchema,
  attributeIdSchema,
  categoryIdSchema,
  createValueSchema,
  updateValueSchema,
  valueIdSchema,
  attributeIdParamSchema,
} from './attributes.validation';

interface CustomRequest extends Request {
  organizationId?: string;
}

export class AttributesController {
  // ==================== CategoryAttribute Endpoints ====================

  // GET /api/categories/:categoryId/attributes
  async getAttributesByCategory(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { categoryId } = categoryIdSchema.parse(req.params);
      console.log('Received request to get attributes for categoryId:', categoryId);
      const organizationId = req.organizationId || '';
      const attributes = await attributesService.getAttributesByCategory(categoryId, organizationId);
      res.json({
        success: true,
        data: attributes,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/attributes/:id
  async getAttributeById(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = attributeIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      const attribute = await attributesService.getAttributeById(id, organizationId);
      res.json({
        success: true,
        data: attribute,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/categories/:categoryId/attributes o POST /api/attributes
  async createAttribute(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      // Tomar categoryId de params o body
      const categoryId = req.params.categoryId || req.body.categoryId;
      const bodyData = { ...req.body, categoryId };
      
      const data = createAttributeSchema.parse(bodyData);
      const organizationId = req.organizationId || '';
      const attribute = await attributesService.createAttribute(data, organizationId);
      res.status(201).json({
        success: true,
        data: attribute,
        message: 'Atributo creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/attributes/:id
  async updateAttribute(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = attributeIdSchema.parse(req.params);
      const data = updateAttributeSchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const attribute = await attributesService.updateAttribute(id, data, organizationId);
      res.json({
        success: true,
        data: attribute,
        message: 'Atributo actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/attributes/:id
  async deleteAttribute(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = attributeIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      await attributesService.deleteAttribute(id, organizationId);
      res.json({
        success: true,
        message: 'Atributo eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== AttributeValue Endpoints ====================

  // GET /api/attributes/:attributeId/values
  async getValuesByAttribute(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { attributeId } = attributeIdParamSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      const includeInactive = req.query.includeInactive === 'true';
      const values = await attributesService.getValuesByAttribute(attributeId, organizationId, includeInactive);
      res.json({
        success: true,
        data: values,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/attributes/values/:id
  async getValueById(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = valueIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      const value = await attributesService.getValueById(id, organizationId);
      res.json({
        success: true,
        data: value,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/attributes/values o POST /api/attributes/:attributeId/values
  async createValue(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      // Tomar attributeId de params o body
      const attributeId = req.params.attributeId || req.body.attributeId;
      const bodyData = { ...req.body, attributeId };
      
      const data = createValueSchema.parse(bodyData);
      const organizationId = req.organizationId || '';
      const value = await attributesService.createValue(data, organizationId);
      res.status(201).json({
        success: true,
        data: value,
        message: 'Valor creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/attributes/values/:id
  async updateValue(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = valueIdSchema.parse(req.params);
      const data = updateValueSchema.parse(req.body);
      const organizationId = req.organizationId || '';
      const value = await attributesService.updateValue(id, data, organizationId);
      res.json({
        success: true,
        data: value,
        message: 'Valor actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/attributes/values/:id
  async deleteValue(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = valueIdSchema.parse(req.params);
      const organizationId = req.organizationId || '';
      await attributesService.deleteValue(id, organizationId);
      res.json({
        success: true,
        message: 'Valor eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AttributesController();
