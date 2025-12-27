# Sistema de Categorías y Atributos Dinámicos

## 📋 Resumen del Cambio

Se ha implementado un sistema flexible de categorías y atributos para reemplazar las tablas rígidas de `colors` y `sizes`. Ahora cada organización puede:

- ✅ Crear sus propias **categorías de productos** (Ropa, Joyas, Maquillaje, etc.)
- ✅ Definir **atributos personalizados** por categoría (Color, Talla, Material, Tamaño, Volumen, etc.)
- ✅ Configurar **valores específicos** para cada atributo
- ✅ Crear **variantes de productos** con combinaciones flexibles de atributos

---

## 🗂️ Nuevas Tablas

### 1. `ProductCategory`
Categorías de productos configurables por organización.

**Campos:**
- `id`, `organizationId`, `name`, `description`, `isActive`

**Ejemplo:**
```typescript
{
  organizationId: "org_123",
  name: "Joyas",
  description: "Anillos, collares, pulseras"
}
```

### 2. `CategoryAttribute`
Atributos que pertenecen a una categoría.

**Campos:**
- `id`, `categoryId`, `name`, `type` (select/text/number), `isRequired`, `order`

**Ejemplo:**
```typescript
{
  categoryId: "cat_joyas",
  name: "Material",
  type: "select",
  isRequired: false,
  order: 0
}
```

### 3. `AttributeValue`
Valores posibles para un atributo tipo "select".

**Campos:**
- `id`, `attributeId`, `value`, `hexCode` (opcional), `order`, `isActive`

**Ejemplo:**
```typescript
{
  attributeId: "attr_material",
  value: "Oro",
  hexCode: null,
  order: 0
}
```

### 4. `VariantAttributeValue`
Tabla intermedia que relaciona variantes con valores de atributos.

**Campos:**
- `id`, `variantId`, `attributeValueId`

---

## 🔄 Migración de Datos Existentes

La migración automáticamente:

1. ✅ Creó una categoría "Ropa" por defecto para cada organización
2. ✅ Creó atributos "Color" y "Talla" para la categoría "Ropa"
3. ✅ Migró todos los colores de `color` → `AttributeValue`
4. ✅ Migró todas las tallas de `size` → `AttributeValue`
5. ✅ Migró las relaciones de `ProductVariant` → `VariantAttributeValue`
6. ✅ Asignó todos los productos existentes a la categoría "Ropa"

**Los datos existentes NO se perdieron.**

---

## 📝 Ejemplos de Uso

### Crear Categoría + Atributos para Joyas

```typescript
// 1. Crear categoría
const category = await prisma.productCategory.create({
  data: {
    organizationId: "org_123",
    name: "Joyas",
    description: "Anillos, collares, pulseras"
  }
});

// 2. Crear atributo "Material"
const materialAttr = await prisma.categoryAttribute.create({
  data: {
    categoryId: category.id,
    name: "Material",
    type: "select",
    order: 0
  }
});

// 3. Crear valores para "Material"
await prisma.attributeValue.createMany({
  data: [
    { attributeId: materialAttr.id, value: "Oro", order: 0 },
    { attributeId: materialAttr.id, value: "Plata", order: 1 },
    { attributeId: materialAttr.id, value: "Acero", order: 2 }
  ]
});

// 4. Crear atributo "Tamaño"
const sizeAttr = await prisma.categoryAttribute.create({
  data: {
    categoryId: category.id,
    name: "Tamaño",
    type: "select",
    order: 1
  }
});

// 5. Crear valores para "Tamaño"
await prisma.attributeValue.createMany({
  data: [
    { attributeId: sizeAttr.id, value: "Pequeño", order: 0 },
    { attributeId: sizeAttr.id, value: "Mediano", order: 1 },
    { attributeId: sizeAttr.id, value: "Grande", order: 2 }
  ]
});
```

### Crear Producto con Variante de Joyas

```typescript
// 1. Crear producto en categoría "Joyas"
const product = await prisma.product.create({
  data: {
    organizationId: "org_123",
    categoryId: category.id,
    name: "Anillo Elegante",
    basePrice: 49.99,
    sku: "ANILLO-001"
  }
});

// 2. Buscar valores de atributos (Oro + Grande)
const oroValue = await prisma.attributeValue.findFirst({
  where: { attributeId: materialAttr.id, value: "Oro" }
});

const grandeValue = await prisma.attributeValue.findFirst({
  where: { attributeId: sizeAttr.id, value: "Grande" }
});

// 3. Crear variante
const variant = await prisma.productVariant.create({
  data: {
    productId: product.id,
    organizationId: "org_123",
    name: "Oro - Grande",
    sku: "ANILLO-001-ORO-G",
    price: 59.99,
    stockQuantity: 10
  }
});

// 4. Relacionar variante con atributos
await prisma.variantAttributeValue.createMany({
  data: [
    { variantId: variant.id, attributeValueId: oroValue.id },
    { variantId: variant.id, attributeValueId: grandeValue.id }
  ]
});
```

