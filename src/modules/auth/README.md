# Módulo de Autenticación

Este módulo implementa el sistema de autenticación JWT para FlowLive.

## Endpoints

### POST /api/auth/register
Registra un nuevo usuario y crea su organización (plan free por defecto).

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "name": "Nombre del Usuario",
  "organizationName": "Mi Organización"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx123456",
      "email": "usuario@ejemplo.com",
      "name": "Nombre del Usuario",
      "organizations": [
        {
          "id": "clx789012",
          "name": "Mi Organización",
          "plan": "free",
          "role": "owner"
        }
      ]
    }
  }
}
```

---

### POST /api/auth/login
Inicia sesión con un usuario existente.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx123456",
      "email": "usuario@ejemplo.com",
      "name": "Nombre del Usuario",
      "organizations": [
        {
          "id": "clx789012",
          "name": "Mi Organización",
          "plan": "free",
          "role": "owner"
        }
      ]
    }
  }
}
```

---

### GET /api/auth/me
Obtiene la información del usuario autenticado actual.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "email": "usuario@ejemplo.com",
    "name": "Nombre del Usuario",
    "organizations": [
      {
        "id": "clx789012",
        "name": "Mi Organización",
        "plan": "free",
        "role": "owner",
        "isActive": true
      }
    ]
  }
}
```

---

## Middlewares

### authMiddleware
Middleware que verifica que el token JWT sea válido y extrae la información del usuario.

**Uso:**
```typescript
import { authMiddleware } from './modules/auth/auth.middleware';

router.get('/ruta-protegida', authMiddleware, controller.metodo);
```

Agrega las siguientes propiedades a `req`:
- `req.userId` - ID del usuario
- `req.userEmail` - Email del usuario
- `req.organizationId` - ID de la organización activa
- `req.userRole` - Rol del usuario en la organización

---

### organizationContextMiddleware
Middleware que verifica que el usuario tenga acceso a una organización.

**Uso:**
```typescript
import { authMiddleware, organizationContextMiddleware } from './modules/auth/auth.middleware';

router.get(
  '/ruta-protegida', 
  authMiddleware,
  organizationContextMiddleware,
  controller.metodo
);
```

---

### roleMiddleware
Middleware que verifica que el usuario tenga uno de los roles especificados.

**Uso:**
```typescript
import { authMiddleware, roleMiddleware } from './modules/auth/auth.middleware';

// Solo permite owners y sellers
router.post(
  '/ventas', 
  authMiddleware,
  roleMiddleware('owner', 'seller'),
  controller.crearVenta
);
```

---

## Flujo de Autenticación

1. **Registro:**
   - Usuario crea cuenta con email, password, nombre y nombre de organización
   - Se crea el usuario, la organización (plan free) y la relación OrganizationUser con role 'owner'
   - Se genera un JWT con la información del usuario
   - Se retorna el token y los datos del usuario

2. **Login:**
   - Usuario proporciona email y password
   - Se verifica que el email exista y la contraseña sea correcta
   - Se actualiza `lastLoginAt`
   - Se genera un JWT con la información del usuario y su primera organización activa
   - Se retorna el token y los datos del usuario

3. **Rutas protegidas:**
   - El cliente debe enviar el token en el header: `Authorization: Bearer <token>`
   - El middleware `authMiddleware` verifica el token y extrae la información
   - Los controladores pueden acceder a `req.userId`, `req.organizationId`, etc.

---

## Seguridad

- Las contraseñas se hashean con bcrypt (10 salt rounds)
- Los tokens JWT expiran según `JWT_EXPIRES_IN` (default: 7 días)
- Los tokens incluyen: userId, email, organizationId y role
- Las contraseñas nunca se retornan en las respuestas

---

## Variables de Entorno

```env
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**IMPORTANTE:** Cambiar `JWT_SECRET` en producción por una clave segura.

---

## Errores Comunes

### 401 Unauthorized
- Token no proporcionado
- Token inválido o expirado
- Formato de token incorrecto

### 403 Forbidden
- Usuario no tiene el rol requerido
- Usuario no tiene acceso a la organización

### 400 Bad Request
- Datos de validación incorrectos (email inválido, contraseña muy corta, etc.)
- Email ya está en uso
- Credenciales inválidas
