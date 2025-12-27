# Módulos de la API

## ✅ Módulos Actualizados

### 🗂️ categories
**Gestión de Categorías de Productos**

Maneja las categorías configurables por organización (Ropa, Joyas, Maquillaje, etc.).

**Endpoints:**
- `GET /api/categories` - Listar categorías
- `POST /api/categories` - Crear categoría
- `GET /api/categories/:id` - Obtener categoría con atributos
- `PUT /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría
- `GET /api/categories/:categoryId/attributes` - Listar atributos de categoría

---

### 🏷️ attributes
**Gestión de Atributos y Valores**

Maneja atributos dinámicos (Color, Talla, Material, etc.) y sus valores.

**Endpoints de Atributos:**
- `POST /api/attributes` - Crear atributo
- `GET /api/attributes/:id` - Obtener atributo
- `PUT /api/attributes/:id` - Actualizar atributo
- `DELETE /api/attributes/:id` - Eliminar atributo

**Endpoints de Valores:**
- `GET /api/attributes/:attributeId/values` - Listar valores
- `POST /api/attributes/values` - Crear valor
- `GET /api/attributes/values/:id` - Obtener valor
- `PUT /api/attributes/values/:id` - Actualizar valor
- `DELETE /api/attributes/values/:id` - Eliminar valor

---

### 📦 products
**Gestión de Productos**

Actualizado para soportar categorías y variantes con atributos dinámicos.

**Cambios principales:**
- Ahora requiere `categoryId` al crear
- Soporte para filtrado por categoría e isActive
- Incluye categoría y variantes con atributos en las respuestas
- Validación de SKU único por organización
- Soft delete en cascada de variantes

**Endpoints:**
- `GET /api/products?categoryId=xxx&isActive=true` - Listar productos
- `POST /api/products` - Crear producto
- `GET /api/products/:id` - Obtener producto con variantes
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto (soft delete)

---

## ❌ Módulos Eliminados

### ~colors~ → ✅ categories + attributes
El módulo `colors` fue reemplazado por el sistema de categorías y atributos dinámicos.

**Antes:**
```typescript
GET /api/colors
POST /api/colors { name: "Rojo", hexCode: "#FF0000" }
```

**Ahora:**
```typescript
// 1. Crear categoría
POST /api/categories { name: "Ropa" }

// 2. Crear atributo "Color"
POST /api/attributes { 
  categoryId: "cat_123", 
  name: "Color", 
  type: "select" 
}

// 3. Crear valor "Rojo"
POST /api/attributes/values { 
  attributeId: "attr_123", 
  value: "Rojo", 
  hexCode: "#FF0000" 
}
```

---

### ~sizes~ → ✅ categories + attributes
El módulo `sizes` también fue reemplazado por el sistema de atributos.

**Antes:**
```typescript
GET /api/sizes
POST /api/sizes { name: "M", order: 1 }
```

**Ahora:**
```typescript
// 1. Usar categoría existente (ej: Ropa)
// 2. Crear atributo "Talla"
POST /api/attributes { 
  categoryId: "cat_123", 
  name: "Talla", 
  type: "select",
  order: 1
}

// 3. Crear valor "M"
POST /api/attributes/values { 
  attributeId: "attr_456", 
  value: "M", 
  order: 1 
}
```

---

## 🔄 Flujo de Creación Completo

### Ejemplo: Vendedor de Joyas

```typescript
// 1. Crear categoría "Joyas"
POST /api/categories
{
  "name": "Joyas",
  "description": "Anillos, collares, pulseras"
}
// Response: { id: "cat_joyas", ... }

// 2. Crear atributo "Material"
POST /api/attributes
{
  "categoryId": "cat_joyas",
  "name": "Material",
  "type": "select",
  "order": 0
}
// Response: { id: "attr_material", ... }

// 3. Crear valores de Material
POST /api/attributes/values
{
  "attributeId": "attr_material",
  "value": "Oro",
  "order": 0
}

POST /api/attributes/values
{
  "attributeId": "attr_material",
  "value": "Plata",
  "order": 1
}

// 4. Crear atributo "Tamaño"
POST /api/attributes
{
  "categoryId": "cat_joyas",
  "name": "Tamaño",
  "type": "select",
  "order": 1
}
// Response: { id: "attr_size", ... }

// 5. Crear valores de Tamaño
POST /api/attributes/values
{
  "attributeId": "attr_size",
  "value": "Pequeño",
  "order": 0
}

POST /api/attributes/values
{
  "attributeId": "attr_size",
  "value": "Grande",
  "order": 1
}

// 6. Crear producto
POST /api/products
{
  "categoryId": "cat_joyas",
  "name": "Anillo Elegante",
  "basePrice": 49.99,
  "sku": "ANILLO-001"
}

// 7. Crear variante (próxima actualización)
// Se integrará con el sistema de atributos
```

---

## 📊 Estructura de Respuesta

### GET /api/products/:id

```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "Anillo Elegante",
    "basePrice": 49.99,
    "sku": "ANILLO-001",
    "category": {
      "id": "cat_joyas",
      "name": "Joyas",
      "attributes": [
        {
          "id": "attr_material",
          "name": "Material",
          "type": "select",
          "order": 0,
          "values": [
            { "id": "val_1", "value": "Oro", "order": 0 },
            { "id": "val_2", "value": "Plata", "order": 1 }
          ]
        },
        {
          "id": "attr_size",
          "name": "Tamaño",
          "type": "select",
          "order": 1,
          "values": [
            { "id": "val_3", "value": "Pequeño", "order": 0 },
            { "id": "val_4", "value": "Grande", "order": 1 }
          ]
        }
      ]
    },
    "ProductVariant": [
      {
        "id": "var_123",
        "name": "Oro - Grande",
        "price": 59.99,
        "stockQuantity": 10,
        "attributeValues": [
          {
            "attributeValue": {
              "value": "Oro",
              "attribute": { "name": "Material" }
            }
          },
          {
            "attributeValue": {
              "value": "Grande",
              "attribute": { "name": "Tamaño" }
            }
          }
        ]
      }
    ]
  }
}
```

---

## 🚀 Próximos Pasos

- [ ] Actualizar módulo de variantes para crear/buscar con atributos dinámicos
- [ ] Actualizar Modo Live para usar pickers dinámicos
- [ ] Migrar datos de prueba existentes
- [ ] Actualizar tests
- [ ] Documentar API completa con Swagger/OpenAPI
