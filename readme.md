# Live Commerce SaaS – Backend

Backend para una plataforma SaaS orientada a marcas, tiendas y vendedores que realizan ventas en vivo (livestream shopping) en plataformas como Instagram Live y TikTok Live.

El sistema permite gestionar ventas en tiempo real, clientes, productos, pagos, envíos, métricas y múltiples usuarios por organización.

---

## 🧱 Stack Tecnológico

- Node.js (v18+)
- TypeScript
- Express.js
- MySQL 8+
- Prisma ORM
- JWT Authentication
- Zod (validaciones)
- dotenv
- bcrypt

---

## 🧠 Contexto del Negocio (IMPORTANTE)

Esta aplicación es **multi-organización (multi-tenant)**:

- Cada usuario pertenece a una o más organizaciones
- Todo dato de negocio (ventas, productos, clientes, livestreams) SIEMPRE está asociado a una `organization_id`
- No debe existir acceso cruzado entre organizaciones

El foco principal es **ventas durante livestreams**, por lo que el sistema debe priorizar:
- rapidez
- consistencia
- simplicidad en creación de ventas
- cambios rápidos de estado

---

## 🏗️ Arquitectura del Proyecto

```
src/
├── app.ts
├── server.ts
├── config/
│   ├── env.ts
│   └── prisma.ts
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── users/
│   ├── products/
│   ├── customers/
│   ├── livestreams/
│   ├── sales/
│   ├── payments/
│   ├── shipments/
│   └── metrics/
├── middlewares/
├── routes.ts
├── utils/
└── types/
```

Cada módulo debe contener:
- controller
- service
- routes
- validations (Zod)
- prisma queries encapsuladas

---

## 🔐 Autenticación y Autorización

- Autenticación con JWT
- Middleware `authMiddleware` para proteger rutas
- Middleware `organizationContextMiddleware` que:
  - obtiene `organization_id` desde JWT
  - lo inyecta en `req.organizationId`
  - evita acceso a recursos de otra organización

Roles soportados:
- owner
- seller
- moderator
- logistics

---

## 🗄️ Modelo de Datos (Prisma)

Usar Prisma ORM con MySQL.

### Tipos de Datos Estándar
- **IDs**: `String` (cuid)
- **Precios/Montos**: `Decimal` (precisión: 10,2)
- **Timestamps**: `DateTime`
- **Enums**: Prisma enums (ver sección Enums)

### Estrategia de Borrado
- **Soft Delete**: Se usa `deletedAt DateTime?` en:
  - organizations
  - products
  - product_variants
  - customers
- **Hard Delete**: En tablas transaccionales (sales, payments, etc.)

### Entidades Principales

#### Core Business
- User
- Organization
- OrganizationUser
- Product
- ProductVariant
- StockMovement
- Customer
- Livestream
- Sale
- SaleItem
- Payment
- Shipment

#### Utilidades
- ActivityLog
- MessageTemplate
- MessageLog

Todas las tablas deben:
- tener `createdAt`
- usar relaciones explícitas
- definir índices para `organization_id`

---

## 📋 TABLAS COMPLETAS

### organizations
```typescript
id                String      @id @default(cuid())
name              String
plan              PlanType    @default(free)
isActive          Boolean     @default(true)
deletedAt         DateTime?
createdAt         DateTime    @default(now())
updatedAt         DateTime    @updatedAt

@@index([isActive])
```

### users
```typescript
id                String      @id @default(cuid())
email             String      @unique
password          String
name              String
lastLoginAt       DateTime?
createdAt         DateTime    @default(now())
updatedAt         DateTime    @updatedAt

@@index([email])
```

### organization_users
```typescript
id                String      @id @default(cuid())
organizationId    String
userId            String
role              UserRole
isActive          Boolean     @default(true)
createdAt         DateTime    @default(now())

@@unique([organizationId, userId])
@@index([userId])
@@index([organizationId, isActive])
```

### products
```typescript
id                String      @id @default(cuid())
organizationId    String
name              String
description       String?     @db.Text
basePrice         Decimal     @db.Decimal(10, 2)
sku               String
imageUrl          String?
isActive          Boolean     @default(true)
deletedAt         DateTime?
createdAt         DateTime    @default(now())
updatedAt         DateTime    @updatedAt

@@unique([organizationId, sku])
@@index([organizationId, isActive])
@@index([sku])
```

### product_variants
```typescript
id                String      @id @default(cuid())
productId         String
organizationId    String
name              String      // ej: "Talla M - Rojo"
sku               String
price             Decimal     @db.Decimal(10, 2)
stockQuantity     Int         @default(0)
isActive          Boolean     @default(true)
deletedAt         DateTime?
createdAt         DateTime    @default(now())
updatedAt         DateTime    @updatedAt

@@unique([organizationId, sku])
@@index([productId])
@@index([organizationId, isActive])
```

