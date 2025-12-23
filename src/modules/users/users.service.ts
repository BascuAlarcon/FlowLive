import bcrypt from 'bcrypt';
import prisma from '../../config/prisma';
import { CreateUserDTO, UpdateUserDTO, UpdateUserRoleDTO, AddUserToOrganizationDTO } from './users.validation';

export class UserService {
  private readonly SALT_ROUNDS = 10;

  // Crear un usuario y asociarlo a una organización
  async create(data: CreateUserDTO) {
    // Verificar que la organización existe
    const organization = await prisma.organization.findFirst({
      where: {
        id: data.organizationId,
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new Error('Organización no encontrada');
    }

    // Verificar que el email no esté en uso
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('El email ya está en uso');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Crear usuario y relación con organización en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
        },
      });

      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: data.organizationId,
          role: data.role,
        },
      });

      return user;
    });

    // Eliminar password de la respuesta
    const { password, ...userWithoutPassword } = result;
    return userWithoutPassword;
  }

  // Obtener todos los usuarios
  async findAll() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  // Obtener un usuario por ID
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  // Obtener usuario con sus organizaciones
  async findByIdWithOrganizations(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener organizaciones del usuario
    const organizations = await prisma.organizationUser.findMany({
      where: {
        userId: id,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            plan: true,
            isActive: true,
          },
        },
      },
    });

    return {
      ...user,
      organizations: organizations.map((ou) => ({
        ...ou.organization,
        role: ou.role,
      })),
    };
  }

  // Obtener usuarios de una organización
  async findByOrganization(organizationId: string) {
    const orgUsers = await prisma.organizationUser.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return orgUsers.map((ou) => ({
      ...ou.user,
      role: ou.role,
    }));
  }

  // Actualizar un usuario
  async update(id: string, data: UpdateUserDTO) {
    // Verificar que existe
    await this.findById(id);

    // Si se actualiza el email, verificar que no esté en uso
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new Error('El email ya está en uso');
      }
    }

    // Si se actualiza la contraseña, hashearla
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, this.SALT_ROUNDS);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // Eliminar un usuario (hard delete)
  async delete(id: string) {
    // Verificar que existe
    await this.findById(id);

    // Eliminar relaciones con organizaciones primero
    await prisma.organizationUser.deleteMany({
      where: { userId: id },
    });

    // Eliminar usuario
    await prisma.user.delete({
      where: { id },
    });

    return { message: 'Usuario eliminado exitosamente' };
  }

  // Agregar usuario a una organización
  async addToOrganization(data: AddUserToOrganizationDTO) {
    // Verificar que el usuario existe
    await this.findById(data.userId);

    // Verificar que la organización existe
    const organization = await prisma.organization.findFirst({
      where: {
        id: data.organizationId,
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new Error('Organización no encontrada');
    }

    // Verificar si ya existe la relación
    const existing = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: data.organizationId,
          userId: data.userId,
        },
      },
    });

    if (existing) {
      throw new Error('El usuario ya pertenece a esta organización');
    }

    // Crear relación
    const orgUser = await prisma.organizationUser.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role,
      },
    });

    return orgUser;
  }

  // Actualizar rol de usuario en organización
  async updateRole(userId: string, data: UpdateUserRoleDTO) {
    // Verificar que existe la relación
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: data.organizationId,
          userId,
        },
      },
    });

    if (!orgUser) {
      throw new Error('El usuario no pertenece a esta organización');
    }

    // Actualizar rol
    const updated = await prisma.organizationUser.update({
      where: {
        organizationId_userId: {
          organizationId: data.organizationId,
          userId,
        },
      },
      data: {
        role: data.role,
      },
    });

    return updated;
  }

  // Remover usuario de una organización
  async removeFromOrganization(userId: string, organizationId: string) {
    // Verificar que existe la relación
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!orgUser) {
      throw new Error('El usuario no pertenece a esta organización');
    }

    // Eliminar relación
    await prisma.organizationUser.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    return { message: 'Usuario removido de la organización exitosamente' };
  }
}

export default new UserService();
