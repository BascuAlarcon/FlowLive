# FlowLive Backend – Live Shopping Platform

Backend para una plataforma SaaS de **Live Shopping** orientada a marcas, tiendas y vendedores que realizan ventas en vivo (livestream shopping) en plataformas como Instagram Live y TikTok Live.

El sistema permite gestionar ventas en tiempo real durante transmisiones en vivo, con carritos persistentes entre sesiones, gestión de items individuales, clientes, pagos, envíos y métricas.

---

## 🧱 Stack Tecnológico

- **Node.js** v18+
- **TypeScript**
- **Express.js**
- **MySQL** 8+
- **Prisma ORM** 5.22.0
- **JWT** Authentication
- **Zod** (validaciones)
- **dotenv**
- **bcrypt**

---

## 🧠 Modelo de Negocio: Live Shopping

### ¿Qué es Live Shopping?

Es una modalidad de venta donde el vendedor muestra productos **individualmente** durante una transmisión en vivo. Los clientes comentan/mencionan qué quieren comprar, y el vendedor va agregando items a sus carritos en tiempo real.

### Características Clave del Sistema

✅ **Items individuales**: Cada producto mostrado es único o tiene pocas unidades (1-3)  
✅ **Sin inventario tradicional**: No se gestiona stock de "productos" sino items individuales que están disponibles, reservados o vendidos  
✅ **Carritos persistentes**: Un cliente puede pedir items en varios lives diferentes y todo se acumula en un solo carrito hasta que pague  
✅ **Multi-organización**: Cada vendedor/marca es una organización independiente  
✅ **Categorías dinámicas**: Los atributos de productos varían según la categoría (ropa tiene talla/color, joyas tienen material/tamaño, etc.)

### Flujo de Negocio

```
1. PREPARACIÓN PRE-LIVE
   └── Vendedor crea LiveItems para mostrar
       ├── Categoría: Ropa, Joyas, Maquillaje, etc.
       ├── Atributos dinámicos: Color, Talla, Material, etc.
       ├── Precio y cantidad (típicamente 1-3 unidades)
       └── Estado: available

2. DURANTE EL LIVE
   └── Cliente "María" comenta: "Quiero la polera roja M"
       ├── Vendedor agrega item al carrito de María
       ├── LiveItem → status: reserved
       ├── Sale (carrito de María) se crea/actualiza
       └── María puede seguir pidiendo más items

3. SIGUIENTE LIVE (DÍAS DESPUÉS)
   └── María vuelve y pide más productos
       ├── Items se suman al MISMO carrito
       ├── lastLivestreamId se actualiza
       └── Todo queda pendiente hasta que pague

4. CONFIRMACIÓN Y PAGO
   └── María confirma que pagó (transferencia)
       ├── Sale → status: confirmed
       ├── Todos los LiveItems → status: sold
       ├── Se crea Payment
       └── Opcional: Se genera Shipment
```

---

## 🏗️ Arquitectura del Proyecto

```
src/
├── server.ts
├── routes.ts
├── config/
│   ├── jwt.ts
│   └── prisma.ts
├── middlewares/
│   ├── auth.middleware.ts
│   └── error-handler.middleware.ts
├── modules/
│   ├── auth/               # Login, registro, JWT
│   ├── organizations/      # Gestión de organizaciones
│   ├── users/              # Gestión de usuarios
│   ├── categories/         # Categorías de productos
│   ├── attributes/         # Atributos dinámicos
│   ├── liveitems/          # ⭐ Items individuales para vender
│   ├── customers/          # Clientes
│   ├── livestreams/        # Lives en vivo
│   ├── carts/              # ⭐ Carritos persistentes
│   ├── sales/              # Ventas confirmadas
│   ├── payments/           # Pagos
│   ├── shipments/          # Envíos
│   └── metrics/            # Analytics y dashboards
└── types/
```

Cada módulo contiene:
- `*.controller.ts` - Maneja requests HTTP
- `*.service.ts` - Lógica de negocio
- `*.routes.ts` - Definición de endpoints
- `*.validation.ts` - Validaciones con Zod

---

## 🔐 Autenticación y Autorización

### JWT Authentication