**IMPORTANTE - Lógica de Variantes:**
- Si un producto NO tiene variantes, se crea una variante por defecto con el mismo nombre/precio
- El stock SIEMPRE se maneja a nivel de variante
- `sale_items` SIEMPRE referencia a `product_variant_id`
- `product_id` en `sale_items` es solo para trazabilidad

### stock_movements
```typescript
id                String              @id @default(cuid())
productVariantId  String
organizationId    String
type              StockMovementType
quantity          Int                 // positivo o negativo
referenceType     String?             // "sale", "adjustment"
referenceId       String?
notes             String?
createdAt         DateTime            @default(now())

@@index([productVariantId])
@@index([organizationId, createdAt])
@@index([referenceType, referenceId])
```

**Cálculo de Stock:**
- Stock actual = SUM(quantity) de todos los movimientos de la variante
- NO se guarda stock como verdad principal (solo en `product_variants.stockQuantity` como caché)

### customers
```typescript
id                String      @id @default(cuid())
organizationId    String
name              String
username          String?     // Instagram/TikTok (nullable)
contact           String?     // Teléfono/email
notes             String?     @db.Text
lastPurchaseAt    DateTime?
deletedAt         DateTime?
createdAt         DateTime    @default(now())
updatedAt         DateTime    @updatedAt

@@index([organizationId])
@@index([username])
@@index([organizationId, lastPurchaseAt])
```

### livestreams
```typescript
id                String      @id @default(cuid())
organizationId    String
title             String
platform          Platform
viewerCount       Int?
totalSalesAmount  Decimal?    @db.Decimal(10, 2)
startedAt         DateTime
endedAt           DateTime?
createdBy         String      // userId
createdAt         DateTime    @default(now())
updatedAt         DateTime    @updatedAt

@@index([organizationId, startedAt])
@@index([createdBy])
```

### sales
```typescript
id                String      @id @default(cuid())
organizationId    String
livestreamId      String?
customerId        String
sellerId          String      // userId
status            SaleStatus  @default(reserved)
totalAmount       Decimal     @db.Decimal(10, 2)
discountAmount    Decimal     @db.Decimal(10, 2) @default(0)
notes             String?     @db.Text
createdAt         DateTime    @default(now())
updatedAt         DateTime    @updatedAt

@@index([organizationId, status])
@@index([livestreamId])
@@index([customerId])
@@index([sellerId])
@@index([createdAt])
```

**Reglas de Negocio:**
- `totalAmount` es la suma de `sale_items.total_price` - `discountAmount`
- Al crear venta en estado `reserved`: se genera `stock_movement` tipo `reserve`
- Al confirmar (`confirmed`): se genera `stock_movement` tipo `sale`
- Al cancelar: se genera `stock_movement` tipo `cancel` (revierte reserva)
- NO se puede cancelar si `payments` tiene al menos un `paid`

### sale_items
```typescript
id                String      @id @default(cuid())
saleId            String
productId         String      // Solo referencia
productVariantId  String      // SIEMPRE requerido
quantity          Int
unitPrice         Decimal     @db.Decimal(10, 2)
totalPrice        Decimal     @db.Decimal(10, 2)
createdAt         DateTime    @default(now())

@@index([saleId])
@@index([productVariantId])
```

### payments
```typescript
id                String         @id @default(cuid())
saleId            String
method            PaymentMethod
amount            Decimal        @db.Decimal(10, 2)
status            PaymentStatus  @default(pending)
reference         String?        // Nro transferencia, ID mercadopago
paidAt            DateTime?
createdAt         DateTime       @default(now())
updatedAt         DateTime       @updatedAt

@@index([saleId])
@@index([status])
```

**Reglas de Negocio:**
- Una venta puede tener múltiples pagos parciales
- Cuando SUM(payments.amount WHERE status=paid) >= sale.totalAmount:
  - La venta pasa automáticamente a `confirmed` (si estaba en `reserved`)

### shipments
```typescript
id                String         @id @default(cuid())
saleId            String         @unique
type              ShipmentType
status            ShipmentStatus @default(pending)
address           String?        @db.Text
trackingCode      String?
shippedAt         DateTime?
deliveredAt       DateTime?
createdAt         DateTime       @default(now())
updatedAt         DateTime       @updatedAt

@@index([status])
@@index([saleId])
```

**Reglas:**
- Relación 1:1 con `sale`
- Si `type=pickup`, `address` puede ser null
- Se crea automáticamente al confirmar venta (opcional según config)

### activity_log
```typescript
id                String      @id @default(cuid())
organizationId    String
userId            String?     // Puede ser null (acciones del sistema)
entityType        String      // "sale", "product", "customer"
entityId          String
action            String      // "created", "updated", "cancelled"
metadata          Json?       // Datos adicionales
createdAt         DateTime    @default(now())

@@index([organizationId, entityType, entityId])
@@index([createdAt])
```

