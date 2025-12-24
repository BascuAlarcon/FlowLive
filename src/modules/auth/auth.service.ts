import bcrypt from 'bcrypt';
import prisma from '../../config/prisma';
import { LoginDTO, RegisterDTO } from './auth.validation';
import { generateToken } from '../../config/jwt';

export class AuthService {
  private readonly SALT_ROUNDS = 10;

  // Login de usuario
  async login(data: LoginDTO) {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        organizations: {
          where: {
            isActive: true,
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                plan: true,
                isActive: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Filtrar solo organizaciones activas y no eliminadas
    const activeOrganizations = user.organizations.filter(
      (org) => org.isActive && org.organization.isActive && !org.organization.deletedAt
    );

    if (activeOrganizations.length === 0) {
      throw new Error('El usuario no tiene organizaciones activas');
    }

    // Usar la primera organización activa como default
    const defaultOrg = activeOrganizations[0];

    // Generar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      organizationId: defaultOrg.organization.id,
      role: defaultOrg.role,
    });

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Retornar datos del usuario sin la contraseña
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: {
        ...userWithoutPassword,
        organizations: activeOrganizations.map((org) => ({
          id: org.organization.id,
          name: org.organization.name,
          plan: org.organization.plan,
          role: org.role,
        })),
      },
    };
  }

  // Registro de nuevo usuario con su organización
  async register(data: RegisterDTO) {
    // Verificar que el email no esté en uso
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('El email ya está en uso');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Crear usuario y organización en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear organización
      const organization = await tx.organization.create({
        data: {
          name: data.organizationName,
          plan: 'free', // Plan por defecto
          isActive: true,
        },
      });

      // Crear usuario
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
        },
      });

      // Asociar usuario a organización como owner
      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'owner',
        },
      });

      return { user, organization };
    });

    // Generar token JWT
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
      role: 'owner',
    });

    // Retornar datos sin la contraseña
    const { password: _, ...userWithoutPassword } = result.user;

    return {
      token,
      user: {
        ...userWithoutPassword,
        organizations: [
          {
            id: result.organization.id,
            name: result.organization.name,
            plan: result.organization.plan,
            role: 'owner',
          },
        ],
      },
    };
  }

  // Verificar usuario por ID (útil para middleware)
  async findById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          where: {
            isActive: true,
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                plan: true,
                isActive: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Retornar datos sin la contraseña
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

const authService = new AuthService();
export default authService;