Todas las rutas (excepto `/api/auth`) requieren header:
```
Authorization: Bearer <token>
```

El token contiene:
- `userId`
- `organizationId` (organización activa)
- `role` (owner, seller, moderator, logistics)

### Middleware de Autenticación

El `authMiddleware` se aplica automáticamente y:
1. Valida el token JWT
2. Extrae `userId` y `organizationId`
3. Los inyecta en `req.userId` y `req.organizationId`
4. Rechaza acceso si el token es inválido

### Roles Soportados

| Role | Permisos |
|------|----------|
| **owner** | Control total de la organización |
| **seller** | Crear/gestionar ventas, carritos, clientes |
| **moderator** | Moderar lives, asistir en ventas |
| **logistics** | Gestionar envíos y entregas |

---

## 🗄️ Modelo de Datos Principal

### Multi-Tenancy

**IMPORTANTE**: Cada recurso está aislado por `organizationId`. Nunca se debe acceder a datos de otra organización.

### Tipos de Datos Estándar

- **IDs**: `String` con `@default(cuid())`
- **Precios**: `Decimal` con `@db.Decimal(10, 2)`
- **Timestamps**: `DateTime`
- **Enums**: Definidos en Prisma

---

## 📋 Entidades Principales

### 1️⃣ **Organization** (Organización)

Cada vendedor/marca es una organización independiente.

```prisma
model Organization {
  id         String   @id @default(cuid())
  name       String
  plan       PlanType @default(free)
  isActive   Boolean  @default(true)
  deletedAt  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

### 2️⃣ **User** (Usuario)

Usuarios del sistema (vendedores, moderadores, etc.).

```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  password    String
  name        String
  lastLoginAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

### 3️⃣ **OrganizationUser** (Relación Usuario-Organización)

Un usuario puede pertenecer a múltiples organizaciones con diferentes roles.

```prisma
model OrganizationUser {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  role           UserRole
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())

  @@unique([organizationId, userId])
}
```

**Roles**: `owner`, `seller`, `moderator`, `logistics`

---

### 4️⃣ **ProductCategory** (Categorías)

Define tipos de productos (Ropa, Joyas, Maquillaje, etc.).

```prisma
model ProductCategory {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  description    String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  liveItems  LiveItem[]
  attributes CategoryAttribute[]

  @@unique([organizationId, name])
}
```

**Ejemplos**:
- Ropa
- Joyas
- Maquillaje
- Accesorios
- Electrónicos

---

### 5️⃣ **CategoryAttribute** (Atributos por Categoría)

Define qué atributos tiene cada categoría.

```prisma
model CategoryAttribute {
  id         String        @id @default(cuid())
  categoryId String
  name       String
  type       AttributeType // select, text, number
  isRequired Boolean       @default(false)
  order      Int           @default(0)
  createdAt  DateTime      @default(now())

  category ProductCategory @relation(fields: [categoryId], references: [id])
  values   AttributeValue[]
}
```

**Tipos de Atributos**:
- `select`: Lista predefinida (ej: Color, Talla)
- `text`: Texto libre (ej: Descripción personalizada)
- `number`: Valor numérico (ej: Volumen en ml)

**Ejemplos por categoría**:
| Categoría | Atributos |
|-----------|-----------|
| Ropa | Color (select), Talla (select) |
| Joyas | Material (select), Tamaño (select) |
| Maquillaje | Tono (select), Volumen (number) |

---

### 6️⃣ **AttributeValue** (Valores de Atributos)

Valores posibles para atributos tipo `select`.

```prisma
model AttributeValue {
  id          String   @id @default(cuid())
  attributeId String
  value       String
  hexCode     String?  // Para colores
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  attribute CategoryAttribute @relation(fields: [attributeId], references: [id])
  liveItems LiveItemAttributeValue[]

  @@unique([attributeId, value])
}
```

**Ejemplos**:
- Atributo "Color" → Valores: Rojo, Azul, Negro
- Atributo "Talla" → Valores: S, M, L, XL
- Atributo "Material" → Valores: Oro, Plata, Acero

---

### 7️⃣ ⭐ **LiveItem** (Item Individual para Vender)

