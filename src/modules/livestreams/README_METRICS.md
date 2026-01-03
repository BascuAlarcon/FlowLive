# 📊 Métricas Detalladas de Livestreams

## ✅ Implementación Completa

Se ha implementado el sistema completo de métricas para livestreams con las siguientes mejoras:

### 🔄 Cambios en el Modelo de Datos

#### 1. Schema de Prisma (`schema.prisma`)

**Tabla `SaleItem` - Campos Nuevos:**
```prisma
model SaleItem {
  // ... campos existentes
  livestreamId       String?  // 🆕 Tracking de qué live vendió este item
  attributesSnapshot Json?    // 🆕 Snapshot de atributos al momento de la venta
  
  Livestream Livestream? @relation(fields: [livestreamId], references: [id])
  
  @@index([livestreamId])  // 🆕 Índice para consultas rápidas
}
```

**Tabla `Livestream` - Nueva Relación:**
```prisma
model Livestream {
  // ... campos existentes
  SaleItem SaleItem[]  // 🆕 Relación con items vendidos
}
```

#### 2. Migración Aplicada
- ✅ Migración: `20251230120857_add_livestream_tracking_to_sale_items`
- ✅ Base de datos actualizada correctamente

---

## 🎯 Endpoint Principal: Estadísticas Detalladas

### `GET /api/livestreams/:id/detailed-stats`

Retorna todas las métricas solicitadas para un livestream específico.

#### Request
```http
GET /api/livestreams/:id/detailed-stats
Authorization: Bearer <token>
```

#### Response (Ejemplo)
```json
{
  "success": true,
  "data": {
    "livestream": {
      "id": "clxxxxxx",
      "title": "Live de Ropa de Invierno",
      "platform": "instagram",
      "seller": "user_123",
      "startDate": "2025-12-30T15:00:00.000Z",
      "endDate": "2025-12-30T17:30:00.000Z",
      "durationMinutes": 150,
      "isActive": false,
      "viewerCount": 1250
    },
    "metrics": {
      "totalEstimatedAmount": 450000.00,      // Monto total de todos los productos del live
      "totalClosedAmount": 320000.00,         // Monto de productos realmente vendidos
      "averageCartAmount": 45000.00,          // Promedio de monto por carrito
      "averageProductsPerCart": 3.5,          // Promedio de productos por carrito
      "closureRate": 68.75,                   // % de carritos confirmados (68.75%)
      "totalCustomers": 32,                   // Usuarios únicos que compraron
      "totalProductsSold": 112,               // Cantidad total de productos vendidos
      "averageProductsPerCustomer": 3.5       // Promedio de productos por cliente
    },
    "topProducts": [
      {
        "liveItemId": "item_001",
        "categoryName": "Ropa",
        "price": 25000.00,
        "quantity": 15,                       // Cantidad vendida
        "totalRevenue": 375000.00,
        "imageUrl": "https://..."
      },
      {
        "liveItemId": "item_002",
        "categoryName": "Ropa",
        "price": 30000.00,
        "quantity": 12,
        "totalRevenue": 360000.00,
        "imageUrl": "https://..."
      }
      // ... top 10 productos
    ],
    "topCustomers": [
      {
        "customerId": "customer_001",
        "customerName": "María González",
        "totalPurchases": 5,                  // Cantidad de compras
        "totalSpent": 125000.00,              // Total gastado
        "productsCount": 8                    // Productos comprados
      },
      {
        "customerId": "customer_002",
        "customerName": "Juan Pérez",
        "totalPurchases": 3,
        "totalSpent": 95000.00,
        "productsCount": 5
      }
      // ... top 10 clientes
    ],
    "topAttributes": {
      "Color": [
        {
          "value": "Negro",
          "count": 25,                        // Cantidad vendida
          "revenue": 625000.00                // Revenue generado
        },
        {
          "value": "Rojo",
          "count": 18,
          "revenue": 450000.00
        },
        {
          "value": "Azul",
          "count": 15,
          "revenue": 375000.00
        }
      ],
      "Talla": [
        {
          "value": "M",
          "count": 30,
          "revenue": 750000.00
        },
        {
          "value": "L",
          "count": 22,
          "revenue": 550000.00
        },
        {
          "value": "S",
          "count": 18,
          "revenue": 450000.00
        }
      ],
      "Material": [
        {
          "value": "Algodón",
          "count": 40,
          "revenue": 1000000.00
        },
        {
          "value": "Poliéster",
          "count": 28,
          "revenue": 700000.00
        }
      ]
    }
  }
}
```

---

## 📋 Métricas Implementadas (15/15)

