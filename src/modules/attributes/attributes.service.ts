import prisma from '../../config/prisma';

export class AttributesService {
  // ==================== CategoryAttribute Methods ====================

  async createAttribute(data: any, organizationId: string) {
    // Verificar que la categoría existe y pertenece a la organización
    const category = await prisma.productCategory.findFirst({
      where: {
        id: data.categoryId,
        organizationId,
      },
    });

    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    // Verificar si ya existe un atributo con ese nombre en la categoría
    const existing = await prisma.categoryAttribute.findFirst({
      where: {
        categoryId: data.categoryId,
        name: data.name,
      },
    });

    if (existing) {
      throw new Error('Ya existe un atributo con ese nombre en esta categoría');
    }

    return await prisma.categoryAttribute.create({
      data,
      include: {
        values: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getAttributesByCategory(categoryId: string, organizationId: string) {

    console.log('Fetching attributes for category:', categoryId, 'and organization:', organizationId);
    // Verificar que la categoría existe y pertenece a la organización
    const category = await prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        organizationId,
      },
    });

    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    return await prisma.categoryAttribute.findMany({
      where: { categoryId },
      orderBy: { order: 'asc' },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            values: true,
          },
        },
      },
    });
  }

  async getAttributeById(id: string, organizationId: string) {
    const attribute = await prisma.categoryAttribute.findFirst({
      where: {
        id,
        category: {
          organizationId,
        },
      },
      include: {
        category: true,
        values: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            values: true,
          },
        },
      },
    });

    if (!attribute) {
      throw new Error('Atributo no encontrado');
    }

    return attribute;
  }

  async updateAttribute(id: string, data: any, organizationId: string) {
    const attribute = await this.getAttributeById(id, organizationId);

    // Si se está actualizando el nombre, verificar que no exista otro con ese nombre en la misma categoría
    if (data.name) {
      const existing = await prisma.categoryAttribute.findFirst({
        where: {
          categoryId: attribute.categoryId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('Ya existe un atributo con ese nombre en esta categoría');
      }
    }

    return await prisma.categoryAttribute.update({
      where: { id },
      data,
      include: {
        values: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async deleteAttribute(id: string, organizationId: string) {
    await this.getAttributeById(id, organizationId);

    // Verificar si el atributo tiene valores en uso en variantes
    const valuesInUse = await prisma.liveItemAttributeValue.count({
      where: {
        attributeValue: {
          attributeId: id,
        },
      },
    });

    if (valuesInUse > 0) {
      throw new Error('No se puede eliminar el atributo porque tiene valores en uso en variantes de productos');
    }

    // Eliminar valores del atributo
    await prisma.attributeValue.deleteMany({
      where: { attributeId: id },
    });

    // Eliminar atributo
    return await prisma.categoryAttribute.delete({
      where: { id },
    });
  }

  // ==================== AttributeValue Methods ====================

  async createValue(data: any, organizationId: string) {
    // Verificar que el atributo existe y pertenece a la organización
    const attribute = await prisma.categoryAttribute.findFirst({
      where: {
        id: data.attributeId,
        category: {
          organizationId,
        },
      },
    });

    if (!attribute) {
      throw new Error('Atributo no encontrado');
    }

    // Verificar si ya existe un valor con ese nombre en el atributo
    const existing = await prisma.attributeValue.findFirst({
      where: {
        attributeId: data.attributeId,
        value: data.value,
      },
    });

    if (existing) {
      throw new Error('Ya existe un valor con ese nombre en este atributo');
    }

    return await prisma.attributeValue.create({
      data,
      include: {
        attribute: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async getValuesByAttribute(attributeId: string, organizationId: string, includeInactive: boolean = false) {
    // Verificar que el atributo existe y pertenece a la organización
    const attribute = await prisma.categoryAttribute.findFirst({
      where: {
        id: attributeId,
        category: {
          organizationId,
        },
      },
    });

    if (!attribute) {
      throw new Error('Atributo no encontrado');
    }

    const where: any = { attributeId };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    return await prisma.attributeValue.findMany({
      where,
      orderBy: { order: 'asc' },
    });
  }

  async getValueById(id: string, organizationId: string) {
    const value = await prisma.attributeValue.findFirst({
      where: {
        id,
        attribute: {
          category: {
            organizationId,
          },
        },
      },
      include: {
        attribute: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!value) {
      throw new Error('Valor no encontrado');
    }

    return value;
  }

  async updateValue(id: string, data: any, organizationId: string) {
    const value = await this.getValueById(id, organizationId);

    // Si se está actualizando el valor, verificar que no exista otro con ese valor en el mismo atributo
    if (data.value) {
      const existing = await prisma.attributeValue.findFirst({
        where: {
          attributeId: value.attributeId,
          value: data.value,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('Ya existe un valor con ese nombre en este atributo');
      }
    }

    return await prisma.attributeValue.update({
      where: { id },
      data,
    });
  }

  async deleteValue(id: string, organizationId: string) {
    await this.getValueById(id, organizationId);

    // Verificar si el valor está en uso en alguna variante
    const variantsWithValue = await prisma.liveItemAttributeValue.count({
      where: {
        attributeValueId: id,
      },
    });

    if (variantsWithValue > 0) {
      throw new Error('No se puede eliminar el valor porque está en uso en variantes de productos');
    }

    return await prisma.attributeValue.delete({
      where: { id },
    });
  }
}

export default new AttributesService();