**Entidad central del sistema**. Representa un item individual que se mostrará en un live.

```prisma
model LiveItem {
  id             String          @id @default(cuid())
  organizationId String
  categoryId     String
  livestreamId   String?
  price          Decimal         @db.Decimal(10, 2)
  quantity       Int             @default(1)
  status         LiveItemStatus  @default(available)
  imageUrl       String?
  notes          String?         @db.Text
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  category   ProductCategory @relation(fields: [categoryId], references: [id])
  livestream Livestream?     @relation(fields: [livestreamId], references: [id])
  attributes LiveItemAttributeValue[]
  SaleItem   SaleItem[]

  @@index([organizationId])
  @@index([categoryId])
  @@index([livestreamId])
  @@index([status])
}
```

**Estados (LiveItemStatus)**:
- `available`: Disponible para vender
- `reserved`: Reservado en un carrito
- `sold`: Vendido (confirmado)

**Características**:
- Cada LiveItem es **único o tiene pocas unidades** (quantity: 1-3 típicamente)
- Los atributos son **dinámicos** según la categoría
- Puede estar asociado a un livestream específico
- No hay concepto de "stock" tradicional, solo estados

**Ejemplo**:
```json
{
  "id": "item_123",
  "categoryId": "cat_ropa",
  "price": 15000,
  "quantity": 2,
  "status": "available",
  "notes": "Polera roja talla M - 2 unidades",
  "attributes": [
    { "attributeValue": { "name": "Color", "value": "Rojo" } },
    { "attributeValue": { "name": "Talla", "value": "M" } }
  ]
}
```

---

### 8️⃣ **LiveItemAttributeValue** (Atributos del Item)

Relación entre un LiveItem y sus atributos.

```prisma
model LiveItemAttributeValue {
  id               String   @id @default(cuid())
  liveItemId       String
  attributeValueId String?  // Para type=select
  textValue        String?  // Para type=text
  numberValue      Decimal? @db.Decimal(10, 2) // Para type=number
  createdAt        DateTime @default(now())

  liveItem       LiveItem        @relation(fields: [liveItemId], references: [id])
  attributeValue AttributeValue? @relation(fields: [attributeValueId], references: [id])

  @@index([liveItemId])
  @@index([attributeValueId])
}
```

---

### 9️⃣ **Customer** (Cliente)

Clientes que compran durante los lives.

```prisma
model Customer {
  id             String    @id @default(cuid())
  organizationId String
  name           String
  username       String?   // Usuario de Instagram/TikTok
  contact        String?   // Teléfono/Email
  notes          String?   @db.Text
  lastPurchaseAt DateTime?
  deletedAt      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  Sale Sale[]

  @@index([organizationId])
  @@index([username])
}
```

---

### 🔟 **Livestream** (Transmisión en Vivo)

Representa una sesión de live shopping.

```prisma
model Livestream {
  id               String   @id @default(cuid())
  organizationId   String
  title            String
  platform         Platform
  viewerCount      Int?
  totalSalesAmount Decimal? @db.Decimal(10, 2)
  startedAt        DateTime
  endedAt          DateTime?
  createdBy        String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  LiveItem LiveItem[]

  @@index([organizationId, startedAt])
  @@index([createdBy])
}
```

**Plataformas soportadas**:
- `instagram`
- `tiktok`
- `youtube`
- `other`

---

### 1️⃣1️⃣ ⭐ **Sale** (Venta / Carrito)

**Entidad dual**: puede ser un carrito pendiente (`reserved`) o una venta confirmada (`confirmed`).

```prisma
model Sale {
  id               String     @id @default(cuid())
  organizationId   String
  livestreamId     String?    // Nullable: carrito puede cambiar entre lives
  customerId       String
  sellerId         String
  status           SaleStatus @default(reserved)
  totalAmount      Decimal    @db.Decimal(10, 2)
  discountAmount   Decimal    @db.Decimal(10, 2) @default(0)
  notes            String?    @db.Text
  lastLivestreamId String?    // Último live donde se modificó
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  SaleItem SaleItem[]
  Payment  Payment[]
  Customer Customer @relation(fields: [customerId], references: [id])

  @@index([organizationId, status])
  @@index([livestreamId])
  @@index([customerId, status])
  @@index([status, updatedAt])
}
```

