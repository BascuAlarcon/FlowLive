import prisma from '../../config/prisma';
import { CreateOrganizationDTO, UpdateOrganizationDTO } from './organizations.validation';

export class OrganizationService {
  // Crear una organización
  async create(data: CreateOrganizationDTO) {
    return await prisma.organization.create({
      data: {
        name: data.name,
        plan: data.plan || 'free',
      },
    });
  }

  // Obtener todas las organizaciones (con soft delete)
  async findAll() {
    return await prisma.organization.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Obtener una organización por ID
  async findById(id: string) {
    const organization = await prisma.organization.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new Error('Organización no encontrada');
    }

    return organization;
  }

  // Actualizar una organización
  async update(id: string, data: UpdateOrganizationDTO) {
    // Verificar que existe
    await this.findById(id);

    return await prisma.organization.update({
      where: { id },
      data,
    });
  }

  // Soft delete de una organización
  async delete(id: string) {
    // Verificar que existe
    await this.findById(id);

    return await prisma.organization.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  // Activar/desactivar una organización
  async toggleActive(id: string, isActive: boolean) {
    // Verificar que existe
    await this.findById(id);

    return await prisma.organization.update({
      where: { id },
      data: {
        isActive,
      },
    });
  }
}

export default new OrganizationService();
