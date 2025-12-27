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
- ProductCategory (Categorías personalizables)
- CategoryAttribute (Atributos dinámicos por categoría)
- AttributeValue (Valores de atributos)
- Product
- ProductVariant
- VariantAttributeValue (Relación variante-atributos)
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

### product_categories
```typescript
id                String      @id @default(cuid())
organizationId    String
name              String      // ej: "Ropa", "Joyas", "Maquillaje", "Accesorios"
description       String?
isActive          Boolean     @default(true)
createdAt         DateTime    @default(now())
updatedAt         DateTime    @updatedAt

@@unique([organizationId, name])
@@index([organizationId, isActive])
```

**Propósito:** Categorías de productos personalizables por organización. Permite separar productos por nicho (ropa, joyas, maquillaje, etc.).

### category_attributes
```typescript
id                String        @id @default(cuid())
categoryId        String        // FK a product_categories
name              String        // ej: "Color", "Talla", "Material", "Tamaño", "Volumen"
type              AttributeType // select, text, number
isRequired        Boolean       @default(false)
order             Int           @default(0)
createdAt         DateTime      @default(now())

@@index([categoryId])
@@index([categoryId, order])
```

**Propósito:** Define qué atributos tiene cada categoría. Por ejemplo:
- Categoría "Ropa" → atributos: Color, Talla
- Categoría "Joyas" → atributos: Material, Tamaño
- Categoría "Maquillaje" → atributos: Tono, Volumen

### attribute_values
```typescript
id                String      @id @default(cuid())
attributeId       String      // FK a category_attributes
value             String      // ej: "Rojo", "S", "Oro", "Pequeño", "5ml"
hexCode           String?     // Solo para colores (opcional)
order             Int         @default(0)
isActive          Boolean     @default(true)
createdAt         DateTime    @default(now())

@@unique([attributeId, value])
@@index([attributeId, isActive])
```

**Propósito:** Valores posibles para cada atributo. Permite crear listas predefinidas (dropdowns) durante el live.

### products
```typescript
id                String      @id @default(cuid())
organizationId    String
categoryId        String      // FK a product_categories
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
@@index([organizationId, categoryId, isActive])
@@index([categoryId])
@@index([sku])
```

### product_variants
```typescript
id                String      @id @default(cuid())
productId         String
organizationId    String
name              String      // ej: "Oro - Grande" o "Rojo - M" (auto-generado o manual)
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

### variant_attribute_values (NUEVA)
```typescript
id                String      @id @default(cuid())
variantId         String      // FK a product_variants
attributeValueId  String      // FK a attribute_values
createdAt         DateTime    @default(now())

@@unique([variantId, attributeValueId])
@@index([variantId])
@@index([attributeValueId])
```

**IMPORTANTE - Lógica de Variantes con Atributos Dinámicos:**
- Si un producto NO tiene variantes, se crea una variante por defecto sin atributos
- Las variantes se relacionan con valores de atributos vía tabla intermedia `variant_attribute_values`
- El `name` puede auto-generarse desde los valores de atributos (ej: "Oro - Grande", "Rojo - M") o ser manual
- Los atributos disponibles dependen de la categoría del producto
- Ejemplo para Ropa: variante con valores "Rojo" (Color) + "M" (Talla)
- Ejemplo para Joyas: variante con valores "Oro" (Material) + "Grande" (Tamaño)
- El stock SIEMPRE se maneja a nivel de variante
- `sale_items` SIEMPRE referencia a `product_variant_id`
- `product_id` en `sale_items` es solo para trazabilidad
- Durante el live, los pickers se adaptan según los atributos de la categoría

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
totalUnitsSold    Int?        // Total de unidades vendidas
startedAt         DateTime
endedAt           DateTime?
createdBy         String      // userId (vendedor principal)
moderatorId       String?     // userId (quien gestiona/modera el live)
status            LiveStatus  @default(active) // active, closed
createdAt         DateTime    @default(now())
updatedAt         DateTime    @updatedAt

@@index([organizationId, startedAt])
@@index([createdBy])
@@index([moderatorId])
@@index([status])
```