**Estados (SaleStatus)**:
- `reserved`: Carrito pendiente (puede editarse)
- `confirmed`: Venta confirmada (no se puede editar)
- `cancelled`: Cancelada (items liberados)

### 🛒 **CARRITOS PERSISTENTES**

#### Reglas de Negocio Clave

✅ **Un cliente puede tener SOLO 1 carrito activo** (`status=reserved`) a la vez  
✅ **El carrito persiste entre diferentes livestreams**  
✅ **Items de varios lives se acumulan en el mismo carrito**  
✅ **El carrito puede editarse hasta que se confirme**

#### Ciclo de Vida

```
1. CREAR CARRITO (reserved)
   └── Cliente pide items en Live 1
       ├── Sale.status = reserved
       ├── Sale.livestreamId = live_1
       └── LiveItems → status: reserved

2. AGREGAR MÁS EN OTRO LIVE (reserved)
   └── Cliente vuelve días después en Live 2
       ├── Se actualiza el MISMO carrito
       ├── Sale.lastLivestreamId = live_2
       └── Se agregan más SaleItems

3. CONFIRMAR CARRITO (confirmed)
   └── Cliente confirma y paga
       ├── Sale.status = confirmed
       ├── Todos los LiveItems → status: sold
       └── Ya no se puede editar
```

---

### 1️⃣2️⃣ **SaleItem** (Items de la Venta)

Items incluidos en una venta/carrito.

```prisma
model SaleItem {
  id         String   @id @default(cuid())
  saleId     String
  liveItemId String
  quantity   Int
  unitPrice  Decimal  @db.Decimal(10, 2)
  totalPrice Decimal  @db.Decimal(10, 2)
  createdAt  DateTime @default(now())

  Sale     Sale     @relation(fields: [saleId], references: [id])
  LiveItem LiveItem @relation(fields: [liveItemId], references: [id])

  @@index([saleId])
  @@index([liveItemId])
}
```

---

### 1️⃣3️⃣ **Payment** (Pago)

Pagos asociados a ventas.

```prisma
model Payment {
  id        String        @id @default(cuid())
  saleId    String
  method    PaymentMethod
  amount    Decimal       @db.Decimal(10, 2)
  status    PaymentStatus @default(pending)
  reference String?
  paidAt    DateTime?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  Sale Sale @relation(fields: [saleId], references: [id])

  @@index([saleId])
  @@index([status])
}
```

**Métodos de pago**:
- `transfer`: Transferencia bancaria
- `cash`: Efectivo
- `mercadopago`: MercadoPago
- `paypal`: PayPal

**Estados**:
- `pending`: Pendiente
- `paid`: Pagado
- `failed`: Fallido

---

### 1️⃣4️⃣ **Shipment** (Envío)

Gestión de envíos.

```prisma
model Shipment {
  id           String         @id @default(cuid())
  saleId       String         @unique
  type         ShipmentType
  status       ShipmentStatus @default(pending)
  address      String?        @db.Text
  trackingCode String?
  shippedAt    DateTime?
  deliveredAt  DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@index([status])
  @@index([saleId])
}
```

**Tipos**:
- `delivery`: Envío a domicilio
- `pickup`: Retiro en tienda

**Estados**:
- `pending`: Pendiente
- `preparing`: Preparando
- `shipped`: Enviado
- `delivered`: Entregado

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar usuario y organización |
| POST | `/auth/login` | Login (retorna JWT) |

---

### LiveItems (⭐ Core del Sistema)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/liveitems` | Listar LiveItems (con filtros) | ✅ |
| GET | `/liveitems/stats` | Estadísticas de items | ✅ |
| GET | `/liveitems/:id` | Ver detalle de un item | ✅ |
| POST | `/liveitems` | Crear nuevo LiveItem | ✅ |
| PATCH | `/liveitems/:id` | Actualizar item | ✅ |
| DELETE | `/liveitems/:id` | Eliminar item | ✅ |
| POST | `/liveitems/:id/attributes` | Agregar atributo | ✅ |
| DELETE | `/liveitems/:id/attributes/:attrId` | Quitar atributo | ✅ |