### Consultar Variante con sus Atributos

```typescript
const variant = await prisma.productVariant.findUnique({
  where: { id: "variant_123" },
  include: {
    Product: {
      include: {
        category: {
          include: {
            attributes: {
              include: {
                values: true
              }
            }
          }
        }
      }
    },
    attributeValues: {
      include: {
        attributeValue: {
          include: {
            attribute: true
          }
        }
      }
    }
  }
});

// Resultado ejemplo:
// {
//   name: "Oro - Grande",
//   Product: {
//     name: "Anillo Elegante",
//     category: {
//       name: "Joyas",
//       attributes: [
//         { name: "Material", values: [...] },
//         { name: "Tamaño", values: [...] }
//       ]
//     }
//   },
//   attributeValues: [
//     { attributeValue: { value: "Oro", attribute: { name: "Material" } } },
//     { attributeValue: { value: "Grande", attribute: { name: "Tamaño" } } }
//   ]
// }
```

---

## 🎯 Casos de Uso por Nicho

### Vendedor de Ropa
**Categoría:** Ropa  
**Atributos:**
- Color (select): Rojo, Azul, Negro, Blanco
- Talla (select): S, M, L, XL

**Variante ejemplo:** Polera - Rojo - M

---

### Vendedor de Joyas
**Categoría:** Joyas  
**Atributos:**
- Material (select): Oro, Plata, Acero
- Tamaño (select): Pequeño, Mediano, Grande

**Variante ejemplo:** Anillo - Oro - Grande

---

### Vendedor de Maquillaje
**Categoría:** Maquillaje  
**Atributos:**
- Tono (select): Natural, Beige, Caramelo
- Volumen (select): 5ml, 10ml, 15ml

**Variante ejemplo:** Base - Natural - 10ml

---

### Vendedor de Electrónica
**Categoría:** Electrónica  
**Atributos:**
- Capacidad (text): 128GB, 256GB, 512GB
- Color (select): Negro, Blanco, Azul

**Variante ejemplo:** Smartphone - Negro - 256GB

---

## 🚀 Integración con Modo Live

El formulario del Modo Live ahora:

1. **Muestra selector de Categoría** (opcional, para filtrar)
2. **Carga los Productos** filtrados por categoría
3. **Al seleccionar producto**, carga sus atributos dinámicamente
4. **Muestra pickers de atributos** según la categoría:
   - Ropa → Color + Talla
   - Joyas → Material + Tamaño
   - Maquillaje → Tono + Volumen
5. **Auto-crea o selecciona la variante** correspondiente

---

## 📌 Consideraciones Importantes

### ✅ Ventajas
- Total flexibilidad por organización
- Soporta cualquier tipo de producto
- No hay contaminación entre nichos
- Escalable a futuro

### ⚠️ Cambios en el Código

**Antes (rígido):**
```typescript
const variant = await prisma.productVariant.findFirst({
  where: { 
    productId, 
    colorId: "color_123", 
    sizeId: "size_456" 
  }
});
```

**Ahora (dinámico):**
```typescript
// 1. Buscar variante que tenga ambos atributos
const variant = await prisma.productVariant.findFirst({
  where: {
    productId,
    attributeValues: {
      every: {
        attributeValueId: {
          in: ["attrval_oro", "attrval_grande"]
        }
      }
    }
  }
});

// 2. Si no existe, crear variante con atributos
const newVariant = await prisma.productVariant.create({
  data: {
    productId,
    name: "Oro - Grande",
    sku: `${product.sku}-ORO-G`,
    price: product.basePrice,
    attributeValues: {
      create: [
        { attributeValueId: "attrval_oro" },
        { attributeValueId: "attrval_grande" }
      ]
    }
  }
});
```

---

## 🛠️ Tareas Pendientes

- [ ] Actualizar módulo `products` para manejar categorías
- [ ] Actualizar módulo `colors` → renombrar a `categories`
- [ ] Actualizar módulo `sizes` → renombrar a `attributes`
- [ ] Actualizar lógica de creación de variantes en Modo Live
- [ ] Actualizar validaciones de Zod
- [ ] Actualizar tests
- [ ] Agregar endpoints CRUD para:
  - Categorías
  - Atributos
  - Valores de atributos

---

## 📚 Referencias

- [README principal](./readme.md)
- [Schema de Prisma](./prisma/schema.prisma)
- [Migración aplicada](./prisma/migrations/20251226181041_add_dynamic_categories_and_attributes_system/)
