# Módulo de Carritos (Cart Management)

## Descripción

El módulo de carritos permite gestionar todos los carritos abiertos (ventas en estado `reserved`) de la organización, independientemente de si están asociados a un livestream o no.

## Concepto: Carritos Persistentes

Los **carritos son persistentes** y pueden:
- Crearse durante un live o manualmente
- Ser editados en múltiples livestreams
- Modificarse fuera del contexto de un live
- Mantenerse abiertos hasta que el cliente decida comprar o se cancelen

**Regla importante:** Un cliente solo puede tener 1 carrito activo (reserved) a la vez.

## Endpoints

### GET /api/carts
Obtiene todos los carritos activos de la organización.

**Query Parameters:**
- `customerId` (string, opcional): Filtrar por cliente
- `livestreamId` (string, opcional): Filtrar por livestream
- `hasNoLivestream` (boolean, opcional): Mostrar solo carritos sin livestream
- `sellerId` (string, opcional): Filtrar por vendedor

**Response:** Array de carritos con sus items, cliente y detalles de productos.

---

### GET /api/carts/old
Obtiene carritos antiguos (no actualizados en X días).

**Query Parameters:**
- `daysOld` (number, opcional): Días de antigüedad (default: 7)

**Response:** Array de carritos antiguos con información del cliente.

---

### GET /api/carts/:id
Obtiene un carrito específico por ID.

**Response:** Carrito con items completos, detalles de productos y cliente.

---

### POST /api/carts/:id/items
Agrega un item al carrito.

**Body:**
```json
{
  "productId": "cuid",
  "productVariantId": "cuid",
  "quantity": 2,
  "unitPrice": 15000
}
```

**Proceso:**
1. Valida que el carrito exista y esté en estado `reserved`
2. Verifica stock disponible
3. Crea el `SaleItem`
4. Crea `StockMovement` tipo `reserve`
5. Recalcula el total del carrito

---

### PATCH /api/carts/:id/items/:itemId
Actualiza un item del carrito (cantidad o precio).

**Body:**
```json
{
  "quantity": 3,
  "unitPrice": 14000
}
```

**Proceso:**
1. Si cambia la cantidad, ajusta el stock (reserve o cancel)
2. Actualiza el item
3. Recalcula el total del carrito

---

### DELETE /api/carts/:id/items/:itemId
Elimina un item del carrito.

**Proceso:**
1. Libera el stock reservado (StockMovement tipo `cancel`)
2. Elimina el item
3. Recalcula el total del carrito

---

### PATCH /api/carts/:id
Actualiza el carrito (notas, descuento, livestream).

**Body:**
```json
{
  "notes": "Cliente pidió cambio por WhatsApp",
  "discountAmount": 5000,
  "livestreamId": "cuid"
}
```

Si se actualiza `livestreamId`, también se actualiza `lastLivestreamId`.

---

### POST /api/carts/:id/confirm
Confirma un carrito (lo convierte en venta confirmada).

**Body:**
```json
{
  "method": "transfer",
  "amount": 50000,
  "reference": "Transf-12345"
}
```

**Proceso (Transacción):**
1. Crea el `Payment` en estado `paid`
2. Crea `StockMovement` tipo `sale` para cada item (confirma venta)
3. Crea `StockMovement` tipo `cancel` para liberar las reservas
4. Actualiza el carrito a `status: confirmed`

---

### POST /api/carts/:id/cancel
Cancela un carrito.

**Proceso (Transacción):**
1. Valida que no tenga pagos confirmados
2. Libera todo el stock reservado (StockMovement tipo `cancel`)
3. Actualiza el carrito a `status: cancelled`

---

## Casos de Uso

### 1. Cliente pide eliminar un producto por WhatsApp
```
GET /api/carts?customerId=xxx
DELETE /api/carts/{cartId}/items/{itemId}
```

### 2. Cliente quiere cambiar talla
```
GET /api/carts/{cartId}
DELETE /api/carts/{cartId}/items/{oldItemId}
POST /api/carts/{cartId}/items (con nueva variante)
```

### 3. Revisar carritos abandonados
```
GET /api/carts/old?daysOld=7
```

### 4. Agregar productos manualmente fuera del live
```
POST /api/carts/{cartId}/items
```

### 5. Confirmar venta desde el mantenedor
```
POST /api/carts/{cartId}/confirm
```

---

## Integración con Modo Live

El **Modo Live** utiliza principalmente el módulo de `sales`, pero también puede:
- Consultar carritos de otros lives: `GET /api/carts?livestreamId={otroLiveId}`
- Traer un carrito a este live: `PATCH /api/carts/{id}` con `livestreamId` del live actual
- Ver todos los carritos activos: `GET /api/carts`

---

## Seguridad

- Todos los endpoints requieren autenticación (JWT)
- Middleware `organizationContext` inyecta `organizationId`
- **Todas las queries filtran por `organizationId`** para aislamiento multi-tenant
- No se puede acceder a carritos de otras organizaciones

---

## Validaciones

Todas las validaciones están en `carts.validation.ts` usando **Zod**:
- Precios y cantidades deben ser positivos
- IDs deben ser strings válidos
- Método de pago debe ser enum válido
- Filtros opcionales se transforman correctamente

---

## Manejo de Errores

Todos los errores retornan:
```json
{
  "error": "Descripción del error"
}
```

Códigos HTTP:
- `200`: OK
- `201`: Creado
- `400`: Error de validación o lógica de negocio
- `404`: Recurso no encontrado

---

## Diferencia con el módulo Sales

| Sales | Carts |
|-------|-------|
| Crear nuevas ventas/carritos | Gestionar carritos existentes |
| CRUD completo de ventas | Solo carritos abiertos (reserved) |
| Uso general | Uso específico para gestión post-live |
| Incluye ventas confirmadas | Solo carritos editables |
