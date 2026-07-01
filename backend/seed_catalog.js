/**
 * seed_catalog.js – Seeding complete catalog data for UTE_SHOP (Categories, Tags, Products, ProductVariants, StockLevels, Reviews)
 *
 * Seeding exactly 12 categories and 120 highly-detailed, beautifully curated flower products (10 per category).
 *
 * Usage: node seed_catalog.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import Models
import Category from './modules/catalog/models/Category.js';
import Tag from './modules/catalog/models/Tag.js';
import Product from './modules/catalog/models/Product.js';
import ProductVariant from './modules/catalog/models/ProductVariant.js';
import Review from './modules/catalog/models/Review.js';
import Warehouse from './modules/inventory/models/Warehouse.js';
import StockLevel from './modules/inventory/models/StockLevel.js';
import StockTransaction from './modules/inventory/models/StockTransaction.js';
import Customer from './modules/user/models/Customer.js';

import ProductStatus from './shared/enums/ProductStatus.js';
import StockStatus from './shared/enums/StockStatus.js';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/uteshop';

// Beautiful aesthetic flower images from Unsplash (categorized for absolute precision)
const FLOWER_IMAGES = {
  red_rose: [
    'https://images.unsplash.com/photo-1548894175-ea255e2d6b3a?q=80&w=600&auto=format&fit=crop', // Red Rose Bouquet
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=600&auto=format&fit=crop', // Dark Red Rose
    'https://images.unsplash.com/photo-1533604861209-7b6eb37243b7?q=80&w=600&auto=format&fit=crop'  // Bright Red Rose
  ],
  pink_rose: [
    'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=600&auto=format&fit=crop', // Pink Rose Bouquet
    'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=600&auto=format&fit=crop', // Luxury Pink Rose
    'https://images.unsplash.com/photo-1494972308805-463bc619d34e?q=80&w=600&auto=format&fit=crop'  // Pastel Pink Rose
  ],
  white_rose: [
    'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?q=80&w=600&auto=format&fit=crop', // Beautiful White Rose Bouquet
    'https://images.unsplash.com/photo-1434064511983-18c6dae20ed5?q=80&w=600&auto=format&fit=crop', // Simple White Rose
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=600&auto=format&fit=crop'  // White bouquet
  ],
  cream_rose: [
    'https://images.unsplash.com/photo-1525648128964-c9ab217e1a4c?q=80&w=600&auto=format&fit=crop', // Cream Rose
    'https://images.unsplash.com/photo-1508610048659-a06b669e3a71?q=80&w=600&auto=format&fit=crop'  // Peach-cream rose
  ],
  orange_rose: [
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=600&auto=format&fit=crop', // Orange rose bouquet
    'https://images.unsplash.com/photo-1612457814421-2e9603099039?q=80&w=600&auto=format&fit=crop', // Orange roses detail
    'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600&auto=format&fit=crop'  // Sweet cream-orange rose
  ],
  tulip_white: [
    'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=600&auto=format&fit=crop', // White tulips in vase
    'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?q=80&w=600&auto=format&fit=crop'  // Pure white tulip bouquet
  ],
  tulip_yellow: [
    'https://images.unsplash.com/photo-1550950158-d0d960dff51b?q=80&w=600&auto=format&fit=crop', // Yellow Tulip
    'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=600&auto=format&fit=crop'  // Vibrant yellow tulips
  ],
  tulip_pink: [
    'https://images.unsplash.com/photo-1521997534047-48b1596dd024?q=80&w=600&auto=format&fit=crop', // Tulip pink field
    'https://images.unsplash.com/photo-1520763185298-1b434c919102?q=80&w=600&auto=format&fit=crop'  // Tulip blush
  ],
  tulip_blue: [
    'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?q=80&w=600&auto=format&fit=crop', // Soft aesthetic blue
    'https://images.unsplash.com/photo-1447875569521-09a5a392534b?q=80&w=600&auto=format&fit=crop'  // Ice blue representation
  ],
  sunflower: [
    'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600&auto=format&fit=crop', // Sunflower Macro
    'https://images.unsplash.com/photo-1590004953392-5aba2e72269a?q=80&w=600&auto=format&fit=crop', // Beautiful Sunflowers Bouquet
    'https://images.unsplash.com/photo-1541256996761-85df2eff3139?q=80&w=600&auto=format&fit=crop'  // Sunflowers field
  ],
  lavender: [
    'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?q=80&w=600&auto=format&fit=crop', // Lavender field
    'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?q=80&w=600&auto=format&fit=crop'  // Lavender bouquet
  ],
  lily_white: [
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=600&auto=format&fit=crop', // White Lily Bouquet
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600&auto=format&fit=crop'  // White lilies in bouquet
  ],
  lily_yellow: [
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop', // Yellow Lily
    'https://images.unsplash.com/photo-1558350315-8aa00e8e4590?q=80&w=600&auto=format&fit=crop'  // Yellow Lily field
  ],
  peony: [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop', // Pink Peony
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop'  // Royalty Peony
  ],
  hydrangea_blue: [
    'https://images.unsplash.com/photo-1589244159943-460088ed5c92?q=80&w=600&auto=format&fit=crop', // Blue Hydrangea
    'https://images.unsplash.com/photo-1507504038482-7621c518d50b?q=80&w=600&auto=format&fit=crop'  // Blue hydrangea macro
  ],
  hydrangea_pink: [
    'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=600&auto=format&fit=crop', // Hydrangea pink
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop'  // Sweet Pink Hydrangeas
  ],
  lotus: [
    'https://images.unsplash.com/photo-1618218168350-6e7c81151b64?q=80&w=600&auto=format&fit=crop', // Pink lotus
    'https://images.unsplash.com/photo-1509024640771-4a34b2f15908?q=80&w=600&auto=format&fit=crop'  // Lotus pond
  ],
  orchid_white: [
    'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?q=80&w=600&auto=format&fit=crop', // Elegant White Orchid Bouquet
    'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=600&auto=format&fit=crop'  // White Orchid elegant
  ],
  orchid_purple: [
    'https://images.unsplash.com/photo-1521133573892-e44906baee46?q=80&w=600&auto=format&fit=crop', // Gorgeous Purple Orchid Bouquet
    'https://images.unsplash.com/photo-1569429547055-3511eb087f58?q=80&w=600&auto=format&fit=crop'  // Purple orchids elegant
  ],
  chamomile: [
    'https://images.unsplash.com/photo-1600180758890-6b94e61025a5?q=80&w=600&auto=format&fit=crop', // Chamomiles
    'https://images.unsplash.com/photo-1596272875729-ed2ff7d6d9c5?q=80&w=600&auto=format&fit=crop'  // White daisies/chamomile
  ],
  gerbera: [
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop', // Red Gerbera
    'https://images.unsplash.com/photo-1558350315-8aa00e8e4590?q=80&w=600&auto=format&fit=crop'  // Orange Gerbera
  ],
  dahlia: [
    'https://images.unsplash.com/photo-1549490353-b0f3408f654f?q=80&w=600&auto=format&fit=crop', // Red dahlia
    'https://images.unsplash.com/photo-1504198266287-1659872e6590?q=80&w=600&auto=format&fit=crop'  // Pink Dahlia
  ],
  carnation: [
    'https://images.unsplash.com/photo-1559715544-33be625347f3?q=80&w=600&auto=format&fit=crop'  // Carnation
  ],
  mixed: [
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=600&auto=format&fit=crop', // Aesthetic mixed bouquet
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=600&auto=format&fit=crop', // Gorgeous garden flowers
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=600&auto=format&fit=crop'  // Wildflowers bouquet
  ],
  condolence: [
    'https://images.unsplash.com/photo-1508610048659-a06b669e3a71?q=80&w=600&auto=format&fit=crop', // Pure White Lilies bouquet
    'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop'  // Quiet white flower condolence arrangement
  ],
  combo: [
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=600&auto=format&fit=crop', // Beautiful flower box
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop'  // Elegant box pastel
  ]
};

// Base Pinterest alternate image for aesthetic layouts
const PINTEREST_AESTHETIC_FLOWER = 'https://i.pinimg.com/564x/0f/c2/f7/0fc2f7902d26fdfbfb54ff4beed84910.jpg';

const seedCatalog = async () => {
  console.log('🌱 Starting UTE_SHOP Expanded 120-Product & 12-Category Catalog Seed Script...');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

    // 1. Clean existing records
    console.log('🗑️ Cleaning existing collections...');
    await Category.deleteMany({});
    await Tag.deleteMany({});
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});
    await Review.deleteMany({});
    await Warehouse.deleteMany({});
    await StockLevel.deleteMany({});
    await StockTransaction.deleteMany({});
    try {
      await StockLevel.collection.dropIndex('warehouse_1_material_1');
      console.log('🧹 Dropped index warehouse_1_material_1');
    } catch (_) { /* index may not exist */ }
    console.log('🧹 Cleaned successfully.');

    // 2. Seed Warehouse
    console.log('🏭 Seeding Warehouse...');
    const warehouse = await Warehouse.create({
      name: 'Kho Trung Tâm UTE_SHOP',
      address: 'Số 1 Võ Văn Ngân, Linh Chiểu, Thủ Đức, TP. HCM',
      isActive: true,
    });
    console.log(`✅ Created Warehouse: ${warehouse.name} (${warehouse._id})`);

    // 3. Seed 12 Categories
    console.log('📁 Seeding 12 Categories...');
    const categoriesData = [
      { name: 'Hoa Sinh Nhật', slug: 'hoa-sinh-nhat', description: 'Món quà sinh nhật rực rỡ, mang niềm vui và lời chúc tuổi mới trọn vẹn.', imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=600&auto=format&fit=crop' },
      { name: 'Hoa Tình Yêu', slug: 'hoa-tinh-yeu', description: 'Sắc hồng, sắc đỏ nồng nàn minh chứng cho tình yêu lãng mạn vĩnh cửu.', imageUrl: 'https://images.unsplash.com/photo-1548894175-ea255e2d6b3a?q=80&w=600&auto=format&fit=crop' },
      { name: 'Hoa Khai Trương', slug: 'hoa-khai-truong', description: 'Kệ hoa, lẵng hoa sang trọng chúc mừng hồng phát, thành công rực rỡ.', imageUrl: 'https://images.unsplash.com/photo-1590004953392-5aba2e72269a?q=80&w=600&auto=format&fit=crop' },
      { name: 'Bình Hoa Nghệ Thuật', slug: 'binh-hoa-nghe-thuat', description: 'Những tác phẩm hoa cắm bình gốm, bình thủy tinh sang trọng cho không gian sống.', imageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=600&auto=format&fit=crop' },
      { name: 'Giỏ Hoa Đồng Quê', slug: 'gio-hoa-dong-que', description: 'Vẻ đẹp mộc mạc, bình dị từ giỏ mây tre đan đan cài hoa dại, cúc họa mi.', imageUrl: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?q=80&w=600&auto=format&fit=crop' },
      { name: 'Bó Hoa Ngân Sách', slug: 'hoa-ngan-sach', description: 'Những bó hoa xinh xắn thiết kế tối giản với giá cả cực kỳ hợp lý dưới 250,000đ.', imageUrl: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=600&auto=format&fit=crop' },
      { name: 'Combo Gấu & Hoa', slug: 'combo-gau-va-hoa', description: 'Sự kết hợp hoàn hảo ngọt ngào giữa đóa hoa tươi và chú gấu bông dễ thương.', imageUrl: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=600&auto=format&fit=crop' },
      { name: 'Hoa Chia Buồn', slug: 'hoa-chia-buon', description: 'Vòng hoa kính viếng trang trọng, gửi gắm lời chia buồn sâu sắc và thành kính nhất.', imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop' },
      { name: 'Hoa Kỷ Niệm', slug: 'hoa-ky-niem', description: 'Gửi trao yêu thương, kỷ niệm những khoảnh khắc ngọt ngào bên nhau.', imageUrl: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=600&auto=format&fit=crop' },
      { name: 'Hoa Chúc Mừng', slug: 'hoa-chuc-mung', description: 'Chúc mừng tốt nghiệp, kỷ niệm ngày thành lập hay thăng tiến sự nghiệp.', imageUrl: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=600&auto=format&fit=crop' },
      { name: 'Loại hoa lẻ', slug: 'loai-hoa-le', description: 'Tự do lựa chọn từng cành hoa yêu thích cắm trang trí phòng tại nhà.', imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=600&auto=format&fit=crop' },
      { name: 'Tiệc & Sự kiện', slug: 'tiec-va-su-kien', description: 'Thiết kế hoa bàn tiệc, cổng hoa cưới và decor trọn gói sự kiện sang trọng.', imageUrl: 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?q=80&w=600&auto=format&fit=crop' }
    ];

    const categories = {};
    for (const cat of categoriesData) {
      const created = await Category.create(cat);
      categories[cat.slug] = created;
    }
    console.log(`✅ Seeding ${Object.keys(categories).length} Categories done.`);

    // 4. Seed Tags
    console.log('🏷️ Seeding Tags...');
    const tagsData = [
      { name: 'Bán chạy', slug: 'ban-chay' },
      { name: 'Mới về', slug: 'moi-ve' },
      { name: 'Khuyến mãi', slug: 'khuyen-mai' },
      { name: 'Yêu thích', slug: 'yeu-thich' }
    ];
    const tags = {};
    for (const tag of tagsData) {
      const created = await Tag.create(tag);
      tags[tag.slug] = created;
    }
    console.log(`✅ Seeding ${Object.keys(tags).length} Tags done.`);

    // 5. Setup Customers for Reviews
    const customerProfiles = [
      { fullName: 'Thắng Vũ', email: 'vuthang@uteshop.vn', phone: '0123456789' },
      { fullName: 'Minh Anh', email: 'minhanh@uteshop.vn', phone: '0912345678' },
      { fullName: 'Lan Chi', email: 'lanchi@uteshop.vn', phone: '0988222333' },
      { fullName: 'Đức Trần', email: 'ductran@uteshop.vn', phone: '0909333444' },
      { fullName: 'Quỳnh Như', email: 'quynhnhu@uteshop.vn', phone: '0933555777' },
    ];
    const reviewCustomers = [];
    for (const profile of customerProfiles) {
      let customer = await Customer.findOne({ email: profile.email });
      if (!customer) {
        customer = await Customer.create({
          fullName: profile.fullName,
          email: profile.email,
          passwordHash: '$2a$10$vY3Z.Yp75d3fXz9Vpx1OQeT3l9EpyQ2Wl/xTfF1Q9D2WwA0T2mUuW', // 'password123'
          phone: profile.phone,
          isEmailVerified: true,
          status: 'ACTIVE',
        });
      }
      reviewCustomers.push(customer);
    }

    // 6. Define 120 Products Blueprint (10 products per category)
    const rawBlueprints = [
      // ==================== HOA SINH NHẬT (10 products) ====================
      {
        name: 'Bó Hồng Vàng Ấm Áp Sinh Nhật',
        category: 'hoa-sinh-nhat',
        tags: ['moi-ve', 'yeu-thich'],
        description: 'Bó hồng Ecuador vàng rực rỡ phối cùng lá bạc nhạt tạo nên năng lượng tích cực chúc mừng tuổi mới an nhiên ấm áp.',
        basePrice: 420000,
        skuPrefix: 'BD-YLW-ROS',
        imageType: 'tulip_yellow'
      },
      {
        name: 'Bó Baby Hồng Kẹo Ngọt Cute',
        category: 'hoa-sinh-nhat',
        tags: ['ban-chay'],
        description: 'Bông baby nhuộm hồng pastel ngọt lịm như kẹo bông, món quà đốn tim các nàng tuổi mới mơ mộng ngọt ngào.',
        basePrice: 380000,
        skuPrefix: 'BD-PNK-BAB',
        imageType: 'pink_rose'
      },
      {
        name: 'Hộp Hoa Sinh Nhật Sweet Cake',
        category: 'hoa-sinh-nhat',
        tags: ['yeu-thich'],
        description: 'Thiết kế hoa hồng kem dâu và cát tường kết tròn xinh xắn giống chiếc bánh kem sinh nhật lung linh và độc đáo.',
        basePrice: 550000,
        skuPrefix: 'BD-BOX-CAKE',
        imageType: 'combo'
      },
      {
        name: 'Bó Cẩm Tú Cầu Xanh Hy Vọng',
        category: 'hoa-sinh-nhat',
        tags: ['khuyen-mai'],
        description: 'Đóa cẩm tú cầu xanh đại bọc giấy xi măng mộc mạc làm quà chúc mừng tuổi mới đầy hoài bão khát vọng lớn.',
        basePrice: 320000,
        skuPrefix: 'BD-HYD-BLU',
        imageType: 'hydrangea_blue'
      },
      {
        name: 'Giỏ Hoa Hướng Dương Mặt Trời',
        category: 'hoa-sinh-nhat',
        tags: ['ban-chay'],
        description: 'Giỏ hoa hướng dương phối cùng hoa cúc nhỏ nhụy vàng tỏa sáng lấp lánh như ánh mặt trời chúc mừng sinh nhật năng động.',
        basePrice: 480000,
        skuPrefix: 'BD-SUN-BSK',
        imageType: 'sunflower'
      },
      {
        name: 'Bó Lan Tường Cát Tường May Mắn',
        category: 'hoa-sinh-nhat',
        tags: ['moi-ve'],
        description: 'Những cánh cát tường hồng viền trắng mềm mại mang theo lời chúc tuổi mới may mắn, bình an và vạn sự như ý.',
        basePrice: 390000,
        skuPrefix: 'BD-LIS-PNK',
        imageType: 'pink_rose'
      },
      {
        name: 'Hộp Hoa Hồng Đỏ Khổng Lồ',
        category: 'hoa-sinh-nhat',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Hộp mica trong suốt trưng bày đóa hồng đỏ tươi Ecuadorian quý phái. Món quà sinh nhật cực kỳ xa hoa và đẳng cấp.',
        basePrice: 850000,
        skuPrefix: 'BD-ROS-RED',
        imageType: 'red_rose'
      },
      {
        name: 'Bó Tulip Trắng Sang Chảnh',
        category: 'hoa-sinh-nhat',
        tags: ['yeu-thich'],
        description: 'Đóa hoa Tulip Ecuador trắng muốt quý phái, bọc trong lớp giấy đen cao cấp tạo độ tương phản cuốn hút nổi tiếng trên Pinterest.',
        basePrice: 620000,
        skuPrefix: 'BD-TLP-WHT',
        imageType: 'tulip_white'
      },
      {
        name: 'Giỏ Hoa Hồng Kem Dâu Quý Phái',
        category: 'hoa-sinh-nhat',
        tags: ['khuyen-mai'],
        description: 'Sự phối hợp hoàn mỹ giữa hồng kem dâu tây mọng nước và lá đùi gà xanh mát cắm trong giỏ mây thanh tao lịch thiệp.',
        basePrice: 520000,
        skuPrefix: 'BD-BSK-CRM',
        imageType: 'cream_rose'
      },
      {
        name: 'Bó Thạch Thảo Tím Lãng Mạn',
        category: 'hoa-sinh-nhat',
        tags: ['moi-ve'],
        description: 'Bó thạch thảo tím hoang dại mộc mạc bọc giấy báo vintage cổ điển mang theo sắc thu lãng mạn dịu ngọt thanh nhã.',
        basePrice: 290000,
        skuPrefix: 'BD-DAI-PPL',
        imageType: 'chamomile'
      },

      // ==================== HOA TÌNH YÊU (10 products) ====================
      {
        name: 'Đóa Ecuador Đỏ Nhung 99 Bông',
        category: 'hoa-tinh-yeu',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Bó hoa khổng lồ kết từ 99 đóa hồng Ecuador đỏ thẫm như nhung đại diện cho tình yêu son sắt vĩnh cửu trọn đời.',
        basePrice: 1990000,
        skuPrefix: 'LV-ROS-RED99',
        imageType: 'red_rose'
      },
      {
        name: 'Bó Hồng Phấn Sweetheart Lãng Mạn',
        category: 'hoa-tinh-yeu',
        tags: ['ban-chay'],
        description: 'Hồng phấn Ecuadorian ngọt ngào đan cài ruy băng lụa tơ tằm thanh mảnh. Đốn tim người yêu ngọt ngào đắm đuối.',
        basePrice: 480000,
        skuPrefix: 'LV-ROS-PNK',
        imageType: 'pink_rose'
      },
      {
        name: 'Hộp Hoa Trái Tim Forever Love',
        category: 'hoa-tinh-yeu',
        tags: ['yeu-thich'],
        description: 'Hộp da cao cấp cắm hoa hồng đỏ Ecuador xếp hình trái tim tinh xảo kèm chocolate Pháp ngọt lịm nồng nàn.',
        basePrice: 950000,
        skuPrefix: 'LV-BOX-HRT',
        imageType: 'red_rose'
      },
      {
        name: 'Bó Tulip Đỏ Nồng Cháy Ecuador',
        category: 'hoa-tinh-yeu',
        tags: ['moi-ve'],
        description: 'Những đóa Tulip Ecuador đỏ rực kiêu hãnh biểu trưng cho lời tuyên ngôn tình yêu nhiệt thành rực lửa vô điều kiện.',
        basePrice: 650000,
        skuPrefix: 'LV-TLP-RED',
        imageType: 'tulip_pink'
      },
      {
        name: 'Bó Mẫu Đơn Peony Sweet Blush',
        category: 'hoa-tinh-yeu',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Những đóa hoa Peony nhập khẩu cánh siêu to bồng bềnh kiêu sa đài các, mang trọn xúc cảm lãng mạn ngây ngất tình nồng.',
        basePrice: 890000,
        skuPrefix: 'LV-PEO-BLSH',
        imageType: 'peony'
      },
      {
        name: 'Bó Cẩm Tú Cầu Hồng Lãng Mạn',
        category: 'hoa-tinh-yeu',
        tags: ['khuyen-mai'],
        description: 'Tú cầu hồng khổng lồ phối hoa cát tường trắng tinh khôi thanh tú đại diện cho lòng biết ơn chân thành sâu sắc tình yêu.',
        basePrice: 350000,
        skuPrefix: 'LV-HYD-PNK',
        imageType: 'hydrangea_pink'
      },
      {
        name: 'Hộp Hoa Hồng Kem Tình Yêu Thơ Mộng',
        category: 'hoa-tinh-yeu',
        tags: ['moi-ve'],
        description: 'Những đóa hồng kem mịn màng cắm sang xịn mịn trong hộp giấy vuông cứng cáp, mang phong cách dịu nhẹ bay bổng lơ lửng.',
        basePrice: 590000,
        skuPrefix: 'LV-BOX-CRM',
        imageType: 'cream_rose'
      },
      {
        name: 'Bó Baby Trắng Trinh Nguyên Vĩnh Cửu',
        category: 'hoa-tinh-yeu',
        tags: ['ban-chay'],
        description: 'Đóa hoa baby trắng muốt khổng lồ tựa mây trắng ngợp trời, biểu trưng cho mối tình đầu tinh khiết ngây ngô tuyệt vời.',
        basePrice: 380000,
        skuPrefix: 'LV-BAB-WHT',
        imageType: 'white_rose'
      },
      {
        name: 'Đóa Hồng Ecuadorian Trắng Kiêu Sa',
        category: 'hoa-tinh-yeu',
        tags: ['yeu-thich'],
        description: 'Hồng Ecuador trắng tinh khiết kết tròn đan lá bạc thanh tao bọc kiếng mờ quyến rũ tuyệt đẹp tôn vinh vẻ thanh cao.',
        basePrice: 550000,
        skuPrefix: 'LV-ROS-WHT',
        imageType: 'white_rose'
      },
      {
        name: 'Giỏ Hoa Hẹn Hò Lavender Thơ Mộng',
        category: 'hoa-tinh-yeu',
        tags: ['khuyen-mai'],
        description: 'Lavender sấy khô vùng Provence thơm ngát cắm giỏ mây thắt nơ tơ tằm. Lưu giữ kỷ niệm chung thủy trọn vẹn suốt 3 năm.',
        basePrice: 450000,
        skuPrefix: 'LV-LAV-BSK',
        imageType: 'lavender'
      },

      // ==================== HOA KHAI TRƯƠNG (10 products) ====================
      {
        name: 'Kệ Hoa Đại Cát Khai Trương 2 Tầng',
        category: 'hoa-khai-truong',
        tags: ['ban-chay'],
        description: 'Kệ hoa 2 tầng khổng lồ kết từ hướng dương, đồng tiền đỏ và hoa lan rực rỡ chúc mừng khai trương hồng phát phát lộc.',
        basePrice: 1500000,
        skuPrefix: 'OP-STND-DC',
        imageType: 'sunflower'
      },
      {
        name: 'Kệ Khai Trương Hồng Phát Đỏ Rực',
        category: 'hoa-khai-truong',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Sử dụng tone màu đỏ nhung chủ đạo từ hồng môn, hồng đỏ Ecuador tôn lên khí thế thịnh vượng may mắn trường tồn.',
        basePrice: 1800000,
        skuPrefix: 'OP-STND-HP',
        imageType: 'red_rose'
      },
      {
        name: 'Lẵng Hoa Hướng Dương Phú Quý Đại Cát',
        category: 'hoa-khai-truong',
        tags: ['khuyen-mai'],
        description: 'Lẵng hoa để bàn khai trương sang trọng với 8 đóa hướng dương nở rộ, đan lá xanh tươi mát căng tràn sức sống đại cát.',
        basePrice: 680000,
        skuPrefix: 'OP-BSK-SUN',
        imageType: 'sunflower'
      },
      {
        name: 'Bình Lan Hồ Điệp Trắng Đẳng Cấp Thượng Hạng',
        category: 'hoa-khai-truong',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Chậu lan hồ điệp trắng 9 cành hoàng gia cắm sang trọng quý phái phù hợp tặng các tập đoàn, đối tác VIP danh giá.',
        basePrice: 3500000,
        skuPrefix: 'OP-ORC-WHT',
        imageType: 'orchid_white'
      },
      {
        name: 'Kệ Hoa Lan Vàng Thịnh Vượng Doanh Nghiệp',
        category: 'hoa-khai-truong',
        tags: ['yeu-thich'],
        description: 'Kệ đứng lan vũ nữ vàng rực bay bổng tựa như cánh bướm đón gió xuân mang lại vạn sự hanh thông, đại cát thăng tiến tài lộc.',
        basePrice: 2200000,
        skuPrefix: 'OP-STND-YLW',
        imageType: 'orchid_purple'
      },
      {
        name: 'Giỏ Hoa Đồng Tiền Phát Tài Rực Rỡ',
        category: 'hoa-khai-truong',
        tags: ['khuyen-mai'],
        description: 'Đồng tiền Ecuador nhiều màu sắc tươi tắn cắm sum suê xôm tụ chúc phát tài phát lộc nhanh chóng hanh thông thuận lợi.',
        basePrice: 490000,
        skuPrefix: 'OP-BSK-GER',
        imageType: 'gerbera'
      },
      {
        name: 'Kệ Khai Trương Tone Cam Hiện Đại',
        category: 'hoa-khai-truong',
        tags: ['moi-ve'],
        description: 'Kệ hoa cắm ngẫu hứng nghệ thuật tone màu cam cháy cá tính rực cháy nhiệt huyết thích hợp cho quán cafe, studio nghệ thuật.',
        basePrice: 1650000,
        skuPrefix: 'OP-STND-ORG',
        imageType: 'orange_rose'
      },
      {
        name: 'Lẵng Hoa Thiên Điểu Vươn Xa Kiêu Sa',
        category: 'hoa-khai-truong',
        tags: ['ban-chay'],
        description: 'Sử dụng thiên điểu dáng cao kiêu hãnh biểu thị sự vươn tầm đỉnh cao vượt bậc, mở lối thành công vang dội trường tồn.',
        basePrice: 850000,
        skuPrefix: 'OP-BSK-BIRD',
        imageType: 'mixed'
      },
      {
        name: 'Chậu Lan Hồ Điệp Tím Tài Lộc Độc Đáo',
        category: 'hoa-khai-truong',
        tags: ['moi-ve'],
        description: 'Sắc tím oải hương kiêu sa đài các của 5 cành lan hồ điệp hoàng gia cắm bình gốm dát vàng nghệ thuật độc bản đẳng cấp.',
        basePrice: 1950000,
        skuPrefix: 'OP-ORC-PPL',
        imageType: 'orchid_purple'
      },
      {
        name: 'Giỏ Hoa Hướng Dương Đại Cát Bình An',
        category: 'hoa-khai-truong',
        tags: ['yeu-thich'],
        description: 'Hướng dương phối cùng cúc mẫu đơn khổng lồ đem lại giỏ hoa sang xịn mịn chúc đối tác kinh doanh phát tài đại thắng lợi.',
        basePrice: 580000,
        skuPrefix: 'OP-BSK-BIG',
        imageType: 'sunflower'
      },

      // ==================== BÌNH HOA NGHỆ THUẬT (10 products) ====================
      {
        name: 'Bình Gốm Cắm Sen Bách Diệp Tinh Tế',
        category: 'binh-hoa-nghe-thuat',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Sen bách diệp hồng trăm cánh Hồ Tây cắm lọ gốm mộc tráng men ngọc mang hồn cốt văn hóa dân tộc tinh khiết thanh cao.',
        basePrice: 450000,
        skuPrefix: 'VA-LOT-PNK',
        imageType: 'lotus'
      },
      {
        name: 'Bình Thủy Tinh Tulip Trắng Kiêu Sa',
        category: 'binh-hoa-nghe-thuat',
        tags: ['ban-chay'],
        description: 'Tulip Hà Lan trắng muốt cắm bình thủy tinh pha lê loe đơn giản tinh xảo mang hơi thở hiện đại tối giản Bắc Âu sang trọng.',
        basePrice: 780000,
        skuPrefix: 'VA-TLP-WHT',
        imageType: 'tulip_white'
      },
      {
        name: 'Bình Gốm Hoa Ly Vàng Đại Cát Hanh Thông',
        category: 'binh-hoa-nghe-thuat',
        tags: ['khuyen-mai'],
        description: 'Bình gốm mộc cắm ly vàng tai to rạng rỡ thơm ngát, kiến tạo điểm nhấn bừng sáng không gian phòng khách trang trọng gia chủ.',
        basePrice: 520000,
        skuPrefix: 'VA-LIL-YLW',
        imageType: 'lily_yellow'
      },
      {
        name: 'Bình Hoa Hồng Ecuador Đỏ Sang Trọng Bàn Tiệc',
        category: 'binh-hoa-nghe-thuat',
        tags: ['yeu-thich'],
        description: 'Bình pha lê cổ điển cắm ngập tràn hồng Ecuadorian đỏ nhung đại diện đẳng cấp sang quý quý tộc khó phai nhạt.',
        basePrice: 890000,
        skuPrefix: 'VA-ROS-RED',
        imageType: 'red_rose'
      },
      {
        name: 'Bình Gốm Cẩm Tú Cầu Xanh Cổ Điển',
        category: 'binh-hoa-nghe-thuat',
        tags: ['moi-ve'],
        description: 'Cẩm tú cầu xanh lam mát mắt kết hợp lá bạc tròn cắm ngẫu hứng lọ gốm men lam hoài cổ trang nhã nhẹ nhàng.',
        basePrice: 420000,
        skuPrefix: 'VA-HYD-BLU',
        imageType: 'hydrangea_blue'
      },
      {
        name: 'Bình Gốm Hướng Dương Rực Rỡ Ánh Dương',
        category: 'binh-hoa-nghe-thuat',
        tags: ['ban-chay'],
        description: 'Sự hòa quyện tuyệt vời từ hướng dương vàng nắng cắm bình gốm thô nâu đất sẫm mang phong cách đồng quê mộc mạc ấm nồng.',
        basePrice: 380000,
        skuPrefix: 'VA-SUN-YLW',
        imageType: 'sunflower'
      },
      {
        name: 'Bình Thủy Tinh Cát Tường Pastel Thanh Lịch',
        category: 'binh-hoa-nghe-thuat',
        tags: ['yeu-thich'],
        description: 'Cát tường hồng và trắng cắm xen kẽ bình thủy tinh trụ tròn nhẹ nhàng thanh lịch mang trọn nét may mắn tự nhiên thư thái.',
        basePrice: 350000,
        skuPrefix: 'VA-LIS-PST',
        imageType: 'pink_rose'
      },
      {
        name: 'Bình Gốm Lan Vũ Nữ Kiêu Kỳ Dưới Nắng',
        category: 'binh-hoa-nghe-thuat',
        tags: ['moi-ve'],
        description: 'Nhành lan vũ nữ vàng rực cắm bay bổng uyển chuyển bình gốm mộc đen nhám độc đáo ấn tượng rực sáng góc phòng.',
        basePrice: 650000,
        skuPrefix: 'VA-ORC-VNU',
        imageType: 'orchid_purple'
      },
      {
        name: 'Bình Thủy Tinh Hoa Mẫu Đơn Quý Tộc Bồng Bềnh',
        category: 'binh-hoa-nghe-thuat',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Mẫu đơn Peony hồng nhạt nở bừng đài các cắm bình thủy tinh bo tròn sang quý quý phái tôn vinh không gian thượng lưu.',
        basePrice: 1200000,
        skuPrefix: 'VA-PEO-LXT',
        imageType: 'peony'
      },
      {
        name: 'Bình Gốm Lavender Khô Quý Phái Hương Provence',
        category: 'binh-hoa-nghe-thuat',
        tags: ['khuyen-mai'],
        description: 'Bó oải hương khô tím ngát cắm lọ gốm họa tiết cổ điển sang trọng mang hương sắc mát dịu của đồng quê Pháp thư thái.',
        basePrice: 480000,
        skuPrefix: 'VA-LAV-FRN',
        imageType: 'lavender'
      },

      // ==================== GIỎ HOA ĐỒNG QUÊ (10 products) ====================
      {
        name: 'Giỏ Mây Cúc Họa Mi Trắng Thu Thơ Mộng',
        category: 'gio-hoa-dong-que',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Đóa cúc họa mi nhỏ xinh rực rỡ trắng nhụy vàng cắm đan xen rơm khô mộc mạc trong giỏ tre nhỏ mang thu Hà Nội bình yên.',
        basePrice: 280000,
        skuPrefix: 'CO-DAI-WHT',
        imageType: 'chamomile'
      },
      {
        name: 'Giỏ Mây Lavender Thơm Ngát Dịu Êm',
        category: 'gio-hoa-dong-que',
        tags: ['ban-chay'],
        description: 'Giỏ oải hương thơm ngát phảng phất giữ trọn vẹn sắc tím vintage hoài niệm mang lại cảm xúc thư giãn nhẹ nhõm an nhiên.',
        basePrice: 390000,
        skuPrefix: 'CO-LAV-BSK',
        imageType: 'lavender'
      },
      {
        name: 'Giỏ Hoa Cúc Tana Xinh Xắn Nắng Hè',
        category: 'gio-hoa-dong-que',
        tags: ['yeu-thich'],
        description: 'Hoa cúc Tana nhỏ nhắn như những mặt trời tí hon cắm sum sê xôm tụ giỏ mây quai xách đậm gu nhẹ dịu Pinterest.',
        basePrice: 320000,
        skuPrefix: 'CO-TAN-BSK',
        imageType: 'chamomile'
      },
      {
        name: 'Giỏ Tre Cát Tường Dịu Dàng Sương Mai',
        category: 'gio-hoa-dong-que',
        tags: ['khuyen-mai'],
        description: 'Sử dụng cát tường hồng phớt đan lá bạc cắm trong chiếc giỏ tre mộc mạc giản đơn biểu thị nét dịu hiền mộc mạc.',
        basePrice: 350000,
        skuPrefix: 'CO-LIS-BSK',
        imageType: 'pink_rose'
      },
      {
        name: 'Giỏ Hoa Hướng Dương Mộc Mạc Vườn Nhà',
        category: 'gio-hoa-dong-que',
        tags: ['ban-chay'],
        description: 'Hướng dương nở căng tràn cắm giỏ mây tre thô phối cẩm chướng kem ấm áp mộc mạc như khu vườn quê lấp lánh nắng mai.',
        basePrice: 390000,
        skuPrefix: 'CO-SUN-BSK',
        imageType: 'sunflower'
      },
      {
        name: 'Giỏ Hoa Cẩm Chướng Vintage Hoài Cổ',
        category: 'gio-hoa-dong-que',
        tags: ['moi-ve'],
        description: 'Cẩm chướng hồng phớt viền ren cắm xum xuê trong giỏ mây cổ điển tạo xúc cảm hoài cổ lãng mạn nhẹ nhàng đắm đuối.',
        basePrice: 300000,
        skuPrefix: 'CO-CAR-BSK',
        imageType: 'carnation'
      },
      {
        name: 'Giỏ Mây Thạch Thảo Tím Thơ Mộng Lơ Lửng',
        category: 'gio-hoa-dong-que',
        tags: ['yeu-thich'],
        description: 'Những nhành thạch thảo tím hoang dại cắm rủ nhẹ tự nhiên mây khói lơ lửng bồng bềnh trong giỏ cói mộc nhẹ nhõm dịu dàng.',
        basePrice: 270000,
        skuPrefix: 'CO-THA-BSK',
        imageType: 'chamomile'
      },
      {
        name: 'Giỏ Tre Sen Đá & Wildflowers Độc Đáo',
        category: 'gio-hoa-dong-que',
        tags: ['moi-ve'],
        description: 'Cắm kết hợp sen đá xanh rì độc đáo và các nhành hoa dại trắng muốt mang xúc cảm tươi mới phóng khoáng hoang dã.',
        basePrice: 420000,
        skuPrefix: 'CO-SUC-BSK',
        imageType: 'mixed'
      },
      {
        name: 'Giỏ Mây Cúc Calimero Rực Rỡ Sắc Màu',
        category: 'gio-hoa-dong-que',
        tags: ['khuyen-mai'],
        description: 'Nhành cúc Calimero nhỏ xíu xiu tròn xoe màu sắc tươi tắn cắm đầy đặn tràn trề năng lượng vui tươi hứng khởi căng tràn.',
        basePrice: 260000,
        skuPrefix: 'CO-CAL-BSK',
        imageType: 'chamomile'
      },
      {
        name: 'Giỏ Tre Hồng Kem Giọt Sương Ngọt Ngào',
        category: 'gio-hoa-dong-que',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Đóa hồng kem lãng mạn như giọt sương ban mai mọng nước cắm tỉ mỉ giỏ tre đan tạo cảm xúc lãng mạn đầy ngọt ngào.',
        basePrice: 450000,
        skuPrefix: 'CO-ROS-CRM',
        imageType: 'cream_rose'
      },

      // ==================== BÓ HOA NGÂN SÁCH (10 products) ====================
      {
        name: 'Bó Hồng Đỏ Ecuador Đơn Giản Quý Phái',
        category: 'hoa-ngan-sach',
        tags: ['ban-chay'],
        description: 'Bó 3 bông hồng Ecuador đỏ nhung cành dài cắm xen lá bạc bọc tối giản kiếng mờ lơ lửng phong cách Pháp sang chảnh giá mềm.',
        basePrice: 190000,
        skuPrefix: 'BU-ROS-RED',
        imageType: 'red_rose'
      },
      {
        name: 'Bó Cúc Tana Mini Học Sinh Sinh Viên',
        category: 'hoa-ngan-sach',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Nhánh cúc Tana nhỏ nhắn nhụy vàng bọc báo kraft nâu đơn sơ mộc mạc giá cực yêu dành tặng bạn bè học sinh.',
        basePrice: 150000,
        skuPrefix: 'BU-TAN-MINI',
        imageType: 'chamomile'
      },
      {
        name: 'Bó Hướng Dương 1 Bông May Mắn Hy Vọng',
        category: 'hoa-ngan-sach',
        tags: ['khuyen-mai'],
        description: 'Đ đóa hướng dương cực đại phối sao tím bọc phong cách mộc mạc giản đơn thay lời chúc may mắn thuận lợi nhanh chóng.',
        basePrice: 99000,
        skuPrefix: 'BU-SUN-ONE',
        imageType: 'sunflower'
      },
      {
        name: 'Bó Baby Trắng Trải Nghiệm Thơ Ngây',
        category: 'hoa-ngan-sach',
        tags: ['moi-ve'],
        description: 'Cụm hoa baby trắng nhỏ gọn thanh tao nhẹ dịu, bọc báo vintage hoài cổ xinh xắn tinh xảo vừa túi tiền.',
        basePrice: 180000,
        skuPrefix: 'BU-BAB-WHT',
        imageType: 'white_rose'
      },
      {
        name: 'Bó Cẩm Tú Cầu Đơn Lẻ Mộc Mạc Cổ Điển',
        category: 'hoa-ngan-sach',
        tags: ['yeu-thich'],
        description: 'Một đóa cẩm tú cầu xanh lam mát dịu gói giấy lụa mờ đen tương phản, mang vẻ kiêu sa tối giản tinh túy.',
        basePrice: 160000,
        skuPrefix: 'BU-HYD-BLU',
        imageType: 'hydrangea_blue'
      },
      {
        name: 'Bó Cúc Họa Mi Thu Hà Nội Nhỏ Xinh',
        category: 'hoa-ngan-sach',
        tags: ['ban-chay'],
        description: 'Sắc trắng thanh tân cúc họa mi gói giấy báo mộc mạc, lưu giữ một chút dịu nhẹ trời thu Hà Nội thơ mộng lãng mạn.',
        basePrice: 170000,
        skuPrefix: 'BU-DAI-WHT',
        imageType: 'chamomile'
      },
      {
        name: 'Bó Cát Tường Nhạt Tối Giản May Mắn',
        category: 'hoa-ngan-sach',
        tags: ['khuyen-mai'],
        description: 'Nhánh hoa cát tường mềm dịu gói tinh giản, phù hợp bày biện trang trí văn phòng làm việc hanh thông may mắn.',
        basePrice: 199000,
        skuPrefix: 'BU-LIS-MINI',
        imageType: 'pink_rose'
      },
      {
        name: 'Bó Thạch Thảo Tím Nhỏ Xinh Thơ Mộng',
        category: 'hoa-ngan-sach',
        tags: ['moi-ve'],
        description: 'Thạch thảo tím mộng mơ gom gọn xinh tươi bọc kraft nâu hoài niệm mang sắc thu thanh bình dịu nhẹ tràn ngập yêu mến.',
        basePrice: 135000,
        skuPrefix: 'BU-THA-MINI',
        imageType: 'chamomile'
      },
      {
        name: 'Bó Hồng Sen Đơn Lẻ Gói Tinh Tế',
        category: 'hoa-ngan-sach',
        tags: ['yeu-thich'],
        description: 'Một bông hồng cánh dày Ecuador hồng ngọt bọc giấy kiếng tối giản thanh lịch thay lời thương mộc mạc chân thành.',
        basePrice: 95000,
        skuPrefix: 'BU-ROS-PNK',
        imageType: 'pink_rose'
      },
      {
        name: 'Bó Cẩm Chướng Hồng Thanh Nhã Tri Ân',
        category: 'hoa-ngan-sach',
        tags: ['ban-chay'],
        description: 'Cụm cẩm chướng hồng phấn cánh ren bọc giấy lụa mờ tinh xảo nhẹ nhàng tri ân mẹ thầy đầy tôn quý ấm lòng.',
        basePrice: 220000,
        skuPrefix: 'BU-CAR-PNK',
        imageType: 'carnation'
      },

      // ==================== COMBO GẤU & HOA (10 products) ====================
      {
        name: 'Combo Bó Hồng Đỏ & Teddy Bear Cực Đẹp',
        category: 'combo-gau-va-hoa',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Sự phối hợp ngọt ngào vô hạn từ bó hồng đỏ Ecuadorian nhung mịn màng bọc kiếng mờ kèm chú gấu bông Teddy nâu dễ thương.',
        basePrice: 650000,
        skuPrefix: 'CB-ROS-RED',
        imageType: 'red_rose'
      },
      {
        name: 'Combo Bó Tulip Hồng & Gấu Bông Sweetie',
        category: 'combo-gau-va-hoa',
        tags: ['ban-chay'],
        description: 'Tulip hồng blush kiều diễm đan dải nơ tơ tằm thanh mảnh đi kèm chú gấu Teddy bông trắng muốt êm mềm ngọt ngào.',
        basePrice: 790000,
        skuPrefix: 'CB-TLP-PNK',
        imageType: 'tulip_pink'
      },
      {
        name: 'Combo Hộp Hồng Kem & Gấu Mini Xinh Xắn',
        category: 'combo-gau-va-hoa',
        tags: ['yeu-thich'],
        description: 'Hộp cứng đựng những đóa hồng kem dâu mọng nước và chú gấu Teddy mini nhỏ xinh thắt nơ đỏ lãng mạn lơ lửng.',
        basePrice: 580000,
        skuPrefix: 'CB-BOX-CRM',
        imageType: 'combo'
      },
      {
        name: 'Combo Giỏ Cát Tường & Teddy Trắng Tinh Anh',
        category: 'combo-gau-va-hoa',
        tags: ['khuyen-mai'],
        description: 'Giỏ tre cát tường hồng dịu dàng đan lá đùi gà xanh tươi mát mắt cùng bé gấu trắng ôm tim hồng cực đáng yêu.',
        basePrice: 540000,
        skuPrefix: 'CB-LIS-BSK',
        imageType: 'pink_rose'
      },
      {
        name: 'Combo Bó Baby Hồng & Thỏ Bông Mơ Mộng',
        category: 'combo-gau-va-hoa',
        tags: ['moi-ve'],
        description: 'Đ đóa baby hồng phấn bồng bềnh như mây khói lơ lửng phối chú thỏ bông tai dài mềm mịn xinh xắn điệu Pinterest.',
        basePrice: 520000,
        skuPrefix: 'CB-BAB-PNK',
        imageType: 'pink_rose'
      },
      {
        name: 'Combo Bó Hướng Dương & Gấu Tốt Nghiệp Rạng Rỡ',
        category: 'combo-gau-va-hoa',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Bó hướng dương 3 đóa rực rỡ tươi vui và gấu bông mặc lễ phục trạng nguyên tốt nghiệp cầm bằng cử nhân chúc mừng rạng rỡ.',
        basePrice: 480000,
        skuPrefix: 'CB-SUN-GRAD',
        imageType: 'sunflower'
      },
      {
        name: 'Combo Hộp Peony & Gấu Trắng Cao Cấp Sang Quý',
        category: 'combo-gau-va-hoa',
        tags: ['yeu-thich'],
        description: 'Đóa Peony cánh siêu dày đài các xếp hộp sang chảnh phối gấu bông lông xù nhập khẩu thượng hạng cực cưng quý tộc.',
        basePrice: 1100000,
        skuPrefix: 'CB-PEO-LXT',
        imageType: 'peony'
      },
      {
        name: 'Combo Giỏ Mây Hoa Cúc & Teddy Nâu Hoài Cổ',
        category: 'combo-gau-va-hoa',
        tags: ['khuyen-mai'],
        description: 'Giỏ mây cúc họa mi nhỏ xinh trắng muốt phối bé Teddy màu nâu socola thô vintage ấm nồng thơm dịu bình yên.',
        basePrice: 460000,
        skuPrefix: 'CB-DAI-BSK',
        imageType: 'chamomile'
      },
      {
        name: 'Combo Bó Oải Hương Khô & Gấu Pháp Lãng Mạn',
        category: 'combo-gau-va-hoa',
        tags: ['moi-ve'],
        description: 'Lavender Pháp khô thơm phức nguyên vẹn sắc tím tình yêu dài lâu kết đôi chú gấu bông Teddy mặc áo len sọc thủy thủ Pháp lãng mạn.',
        basePrice: 590000,
        skuPrefix: 'CB-LAV-FRN',
        imageType: 'lavender'
      },
      {
        name: 'Combo Bó Cẩm Tú Cầu & Gấu Xám Cute Dễ Thương',
        category: 'combo-gau-va-hoa',
        tags: ['ban-chay'],
        description: 'Đ đóa tú cầu xanh lam thanh cao bọc giấy bóng mờ tinh xảo cùng chú Teddy xám nhỏ mềm mại đáng yêu nâng niu.',
        basePrice: 480000,
        skuPrefix: 'CB-HYD-GRY',
        imageType: 'hydrangea_blue'
      },

      // ==================== HOA CHIA BUỒN (10 products) ====================
      {
        name: 'Vòng Hoa Kính Viếng Thành Kính Trang Nghiêm',
        category: 'hoa-chia-buon',
        tags: ['ban-chay'],
        description: 'Vòng hoa đứng truyền thống kết từ cúc trắng, huệ trắng và lan hồ điệp trắng tiễn biệt người đã khuất thành kính tôn nghiêm.',
        basePrice: 1200000,
        skuPrefix: 'FN-STND-TK',
        imageType: 'condolence'
      },
      {
        name: 'Kệ Hoa Kính Viếng Lan Trắng Sang Trọng',
        category: 'hoa-chia-buon',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Kệ hoa 2 tầng khổng lồ trang trọng phủ đầy lan hồ điệp trắng muốt và lá thiết mộc lan xanh thẫm gửi gắm chia buồn sâu sắc.',
        basePrice: 1800000,
        skuPrefix: 'FN-STND-LAN',
        imageType: 'condolence'
      },
      {
        name: 'Vòng Hoa Chia Buồn Sắc Tím U Hoài',
        category: 'hoa-chia-buon',
        tags: ['khuyen-mai'],
        description: 'Sử dụng lan tím oải hương phối cùng thạch thảo tím u trầm u hoài, chia sẻ nỗi buồn tiếc thương sâu thẳm khó nguôi ngoai.',
        basePrice: 1100000,
        skuPrefix: 'FN-STND-PPL',
        imageType: 'condolence'
      },
      {
        name: 'Lẵng Hoa Lan Trắng Thành Tâm Tưởng Niệm',
        category: 'hoa-chia-buon',
        tags: ['yeu-thich'],
        description: 'Lẵng hoa lan để bàn tưởng niệm gọn gàng thanh tịnh gửi gắm lời nguyện cầu linh hồn an giấc nghìn thu nơi cực lạc.',
        basePrice: 750000,
        skuPrefix: 'FN-BSK-WHT',
        imageType: 'condolence'
      },
      {
        name: 'Kệ Cúc Trắng Kính Viếng Tôn Nghiêm Vĩnh Hằng',
        category: 'hoa-chia-buon',
        tags: ['moi-ve'],
        description: 'Kết từ hàng trăm đóa cúc đại đóa trắng muốt bung nở, đại diện cho tấm lòng thành kính sâu nặng, thanh cao tôn kính.',
        basePrice: 135000,
        skuPrefix: 'FN-STND-CUC',
        imageType: 'condolence'
      },
      {
        name: 'Bình Hoa Ly Trắng Thành Kính Tiễn Biệt',
        category: 'hoa-chia-buon',
        tags: ['ban-chay'],
        description: 'Ly trắng tai to tinh xảo cắm bình đứng cao thanh bạch thơm dịu nhẹ gửi gắm sự sẻ chia đau thương mất mát vô hạn.',
        basePrice: 680000,
        skuPrefix: 'FN-VA-LIL',
        imageType: 'condolence'
      },
      {
        name: 'Vòng Hoa Chia Buồn Vĩnh Hằng Yên Bình',
        category: 'hoa-chia-buon',
        tags: ['yeu-thich'],
        description: 'Vòm tròn hoa cúc trắng đan cài cẩm tú cầu xanh nhạt pastel dịu buồn an ủi tâm hồn thân nhân người khuất an nhiên.',
        basePrice: 1450000,
        skuPrefix: 'FN-STND-VH',
        imageType: 'condolence'
      },
      {
        name: 'Lẵng Cúc Vàng Kính Viếng Trang Nghiêm Cổ Điển',
        category: 'hoa-chia-buon',
        tags: ['khuyen-mai'],
        description: 'Sử dụng cúc vàng truyền thống cắm lẵng gỗ trang trọng mộc mạc cổ kính tiễn đưa ông bà tổ tiên tôn kính đầy hiếu nghĩa.',
        basePrice: 580000,
        skuPrefix: 'FN-BSK-YLW',
        imageType: 'condolence'
      },
      {
        name: 'Kệ Lan Hồ Điệp Trắng Chia Buồn Cao Cấp',
        category: 'hoa-chia-buon',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Kệ hoa đứng một tầng cao cấp kết 15 cành lan hồ điệp nhập khẩu trắng tinh nguyên tôn vinh cuộc đời người đã khuất sang quý.',
        basePrice: 2500000,
        skuPrefix: 'FN-STND-PREM',
        imageType: 'condolence'
      },
      {
        name: 'Bó Hoa Huệ Trắng Trang Nghiêm Lặng Lẽ',
        category: 'hoa-chia-buon',
        tags: ['moi-ve'],
        description: 'Bó hoa huệ ta trắng ngần đơm bông thanh tịnh gói tối giản tôn nghiêm lặng lẽ tiễn đưa đưa linh hồn thanh khiết nhẹ nhõm.',
        basePrice: 350000,
        skuPrefix: 'FN-BOU-HUE',
        imageType: 'condolence'
      },

      // ==================== HOA KỶ NIỆM (10 products) ====================
      {
        name: 'Bó Hoa Hồng Ecuador Đỏ Velvety Kỷ Niệm',
        category: 'hoa-ky-niem',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Đóa hồng Ecuador đỏ thẫm như nhung tượng trưng cho tình yêu vĩnh cửu. Bó hoa được thiết kế với giấy gói mờ đen sang trọng.',
        basePrice: 500000,
        skuPrefix: 'AN-EC-RED',
        imageType: 'red_rose'
      },
      {
        name: 'Bó Hồng Pastel Giọt Nước Dịu Dàng Sương Mai',
        category: 'hoa-ky-niem',
        tags: ['moi-ve', 'yeu-thich'],
        description: 'Tông màu hồng phấn dịu ngọt tựa như những giọt sương ban mai mọng nước. Điểm xuyết lá bạc tròn nhập khẩu thơ mộng.',
        basePrice: 420000,
        skuPrefix: 'AN-PST-DRP',
        imageType: 'pink_rose'
      },
      {
        name: 'Hộp Hoa Mẫu Đơn Peony Hoàng Gia Đẳng Cấp',
        category: 'hoa-ky-niem',
        tags: ['ban-chay'],
        description: 'Những đóa hoa Peony cánh dày tròn trịa đầy đặn biểu tượng của sự giàu sang phú quý và hạnh phúc gia đình viên mãn.',
        basePrice: 850000,
        skuPrefix: 'AN-RY-PEO',
        imageType: 'peony'
      },
      {
        name: 'Bó Oải Hương Lavender Sấy Khô Pháp Thơm Lâu',
        category: 'hoa-ky-niem',
        tags: ['yeu-thich'],
        description: 'Lavender nhập khẩu trực tiếp từ vùng Provence nước Pháp. Đóa hoa sấy khô giữ nguyên vẹn sắc tím chung thủy suốt 3 năm.',
        basePrice: 350000,
        skuPrefix: 'AN-LVD-FR',
        imageType: 'lavender'
      },
      {
        name: 'Bó Cẩm Tú Cầu Tím Mộng Mơ Lãng Mạn',
        category: 'hoa-ky-niem',
        tags: ['khuyen-mai'],
        description: 'Đóa cẩm tú cầu to tròn màu tím oải hương lãng mạn đan cài với cát tường trắng tinh khiết, gửi gắm lời cảm ơn chân thành.',
        basePrice: 320000,
        skuPrefix: 'AN-HY-PPL',
        imageType: 'hydrangea_blue'
      },
      {
        name: 'Bó Hoa Tulip Trắng Tinh Khôi Kỷ Niệm',
        category: 'hoa-ky-niem',
        tags: ['moi-ve'],
        description: 'Đóa Tulip trắng Ecuador kiêu sa biểu trưng cho sự trân trọng và chân thành. Thích hợp quà tặng kỷ niệm những dấu mốc khởi đầu.',
        basePrice: 480000,
        skuPrefix: 'AN-TLP-WHT',
        imageType: 'tulip_white'
      },
      {
        name: 'Bó Baby Trắng Mây Khói Bồng Bềnh Tình Bạn',
        category: 'hoa-ky-niem',
        tags: ['ban-chay'],
        description: 'Bó hoa baby khổng lồ trắng muốt tựa làn mây khói lơ lửng, tạo nên vẻ đẹp thuần khiết bay bổng lãng mạn nhẹ nhàng.',
        basePrice: 300000,
        skuPrefix: 'AN-BB-CLD',
        imageType: 'white_rose'
      },
      {
        name: 'Bó Hoa Hồng Kem Dâu Tây Lãng Mạn Sweetie',
        category: 'hoa-ky-niem',
        tags: ['yeu-thich'],
        description: 'Tone màu hồng kem ngọt lịm như quả dâu chín mọng ngọt ngào. Món quà hoàn hảo đốn gục trái tim người thương.',
        basePrice: 390000,
        skuPrefix: 'AN-ROS-STR',
        imageType: 'cream_rose'
      },
      {
        name: 'Hộp Hoa Hồng Phấn Sweet Love Tròn Đầy',
        category: 'hoa-ky-niem',
        tags: ['khuyen-mai'],
        description: 'Những bông hồng phấn Ecuadorian được sắp xếp tỉ mỉ hình trái tim trong chiếc hộp bằng da sang trọng cao cấp.',
        basePrice: 650000,
        skuPrefix: 'AN-BOX-SWT',
        imageType: 'pink_rose'
      },
      {
        name: 'Bó Cát Tường Tím Viền Trắng Duyên Dáng Lịch Sự',
        category: 'hoa-ky-niem',
        tags: ['moi-ve'],
        description: 'Hoa cát tường mềm mại thanh tao mang ý nghĩa vạn sự như ý, may mắn tốt lành. Tone màu tím phối trắng trang nhã.',
        basePrice: 280000,
        skuPrefix: 'AN-LIS-PPL',
        imageType: 'pink_rose'
      },

      // ==================== HOA CHÚC MỪNG (10 products) ====================
      {
        name: 'Lẵng Hoa Khai Trương Phát Tài Chúc Mừng',
        category: 'hoa-chuc-mung',
        tags: ['ban-chay'],
        description: 'Sự hòa quyện rực rỡ của hoa thiên điểu kiêu sa, hồng môn đỏ thắm và hướng dương đại cát. Giỏ hoa mang thịnh vượng.',
        basePrice: 950000,
        skuPrefix: 'CG-CONG-GLD',
        imageType: 'sunflower'
      },
      {
        name: 'Kệ Hoa Hướng Dương Thành Công Vinh Quang',
        category: 'hoa-chuc-mung',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Kệ hoa đứng cao cấp ngập tràn hướng dương vàng rực rỡ, vinh danh các mốc sự nghiệp chói lọi huy hoàng.',
        basePrice: 1200000,
        skuPrefix: 'CG-STND-SUN',
        imageType: 'sunflower'
      },
      {
        name: 'Giỏ Cẩm Tú Cầu Xanh Lam Hy Vọng Rực Rỡ',
        category: 'hoa-chuc-mung',
        tags: ['khuyen-mai'],
        description: 'Đóa Cẩm Tú Cầu xanh lam pastel cực đại nổi bật giữa nền hoa cát tường kem nhạt thanh nhã cắm giỏ gỗ mộc mạc.',
        basePrice: 460000,
        skuPrefix: 'CG-HY-BLU',
        imageType: 'hydrangea_blue'
      },
      {
        name: 'Bó Hoa Đồng Tiền Đỏ May Mắn Hồng Phát',
        category: 'hoa-chuc-mung',
        tags: ['moi-ve'],
        description: 'Những đóa hoa đồng tiền Ecuador đỏ tươi rực lửa mang năng lượng may mắn căng tràn khí thế thịnh vượng ngày tốt lành.',
        basePrice: 380000,
        skuPrefix: 'CG-GER-RED',
        imageType: 'gerbera'
      },
      {
        name: 'Bình Hoa Lan Hồ Điệp Phú Quý Hoàng Gia',
        category: 'hoa-chuc-mung',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Chậu lan hồ điệp trắng 5 cành sang trọng được phối đá cuội tự nhiên và rêu xanh mộc mạc. Món quà thượng hạng doanh nhân.',
        basePrice: 2500000,
        skuPrefix: 'CG-ORC-WHT',
        imageType: 'orchid_white'
      },
      {
        name: 'Bó Hoa Ly Vàng Đại Cát Thịnh Vượng',
        category: 'hoa-chuc-mung',
        tags: ['khuyen-mai'],
        description: 'Ly vàng hoàng gia tai to tỏa hương thơm thanh khiết ngọt ngào bay xa. Thiết kế bó hoa kiêu hãnh thay lời chúc thăng tiến.',
        basePrice: 420000,
        skuPrefix: 'CG-LIL-YLW',
        imageType: 'lily_yellow'
      },
      {
        name: 'Giỏ Hoa Cát Tường Xanh Matcha Tươi Trẻ',
        category: 'hoa-chuc-mung',
        tags: ['moi-ve'],
        description: 'Cát tường xanh matcha độc đáo, biểu trưng cho sự như ý cát tường và an nhiên bình an. Thiết kế tươi trẻ sống động.',
        basePrice: 350000,
        skuPrefix: 'CG-LIS-GRN',
        imageType: 'pink_rose'
      },
      {
        name: 'Bó Hoa Hướng Dương & Baby Vàng Nắng Ấm',
        category: 'hoa-chuc-mung',
        tags: ['ban-chay'],
        description: 'Sắc vàng óng ả của 5 đóa hướng dương phối cùng hoa baby trắng tinh xôi như những tia nắng ấm ban mai tin tưởng tương lai.',
        basePrice: 300000,
        skuPrefix: 'CG-SUN-BABY',
        imageType: 'sunflower'
      },
      {
        name: 'Lẵng Hoa Thắng Lợi Rực Rỡ Sắc Cam',
        category: 'hoa-chuc-mung',
        tags: ['yeu-thich'],
        description: 'Tone màu cam cháy cá tính làm chủ đạo từ hoa hồng cam lửa phối cát tường kem. Phù hợp cho những ai yêu thích phá cách.',
        basePrice: 780000,
        skuPrefix: 'CG-CONG-ORG',
        imageType: 'orange_rose'
      },
      {
        name: 'Giỏ Hoa Hồng Cam Ecuador Rực Lửa Nhiệt Thành',
        category: 'hoa-chuc-mung',
        tags: ['moi-ve', 'khuyen-mai'],
        description: 'Món quà chúc mừng tràn trề nhiệt huyết rực rỡ nhiệt thành với hồng Ecuador cam lửa độc đáo. Gửi gắm may mắn phát đạt.',
        basePrice: 580000,
        skuPrefix: 'CG-ROS-ORG',
        imageType: 'orange_rose'
      },

      // ==================== LOẠI HOA LẺ (10 products) ====================
      {
        name: 'Cành Hồng Ecuador Đỏ Đơn Lẻ Kiêu Kỳ',
        category: 'loai-hoa-le',
        tags: ['ban-chay'],
        description: 'Một bông hồng Ecuador đỏ nhung cao cấp cành dài cắm lọ thủy tinh nhỏ mang xúc cảm Pháp tinh xảo đơn sơ.',
        basePrice: 60000,
        skuPrefix: 'SG-ROS-RED',
        imageType: 'red_rose'
      },
      {
        name: 'Bó Tulip Vàng Lẻ Mộc Mạc Thơ Mộng',
        category: 'loai-hoa-le',
        tags: ['yeu-thich'],
        description: 'Một nhành Tulip vàng rực bọc mộc mạc bằng giấy xi măng vintage và ruy băng thô. Vẻ đẹp tối giản lãng mạn đầy thơ.',
        basePrice: 90000,
        skuPrefix: 'SG-TLP-YLW',
        imageType: 'tulip_yellow'
      },
      {
        name: 'Bó Hướng Dương Lẻ Bản Tròn Tươi Vui',
        category: 'loai-hoa-le',
        tags: ['khuyen-mai'],
        description: 'Một đóa hướng dương nở tròn cực đại bọc tối giản kiếng bóng kính xinh tươi thắp sáng bàn học rạng ngời.',
        basePrice: 80000,
        skuPrefix: 'SG-SUN-ONE',
        imageType: 'sunflower'
      },
      {
        name: 'Cành Cẩm Tú Cầu Xanh Lẻ Ecuador Mát Dịu',
        category: 'loai-hoa-le',
        tags: ['moi-ve'],
        description: 'Một đóa cẩm tú cầu xanh lam Ecuador cực to bọc giấy lụa mờ đen tương phản, mang vẻ kiêu sa thanh nhã sang chảnh.',
        basePrice: 150000,
        skuPrefix: 'SG-HYD-BLU',
        imageType: 'hydrangea_blue'
      },
      {
        name: 'Bó Hoa Ly Trắng Lẻ Thơm Ngát Dịu Thao',
        category: 'loai-hoa-le',
        tags: ['ban-chay'],
        description: 'Một cành hoa ly trắng 3 tai bung nở tỏa hương thơm ngát tinh khiết cắm bình trưng bày thư thái góc phòng khách.',
        basePrice: 110000,
        skuPrefix: 'SG-LIL-WHT',
        imageType: 'lily_white'
      },
      {
        name: 'Đóa Mẫu Đơn Peony Hồng Lẻ Cực Phẩm Đẳng Cấp',
        category: 'loai-hoa-le',
        tags: ['yeu-thich', 'ban-chay'],
        description: 'Một đóa hoa mẫu đơn Peony Ecuadorian hồng ngọt ngào hé nở bồng bềnh quý phái kiêu hãnh đài các bậc nhất.',
        basePrice: 220000,
        skuPrefix: 'SG-PEO-PNK',
        imageType: 'peony'
      },
      {
        name: 'Bó Cát Tường Hồng Lẻ Dịu Dàng May Mắn',
        category: 'loai-hoa-le',
        tags: ['khuyen-mai'],
        description: 'Một cành cát tường hồng phớt cánh mỏng nhẹ nhàng gói báo thanh nhã đem lại sự an vui cát tường tốt lành.',
        basePrice: 75000,
        skuPrefix: 'SG-LIS-PNK',
        imageType: 'pink_rose'
      },
      {
        name: 'Đóa Sen Hồng Bách Diệp Tinh Tế Thuần Khiết',
        category: 'loai-hoa-le',
        tags: ['moi-ve'],
        description: 'Đóa sen hồng trăm cánh Hồ Tây tỏa hương ngát thanh tao mộc mạc cắm lọ gốm sành trang nhã tôn vinh hồn quê Việt.',
        basePrice: 85000,
        skuPrefix: 'SG-LOT-HUE',
        imageType: 'lotus'
      },
      {
        name: 'Bó Hoa Cúc Họa Mi Lẻ Mộc Mạc Thu Hà Nội',
        category: 'loai-hoa-le',
        tags: ['ban-chay'],
        description: 'Nắm cúc họa mi nhỏ trắng muốt bọc báo hoài cổ mộc mạc phảng phất tiết thu dịu nhẹ bình yên của Hà Thành xưa.',
        basePrice: 95000,
        skuPrefix: 'SG-DAI-WHT',
        imageType: 'chamomile'
      },
      {
        name: 'Đóa Thược Dược Đỏ Cổ Điển Kiêu Sa',
        category: 'loai-hoa-le',
        tags: ['yeu-thich'],
        description: 'Một cành thược dược đỏ cánh kép xếp tầng đối xứng hoàn mỹ cắm tô điểm lọ men nâu đồng quê đầy hoài niệm.',
        basePrice: 70000,
        skuPrefix: 'SG-DHA-RED',
        imageType: 'dahlia'
      },

      // ==================== TIỆC & SỰ KIỆN (10 products) ====================
      {
        name: 'Thiết Kế Hoa Bàn Tiệc Sunny Day Ấm Cúng',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Dải hoa để bàn tiệc tròn rực rỡ với hoa hướng dương cắm xen cẩm chướng kem và hồng vàng ấm áp, thắp sáng bàn tiệc.',
        basePrice: 850000,
        skuPrefix: 'EV-SUN-TBL',
        imageType: 'sunflower'
      },
      {
        name: 'Dải Hoa Bàn Dài Tiệc Cưới Royal Sang Trọng',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay'],
        description: 'Dải hoa tươi chạy dọc bàn tiệc cưới dài sang trọng phong cách Hoàng Gia với hồng trắng, lá bạc tròn thơ mộng ấm cúng.',
        basePrice: 1800000,
        skuPrefix: 'EV-WED-LONG',
        imageType: 'white_rose'
      },
      {
        name: 'Cổng Hoa Cưới Pastel Sweet Dreams Lãng Mạn',
        category: 'tiec-va-su-kien',
        tags: ['yeu-thich'],
        description: 'Cổng hoa cưới dáng vòm lãng mạn phủ ngập tràn hoa cẩm tú cầu, cát tường và hồng Ecuadorian pastel ngọt ngào bay bổng.',
        basePrice: 8500000,
        skuPrefix: 'EV-GATE-WED',
        imageType: 'mixed'
      },
      {
        name: 'Hoa Cầm Tay Cô Dâu White Elegant Thanh Khiết',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay', 'moi-ve'],
        description: 'Bó hoa cưới cầm tay cô dâu dáng rủ nhẹ thanh khiết kết tác từ hoa rum (Calla Lily) trắng và hồng trắng Ecuador sang quý.',
        basePrice: 950000,
        skuPrefix: 'EV-BOU-BRD',
        imageType: 'white_rose'
      },
      {
        name: 'Hoa Cầm Tay Cô Dâu Tulip Xanh Băng Độc Bản',
        category: 'tiec-va-su-kien',
        tags: ['yeu-thich'],
        description: 'Tulip nhuộm màu Ice Blue độc quyền cuốn hút mang phong vị độc bản hiện đại sang chảnh dành cho nàng dâu cá tính độc đáo.',
        basePrice: 1100000,
        skuPrefix: 'EV-BOU-TLP',
        imageType: 'tulip_blue'
      },
      {
        name: 'Trụ Hoa Lối Đi Sân Khấu Gardenia Thơ Mộng',
        category: 'tiec-va-su-kien',
        tags: ['moi-ve'],
        description: 'Trụ hoa cắm thả tự nhiên theo phong cách khu vườn cổ tích châu Âu lãng mạn dẫn bước cô dâu chú rể ngập tràn hạnh phúc.',
        basePrice: 1500000,
        skuPrefix: 'EV-STND-PATH',
        imageType: 'mixed'
      },
      {
        name: 'Setup Hoa Backdrop Chụp Ảnh Pastel Lộng Lẫy',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay'],
        description: 'Thiết kế thi công background chụp ảnh ngập hoa tươi kết hợp voan mỏng cho các buổi tiệc sinh nhật, cưới hỏi lung linh.',
        basePrice: 6500000,
        skuPrefix: 'EV-BKDP-PST',
        imageType: 'pink_rose'
      },
      {
        name: 'Bộ Hoa Cài Áo Chú Rể & Quan Khách Tinh Xảo',
        category: 'tiec-va-su-kien',
        tags: ['khuyen-mai'],
        description: 'Những cụm hoa cài áo mini tinh xảo chế tác thủ công đồng điệu với hoa cưới cô dâu chú rể, tạo nét trang trọng lịch thiệp.',
        basePrice: 50000,
        skuPrefix: 'EV-BTN-MINI',
        imageType: 'red_rose'
      },
      {
        name: 'Bình Hoa Lớn Sảnh Hội Nghị Diamond Kiêu Sa',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay'],
        description: 'Thiết kế bình hoa cực đại đặt tại trung tâm sảnh đón khách hội nghị với hoa lan, thiên điểu kiêu sa khẳng định vị thế VIP.',
        basePrice: 3500000,
        skuPrefix: 'EV-VA-HALL',
        imageType: 'mixed'
      },
      {
        name: 'Thiết Kế Hoa Bàn Hội Nghị Đại Biểu Trang Trọng',
        category: 'tiec-va-su-kien',
        tags: ['moi-ve'],
        description: 'Dải hoa tươi cắm thấp thanh lịch sang trọng chạy dọc bàn họp đoàn đại biểu trang nghiêm, tạo cảm giác thư thái dễ chịu.',
        basePrice: 1200000,
        skuPrefix: 'EV-TBL-CONF',
        imageType: 'mixed'
      }
    ];

    let imageIdx = 0;
    for (const p of rawBlueprints) {
      console.log(`🛒 Seeding Product [${imageIdx + 1}/120]: ${p.name}...`);

      // Determine main image and alternate images from categorized FLOWER_IMAGES
      const imagesList = FLOWER_IMAGES[p.imageType] || FLOWER_IMAGES['mixed'];
      const mainImageUrl = imagesList[imageIdx % imagesList.length];
      const altImages = [
        PINTEREST_AESTHETIC_FLOWER,
        imagesList[(imageIdx + 1) % imagesList.length] || PINTEREST_AESTHETIC_FLOWER,
        imagesList[(imageIdx + 2) % imagesList.length] || PINTEREST_AESTHETIC_FLOWER
      ];

      // Define variant configurations based on category
      let variantsConf = [];
      if (p.category === 'loai-hoa-le') {
        variantsConf = [
          { sizeName: 'Cành Tiêu Chuẩn', price: p.basePrice, stock: 60, skuSuffix: 'STD' },
          { sizeName: 'Bó Lớn (10 Cành)', price: Math.round(p.basePrice * 8.5), stock: 25, skuSuffix: '10C' }
        ];
      } else if (p.category === 'tiec-va-su-kien' || p.basePrice >= 3000000) {
        variantsConf = [
          { sizeName: 'Gói Standard', price: p.basePrice, stock: 12, skuSuffix: 'STD' },
          { sizeName: 'Gói Premium Luxe', price: Math.round(p.basePrice * 1.5), stock: 6, skuSuffix: 'PRM' }
        ];
      } else {
        variantsConf = [
          { sizeName: 'Size S (Thanh nhã)', price: p.basePrice, stock: 25, skuSuffix: 'S' },
          { sizeName: 'Size M (Thịnh soạn)', price: Math.round(p.basePrice * 1.4), stock: 18, skuSuffix: 'M' },
          { sizeName: 'Size L (Hoàng gia)', price: Math.round(p.basePrice * 2.1), stock: (imageIdx % 12 === 0) ? 0 : 10, skuSuffix: 'L' }
        ];
      }

      // Generate ObjectId for minifiedVariants in advance
      const minifiedVariants = variantsConf.map(v => ({
        variantId: new mongoose.Types.ObjectId(),
        sizeName: v.sizeName,
        price: mongoose.Types.Decimal128.fromString(v.price.toString()),
        inStock: v.stock > 0,
      }));

      // Generate clean Vietnamese slug string
      const cleanSlug = p.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Create Product document
      const createdProduct = await Product.create({
        name: p.name,
        slug: cleanSlug,
        description: p.description,
        mainImageUrl: mainImageUrl,
        status: ProductStatus.ACTIVE,
        category: categories[p.category]._id,
        tags: p.tags.map(slug => tags[slug]._id),
        minifiedVariants: minifiedVariants,
        reviewStats: {
          averageRating: 0,
          totalReviews: 0
        },
        views: ((imageIdx * 23 + 127) % 500) + 60,
        soldCount: ((imageIdx * 9 + 17) % 150) + 15
      });

      // Create ProductVariants and StockLevels
      for (let i = 0; i < variantsConf.length; i++) {
        const v = variantsConf[i];
        const minified = minifiedVariants[i];

        const variant = await ProductVariant.create({
          _id: minified.variantId,
          product: createdProduct._id,
          sku: `${p.skuPrefix}-${v.skuSuffix}`,
          sizeName: v.sizeName,
          price: mongoose.Types.Decimal128.fromString(v.price.toString()),
          stockStatus: v.stock === 0 ? StockStatus.OUT_OF_STOCK : (v.stock < 5 ? StockStatus.LOW : StockStatus.IN_STOCK),
          isActive: true,
          imageUrls: [mainImageUrl, ...altImages]
        });

        // Seed inventory stock level
        await StockLevel.create({
          warehouse: warehouse._id,
          productVariant: variant._id,
          quantity: mongoose.Types.Decimal128.fromString(v.stock.toString()),
          minThreshold: mongoose.Types.Decimal128.fromString('5'),
        });
      }

      // Seed mock reviews for this product
      const reviewCount = 2 + (imageIdx % 3); // 2 -> 4 reviews per product
      const ratings = [5, 4, 5, 3, 4];
      const comments = [
        'Hoa rất tươi, phối màu đẹp và gói hàng chắc chắn. Nhận quà ai cũng khen.',
        'Shop tư vấn tận tình, giao đúng giờ, bó hoa nhìn ngoài còn đẹp hơn hình.',
        'Mùi hương tự nhiên dễ chịu, để được khá lâu, mình sẽ đặt lại dịp tới.',
        'Thiết kế đúng phong cách nhẹ nhàng, nhìn tinh tế và phù hợp để tặng.',
        'Dịch vụ ổn, nhân viên thân thiện, sản phẩm nhận được đúng như mô tả.',
        'Đóng gói cẩn thận, thiệp viết đẹp, tổng thể trải nghiệm mua hàng rất tốt.',
      ];

      for (let r = 0; r < reviewCount; r++) {
        const reviewer = reviewCustomers[(imageIdx + r) % reviewCustomers.length];
        try {
          await Review.create({
            product: createdProduct._id,
            customer: reviewer._id,
            rating: ratings[(imageIdx + r) % ratings.length],
            comment: comments[(imageIdx + r) % comments.length],
            isVerified: true
          });
        } catch (e) {
          // Ignore review duplicate index collision
        }
      }

      const seededReviews = await Review.find({ product: createdProduct._id }).select('rating');
      const totalReviews = seededReviews.length;
      const averageRating = totalReviews > 0
        ? Number((seededReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1))
        : 0;
      await Product.findByIdAndUpdate(createdProduct._id, {
        'reviewStats.averageRating': averageRating,
        'reviewStats.totalReviews': totalReviews
      });

      imageIdx++;
    }

    console.log(`\n🌟 SEEDING COMPLETE: Successfully seeded exactly ${imageIdx} highly detailed products into MongoDB! 🌟`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedCatalog();
