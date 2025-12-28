import prisma from '../../config/prisma';

export class CategoriesService {
  async createCategory(data: any, organizationId: string) {
    // Verificar si ya existe una categoría con ese nombre en la organización
    const existing = await prisma.productCategory.findFirst({
      where: {
        organizationId,
        name: data.name,
      },
    });

    if (existing) {
      throw new Error('Ya existe una categoría con ese nombre');
    }

    return await prisma.productCategory.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async getCategories(organizationId: string, includeInactive: boolean = false) {
    const where: any = { organizationId };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    return await prisma.productCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            liveItems: true,
            attributes: true,
          },
        },
      },
    });
  }

  async getCategoryById(id: string, organizationId: string) {
    const category = await prisma.productCategory.findFirst({
      where: { id, organizationId },
      include: {
        attributes: {
          orderBy: { order: 'asc' },
          include: {
            values: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        _count: {
          select: {
            liveItems: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    return category;
  }

  async updateCategory(id: string, data: any, organizationId: string) {
    await this.getCategoryById(id, organizationId);

    // Si se está actualizando el nombre, verificar que no exista otra con ese nombre
    if (data.name) {
      const existing = await prisma.productCategory.findFirst({
        where: {
          organizationId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('Ya existe una categoría con ese nombre');
      }
    }

    return await prisma.productCategory.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string, organizationId: string) {
    await this.getCategoryById(id, organizationId);

    // Verificar si la categoría está en uso en algún producto
    const productsWithCategory = await prisma.liveItem.count({
      where: {
        categoryId: id,
      },
    });

    if (productsWithCategory > 0) {
      throw new Error('No se puede eliminar la categoría porque está en uso en productos');
    }

    // Eliminar atributos y valores asociados en cascada
    const attributes = await prisma.categoryAttribute.findMany({
      where: { categoryId: id },
      select: { id: true },
    });

    for (const attr of attributes) {
      // Eliminar valores de atributos
      await prisma.attributeValue.deleteMany({
        where: { attributeId: attr.id },
      });
      // Eliminar atributo
      await prisma.categoryAttribute.delete({
        where: { id: attr.id },
      });
    }

    return await prisma.productCategory.delete({
      where: { id },
    });
  }
}

export default new CategoriesService();