**Propósito:** Auditoría completa de acciones

### message_templates
```typescript
id                String         @id @default(cuid())
organizationId    String
type              MessageType
content           String         @db.Text
isActive          Boolean        @default(true)
createdAt         DateTime       @default(now())
updatedAt         DateTime       @updatedAt

@@unique([organizationId, type])
@@index([organizationId, isActive])
```

### messages_log
```typescript
id                String      @id @default(cuid())
customerId        String
saleId            String?
channel           String      // "whatsapp", "instagram"
content           String      @db.Text
status            String      @default("sent") // sent, failed
sentAt            DateTime    @default(now())

@@index([customerId])
@@index([saleId])
@@index([sentAt])
```

---

## 🎨 ENUMS (Prisma)

```prisma
enum PlanType {
  free
  pro
  brand
}

enum UserRole {
  owner
  seller
  moderator
  logistics
}

enum Platform {
  instagram
  tiktok
  youtube
  other
}

enum SaleStatus {
  reserved
  confirmed
  cancelled
}

enum PaymentStatus {
  pending
  paid
  failed
}

enum PaymentMethod {
  transfer
  cash
  mercadopago
  paypal
}

enum ShipmentStatus {
  pending
  preparing
  shipped
  delivered
}

enum ShipmentType {
  delivery
  pickup
}

enum StockMovementType {
  reserve    // Al crear venta
  sale       // Al confirmar venta
  cancel     // Al cancelar venta
  adjustment // Ajuste manual
  return     // Devolución
}

enum MessageType {
  order_confirmed
  payment_reminder
  shipped
  custom
}
```

---

## 🛒 Ventas (Core del sistema)

Una venta:
- pertenece a una organización
- puede estar asociada a un livestream (nullable)
- DEBE tener un cliente (customer_id requerido)
- DEBE tener un vendedor (seller_id requerido)
- tiene uno o más productos (via sale_items)
- puede tener múltiples pagos parciales
- tiene 0 o 1 envío

### Estados de venta:
- `reserved`: Venta creada, stock reservado
- `confirmed`: Pagada/confirmada, stock descontado
- `cancelled`: Cancelada, stock liberado

### Estados de pago:
- `pending`: Esperando pago
- `paid`: Pagado
- `failed`: Falló (ej: transferencia rechazada)

### Estados de envío:
- `pending`: Sin preparar
- `preparing`: En preparación
- `shipped`: Enviado
- `delivered`: Entregado

---

## 📺 Livestreams

Los livestreams sirven para:
- agrupar ventas de una transmisión
- calcular métricas por transmisión
- operar el "Modo Live"

Un livestream:
- pertenece a una organización
- tiene plataforma (instagram, tiktok, youtube, other)
- tiene `startedAt` y `endedAt` (nullable mientras esté en vivo)
- puede tener `viewerCount` y `totalSalesAmount` (calculados o manuales)

---

## 📊 Métricas

Las métricas NO se guardan como verdad principal (excepto `daily_sales_summary` para performance).

Se calculan en tiempo real desde:
- sales
- payments
- livestreams
- sale_items

### Ejemplos:
- Total vendido por mes
- Ventas pagadas vs pendientes
- Total por livestream
- Ticket promedio
- Top productos

### daily_sales_summary (solo caché)
```typescript
id                String      @id @default(cuid())
organizationId    String
date              DateTime    @db.Date
totalSales        Int
totalRevenue      Decimal     @db.Decimal(10, 2)
totalPaid         Decimal     @db.Decimal(10, 2)
createdAt         DateTime    @default(now())

@@unique([organizationId, date])
@@index([organizationId, date])
```

**Propósito:** Performance en dashboards. Se regenera diariamente.

---

## 🔄 Flujo de una Venta

1. **Crear Venta** (status: `reserved`)
   - Validar stock disponible
   - Crear `sale` + `sale_items`
   - Crear `stock_movements` tipo `reserve` (cantidad negativa)
   - Crear `activity_log`

2. **Registrar Pago**
   - Crear `payment`
   - Si total pagado >= total venta:
     - Cambiar sale.status a `confirmed`
     - Crear `stock_movements` tipo `sale` (confirma venta)
     - Crear `stock_movements` tipo `cancel` (libera reserva)
     - Actualizar `product_variants.stockQuantity`

3. **Crear Envío** (opcional)
   - Si venta confirmada, crear `shipment`

4. **Cancelar Venta**
   - Validar que NO tenga pagos en estado `paid`
   - Cambiar sale.status a `cancelled`
   - Crear `stock_movements` tipo `cancel` (libera reserva)

---

## 🔒 Validaciones de Stock

