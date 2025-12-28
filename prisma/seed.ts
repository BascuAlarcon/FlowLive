import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // 1. Obtener la organización existente
  const organization = await prisma.organization.findFirst();
  if (!organization) {
    throw new Error('No existe ninguna organización. Registra un usuario primero.');
  }
  console.log(`✅ Organización encontrada: ${organization.name} (${organization.id})`);

  const organizationId = organization.id;

  // Obtener el primer usuario de la organización
  const orgUser = await prisma.organizationUser.findFirst({
    where: { organizationId },
  });
  if (!orgUser) {
    throw new Error('No hay usuarios en la organización');
  }
  const userId = orgUser.userId;
  console.log(`✅ Usuario encontrado: ${userId}\n`);

  // 2. Crear ProductCategory
  console.log('📦 Creando categoría "Ropa"...');
  const category = await prisma.productCategory.upsert({
    where: {
      organizationId_name: {
        organizationId,
        name: 'Ropa',
      },
    },
    update: {},
    create: {
      organizationId,
      name: 'Ropa',
      description: 'Categoría de vestuario y prendas de vestir',
      isActive: true,
    },
  });
  console.log(`✅ Categoría creada: ${category.name} (${category.id})\n`);

  // 3. Crear CategoryAttributes
  console.log('🎨 Creando atributos...');
  
  const colorAttribute = await prisma.categoryAttribute.upsert({
    where: {
      id: 'temp-color-id',
    },
    update: {},
    create: {
      categoryId: category.id,
      name: 'Color',
      type: 'select',
      isRequired: true,
      order: 1,
    },
  });
  console.log(`  ✅ Atributo: ${colorAttribute.name} (${colorAttribute.id})`);

  const tallaAttribute = await prisma.categoryAttribute.upsert({
    where: {
      id: 'temp-talla-id',
    },
    update: {},
    create: {
      categoryId: category.id,
      name: 'Talla',
      type: 'select',
      isRequired: true,
      order: 2,
    },
  });
  console.log(`  ✅ Atributo: ${tallaAttribute.name} (${tallaAttribute.id})\n`);

  // 4. Crear AttributeValues para Color
  console.log('🎨 Creando valores de Color...');
  
  const colorRojo = await prisma.attributeValue.upsert({
    where: {
      attributeId_value: {
        attributeId: colorAttribute.id,
        value: 'Rojo',
      },
    },
    update: {},
    create: {
      attributeId: colorAttribute.id,
      value: 'Rojo',
      hexCode: '#FF0000',
      order: 1,
    },
  });
  console.log(`  ✅ ${colorRojo.value} (${colorRojo.id})`);

  const colorAzul = await prisma.attributeValue.upsert({
    where: {
      attributeId_value: {
        attributeId: colorAttribute.id,
        value: 'Azul',
      },
    },
    update: {},
    create: {
      attributeId: colorAttribute.id,
      value: 'Azul',
      hexCode: '#0000FF',
      order: 2,
    },
  });
  console.log(`  ✅ ${colorAzul.value} (${colorAzul.id})`);

  const colorNegro = await prisma.attributeValue.upsert({
    where: {
      attributeId_value: {
        attributeId: colorAttribute.id,
        value: 'Negro',
      },
    },
    update: {},
    create: {
      attributeId: colorAttribute.id,
      value: 'Negro',
      hexCode: '#000000',
      order: 3,
    },
  });
  console.log(`  ✅ ${colorNegro.value} (${colorNegro.id})\n`);

  // 5. Crear AttributeValues para Talla
  console.log('📏 Creando valores de Talla...');
  
  const tallaS = await prisma.attributeValue.upsert({
    where: {
      attributeId_value: {
        attributeId: tallaAttribute.id,
        value: 'S',
      },
    },
    update: {},
    create: {
      attributeId: tallaAttribute.id,
      value: 'S',
      order: 1,
    },
  });
  console.log(`  ✅ ${tallaS.value} (${tallaS.id})`);

  const tallaM = await prisma.attributeValue.upsert({
    where: {
      attributeId_value: {
        attributeId: tallaAttribute.id,
        value: 'M',
      },
    },
    update: {},
    create: {
      attributeId: tallaAttribute.id,
      value: 'M',
      order: 2,
    },
  });
  console.log(`  ✅ ${tallaM.value} (${tallaM.id})`);

  const tallaL = await prisma.attributeValue.upsert({
    where: {
      attributeId_value: {
        attributeId: tallaAttribute.id,
        value: 'L',
      },
    },
    update: {},
    create: {
      attributeId: tallaAttribute.id,
      value: 'L',
      order: 3,
    },
  });
  console.log(`  ✅ ${tallaL.value} (${tallaL.id})`);

  const tallaXL = await prisma.attributeValue.upsert({
    where: {
      attributeId_value: {
        attributeId: tallaAttribute.id,
        value: 'XL',
      },
    },
    update: {},
    create: {
      attributeId: tallaAttribute.id,
      value: 'XL',
      order: 4,
    },
  });
  console.log(`  ✅ ${tallaXL.value} (${tallaXL.id})\n`);

  // 6. Crear Customer
  console.log('👤 Creando cliente...');
  
  const customer = await prisma.customer.upsert({
    where: {
      id: 'temp-customer-id',
    },
    update: {},
    create: {
      organizationId,
      name: 'María González',
      username: '@maria_ig',
      contact: '+56912345678',
      notes: 'Cliente frecuente, prefiere colores oscuros',
    },
  });
  console.log(`✅ Cliente creado: ${customer.name} (${customer.id})\n`);

  // 7. Crear Livestream
  console.log('🔴 Creando livestream...');
  
  const livestream = await prisma.livestream.create({
    data: {
      organizationId,
      title: 'Live Navidad 2025 - Especial Ropa',
      platform: 'instagram',
      viewerCount: 250,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdBy: userId,
    },
  });
  console.log(`✅ Livestream creado: ${livestream.title} (${livestream.id})\n`);

  // 8. Crear LiveItems
  console.log('👕 Creando LiveItems...');
  
  const liveItems = [
    { color: colorRojo, talla: tallaS, price: 15000, qty: 1, notes: 'Polera roja S' },
    { color: colorRojo, talla: tallaM, price: 15000, qty: 2, notes: 'Polera roja M - 2 unidades' },
    { color: colorRojo, talla: tallaL, price: 15000, qty: 1, notes: 'Polera roja L' },
    { color: colorAzul, talla: tallaM, price: 15000, qty: 1, notes: 'Polera azul M' },
    { color: colorAzul, talla: tallaL, price: 16000, qty: 1, notes: 'Polera azul L - Premium' },
    { color: colorNegro, talla: tallaM, price: 16000, qty: 3, notes: 'Polera negra M - 3 unidades' },
    { color: colorNegro, talla: tallaL, price: 16000, qty: 1, notes: 'Polera negra L' },
    { color: colorNegro, talla: tallaXL, price: 17000, qty: 1, notes: 'Polera negra XL' },
  ];

  const createdLiveItems = [];
  for (const itemData of liveItems) {
    const item = await prisma.liveItem.create({
      data: {
        organizationId,
        categoryId: category.id,
        livestreamId: livestream.id,
        price: itemData.price,
        quantity: itemData.qty,
        status: 'available',
        notes: itemData.notes,
        imageUrl: 'https://via.placeholder.com/400x400?text=Polera',
      },
    });

    await prisma.liveItemAttributeValue.createMany({
      data: [
        {
          liveItemId: item.id,
          attributeValueId: itemData.color.id,
        },
        {
          liveItemId: item.id,
          attributeValueId: itemData.talla.id,
        },
      ],
    });

    createdLiveItems.push(item);
    console.log(`  ✅ ${itemData.notes} - Precio: $${itemData.price} - Qty: ${itemData.qty}`);
  }
  console.log();

  // 9. Crear Sale
  console.log('💰 Creando venta...');
  
  const item1 = createdLiveItems[1];
  const item2 = createdLiveItems[5];

  const sale = await prisma.sale.create({
    data: {
      organizationId,
      customerId: customer.id,
      livestreamId: livestream.id,
      sellerId: userId,
      status: 'confirmed',
      totalAmount: 47000,
      notes: 'Compra durante el live de Navidad',
      SaleItem: {
        create: [
          {
            liveItemId: item1.id,
            quantity: 2,
            unitPrice: item1.price,
            totalPrice: Number(item1.price) * 2,
          },
          {
            liveItemId: item2.id,
            quantity: 1,
            unitPrice: item2.price,
            totalPrice: Number(item2.price) * 1,
          },
        ],
      },
      Payment: {
        create: {
          method: 'transfer',
          amount: 47000,
          status: 'paid',
          reference: 'TRANSF-2025-001',
          paidAt: new Date(),
        },
      },
    },
    include: {
      SaleItem: true,
      Payment: true,
    },
  });

  console.log(`✅ Venta creada: ${sale.id}`);
  console.log(`   - Total: $${sale.totalAmount}`);
  console.log(`   - Items: ${sale.SaleItem.length}`);
  console.log(`   - Estado: ${sale.status}`);
  console.log(`   - Pago: ${sale.Payment[0].status}\n`);

  // 10. Actualizar status de items vendidos
  console.log('📦 Actualizando status de items vendidos...');
  
  await prisma.liveItem.update({
    where: { id: item1.id },
    data: { 
      status: 'sold',
      quantity: 0,
    },
  });
  console.log(`  ✅ ${item1.notes}: sold`);

  await prisma.liveItem.update({
    where: { id: item2.id },
    data: { 
      status: 'available',
      quantity: 2,
    },
  });
  console.log(`  ✅ ${item2.notes}: quedan 2 unidades\n`);

  console.log('✨ ¡Seed completado exitosamente!\n');
  console.log('📊 Resumen:');
  console.log(`   - 1 Categoría (Ropa)`);
  console.log(`   - 2 Atributos (Color, Talla)`);
  console.log(`   - 7 Valores de atributos (3 colores + 4 tallas)`);
  console.log(`   - 8 LiveItems (items individuales para vender)`);
  console.log(`   - 1 Cliente (María González)`);
  console.log(`   - 1 Livestream (Live Navidad 2025)`);
  console.log(`   - 1 Venta con 2 items y 1 pago confirmado\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