### sales
```typescript
id                String      @id @default(cuid())
organizationId    String
livestreamId      String?     // Nullable: carrito puede existir sin live o cambiar entre lives
customerId        String
sellerId          String      // userId
status            SaleStatus  @default(reserved)
totalAmount       Decimal     @db.Decimal(10, 2)
discountAmount    Decimal     @db.Decimal(10, 2) @default(0)
notes             String?     @db.Text
lastLivestreamId  String?     // Último live donde se modificó (para trazabilidad)
createdAt         DateTime    @default(now())
updatedAt         DateTime    @updatedAt

@@index([organizationId, status])
@@index([livestreamId])
@@index([customerId])
@@index([customerId, status])  // Para buscar carritos activos de un cliente
@@index([sellerId])
@@index([createdAt])
@@index([status, updatedAt])   // Para ordenar carritos por última actualización
```

**🛒 CARRITOS PERSISTENTES (Cambio Importante):**

Las ventas en estado `reserved` son **carritos abiertos y persistentes**:

✅ Un carrito puede existir SIN livestream (creado manualmente)
✅ Un carrito puede **agregarse desde múltiples livestreams**
✅ Un carrito puede **editarse en cualquier momento** (hasta que se confirme)
✅ El `livestreamId` indica el live actual donde se está gestionando (nullable)
✅ El `lastLivestreamId` registra el último live donde se modificó

**Ciclo de Vida de un Carrito:**
```
1. CREAR CARRITO (reserved)
   └── Cliente pide productos en Live 1
       ├── Sale.status = reserved
       ├── Sale.livestreamId = live_1
       └── Stock reservado

2. AGREGAR MÁS EN OTRO LIVE (reserved)
   └── Cliente vuelve en Live 2 y pide más
       ├── Se actualiza el MISMO carrito
       ├── Sale.livestreamId = live_2 (actualizado)
       ├── Sale.lastLivestreamId = live_2
       └── Se agregan más SaleItems

3. EDITAR FUERA DEL LIVE (reserved)
   └── Cliente pide cambio por WhatsApp
       ├── Entrar al "Mantenedor de Carritos"
       ├── Modificar/eliminar productos
       └── Sale.livestreamId puede ser null o mantener el último

4. CONFIRMAR CARRITO (confirmed)
   └── Cliente confirma y paga
       ├── Sale.status = confirmed
       ├── Stock definitivamente descontado
       └── YA NO SE PUEDE EDITAR
```

**Reglas de Negocio:**
- `totalAmount` es la suma de `sale_items.total_price` - `discountAmount`
- Al crear venta en estado `reserved`: se genera `stock_movement` tipo `reserve`
- Al confirmar (`confirmed`): se genera `stock_movement` tipo `sale`
- Al cancelar: se genera `stock_movement` tipo `cancel` (revierte reserva)
- NO se puede cancelar si `payments` tiene al menos un `paid`
- **Los carritos (reserved) pueden editarse libremente hasta que se confirmen**
- **Un cliente puede tener SOLO 1 carrito activo (reserved) a la vez**

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
  reserved    // Carrito abierto - editable en cualquier momento
  confirmed   // Venta confirmada - cerrada, no editable
  cancelled   // Venta cancelada - cerrada
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

enum LiveStatus {
  active    // Live en curso
  closed    // Live cerrado/finalizado
}