- Antes de crear venta: verificar `stockQuantity` de cada variante
- Stock se calcula: `stockQuantity + SUM(stock_movements.quantity WHERE productVariantId)`
- NO permitir stock negativo (configurable por organización en futuro)
- Transacciones Prisma para todas las operaciones de stock

---

## 🧪 Buenas Prácticas

- No lógica en controllers
- Services deben ser testeables
- Validar todos los inputs con Zod
- Nunca confiar en IDs enviados sin validar `organization_id`
- Manejar errores con middleware global
- Usar transacciones Prisma para:
  - crear ventas
  - registrar pagos
  - descontar stock
  - cancelar ventas

---

## 🧠 Instrucciones para GitHub Copilot

Copilot debe:
- Generar código en TypeScript
- Usar Prisma Client para todas las consultas
- Respetar el contexto multi-tenant (SIEMPRE filtrar por `organizationId`)
- Usar async/await
- Seguir separación controller/service
- No usar SQL directo
- Priorizar claridad sobre complejidad
- Usar transacciones para operaciones críticas
- Validar con Zod antes de tocar la DB

---

## 🚀 Objetivo del MVP Backend

- ✅ Autenticación JWT
- ✅ Gestión de organizaciones
- ✅ Gestión de usuarios multi-tenant
- ✅ Gestión de productos y variantes
- ✅ Gestión de stock
- ✅ Gestión de clientes
- ✅ Creación de ventas con reserva de stock
- ✅ Registro de pagos (parciales y completos)
- ✅ Envíos
- ✅ Métricas básicas
- ✅ Soporte para livestreams
- ✅ Activity log
- ✅ Templates de mensajes

Todo debe ser extensible para versiones futuras.

---

## 📦 Inicialización

### 1. Seeds Iniciales
Crear script `prisma/seed.ts` que genere:
- 1 organización demo
- 1 usuario owner
- Productos y variantes de ejemplo
- Message templates por defecto

### 2. Primer Usuario
```typescript
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "secure123",
  "name": "Admin",
  "organizationName": "Mi Tienda"
}
```

Esto crea:
- User
- Organization
- OrganizationUser (role: owner)
- JWT token

---

## 🔍 Índices Recomendados

Además de los mencionados en cada tabla:

```prisma
// Compuestos para queries frecuentes
@@index([organizationId, status, createdAt]) // sales
@@index([organizationId, isActive, deletedAt]) // products
@@index([productId, isActive]) // product_variants
@@index([customerId, createdAt]) // sales
@@index([livestreamId, status]) // sales
```

---

## 🚨 MVP

MVP – Resumen Ejecutivo

El MVP es una plataforma web que permite a vendedores y tiendas que venden en livestreams ordenar, registrar y cerrar sus ventas en tiempo real, reemplazando Excel, WhatsApp y notas manuales.

🧩 ¿Qué problemas resuelve el MVP?

✔ Ventas desordenadas durante el live
✔ Pagos no identificados
✔ Clientes confundidos
✔ Stock mal controlado
✔ Falta de visibilidad del dinero vendido

🧱 ¿Qué INCLUYE el MVP?
1️⃣ Autenticación y organización

Registro / login

1 usuario = 1 organización

Todo el sistema aislado por organización

2️⃣ Productos

Crear / editar / desactivar productos

Precio

Stock

Uso rápido durante el live

👉 Sin variantes todavía

3️⃣ Clientes

Registro simple

Nombre + usuario (IG / TikTok)

Contacto libre

4️⃣ Ventas (CORE)

Crear ventas rápidamente

Agregar uno o más productos

Total automático

Estados de venta:

Reservada

Pagada

Cancelada

5️⃣ Pagos

Marcar venta como pagada / no pagada

Método de pago (texto)

Sin pasarela de pago

6️⃣ 🔴 Modo Live (diferenciador)

Un panel optimizado para usar mientras transmiten:

Crear ventas en segundos

Buscar productos rápido

Ver stock disponible

Ver ventas pendientes

Ver total vendido en tiempo real

🔥 Esto es lo que hace que el MVP valga la pena.

7️⃣ Métricas básicas

Total vendido por mes

Ventas pagadas vs pendientes

Cantidad de ventas

Ticket promedio

❌ ¿Qué NO incluye el MVP?

❌ Integración con TikTok / Instagram
❌ Variantes de productos
❌ Envíos / logística
❌ Roles de usuarios
❌ Automatizaciones
❌ Mensajería
❌ Reportes avanzados

---

## 📝 Notas Finales

- IDs usa `cuid()` para mejor distribución
- Todos los decimales son `(10,2)` = hasta 99,999,999.99
- DateTime en UTC, conversión a timezone en frontend
- Soft delete solo en entidades maestras
- Activity log registra TODO
- No eliminar físicamente datos transaccionales

---

**Versión:** 1.0  
**Última actualización:** Diciembre 2024