#### Crear LiveItem
```http
POST /api/liveitems
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryId": "cat_ropa_123",
  "livestreamId": "live_456",
  "price": 15000,
  "quantity": 2,
  "imageUrl": "https://...",
  "notes": "Polera roja M",
  "attributes": [
    { "attributeValueId": "val_color_rojo" },
    { "attributeValueId": "val_talla_m" }
  ]
}
```

#### Listar LiveItems con Filtros
```http
GET /api/liveitems?status=available&livestreamId=live_456&page=1&limit=20
Authorization: Bearer <token>
```

**Filtros disponibles**:
- `categoryId`: Filtrar por categoría
- `livestreamId`: Items de un live específico
- `status`: `available`, `reserved`, `sold`
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 20)

---

### Carritos (⭐ Gestión de Carritos Persistentes)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/carts` | Listar carritos activos | ✅ |
| GET | `/carts/customer/:customerId` | Ver carrito de un cliente | ✅ |
| POST | `/carts/items` | Agregar item al carrito | ✅ |
| DELETE | `/carts/:cartId/items/:itemId` | Quitar item del carrito | ✅ |
| POST | `/carts/:cartId/confirm` | Confirmar carrito (cerrar venta) | ✅ |
| POST | `/carts/:cartId/cancel` | Cancelar carrito (liberar items) | ✅ |

#### Agregar Item al Carrito
```http
POST /api/carts/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer_123",
  "liveItemId": "item_456",
  "quantity": 1,
  "livestreamId": "live_789"
}
```

**Comportamiento**:
- Si el cliente NO tiene carrito activo → se crea uno nuevo
- Si el cliente YA tiene carrito activo → se agrega al mismo
- El `liveItemId` pasa a estado `reserved`

#### Confirmar Carrito
```http
POST /api/carts/:cartId/confirm
Authorization: Bearer <token>
```

**Efecto**:
- Sale → `status: confirmed`
- Todos los LiveItems → `status: sold`
- Ya no se puede editar

---

### Categorías

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/categories` | Listar categorías | ✅ |
| GET | `/categories/:id` | Ver categoría con atributos | ✅ |
| POST | `/categories` | Crear categoría | ✅ |
| PATCH | `/categories/:id` | Actualizar categoría | ✅ |
| DELETE | `/categories/:id` | Eliminar categoría | ✅ |

---

### Atributos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/categories/:id/attributes` | Crear atributo | ✅ |
| PATCH | `/attributes/:id` | Actualizar atributo | ✅ |
| DELETE | `/attributes/:id` | Eliminar atributo | ✅ |
| POST | `/attributes/:id/values` | Agregar valor | ✅ |
| PATCH | `/attributes/values/:id` | Actualizar valor | ✅ |
| DELETE | `/attributes/values/:id` | Eliminar valor | ✅ |

---

### Clientes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/customers` | Listar clientes | ✅ |
| GET | `/customers/:id` | Ver cliente | ✅ |
| POST | `/customers` | Crear cliente | ✅ |
| PATCH | `/customers/:id` | Actualizar cliente | ✅ |
| DELETE | `/customers/:id` | Eliminar cliente | ✅ |

---

### Livestreams

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/livestreams` | Listar lives | ✅ |
| GET | `/livestreams/:id` | Ver live | ✅ |
| POST | `/livestreams` | Crear live | ✅ |
| PATCH | `/livestreams/:id` | Actualizar live | ✅ |
| POST | `/livestreams/:id/end` | Finalizar live | ✅ |

---

### Ventas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/sales` | Listar ventas | ✅ |
| GET | `/sales/:id` | Ver detalle de venta | ✅ |
| POST | `/sales` | Crear venta manual | ✅ |
| PATCH | `/sales/:id` | Actualizar venta | ✅ |
| POST | `/sales/:id/cancel` | Cancelar venta | ✅ |

---

### Métricas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/metrics/dashboard` | Métricas generales | ✅ |
| GET | `/metrics/sales` | Métricas de ventas | ✅ |
| GET | `/metrics/livestreams/:id` | Métricas de un live | ✅ |

