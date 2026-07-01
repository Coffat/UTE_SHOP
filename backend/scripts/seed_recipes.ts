import '../config/loadEnv.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Material from '../modules/inventory/models/Material.js';
import Recipe from '../modules/catalog/models/Recipe.js';
import ProductVariant from '../modules/catalog/models/ProductVariant.js';
import StockLevel from '../modules/inventory/models/StockLevel.js';
import Warehouse from '../modules/inventory/models/Warehouse.js';

const MATERIALS_DATA = [
  { name: 'Hoa hồng đỏ Ecuador', unit: 'Cành', costPerUnit: '12000', shelfLifeDays: 7 },
  { name: 'Hoa hồng vàng Ecuador', unit: 'Cành', costPerUnit: '12000', shelfLifeDays: 7 },
  { name: 'Hoa hồng kem dâu', unit: 'Cành', costPerUnit: '10000', shelfLifeDays: 7 },
  { name: 'Hoa Tulip trắng', unit: 'Cành', costPerUnit: '18000', shelfLifeDays: 5 },
  { name: 'Hoa Tulip hồng', unit: 'Cành', costPerUnit: '18000', shelfLifeDays: 5 },
  { name: 'Hoa hướng dương đại', unit: 'Cành', costPerUnit: '15000', shelfLifeDays: 6 },
  { name: 'Hoa cẩm tú cầu xanh', unit: 'Cành', costPerUnit: '25000', shelfLifeDays: 5 },
  { name: 'Hoa oải hương khô Pháp', unit: 'Nhánh', costPerUnit: '5000', shelfLifeDays: 365 },
  { name: 'Hoa baby trắng', unit: 'Cành', costPerUnit: '8000', shelfLifeDays: 10 },
  { name: 'Lá bạc tròn nhập khẩu', unit: 'Nhánh', costPerUnit: '3000', shelfLifeDays: 14 },
  { name: 'Giấy gói xi măng vintage', unit: 'Tờ', costPerUnit: '2000', shelfLifeDays: null },
  { name: 'Giấy kiếng mờ Pháp', unit: 'Tờ', costPerUnit: '3500', shelfLifeDays: null },
  { name: 'Ruy băng lụa tơ tằm', unit: 'Mét', costPerUnit: '4000', shelfLifeDays: null },
  { name: 'Gấu bông Teddy nâu size M', unit: 'Con', costPerUnit: '95000', shelfLifeDays: null },
  { name: 'Gấu bông Teddy trắng ôm tim', unit: 'Con', costPerUnit: '110000', shelfLifeDays: null }
];

