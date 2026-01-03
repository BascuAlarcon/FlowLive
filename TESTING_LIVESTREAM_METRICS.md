# 🧪 Testing: Endpoints de Livestream Metrics

## 📋 Guía de Pruebas

### 1️⃣ Crear un Livestream

```bash
POST http://localhost:3000/api/livestreams
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "title": "Live de Prueba - Ropa de Invierno",
  "platform": "instagram",
  "viewerCount": 0
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "clxxxxx_livestream_id",
    "title": "Live de Prueba - Ropa de Invierno",
    "platform": "instagram",
    "startedAt": "2025-12-30T...",
    "endedAt": null
  },
  "message": "Livestream iniciado exitosamente"
}
```

---

### 2️⃣ Crear LiveItems para el Livestream

```bash
POST http://localhost:3000/api/liveitems
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "categoryId": "category_ropa_id",
  "livestreamId": "clxxxxx_livestream_id",
  "price": 25000,
  "quantity": 2,
  "status": "available",
  "imageUrl": "https://example.com/polera.jpg",
  "notes": "Polera negra talla M"
}
```

---

### 3️⃣ Agregar Items al Carrito de Clientes

```bash
POST http://localhost:3000/api/carts/items
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "customerId": "customer_maria_id",
  "liveItemId": "liveitem_polera_id",
  "quantity": 1,
  "livestreamId": "clxxxxx_livestream_id"
}
```

**Nota:** Aquí se guardará automáticamente:
- `SaleItem.livestreamId = "clxxxxx_livestream_id"`
- `SaleItem.attributesSnapshot = [{ name: "Color", value: "Negro", ... }]`

---

### 4️⃣ Confirmar Carrito (Simular Compra)

```bash
POST http://localhost:3000/api/carts/{cartId}/confirm
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "paymentMethod": "transfer",
  "paymentAmount": 25000
}
```

---

### 5️⃣ Obtener Estadísticas Detalladas del Live

```bash
GET http://localhost:3000/api/livestreams/{livestreamId}/detailed-stats
Authorization: Bearer <tu_token>
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "livestream": {
      "id": "clxxxxx",
      "title": "Live de Prueba - Ropa de Invierno",
      "platform": "instagram",
      "seller": "user_123",
      "startDate": "2025-12-30T15:00:00.000Z",
      "endDate": null,
      "durationMinutes": 45,
      "isActive": true,
      "viewerCount": 120
    },
    "metrics": {
      "totalEstimatedAmount": 50000,
      "totalClosedAmount": 25000,
      "averageCartAmount": 25000,
      "averageProductsPerCart": 1,
      "closureRate": 100,
      "totalCustomers": 1,
      "totalProductsSold": 1,
      "averageProductsPerCustomer": 1
    },
    "topProducts": [
      {
        "liveItemId": "liveitem_polera_id",
        "categoryName": "Ropa",
        "price": 25000,
        "quantity": 1,
        "totalRevenue": 25000,
        "imageUrl": "https://example.com/polera.jpg"
      }
    ],
    "topCustomers": [
      {
        "customerId": "customer_maria_id",
        "customerName": "María González",
        "totalPurchases": 1,
        "totalSpent": 25000,
        "productsCount": 1
      }
    ],
    "topAttributes": {
      "Color": [
        {
          "value": "Negro",
          "count": 1,
          "revenue": 25000
        }
      ],
      "Talla": [
        {
          "value": "M",
          "count": 1,
          "revenue": 25000
        }
      ]
    }
  }
}
```

---

### 6️⃣ Cerrar el Livestream

```bash
POST http://localhost:3000/api/livestreams/{livestreamId}/close
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "viewerCount": 150
}
```

---

## 🧪 Escenario de Prueba Completo

### Flujo Recomendado para Testing:

1. **Crear Livestream**
   ```
   POST /api/livestreams
   { "title": "Live Test", "platform": "instagram" }
   ```

2. **Crear 5 LiveItems** con diferentes atributos:
   - Polera Roja M ($20.000)
   - Polera Negra L ($20.000)
   - Pantalón Azul M ($30.000)
   - Pantalón Negro L ($30.000)
   - Chaqueta Negra XL ($50.000)

3. **Crear 3 Clientes**:
   - María
   - Juan
   - Pedro

4. **Simular Compras**:
   
   **María compra:**
   - 1 Polera Roja M
   - 1 Pantalón Azul M
   - Confirma su carrito ($50.000)
   
   **Juan compra:**
   - 1 Polera Negra L
   - 1 Chaqueta Negra XL
   - Confirma su carrito ($70.000)
   
   **Pedro compra:**
   - 1 Pantalón Negro L
   - NO confirma (deja el carrito en "reserved")