---

## 🚀 Instalación y Setup

### Prerequisitos

- Node.js v18+
- MySQL 8+
- npm o yarn

### 1. Clonar e Instalar

```bash
git clone <repo-url>
cd FlowLive
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env`:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/flowlive"

# JWT
JWT_SECRET="tu-secret-key-super-seguro"

# Server
PORT=3000
FRONTEND_URL="http://localhost:4200"
```

### 3. Migrar Base de Datos

```bash
npx prisma migrate dev
```

### 4. Ejecutar Seed (Datos de Prueba)

```bash
npx ts-node prisma/seed.ts
```

El seed crea:
- 1 Categoría (Ropa)
- 2 Atributos (Color, Talla)
- 7 Valores de atributos
- 8 LiveItems de ejemplo
- 1 Cliente
- 1 Livestream
- 1 Venta confirmada

### 5. Iniciar Servidor

```bash
# Compilar
npm run build

# Ejecutar
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## 🧪 Testing con Datos de Ejemplo

### 1. Registrar Usuario y Organización

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "seller@example.com",
  "password": "password123",
  "name": "Juan Vendedor",
  "organizationName": "Mi Tienda Live"
}
```

### 2. Login

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "seller@example.com",
  "password": "password123"
}
```

Respuesta:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### 3. Listar LiveItems

```http
GET http://localhost:3000/api/liveitems?status=available
Authorization: Bearer <token>
```

### 4. Agregar Item a Carrito de Cliente

```http
POST http://localhost:3000/api/carts/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "<customer_id>",
  "liveItemId": "<item_id>",
  "quantity": 1
}
```

---

## 📊 Flujo Completo de Venta en Live

### Preparación (Pre-Live)

1. Vendedor crea categorías y atributos
2. Vendedor crea LiveItems para el live de hoy
3. Vendedor crea el Livestream

### Durante el Live

1. Cliente comenta "quiero X"
2. Vendedor agrega item al carrito del cliente
3. LiveItem pasa a `reserved`
4. Se repite para todos los clientes

### Post-Live

1. Vendedor contacta clientes para confirmar pago
2. Cliente paga (transferencia/efectivo/etc)
3. Vendedor marca carrito como `confirmed`
4. Sistema marca todos los items como `sold`

### Días Después (Otro Live)

1. Mismo cliente vuelve a pedir items
2. Vendedor agrega al MISMO carrito
3. Cliente paga todo junto cuando esté listo

---

## 🔄 Migraciones Aplicadas

### Migración más reciente
```
20251227132112_refactor_to_live_items
```

**Cambios principales**:
- ❌ Eliminado: `Product`, `ProductVariant`, `StockMovement`
- ✅ Creado: `LiveItem`, `LiveItemAttributeValue`
- ✅ Actualizado: `SaleItem` ahora referencia `LiveItem`
- ✅ Nuevo enum: `LiveItemStatus` (available, reserved, sold)

---

## 📝 Convenciones y Best Practices

### Naming Conventions

- **Tablas**: PascalCase singular (ej: `LiveItem`)
- **Campos**: camelCase (ej: `organizationId`)
- **Enums**: PascalCase (ej: `LiveItemStatus`)
- **Rutas**: kebab-case (ej: `/live-items`)

### Validaciones con Zod

Todas las entradas de API se validan con Zod:

```typescript
const createLiveItemSchema = z.object({
  categoryId: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  // ...
});
```

### Error Handling

Errores retornan formato estándar:

```json
{
  "error": "Mensaje de error descriptivo"
}
```

---

## 🛠️ Desarrollo

### Comandos Útiles

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor
npm start

# Generar Prisma Client
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Ver base de datos en Prisma Studio
npx prisma studio

# Ejecutar seed
npx ts-node prisma/seed.ts
```

---

## 📞 Soporte

Para el equipo de frontend, este README contiene toda la información necesaria sobre:
- Estructura de datos
- Endpoints disponibles
- Flujos de negocio
- Ejemplos de uso

¿Preguntas? Contactar al equipo de backend.

---

## 📄 Licencia

Privado - Todos los derechos reservados