### ✅ Información Básica
1. **Plataforma** - `livestream.platform`
2. **Vendedor** - `livestream.seller`
3. **Fecha inicio** - `livestream.startDate`
4. **Duración Live** - `livestream.durationMinutes`

### ✅ Métricas Financieras
5. **Monto total estimado** - `metrics.totalEstimatedAmount`
   - Suma de TODOS los productos mostrados en el live (incluso no vendidos)
   
6. **Monto total cerrado** - `metrics.totalClosedAmount`
   - Suma solo de productos CONFIRMADOS/PAGADOS
   
7. **Monto Promedio de carritos** - `metrics.averageCartAmount`
   
8. **Cantidad de productos promedio de carritos** - `metrics.averageProductsPerCart`

### ✅ Métricas de Conversión
9. **Tasa % de compras cerradas** - `metrics.closureRate`
   - (Carritos confirmados / Total carritos) × 100

### ✅ Métricas de Clientes
10. **Cantidad de Usuarios que compraron** - `metrics.totalCustomers`
11. **Cantidad de Productos que se compraron** - `metrics.totalProductsSold`
12. **Cantidad de Productos promedio por usuario** - `metrics.averageProductsPerCustomer`

### ✅ Rankings
13. **Productos más vendidos** - `topProducts[]`
    - Top 10 productos ordenados por cantidad vendida
    - Incluye: ID, categoría, precio, cantidad, revenue, imagen
    
14. **Usuarios que más compraron** - `topCustomers[]`
    - Top 10 clientes ordenados por total gastado
    - Incluye: ID, nombre, cantidad de compras, total gastado, productos comprados
    
15. **Atributos más comprados** - `topAttributes{}`
    - Por cada atributo (Color, Talla, Material, etc.)
    - Top 10 valores ordenados por cantidad vendida
    - Incluye: valor, cantidad vendida, revenue generado

---

## 🔧 Cambios en el Código

### 1. `carts.service.ts`

**Método `addItemToCart` actualizado:**
- ✅ Ahora captura el snapshot de atributos al momento de agregar al carrito
- ✅ Guarda el `livestreamId` en cada `SaleItem`
- ✅ El snapshot incluye: nombre, valor, tipo y hexCode del atributo

```typescript
const attributesSnapshot = liveItem.attributes.map(attr => ({
  name: attr.attributeValue?.attribute?.name || '',
  value: attr.attributeValue?.value || attr.textValue || attr.numberValue?.toString() || '',
  type: attr.attributeValue?.attribute?.type || 'text',
  hexCode: attr.attributeValue?.hexCode,
}));
```

### 2. `livestreams.service.ts`

**Método `getDetailedStats` agregado:**
- ✅ Calcula todas las 15 métricas solicitadas
- ✅ Usa `SaleItem.livestreamId` para tracking preciso
- ✅ Usa `SaleItem.attributesSnapshot` para métricas de atributos
- ✅ Optimizado con consultas eficientes

### 3. `livestreams.controller.ts`

**Nuevo endpoint:**
```typescript
// GET /api/livestreams/:id/detailed-stats
async getDetailedStats(req: CustomRequest, res: Response, next: NextFunction)
```

### 4. `livestreams.routes.ts`

**Nueva ruta:**
```typescript
router.get('/:id/detailed-stats', livestreamsController.getDetailedStats.bind(livestreamsController));
```

---

## 🎨 Uso en el Frontend

### Ejemplo de Componente React