5. **Obtener Estadísticas**:
   ```
   GET /api/livestreams/{id}/detailed-stats
   ```

### Resultado Esperado:

```json
{
  "metrics": {
    "totalEstimatedAmount": 150000,     // Suma de los 5 productos
    "totalClosedAmount": 120000,        // Solo María + Juan
    "averageCartAmount": 50000,         // (50k + 70k + 30k) / 3
    "averageProductsPerCart": 1.67,     // (2 + 2 + 1) / 3
    "closureRate": 66.67,               // 2 confirmados / 3 carritos
    "totalCustomers": 2,                // Solo María y Juan confirmaron
    "totalProductsSold": 4,             // 2 de María + 2 de Juan
    "averageProductsPerCustomer": 2     // 4 / 2
  },
  "topProducts": [
    // Todos empatan con 1 venta cada uno
  ],
  "topCustomers": [
    {
      "customerName": "Juan",
      "totalSpent": 70000,
      "totalPurchases": 1,
      "productsCount": 2
    },
    {
      "customerName": "María",
      "totalSpent": 50000,
      "totalPurchases": 1,
      "productsCount": 2
    }
  ],
  "topAttributes": {
    "Color": [
      { "value": "Negro", "count": 2, "revenue": 80000 },  // Polera + Chaqueta
      { "value": "Rojo", "count": 1, "revenue": 20000 },
      { "value": "Azul", "count": 1, "revenue": 30000 }
    ],
    "Talla": [
      { "value": "M", "count": 2, "revenue": 50000 },      // Polera + Pantalón
      { "value": "L", "count": 1, "revenue": 20000 },
      { "value": "XL", "count": 1, "revenue": 50000 }
    ]
  }
}
```

---

## 📊 Postman Collection

Puedes importar esta colección en Postman:

```json
{
  "info": {
    "name": "Livestream Metrics Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Create Livestream",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Live de Prueba\",\n  \"platform\": \"instagram\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/livestreams",
          "host": ["{{baseUrl}}"],
          "path": ["api", "livestreams"]
        }
      }
    },
    {
      "name": "2. Get Detailed Stats",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/livestreams/{{livestreamId}}/detailed-stats",
          "host": ["{{baseUrl}}"],
          "path": ["api", "livestreams", "{{livestreamId}}", "detailed-stats"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "token",
      "value": "tu_token_aqui"
    },
    {
      "key": "livestreamId",
      "value": "id_del_livestream"
    }
  ]
}
```

---

## 🐛 Debugging

### Verificar datos en la base de datos:

```sql
-- Ver SaleItems con livestreamId y attributesSnapshot
SELECT 
  id,
  saleId,
  liveItemId,
  livestreamId,
  attributesSnapshot,
  quantity,
  totalPrice
FROM SaleItem
WHERE livestreamId IS NOT NULL;

-- Ver ventas por livestream
SELECT 
  l.title,
  COUNT(DISTINCT si.saleId) as total_carritos,
  SUM(si.quantity) as productos_vendidos,
  SUM(si.totalPrice) as revenue_total
FROM Livestream l
LEFT JOIN SaleItem si ON si.livestreamId = l.id
LEFT JOIN Sale s ON si.saleId = s.id
WHERE s.status != 'cancelled'
GROUP BY l.id;

-- Ver atributos más vendidos
SELECT 
  JSON_EXTRACT(si.attributesSnapshot, '$[*].name') as atributos,
  JSON_EXTRACT(si.attributesSnapshot, '$[*].value') as valores,
  SUM(si.quantity) as cantidad_vendida
FROM SaleItem si
JOIN Sale s ON si.saleId = s.id
WHERE s.status = 'confirmed'
  AND si.attributesSnapshot IS NOT NULL
GROUP BY si.attributesSnapshot;
```

---

## ✅ Checklist de Testing

- [ ] Crear livestream
- [ ] Crear varios LiveItems con atributos
- [ ] Crear varios clientes
- [ ] Agregar items a carritos (diferentes combinaciones)
- [ ] Confirmar algunos carritos
- [ ] Dejar algunos carritos sin confirmar
- [ ] Cancelar algún carrito
- [ ] Obtener estadísticas detalladas
- [ ] Verificar que todos los campos tienen valores correctos
- [ ] Verificar que topProducts está ordenado correctamente
- [ ] Verificar que topCustomers está ordenado correctamente
- [ ] Verificar que topAttributes muestra todos los atributos
- [ ] Cerrar el livestream
- [ ] Volver a consultar estadísticas del live cerrado

---

**Última actualización:** 30 de diciembre de 2025