async function run() {
  console.log('🌱 Starting recipe (BOM) & material seeding script...');
  await connectDB();

  // 1. Clean materials & recipes
  console.log('🧹 Cleaning old materials & recipes...');
  await Recipe.deleteMany({});
  await Material.deleteMany({});
  
  // Drop old unique indexes to ensure new partial indexes are created correctly
  try {
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections({ name: 'stocklevels' }).toArray();
      if (collections.length > 0) {
        console.log('🧹 Dropping old indexes on stocklevels if they exist...');
        try {
          await db.collection('stocklevels').dropIndex('warehouse_1_productVariant_1');
          console.log('   - Dropped warehouse_1_productVariant_1');
        } catch (_) {}
        try {
          await db.collection('stocklevels').dropIndex('warehouse_1_material_1');
          console.log('   - Dropped warehouse_1_material_1');
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('⚠️ Warning: Failed to drop indexes:', err);
  }

  // clean stock levels of materials
  await StockLevel.deleteMany({ material: { $ne: null } });

  // 2. Seed Materials
  console.log('🌾 Seeding Materials...');
  const createdMaterials: Record<string, any> = {};
  for (const mat of MATERIALS_DATA) {
    const doc = await Material.create({
      name: mat.name,
      unit: mat.unit,
      costPerUnit: mongoose.Types.Decimal128.fromString(mat.costPerUnit),
      shelfLifeDays: mat.shelfLifeDays
    });
    createdMaterials[mat.name] = doc;
    console.log(`   + Created Material: ${doc.name} (${doc.unit})`);
  }

  // Find a warehouse to seed stock levels for materials
  const warehouse = await Warehouse.findOne({ isActive: true }) || await Warehouse.findOne({});
  if (warehouse) {
    console.log(`🏭 Found warehouse: ${warehouse.name}. Initializing material stock levels...`);
    for (const matName of Object.keys(createdMaterials)) {
      const mat = createdMaterials[matName];
      await StockLevel.create({
        warehouse: warehouse._id,
        material: mat._id,
        quantity: mongoose.Types.Decimal128.fromString('100'), // initial 100 units
        minThreshold: mongoose.Types.Decimal128.fromString('10')
      });
    }
    console.log(`✅ Initialized stock levels (100 qty) for all raw materials.`);
  }

  // 3. Seed Recipes for Product Variants
  console.log('🧾 Seeding Recipes...');
  const variants = await ProductVariant.find({});
  console.log(`   Found ${variants.length} product variants in DB.`);

  let seededCount = 0;
  for (const variant of variants) {
    const sku = variant.sku || '';
    const ingredients: any[] = [];

    // Setup wrapping materials for every bouquet (except single stems)
    const isSingleStem = sku.includes('SG-');
    if (!isSingleStem) {
      ingredients.push({
        material: createdMaterials['Giấy kiếng mờ Pháp']._id,
        amount: mongoose.Types.Decimal128.fromString('2'),
        wastePercent: mongoose.Types.Decimal128.fromString('10')
      });
      ingredients.push({
        material: createdMaterials['Ruy băng lụa tơ tằm']._id,
        amount: mongoose.Types.Decimal128.fromString('1.5'),
        wastePercent: mongoose.Types.Decimal128.fromString('5')
      });
      ingredients.push({
        material: createdMaterials['Lá bạc tròn nhập khẩu']._id,
        amount: mongoose.Types.Decimal128.fromString('5'),
        wastePercent: mongoose.Types.Decimal128.fromString('15')
      });
    } else {
      // Single stems need at least 1 wrapping paper
      ingredients.push({
        material: createdMaterials['Giấy gói xi măng vintage']._id,
        amount: mongoose.Types.Decimal128.fromString('1'),
        wastePercent: mongoose.Types.Decimal128.fromString('5')
      });
    }

    // Add main items based on SKU pattern
    if (sku.includes('CB-')) {
      // Combos have Teddy Bear
      const hasWhiteGau = sku.includes('CB-TLP-PNK') || sku.includes('CB-LIS-BSK') || sku.includes('CB-PEO-LXT');
      const gauName = hasWhiteGau ? 'Gấu bông Teddy trắng ôm tim' : 'Gấu bông Teddy nâu size M';
      ingredients.push({
        material: createdMaterials[gauName]._id,
        amount: mongoose.Types.Decimal128.fromString('1'),
        wastePercent: mongoose.Types.Decimal128.fromString('0')
      });
    }

    // Flowers based on SKU keywords
    if (sku.includes('RED') || sku.includes('LV-ROS-')) {
      // Red Rose based recipe
      const amount = sku.includes('99') ? '99' : (sku.includes('-L') ? '20' : (sku.includes('-M') ? '12' : '6'));
      ingredients.push({
        material: createdMaterials['Hoa hồng đỏ Ecuador']._id,
        amount: mongoose.Types.Decimal128.fromString(amount),
        wastePercent: mongoose.Types.Decimal128.fromString('8')
      });
    } else if (sku.includes('YLW') || sku.includes('BD-YLW-')) {
      // Yellow Rose based
      const amount = sku.includes('-L') ? '25' : (sku.includes('-M') ? '15' : '8');
      ingredients.push({
        material: createdMaterials['Hoa hồng vàng Ecuador']._id,
        amount: mongoose.Types.Decimal128.fromString(amount),
        wastePercent: mongoose.Types.Decimal128.fromString('8')
      });
    } else if (sku.includes('CRM') || sku.includes('-CRM')) {
      // Cream rose based
      const amount = sku.includes('-L') ? '20' : (sku.includes('-M') ? '12' : '6');
      ingredients.push({
        material: createdMaterials['Hoa hồng kem dâu']._id,
        amount: mongoose.Types.Decimal128.fromString(amount),
        wastePercent: mongoose.Types.Decimal128.fromString('8')
      });
    } else if (sku.includes('TLP-WHT') || sku.includes('TLP-RED') || sku.includes('TLP-')) {
      // Tulip based
      const isWhite = sku.includes('WHT');
      const tulipName = isWhite ? 'Hoa Tulip trắng' : 'Hoa Tulip hồng';
      const amount = sku.includes('-L') ? '20' : (sku.includes('-M') ? '12' : '6');
      ingredients.push({
        material: createdMaterials[tulipName]._id,
        amount: mongoose.Types.Decimal128.fromString(amount),
        wastePercent: mongoose.Types.Decimal128.fromString('10')
      });
    } else if (sku.includes('SUN')) {
      // Sunflower based
      const amount = sku.includes('ONE') ? '1' : (sku.includes('-L') ? '10' : (sku.includes('-M') ? '5' : '3'));
      ingredients.push({
        material: createdMaterials['Hoa hướng dương đại']._id,
        amount: mongoose.Types.Decimal128.fromString(amount),
        wastePercent: mongoose.Types.Decimal128.fromString('5')
      });
    } else if (sku.includes('HYD') || sku.includes('HY-')) {
      // Hydrangea based
      const amount = sku.includes('-L') ? '3' : '1';
      ingredients.push({
        material: createdMaterials['Hoa cẩm tú cầu xanh']._id,
        amount: mongoose.Types.Decimal128.fromString(amount),
        wastePercent: mongoose.Types.Decimal128.fromString('5')
      });
    } else if (sku.includes('LAV')) {
      // Lavender based
      const amount = sku.includes('-L') ? '50' : (sku.includes('-M') ? '30' : '15');
      ingredients.push({
        material: createdMaterials['Hoa oải hương khô Pháp']._id,
        amount: mongoose.Types.Decimal128.fromString(amount),
        wastePercent: mongoose.Types.Decimal128.fromString('2')
      });
    } else if (sku.includes('BAB')) {
      // Baby flowers
      const amount = sku.includes('-L') ? '10' : (sku.includes('-M') ? '6' : '3');
      ingredients.push({
        material: createdMaterials['Hoa baby trắng']._id,
        amount: mongoose.Types.Decimal128.fromString(amount),
        wastePercent: mongoose.Types.Decimal128.fromString('12')
      });
    } else {
      // Default: mix of Red rose & Baby
      ingredients.push({
        material: createdMaterials['Hoa hồng đỏ Ecuador']._id,
        amount: mongoose.Types.Decimal128.fromString('5'),
        wastePercent: mongoose.Types.Decimal128.fromString('8')
      });
      ingredients.push({
        material: createdMaterials['Hoa baby trắng']._id,
        amount: mongoose.Types.Decimal128.fromString('2'),
        wastePercent: mongoose.Types.Decimal128.fromString('12')
      });
    }

    // Save recipe to DB
    await Recipe.create({
      productVariant: variant._id,
      ingredients,
      isActive: true
    });
    seededCount++;
  }

  console.log(`✅ Successfully seeded ${seededCount} recipes!`);
  await mongoose.disconnect();
  console.log('👋 Seeding finished successfully!');
}

run().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