```tsx
import { useEffect, useState } from 'react';

interface LivestreamStats {
  livestream: {
    title: string;
    platform: string;
    durationMinutes: number;
    // ...
  };
  metrics: {
    totalEstimatedAmount: number;
    totalClosedAmount: number;
    closureRate: number;
    // ...
  };
  topProducts: Array<{
    categoryName: string;
    quantity: number;
    totalRevenue: number;
  }>;
  topCustomers: Array<{
    customerName: string;
    totalSpent: number;
  }>;
  topAttributes: Record<string, Array<{
    value: string;
    count: number;
  }>>;
}

function LivestreamDashboard({ livestreamId }: { livestreamId: string }) {
  const [stats, setStats] = useState<LivestreamStats | null>(null);

  useEffect(() => {
    fetch(`/api/livestreams/${livestreamId}/detailed-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setStats(data.data));
  }, [livestreamId]);

  if (!stats) return <div>Cargando...</div>;

  return (
    <div className="dashboard">
      {/* Header */}
      <header>
        <h1>{stats.livestream.title}</h1>
        <p>Plataforma: {stats.livestream.platform}</p>
        <p>Duración: {stats.livestream.durationMinutes} minutos</p>
      </header>

      {/* Métricas Principales */}
      <section className="metrics-grid">
        <MetricCard
          title="Monto Total Estimado"
          value={`$${stats.metrics.totalEstimatedAmount.toLocaleString()}`}
        />
        <MetricCard
          title="Monto Total Cerrado"
          value={`$${stats.metrics.totalClosedAmount.toLocaleString()}`}
        />
        <MetricCard
          title="Tasa de Conversión"
          value={`${stats.metrics.closureRate.toFixed(2)}%`}
        />
        <MetricCard
          title="Total Clientes"
          value={stats.metrics.totalCustomers}
        />
      </section>

      {/* Productos Más Vendidos */}
      <section>
        <h2>Productos Más Vendidos</h2>
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.topProducts.map((product, idx) => (
              <tr key={idx}>
                <td>{product.categoryName}</td>
                <td>{product.quantity}</td>
                <td>${product.totalRevenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Clientes Top */}
      <section>
        <h2>Clientes que Más Compraron</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Total Gastado</th>
            </tr>
          </thead>
          <tbody>
            {stats.topCustomers.map((customer, idx) => (
              <tr key={idx}>
                <td>{customer.customerName}</td>
                <td>${customer.totalSpent.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Atributos Más Comprados */}
      <section>
        <h2>Atributos Más Comprados</h2>
        {Object.entries(stats.topAttributes).map(([attrName, values]) => (
          <div key={attrName}>
            <h3>{attrName}</h3>
            <ul>
              {values.map((item, idx) => (
                <li key={idx}>
                  {item.value}: {item.count} unidades
                  (${item.revenue.toLocaleString()})
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
```

---

## 🚀 Ventajas del Sistema Implementado

### ✅ Tracking Preciso
- Cada `SaleItem` sabe exactamente de qué live proviene
- Los atributos se guardan en el momento de la venta (inmune a cambios posteriores)

### ✅ Carritos Multi-Live
- Un cliente puede tener items de diferentes lives en el mismo carrito
- Las métricas por live son precisas porque se usa `SaleItem.livestreamId`

### ✅ Histórico Completo
- El `attributesSnapshot` preserva los atributos exactos al momento de la venta
- Puedes calcular métricas históricas sin importar si cambias los atributos después

### ✅ Escalabilidad
- Índices optimizados en `livestreamId`
- Consultas eficientes usando agregaciones

---

## 📊 Métricas Globales (Bonus)

El sistema también soporta métricas globales para el módulo de `metrics`:

### Top Usuarios Globales
```typescript
// Consulta: Top usuarios que más han comprado en TODOS los lives
SELECT 
  Customer.id,
  Customer.name,
  COUNT(DISTINCT Sale.id) as totalPurchases,
  SUM(SaleItem.totalPrice) as totalSpent
FROM SaleItem
JOIN Sale ON SaleItem.saleId = Sale.id
JOIN Customer ON Sale.customerId = Customer.id
WHERE Sale.status = 'confirmed'
  AND Sale.organizationId = :orgId
GROUP BY Customer.id
ORDER BY totalSpent DESC
LIMIT 10
```

### Top Productos Globales
```typescript
// Consulta: Top productos más vendidos en TODOS los lives
SELECT 
  LiveItem.id,
  LiveItem.categoryId,
  SUM(SaleItem.quantity) as totalSold,
  SUM(SaleItem.totalPrice) as totalRevenue
FROM SaleItem
JOIN LiveItem ON SaleItem.liveItemId = LiveItem.id
JOIN Sale ON SaleItem.saleId = Sale.id
WHERE Sale.status = 'confirmed'
  AND LiveItem.organizationId = :orgId
GROUP BY LiveItem.id
ORDER BY totalSold DESC
LIMIT 10
```

### Top Atributos Globales
```typescript
// Consulta: Atributos más vendidos en TODOS los lives
// Se puede hacer con el attributesSnapshot de SaleItem
```

---

## 🎯 Próximos Pasos Sugeridos

1. **Cache de Métricas**: Considera cachear los resultados para lives cerrados
2. **Webhooks**: Notificar cuando se alcancen ciertos KPIs (ej: $1M en ventas)
3. **Comparativas**: Comparar métricas entre diferentes lives
4. **Exportación**: Permitir exportar métricas a Excel/PDF
5. **Gráficos**: Integrar con Chart.js o Recharts para visualizaciones

---

## 📝 Notas Importantes

- ✅ Todas las métricas respetan el `organizationId` (multi-tenancy)
- ✅ Los cálculos excluyen ventas canceladas automáticamente
- ✅ Los snapshots de atributos son inmutables (no se modifican)
- ✅ El sistema soporta múltiples tipos de atributos (select, text, number)

---

**Implementado por:** GitHub Copilot  
**Fecha:** 30 de diciembre de 2025  
**Versión:** 1.0.0