enum AttributeType {
  select   // Lista predefinida de valores (dropdown)
  text     // Texto libre
  number   // Número (ej: medidas, peso)
}
```

---

## 🛒 Ventas y Carritos (Core del sistema)

### 🛒 Concepto de Carrito Persistente

**Los carritos NO están atados a un livestream específico.** Son entidades persistentes que pueden:
- Crearse durante un live o manualmente
- Editarse en múltiples livestreams
- Modificarse fuera del live (Mantenedor de Carritos)
- Mantenerse abiertos hasta que el cliente decida comprar

Una venta/carrito:
- pertenece a una organización
- puede estar asociada a un livestream (nullable)
- DEBE tener un cliente (customer_id requerido)
- DEBE tener un vendedor (seller_id requerido)
- tiene uno o más productos (via sale_items)
- puede tener múltiples pagos parciales
- tiene 0 o 1 envío
- **Un cliente solo puede tener 1 carrito activo (reserved) a la vez**

### Estados de venta:
- `reserved`: **Carrito abierto** - editable, stock reservado, puede agregarse desde cualquier live
- `confirmed`: **Venta confirmada** - pagada, cerrada, no editable, stock definitivamente descontado
- `cancelled`: **Cancelada** - cerrada, stock liberado

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

## �️ Mantenedor de Carritos

### Propósito

Pantalla para gestionar **todos los carritos abiertos (reserved)** de la organización, fuera del contexto de un livestream.

**Casos de uso:**
- Cliente pide por WhatsApp eliminar un producto de su carrito
- Cliente quiere cambiar la talla de un producto
- Vendedor necesita revisar qué carritos están pendientes
- Agregar productos manualmente a un carrito sin estar en live
- Cancelar carritos abandonados
- Ver qué clientes tienen carritos abiertos hace días

### Funcionalidades

#### 📋 Vista de Lista
- Tabla con todos los carritos abiertos (`status=reserved`)
- Columnas:
  - Cliente (nombre + username)
  - Cantidad de productos
  - Total
  - Último live (si existe)
  - Última actualización
  - Acciones
- Filtros:
  - Por cliente
  - Por rango de fecha
  - Sin live asignado
  - Por vendedor
- Ordenamiento:
  - Por última actualización (default)
  - Por total
  - Por antigüedad

#### ✏️ Edición de Carrito
Al seleccionar un carrito:
- Ver todos los `sale_items`
- **Agregar productos** (como en el Modo Live)
- **Editar productos existentes:**
  - Cambiar cantidad
  - Cambiar variante (color/talla)
  - Cambiar precio
- **Eliminar productos**
- Agregar/editar notas
- Aplicar descuento
- **Marcar como pagado** (confirmar venta)
- **Cancelar carrito**
- Asignar a un live activo (si existe)

#### 🔔 Alertas
- Carritos con más de X días sin actualizar
- Carritos con productos sin stock suficiente
- Carritos sin vendedor asignado

### Reglas de Negocio

✅ Cualquier usuario con rol `owner`, `seller` o `moderator` puede editar carritos
✅ Al editar un carrito, se actualiza `updatedAt` y opcionalmente `lastLivestreamId`
✅ Si se elimina el último producto de un carrito, se puede auto-cancelar o dejar vacío
✅ Los cambios en carritos generan registros en `activity_log`
✅ Al confirmar un carrito desde aquí, se crea el `payment` y cambia a `confirmed`

### Diferencia con Modo Live

| Aspecto | Modo Live | Mantenedor de Carritos |
|---------|-----------|------------------------|
| Contexto | Durante transmisión en vivo | Fuera del live |
| Velocidad | Optimizado para rapidez | Más detallado |
| Alcance | Prioriza carritos del live actual | Todos los carritos abiertos |
| Interfaz | Formulario rápido + lista | Tabla + formulario completo |
| Uso | Ventas en tiempo real | Gestión post-live, ajustes |

---

## �📺 Livestreams y Modo Live

Los livestreams sirven para:
- agrupar ventas de una transmisión
- calcular métricas por transmisión
- **operar el "Modo Live"** (funcionalidad clave)

Un livestream:
- pertenece a una organización
- tiene plataforma (instagram, tiktok, youtube, other)
- tiene `startedAt` y `endedAt` (nullable mientras esté en vivo)
- puede tener `viewerCount`, `totalSalesAmount` y `totalUnitsSold`
- tiene un `createdBy` (vendedor principal) y opcionalmente `moderatorId` (quien gestiona)
- tiene estado `active` o `closed`

### 🔴 MODO LIVE (Core del Sistema)

El **Modo Live** es la pantalla principal durante una transmisión en vivo. Optimizado para velocidad y uso en tiempo real.

#### Diseño de Interfaz

**Pantalla dividida en 2 columnas:**

**Columna IZQUIERDA - Carritos (Persistentes entre Lives)**

**🔄 Vista Inteligente de Carritos:**
- Muestra **todos los carritos activos (reserved)** de la organización
- Prioriza/resalta los carritos que están siendo gestionados en este live
- También muestra carritos de otros livestreams o sin live asignado
- Permite "traer" un carrito de otro live al live actual

**Cada carrito muestra:**
- Nombre del comprador
- Cantidad de productos
- Total de la venta
- Estado (color + badge)
- **Badge del live:** "Este live" | "Live anterior" | "Sin live" | "Otro live activo"

**Estados visuales:**
- 🟡 **Carrito Abierto** (`reserved`): Editable, puede agregarse más productos
- 🟢 **Pagado** (`confirmed`): Venta confirmada, cerrada
- 🔴 **Cancelado** (`cancelled`): Venta cancelada

**Acciones:**
- Click en carrito: abre modal con detalle completo y permite editar
- "Traer a este live": Asigna el carrito al livestream actual
- Filtros: Todos | Este live | Otros lives | Sin live | Pendientes | Pagados | Cancelados

**Ordenamiento:**
- Por defecto: carritos de este live primero, luego por última actualización

**Columna DERECHA - Formulario Rápido de Venta**

Formulario con pickers para agregar productos al carrito:

1. **Comprador** (Text input con autocompletado)
   - Muestra lista de compradores de la organización
   - **Si el cliente ya tiene un carrito abierto (reserved):**
     - ✅ Agrega productos al carrito existente
     - ✅ Actualiza `livestreamId` al live actual
     - ✅ Actualiza `lastLivestreamId` y `updatedAt`
   - **Si el cliente NO tiene carrito abierto:**
     - ✅ Crea un nuevo carrito (nueva `sale`)
     - ✅ Asigna `livestreamId` al live actual
   - Si no existe el `customer`, se crea automáticamente

2. **Categoría** (Select / Picker - opcional, para filtrar)
   - Lista de categorías de la organización (Ropa, Joyas, Maquillaje, etc.)
   - Filtra los productos por categoría
   - Determina qué atributos mostrar en los siguientes pasos

3. **Producto** (Select / Picker)
   - Lista de productos activos (filtrados por categoría si aplica)
   - Muestra: nombre + precio base + stock disponible
   - Filtro rápido por texto
   - Al seleccionar, carga los atributos de su categoría

4. **Atributos Dinámicos** (Select / Picker - cantidad variable según categoría)
   - Se muestran según la categoría del producto seleccionado
   - **Ejemplo para Ropa:** "Color" + "Talla"
   - **Ejemplo para Joyas:** "Material" + "Tamaño"
   - **Ejemplo para Maquillaje:** "Tono" + "Volumen"
   - Cada atributo muestra sus valores configurados
   - Para colores con hexCode, muestra círculo de color
   - Los atributos pueden ser opcionales según configuración
   - Se crea/selecciona la `product_variant` correspondiente automáticamente

5. **Precio** (Number input)
   - Precio de venta (puede ser diferente al precio base)
   - Pre-llenado con el precio de la variante seleccionada
   - Editable manualmente

6. **Cantidad** (Number input)
   - Cantidad a vender
   - Default: 1
   - Validación contra stock disponible

**Botón:** "Agregar al Carrito" → Crea/actualiza la venta en tiempo real

#### Indicadores en Tiempo Real (Header del Modo Live)

- 🔴 **Indicador LIVE** (parpadeante rojo)
- ⏱️ **Cronómetro**: Tiempo transcurrido desde `livestream.startedAt`
- 💰 **Total Recaudado**: Suma de `sales.totalAmount` WHERE `livestreamId` y `status != cancelled`
- 📦 **Unidades Vendidas**: Suma de `sale_items.quantity` del live
- 👤 **Vendedor**: `livestream.createdBy` (nombre)
- 🎯 **Moderador**: `livestream.moderatorId` (nombre, si existe)

#### Flujo de Trabajo en Modo Live

1. **Iniciar Live**
   - Crear `livestream` con `status=active`, `startedAt=now()`, `endedAt=null`
   - Asignar `createdBy` (vendedor) y opcionalmente `moderatorId`

2. **Durante el Live**
   - Usar formulario rápido para agregar productos
   - Las ventas se crean en estado `reserved` (Pendiente)
   - El stock se reserva automáticamente (`stock_movements` tipo `reserve`)
   - Los carritos se actualizan en tiempo real
   - Se puede marcar ventas como pagadas desde el modal del carrito

3. **Cerrar Live**
   - Botón: "Cerrar Live"
   - Actualizar `livestream`: `status=closed`, `endedAt=now()`
   - Calcular y guardar `totalSalesAmount` y `totalUnitsSold`
   - Las ventas quedan "congeladas":
     - Solo usuarios con rol `owner` o `logistics` pueden modificarlas después
     - Los datos se usan para métricas y notificaciones

#### Reglas del Modo Live

- ✅ Solo puede haber 1 live `active` por organización a la vez
- ✅ **Los carritos (reserved) pueden venir de otros livestreams o no tener live asignado**
- ✅ Al agregar productos a un carrito existente, se actualiza su `livestreamId` al live actual
- ✅ Los carritos cerrados como venta (`confirmed`) ya NO aparecen en el Modo Live
- ✅ Al cerrar live, se registra en `activity_log`
- ✅ Después de cerrar un live, los carritos pendientes siguen editables desde otro live o el mantenedor
- ✅ Si una variante no existe (combinación producto + color + talla), se crea automáticamente
- ⚠️ Si el stock no es suficiente, mostrar warning pero permitir reserva (configurable)
- 📌 **Un cliente solo puede tener 1 carrito activo (reserved) a la vez**

#### Edición de Carrito (Modal)

Al hacer clic en un carrito:
- Ver todos los `sale_items`
- Editar cantidad / precio de cada item
- Eliminar items
- Agregar más productos
- Cambiar estado de la venta:
  - Marcar como pagada (crea `payment` y cambia a `confirmed`)
  - Cancelar (cambia a `cancelled`, libera stock)
- Agregar notas
- Ver información del cliente

#### Optimizaciones

- Polling cada 3-5 segundos para actualizar carritos y métricas
- WebSockets en versión futura para tiempo real puro
- Caché de productos, colores y tallas en frontend
- Validación de stock en backend antes de confirmar

---

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

## 🔄 Flujo de un Carrito / Venta

### 1. Crear Carrito (status: `reserved`)
**Contexto:** Durante un live o manualmente
- Verificar si cliente ya tiene carrito abierto:
  - ✅ Si existe: usar carrito existente, actualizar `livestreamId` y `lastLivestreamId`
  - ✅ Si no existe: crear nuevo `sale`
- Validar stock disponible de cada variante
- Crear/actualizar `sale` + agregar `sale_items`
- Crear `stock_movements` tipo `reserve` (cantidad negativa) por cada item
- Crear `activity_log`
- El carrito queda **abierto y editable**

### 2. Agregar Más Productos al Carrito (status: `reserved`)
**Contexto:** Cliente vuelve en otro live o se edita manualmente
- Buscar carrito existente del cliente (`status=reserved`)
- Agregar nuevos `sale_items`
- Crear `stock_movements` tipo `reserve` para los nuevos items
- Actualizar `totalAmount`, `updatedAt`, `livestreamId`, `lastLivestreamId`
- Registrar en `activity_log`

### 3. Editar Carrito (status: `reserved`)
**Contexto:** Mantenedor de Carritos o Modo Live
- Modificar cantidades de `sale_items`
- Cambiar variantes (color/talla)
- Eliminar `sale_items`
- Ajustar `stock_movements` según los cambios:
  - Si aumenta cantidad: nuevo `reserve`
  - Si disminuye cantidad: `cancel` parcial (libera stock)
  - Si elimina item: `cancel` total del item
- Recalcular `totalAmount`
- Actualizar `updatedAt`

### 4. Confirmar Carrito (reserved → confirmed)
**Contexto:** Cliente paga y confirma
- Crear `payment`
- Si total pagado >= total venta:
  - Cambiar `sale.status` a `confirmed`
  - Crear `stock_movements` tipo `sale` (confirma venta)
  - Crear `stock_movements` tipo `cancel` (libera las reservas)
  - Actualizar `product_variants.stockQuantity`
  - **El carrito se cierra y ya NO es editable**
  - Cliente puede crear un nuevo carrito en el futuro

### 5. Crear Envío (opcional)
- Si venta confirmada, crear `shipment`

### 6. Cancelar Carrito (reserved → cancelled)
**Contexto:** Cliente ya no quiere comprar o carrito abandonado
- Validar que NO tenga pagos en estado `paid`
- Cambiar `sale.status` a `cancelled`
- Crear `stock_movements` tipo `cancel` (libera todas las reservas)
- Registrar en `activity_log`
- Cliente puede crear un nuevo carrito

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
- ✅ **Sistema de categorías de productos personalizables**
- ✅ **Atributos dinámicos por categoría (Color, Talla, Material, Tamaño, etc.)**
- ✅ Gestión de productos y variantes con atributos flexibles
- ✅ Gestión de stock
- ✅ Gestión de clientes
- ✅ Creación de ventas con reserva de stock
- ✅ Registro de pagos (parciales y completos)
- ✅ Envíos
- ✅ Métricas básicas
- ✅ **Soporte completo para livestreams y Modo Live**
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

2️⃣ Productos y Categorías

Crear categorías personalizadas (Ropa, Joyas, Maquillaje, etc.)

Definir atributos por categoría (Color/Talla para ropa, Material/Tamaño para joyas, etc.)

Crear valores para cada atributo

Crear / editar / desactivar productos

Asignar productos a categorías

Precio y stock

Uso rápido durante el live con pickers dinámicos

✅ Sistema flexible de variantes basado en atributos configurables

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

- Interfaz dividida: Carritos (izq) + Formulario rápido (der)
- **Carritos persistentes:** Ver carritos de este live y de lives anteriores
- **Pickers dinámicos:** Categoría → Producto → Atributos adaptados a la categoría
- Crear ventas con: Comprador, Categoría, Producto, Atributos (Color/Talla/Material/etc.), Precio, Cantidad
- **Si el cliente ya tiene carrito:** agrega al carrito existente automáticamente
- Indicadores en tiempo real: cronómetro, total recaudado, unidades vendidas
- Gestión de carritos con estados: Carrito Abierto | Pagado | Cancelado
- Filtros: Este live | Otros lives | Pendientes | Pagados
- Edición rápida y "traer carrito a este live"
- Botón "Cerrar Live"

🔥 Esto es lo que hace que el MVP valga la pena.

**Incluye:**
- Sistema de categorías de productos personalizables
- Atributos dinámicos configurables por categoría
- Mantenedores de valores de atributos (colores con hexCode, tallas ordenadas, etc.)
- Auto-creación de variantes durante el live basado en atributos
- Validación de stock en tiempo real
- Carritos persistentes entre livestreams

7️⃣ 🗂️ Mantenedor de Carritos

Pantalla para gestionar carritos fuera del live:

- Lista de todos los carritos abiertos (reserved)
- Editar/eliminar productos de carritos
- Cambiar tallas/colores
- Agregar productos manualmente
- Cancelar carritos abandonados
- Confirmar y marcar como pagado
- Filtros por cliente, fecha, vendedor
- Alertas de carritos antiguos o sin stock

🔥 Esto permite atender clientes que piden cambios por WhatsApp/DM.

8️⃣ Métricas básicas

Total vendido por mes

Ventas pagadas vs pendientes

Cantidad de ventas

Ticket promedio

❌ ¿Qué NO incluye el MVP?

❌ Integración con TikTok / Instagram (API)
❌ WebSockets / tiempo real puro (usa polling)
❌ Envíos / logística avanzada
❌ Múltiples roles de usuarios (solo owner por ahora)
❌ Automatizaciones
❌ Mensajería automática
❌ Reportes avanzados
❌ Gestión de múltiples lives simultáneos

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