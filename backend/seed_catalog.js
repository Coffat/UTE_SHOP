/**
 * seed_catalog.js – Seeding complete catalog data for UTE_SHOP (Categories, Tags, Products, ProductVariants, StockLevels, Reviews)
 *
 * Seeding at least 52 highly diverse, professional flower products.
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
import User from './modules/user/models/User.js';
import Customer from './modules/user/models/Customer.js';

import ProductStatus from './shared/enums/ProductStatus.js';
import StockStatus from './shared/enums/StockStatus.js';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/uteshop';

// Beautiful aesthetic flower images from Unsplash (curated list of 52 distinct images)
const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop', // 1
  'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=600&auto=format&fit=crop', // 2
  'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=600&auto=format&fit=crop', // 3
  'https://images.unsplash.com/photo-1587334206574-35113ab64062?q=80&w=600&auto=format&fit=crop', // 4
  'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600&auto=format&fit=crop', // 5
  'https://images.unsplash.com/photo-1508784932216-4b55da6376bc?q=80&w=600&auto=format&fit=crop', // 6
  'https://images.unsplash.com/photo-1533604905143-6a72d22e9617?q=80&w=600&auto=format&fit=crop', // 7
  'https://images.unsplash.com/photo-1550950158-d0d960dff51b?q=80&w=600&auto=format&fit=crop', // 8
  'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=600&auto=format&fit=crop', // 9
  'https://images.unsplash.com/photo-1562690868-60bbe7293e94?q=80&w=600&auto=format&fit=crop', // 10
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop', // 11
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=600&auto=format&fit=crop', // 12
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop', // 13
  'https://images.unsplash.com/photo-1507504038482-7621c210d50d?q=80&w=600&auto=format&fit=crop', // 14
  'https://images.unsplash.com/photo-1447875226468-6d729d5a612a?q=80&w=600&auto=format&fit=crop', // 15
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop', // 16
  'https://images.unsplash.com/photo-1551893086-c2475148b240?q=80&w=600&auto=format&fit=crop', // 17
  'https://images.unsplash.com/photo-1589244159943-460088ed5c92?q=80&w=600&auto=format&fit=crop', // 18
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop', // 19
  'https://images.unsplash.com/photo-1520763185298-1b434c919102?q=80&w=600&auto=format&fit=crop', // 20
  'https://images.unsplash.com/photo-1457089328109-e5d9bd499191?q=80&w=600&auto=format&fit=crop', // 21
  'https://images.unsplash.com/photo-1572458479138-81b4028590d4?q=80&w=600&auto=format&fit=crop', // 22
  'https://images.unsplash.com/photo-1606757389105-a28971f54460?q=80&w=600&auto=format&fit=crop', // 23
  'https://images.unsplash.com/photo-1558350315-8aa00e8e4590?q=80&w=600&auto=format&fit=crop', // 24
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop', // 25
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=600&auto=format&fit=crop', // 26
  'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=600&auto=format&fit=crop', // 27
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=600&auto=format&fit=crop', // 28
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop', // 29
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop', // 30
  'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop', // 31
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=600&auto=format&fit=crop', // 32
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=600&auto=format&fit=crop', // 33
  'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?q=80&w=600&auto=format&fit=crop', // 34
  'https://images.unsplash.com/photo-1500627869374-13cd993b1115?q=80&w=600&auto=format&fit=crop', // 35
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=600&auto=format&fit=crop', // 36
  'https://images.unsplash.com/photo-1472214222541-d510753a4907?q=80&w=600&auto=format&fit=crop', // 37
  'https://images.unsplash.com/photo-1434064511983-18c6dae20ed5?q=80&w=600&auto=format&fit=crop', // 38
  'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=600&auto=format&fit=crop', // 39
  'https://images.unsplash.com/photo-1421930866200-c0db36265606?q=80&w=600&auto=format&fit=crop', // 40
  'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?q=80&w=600&auto=format&fit=crop', // 41
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=600&auto=format&fit=crop', // 42
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=600&auto=format&fit=crop', // 43
  'https://images.unsplash.com/photo-1505233508722-442d45a90ede?q=80&w=600&auto=format&fit=crop', // 44
  'https://images.unsplash.com/photo-1498612753354-f121b6643f78?q=80&w=600&auto=format&fit=crop', // 45
  'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=600&auto=format&fit=crop', // 46
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600&auto=format&fit=crop', // 47
  'https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?q=80&w=600&auto=format&fit=crop', // 48
  'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?q=80&w=600&auto=format&fit=crop', // 49
  'https://images.unsplash.com/photo-1495908358091-c19e89c48201?q=80&w=600&auto=format&fit=crop', // 50
  'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?q=80&w=600&auto=format&fit=crop', // 51
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop'  // 52
];

// Pinterest aesthetic base image
const PINTEREST_AESTHETIC_FLOWER = 'https://i.pinimg.com/564x/0f/c2/f7/0fc2f7902d26fdfbfb54ff4beed84910.jpg';

const seedCatalog = async () => {
  console.log('🌱 Starting 50+ Catalog Seed Data Script...');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

    // 1. Clean existing records & drop unused index
    console.log('🗑️ Cleaning existing collections...');
    await Category.deleteMany({});
    await Tag.deleteMany({});
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});
    await Review.deleteMany({});
    await Warehouse.deleteMany({});
    await StockLevel.deleteMany({});
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

    // 3. Seed Categories
    console.log('📁 Seeding Categories...');
    const categoriesData = [
      { name: 'Hoa Kỷ Niệm', slug: 'hoa-ky-niem', description: 'Gửi trao yêu thương, kỷ niệm khoảnh khắc ngọt ngào bên nhau.' },
      { name: 'Hoa Chúc Mừng', slug: 'hoa-chuc-mung', description: 'Chúc mừng thành công, khai trương, tốt nghiệp rực rỡ.' },
      { name: 'Loại hoa lẻ', slug: 'loai-hoa-le', description: 'Tự do lựa chọn loài hoa yêu thích cho không gian sống.' },
      { name: 'Tiệc & Sự kiện', slug: 'tiec-va-su-kien', description: 'Thiết kế hoa sang trọng cho các buổi tiệc cưới, hội nghị.' },
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
      { name: 'Yêu thích', slug: 'yeu-thich' },
    ];
    const tags = {};
    for (const tag of tagsData) {
      const created = await Tag.create(tag);
      tags[tag.slug] = created;
    }
    console.log(`✅ Seeding ${Object.keys(tags).length} Tags done.`);

    // 5. Setup Customer for Reviews
    let customer = await Customer.findOne({ email: 'vuthang@uteshop.vn' });
    if (!customer) {
      console.log('⚠️ Customer not found, creating a mock customer for reviews...');
      customer = await Customer.create({
        fullName: 'Thắng Vũ',
        email: 'vuthang@uteshop.vn',
        passwordHash: '$2a$10$vY3Z.Yp75d3fXz9Vpx1OQeT3l9EpyQ2Wl/xTfF1Q9D2WwA0T2mUuW', // 'password123'
        phone: '0123456789',
        isEmailVerified: true,
        status: 'ACTIVE',
      });
    }

    // 6. 52 Detailed Flower Product Blueprints
    const rawBlueprints = [
      // ─── HOA KỶ NIỆM (13 Products) ──────────────────────────────────────────
      {
        name: 'Bó Hoa Hồng Ecuador Đỏ Velvety',
        category: 'hoa-ky-niem',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Đóa hồng Ecuador đỏ thẫm như nhung tượng trưng cho tình yêu vĩnh cửu. Bó hoa được thiết kế với giấy gói mờ đen sang trọng kết hợp dải nơ satin đỏ quý phái.',
        basePrice: 500000,
        skuPrefix: 'EC-RED'
      },
      {
        name: 'Bó Hồng Pastel Giọt Nước Dịu Dàng',
        category: 'hoa-ky-niem',
        tags: ['moi-ve', 'yeu-thich'],
        description: 'Tông màu hồng phấn dịu ngọt tựa như những giọt sương ban mai mọng nước. Điểm xuyết lá bạc tròn nhập khẩu mang hơi thở thơ mộng đúng điệu Pinterest.',
        basePrice: 420000,
        skuPrefix: 'PST-DRP'
      },
      {
        name: 'Hộp Hoa Mẫu Đơn Peony Hoàng Gia',
        category: 'hoa-ky-niem',
        tags: ['ban-chay'],
        description: 'Những đóa hoa Peony cánh dày tròn trịa đầy đặn biểu tượng của sự giàu sang phú quý và hạnh phúc gia đình viên mãn, được trình bày trang nhã trong hộp kính mờ.',
        basePrice: 850000,
        skuPrefix: 'RY-PEO'
      },
      {
        name: 'Bó Oải Hương Lavender Sấy Khô Pháp',
        category: 'hoa-ky-niem',
        tags: ['yeu-thich'],
        description: 'Lavender nhập khẩu trực tiếp từ vùng Provence nước Pháp. Đóa hoa sấy khô giữ nguyên vẹn sắc tím chung thủy cùng hương thơm ngào ngạt suốt 2-3 năm.',
        basePrice: 350000,
        skuPrefix: 'LVD-FR'
      },
      {
        name: 'Bó Cẩm Tú Cầu Tím Mộng Mơ',
        category: 'hoa-ky-niem',
        tags: ['khuyen-mai'],
        description: 'Đóa cẩm tú cầu to tròn màu tím oải hương lãng mạn đan cài với cát tường trắng tinh khiết, gửi gắm lời cảm ơn chân thành và sâu sắc nhất.',
        basePrice: 320000,
        skuPrefix: 'HY-PPL'
      },
      {
        name: 'Bó Hoa Tulip Trắng Tinh Khôi',
        category: 'hoa-ky-niem',
        tags: ['moi-ve'],
        description: 'Đóa Tulip trắng Ecuador kiêu sa biểu trưng cho sự trân trọng và chân thành. Thích hợp làm quà tặng kỷ niệm những dấu mốc khởi đầu đáng nhớ.',
        basePrice: 480000,
        skuPrefix: 'TLP-WHT'
      },
      {
        name: 'Bó Baby Trắng Mây Khói Bồng Bềnh',
        category: 'hoa-ky-niem',
        tags: ['ban-chay'],
        description: 'Bó hoa baby khổng lồ trắng muốt tựa làn mây khói lơ lửng, tạo nên vẻ đẹp thuần khiết bay bổng, tôn lên sự lãng mạn bay bổng nhẹ nhàng.',
        basePrice: 300000,
        skuPrefix: 'BB-CLD'
      },
      {
        name: 'Bó Hoa Hồng Kem Dâu Tây Lãng Mạn',
        category: 'hoa-ky-niem',
        tags: ['yeu-thich'],
        description: 'Tone màu hồng kem ngọt lịm như quả dâu chín mọng ngọt ngào. Món quà hoàn hảo đốn gục trái tim người thương từ cái nhìn đầu tiên.',
        basePrice: 390000,
        skuPrefix: 'ROS-STR'
      },
      {
        name: 'Hộp Hoa Hồng Phấn Sweet Love',
        category: 'hoa-ky-niem',
        tags: ['khuyen-mai'],
        description: 'Những bông hồng phấn Ecuadorian được sắp xếp tỉ mỉ hình trái tim trong chiếc hộp bằng da sang trọng cao cấp, kèm thiệp chúc mừng ý nghĩa.',
        basePrice: 650000,
        skuPrefix: 'BOX-SWT'
      },
      {
        name: 'Bó Cát Tường Tím Viền Trắng Duyên Dáng',
        category: 'hoa-ky-niem',
        tags: ['moi-ve'],
        description: 'Hoa cát tường mềm mại thanh tao mang ý nghĩa vạn sự như ý, may mắn tốt lành. Tone màu tím phối trắng tạo nên vẻ đẹp trang nhã cổ điển.',
        basePrice: 280000,
        skuPrefix: 'LIS-PPL'
      },
      {
        name: 'Bó Hoa Hồng Trắng Trinh Nguyên',
        category: 'hoa-ky-niem',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Những đóa hồng Ecuador trắng to tròn căng mịn bọc trong lớp giấy kiếng mờ tối giản. Thể hiện sự thanh cao tôn kính trọn vẹn yêu thương.',
        basePrice: 450000,
        skuPrefix: 'ROS-WHT'
      },
      {
        name: 'Giỏ Hoa Pastel Dreams',
        category: 'hoa-ky-niem',
        tags: ['ban-chay'],
        description: 'Sự pha trộn ngọt ngào giữa hồng kem dâu, cát tường nhạt và lá bạc tròn cắm xinh xắn trong giỏ mây tre đan đậm chất đồng quê châu Âu thanh nhã.',
        basePrice: 520000,
        skuPrefix: 'BSK-PST'
      },
      {
        name: 'Bó Tulip Hồng Blush Ecuador kiều diễm',
        category: 'hoa-ky-niem',
        tags: ['yeu-thich', 'moi-ve'],
        description: 'Tulip Ecuador phớt hồng cực lớn kết hợp cùng ruy băng lụa tơ tằm thanh mảnh. Đem lại xúc cảm dịu dàng lãng mạn tuyệt đỉnh.',
        basePrice: 550000,
        skuPrefix: 'TLP-BLSH'
      },

      // ─── HOA CHÚC MỪNG (13 Products) ────────────────────────────────────────
      {
        name: 'Lẵng Hoa Khai Trương Phát Tài',
        category: 'hoa-chuc-mung',
        tags: ['ban-chay'],
        description: 'Sự hòa quyện rực rỡ của hoa thiên điểu kiêu sa, hồng môn đỏ thắm và hướng dương đại cát. Giỏ hoa mang thông điệp thịnh vượng may mắn.',
        basePrice: 950000,
        skuPrefix: 'CONG-GLD'
      },
      {
        name: 'Kệ Hoa Hướng Dương Thành Công',
        category: 'hoa-chuc-mung',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Kệ hoa đứng cao cấp ngập tràn hướng dương vàng rực rỡ, thích hợp tặng kỷ niệm tốt nghiệp, khánh thành hay vinh danh các mốc sự nghiệp chói lọi.',
        basePrice: 1200000,
        skuPrefix: 'STND-SUN'
      },
      {
        name: 'Giỏ Cẩm Tú Cầu Xanh Lam Hy Vọng',
        category: 'hoa-chuc-mung',
        tags: ['khuyen-mai'],
        description: 'Đóa Cẩm Tú Cầu xanh lam pastel cực đại nổi bật giữa nền hoa cát tường kem nhạt thanh nhã, cắm sang trọng trong giỏ gỗ mộc mạc.',
        basePrice: 460000,
        skuPrefix: 'HY-BLU'
      },
      {
        name: 'Bó Hoa Đồng Tiền Đỏ May Mắn',
        category: 'hoa-chuc-mung',
        tags: ['moi-ve'],
        description: 'Những đóa hoa đồng tiền Ecuador đỏ tươi rực lửa mang năng lượng may mắn căng tràn khí thế thịnh vượng tài lộc cho gia chủ ngày khai trương.',
        basePrice: 380000,
        skuPrefix: 'GER-RED'
      },
      {
        name: 'Bình Hoa Lan Hồ Điệp Phú Quý',
        category: 'hoa-chuc-mung',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Chậu lan hồ điệp trắng 5 cành sang trọng được phối đá cuội tự nhiên và rêu xanh mộc mạc. Món quà thượng hạng gửi tặng đối tác doanh nghiệp.',
        basePrice: 2500000,
        skuPrefix: 'ORC-WHT'
      },
      {
        name: 'Bó Hoa Ly Vàng Đại Cát',
        category: 'hoa-chuc-mung',
        tags: ['khuyen-mai'],
        description: 'Ly vàng hoàng gia tai to tỏa hương thơm thanh khiết ngọt ngào bay xa. Thiết kế bó hoa kiêu hãnh thay lời chúc thăng tiến vững vàng.',
        basePrice: 420000,
        skuPrefix: 'LIL-YLW'
      },
      {
        name: 'Giỏ Hoa Cát Tường Xanh Matcha',
        category: 'hoa-chuc-mung',
        tags: ['moi-ve'],
        description: 'Cát tường xanh matcha độc đáo, biểu trưng cho sự như ý cát tường và an nhiên bình an. Thiết kế sang xịn tạo cảm xúc tươi trẻ tràn đầy sức sống.',
        basePrice: 350000,
        skuPrefix: 'LIS-GRN'
      },
      {
        name: 'Bó Hoa Hướng Dương & Baby Vàng Nắng',
        category: 'hoa-chuc-mung',
        tags: ['ban-chay'],
        description: 'Sắc vàng óng ả của 5 đóa hướng dương phối cùng hoa baby trắng tinh xôi như những tia nắng ấm ban mai, biểu thị niềm tin tương lai rạng ngời.',
        basePrice: 300000,
        skuPrefix: 'SUN-BABY'
      },
      {
        name: 'Lẵng Hoa Thắng Lợi Rực Rỡ',
        category: 'hoa-chuc-mung',
        tags: ['yeu-thich'],
        description: 'Tone màu cam cháy cá tính làm chủ đạo từ hoa hồng cam lửa phối cát tường kem. Phù hợp cho những ai yêu thích sự phá cách cá tính mạnh mẽ.',
        basePrice: 780000,
        skuPrefix: 'CONG-ORG'
      },
      {
        name: 'Giỏ Hoa Hồng Cam Ecuador Rực Lửa',
        category: 'hoa-chuc-mung',
        tags: ['moi-ve', 'khuyen-mai'],
        description: 'Món quà chúc mừng tràn trề nhiệt huyết rực rỡ nhiệt thành với hồng Ecuador cam lửa độc đáo. Gửi gắm may mắn phát đạt rực rỡ.',
        basePrice: 580000,
        skuPrefix: 'ROS-ORG'
      },
      {
        name: 'Kệ Hoa Khai Trương Thịnh Vượng Đôi',
        category: 'hoa-chuc-mung',
        tags: ['ban-chay'],
        description: 'Kệ hoa 2 tầng khổng lồ hoành tráng kết hợp hoa lan hồ điệp, thiên điểu và hồng đỏ. Biểu trưng cho sự vươn tầm đỉnh cao thịnh vượng trường tồn.',
        basePrice: 3200000,
        skuPrefix: 'STND-ROY'
      },
      {
        name: 'Bó Hoa Hồng Đỏ Cánh Dày Ecuador',
        category: 'hoa-chuc-mung',
        tags: ['yeu-thich'],
        description: 'Đóa hồng Ecuadorian cánh siêu dày to tròn kiêu sa, tạo ấn tượng đẳng cấp quý phái vượt bậc chúc mừng ngày lễ kỷ niệm trọng đại thành công.',
        basePrice: 690000,
        skuPrefix: 'EC-PREM'
      },
      {
        name: 'Bình Hoa Thiên Điểu Kiêu Sa Hội Tụ',
        category: 'hoa-chuc-mung',
        tags: ['moi-ve'],
        description: 'Thiên điểu cắm lọ cao sang trọng như những cánh chim trời tự do sải cánh vươn xa chinh phục những hoài bão khát vọng đỉnh cao mới.',
        basePrice: 850000,
        skuPrefix: 'BIRD-ROY'
      },

      // ─── LOẠI HOA LẺ (13 Products) ──────────────────────────────────────────
      {
        name: 'Cành Hồng Ecuador Đỏ Đơn Lẻ',
        category: 'loai-hoa-le',
        tags: ['ban-chay'],
        description: 'Một bông hồng Ecuador đỏ nhung cao cấp cành dài 70cm siêu đẹp, bọc tối giản bằng giấy kiếng mờ lơ lửng phong cách Pháp sang chảnh.',
        basePrice: 60000,
        skuPrefix: 'SNGL-RED'
      },
      {
        name: 'Bó Tulip Vàng Lẻ Mộc Mạc',
        category: 'loai-hoa-le',
        tags: ['yeu-thich'],
        description: 'Đóa Tulip vàng rực rỡ đơn lẻ bọc mộc mạc bằng giấy xi măng xi măng vintage và ruy băng thô. Vẻ đẹp tối giản đầy chất thơ cuốn hút.',
        basePrice: 90000,
        skuPrefix: 'SNGL-TLP'
      },
      {
        name: 'Bó Hướng Dương Lẻ Bản Tròn',
        category: 'loai-hoa-le',
        tags: ['khuyen-mai'],
        description: 'Một đóa hướng dương nở tròn cực đại kèm theo vài nhánh lá bạc tròn xinh xắn bọc phong cách mộc mạc giản đơn ấm áp.',
        basePrice: 80000,
        skuPrefix: 'SNGL-SUN'
      },
      {
        name: 'Cành Cẩm Tú Cầu Xanh Lẻ Ecuador',
        category: 'loai-hoa-le',
        tags: ['moi-ve'],
        description: 'Đ đóa cẩm tú cầu xanh lam Ecuador cực to khổng lồ bọc giấy kính bóng mờ tinh xảo. Đơn giản mà đẳng cấp thanh nhã nổi bật.',
        basePrice: 150000,
        skuPrefix: 'SNGL-HYD'
      },
      {
        name: 'Bó Hoa Ly Trắng Lẻ Thơm Ngát',
        category: 'loai-hoa-le',
        tags: ['ban-chay'],
        description: 'Một cành hoa ly trắng 3 tai bung nở ngào ngạt hương thơm thanh tao nhẹ nhàng thích hợp cắm trang trí phòng khách dịu nhẹ.',
        basePrice: 110000,
        skuPrefix: 'SNGL-LIL'
      },
      {
        name: 'Đóa Mẫu Đơn Peony Hồng Lẻ Cực Phẩm',
        category: 'loai-hoa-le',
        tags: ['yeu-thich', 'ban-chay'],
        description: 'Một đóa hoa mẫu đơn Peony Ecuadorian hồng ngọt ngào vừa hé nở, cánh hoa xếp nếp bồng bềnh kiêu sa đài các lộng lẫy.',
        basePrice: 220000,
        skuPrefix: 'SNGL-PEO'
      },
      {
        name: 'Bó Cát Tường Hồng Lẻ Dịu Dàng',
        category: 'loai-hoa-le',
        tags: ['khuyen-mai'],
        description: 'Một nhánh cát tường màu hồng phấn ngọt ngào, những cánh hoa xếp lớp mong manh tựa như lụa mang may mắn tốt lành đến muôn nơi.',
        basePrice: 75000,
        skuPrefix: 'SNGL-LIS'
      },
      {
        name: 'Đóa Sen Hồng Bách Diệp Tinh Tế',
        category: 'loai-hoa-le',
        tags: ['moi-ve'],
        description: 'Đ đóa sen hồng trăm cánh Hồ Tây tỏa hương thơm thanh khiết mộc mạc mộc mạc đậm chất hồn quê truyền thống Việt Nam tinh tế.',
        basePrice: 85000,
        skuPrefix: 'SNGL-LOT'
      },
      {
        name: 'Bó Hoa Cúc Họa Mi Lẻ Mộc Mạc',
        category: 'loai-hoa-le',
        tags: ['ban-chay'],
        description: 'Một nắm hoa cúc họa mi trắng nhụy vàng nhỏ xinh xinh bọc đơn sơ bằng báo cổ điển mang trọn sắc thu mát rượi lãng mạn Hà Nội.',
        basePrice: 95000,
        skuPrefix: 'SNGL-DAI'
      },
      {
        name: 'Đóa Thược Dược Đỏ Cổ Điển',
        category: 'loai-hoa-le',
        tags: ['yeu-thich'],
        description: 'Đóa hoa thược dược màu đỏ nhung hoài cổ cánh kép xếp tầng đối xứng hoàn hảo thích hợp làm duyên cắm lọ gốm mộc mạc.',
        basePrice: 70000,
        skuPrefix: 'SNGL-DHA'
      },
      {
        name: 'Đóa Cẩm Chướng Hồng Phấn Lẻ',
        category: 'loai-hoa-le',
        tags: ['khuyen-mai'],
        description: 'Một đóa cẩm chướng cánh ren hồng phấn biểu tượng của tình mẫu tử và lòng tri ân sâu sắc thích hợp làm quà tặng ý nghĩa dịu êm.',
        basePrice: 65000,
        skuPrefix: 'SNGL-CAR'
      },
      {
        name: 'Đóa Hoa Đồng Tiền Vàng Lẻ Nắng',
        category: 'loai-hoa-le',
        tags: ['moi-ve'],
        description: 'Một đóa đồng tiền màu vàng nắng tươi rực, đem lại niềm vui tiếng cười hân hoan rạng rỡ cắm trang trí bàn làm việc năng lượng.',
        basePrice: 50000,
        skuPrefix: 'SNGL-GER'
      },
      {
        name: 'Bó Baby Trắng Lẻ Gói Giấy Báo',
        category: 'loai-hoa-le',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Nhành hoa baby trắng bọc giấy báo vintage hoài cổ nhỏ gọn tinh tế, mang xúc cảm thanh xuân trong trẻo thơ ngây dịu dàng.',
        basePrice: 85000,
        skuPrefix: 'SNGL-BAB'
      },

      // ─── TIỆC & SỰ KIỆN (13 Products) ───────────────────────────────────────
      {
        name: 'Thiết Kế Hoa Bàn Tiệc Sunny Day',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Dải hoa để bàn tiệc tròn rực rỡ với hoa hướng dương cắm xen cẩm chướng kem và hồng vàng ấm áp, thắp sáng không gian tiệc ấm cúng.',
        basePrice: 850000,
        skuPrefix: 'EVT-SUN'
      },
      {
        name: 'Dải Hoa Bàn Dài Tiệc Cưới Royal',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay'],
        description: 'Dải hoa tươi chạy dọc bàn tiệc cưới dài sang trọng phong cách Hoàng Gia với hồng trắng, lá bạc tròn và ánh nến lung linh thơ mộng.',
        basePrice: 1800000,
        skuPrefix: 'EVT-WED'
      },
      {
        name: 'Cổng Hoa Cưới Pastel Sweet Dreams',
        category: 'tiec-va-su-kien',
        tags: ['yeu-thich'],
        description: 'Cổng hoa cưới dáng vòm lãng mạn phủ ngập tràn hoa cẩm tú cầu, cát tường và hồng Ecuadorian pastel ngọt ngào bay bổng.',
        basePrice: 8500000,
        skuPrefix: 'EVT-GATE'
      },
      {
        name: 'Hoa Cầm Tay Cô Dâu White Elegant',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay', 'moi-ve'],
        description: 'Bó hoa cưới cầm tay cô dâu dáng rủ nhẹ cực kỳ thanh khiết sang trọng kết tác từ hoa rum (Calla Lily) trắng và hồng trắng Ecuador.',
        basePrice: 950000,
        skuPrefix: 'EVT-BRD'
      },
      {
        name: 'Hoa Cầm Tay Cô Dâu Tulip Xanh Băng',
        category: 'tiec-va-su-kien',
        tags: ['yeu-thich'],
        description: 'Tulip nhuộm màu Ice Blue độc quyền cuốn hút mang phong vị độc bản hiện đại sang chảnh dành cho nàng dâu cá tính độc đáo.',
        basePrice: 1100000,
        skuPrefix: 'EVT-BLUE'
      },
      {
        name: 'Trụ Hoa Lối Đi Sân Khấu Gardenia',
        category: 'tiec-va-su-kien',
        tags: ['moi-ve'],
        description: 'Trụ hoa cắm thả tự nhiên theo phong cách khu vườn cổ tích châu Âu lãng mạn dẫn bước cô dâu chú rể bước vào thiên đường hạnh phúc.',
        basePrice: 1500000,
        skuPrefix: 'EVT-PATH'
      },
      {
        name: 'Setup Hoa Backdrop Chụp Ảnh Pastel',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay'],
        description: 'Thiết kế thi công background chụp ảnh ngập hoa tươi kết hợp chữ neon nổi và voan mỏng cho các buổi tiệc sinh nhật, cưới hỏi lung linh.',
        basePrice: 6500000,
        skuPrefix: 'EVT-BKDP'
      },
      {
        name: 'Bộ Hoa Cài Áo Chú Rể & Quan Khách',
        category: 'tiec-va-su-kien',
        tags: ['khuyen-mai'],
        description: 'Những cụm hoa cài áo mini tinh xảo chế tác thủ công đồng điệu với hoa cưới cô dâu chú rể, tạo nét trang trọng lịch thiệp trong ngày cưới.',
        basePrice: 50000,
        skuPrefix: 'EVT-BOUT'
      },
      {
        name: 'Bình Hoa Lớn Sảnh Hội Nghị Diamond',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay'],
        description: 'Thiết kế bình hoa cực đại đặt tại trung tâm sảnh đón khách hội nghị với hoa lan, thiên điểu, cẩm tú cầu kiêu sa khẳng định vị thế.',
        basePrice: 3500000,
        skuPrefix: 'EVT-HALL'
      },
      {
        name: 'Thiết Kế Hoa Bàn Hội Nghị Đại Biểu',
        category: 'tiec-va-su-kien',
        tags: ['moi-ve'],
        description: 'Dải hoa tươi cắm thấp thanh lịch sang trọng chạy dọc bàn họp đoàn đại biểu trang nghiêm, tạo cảm giác thư thái tươi mát dễ chịu.',
        basePrice: 1200000,
        skuPrefix: 'EVT-MEET'
      },
      {
        name: 'Giỏ Quà Tặng Sự Kiện Doanh Nghiệp',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay', 'yeu-thich'],
        description: 'Sự kết hợp hoàn hảo giữa hoa tươi cao cấp cùng vang đỏ nhập khẩu và hộp chocolate Ferrero Rocher mạ vàng sang trọng quý phái.',
        basePrice: 1650000,
        skuPrefix: 'EVT-GIFT'
      },
      {
        name: 'Trang Trí Hoa Xe Cưới Everlasting',
        category: 'tiec-va-su-kien',
        tags: ['yeu-thich'],
        description: 'Set hoa xe cưới kết hoa tươi phủ đầu xe và dải nơ satin chạy dọc thân xe bám hút chân không chắc chắn bền bỉ suốt cung đường đón dâu.',
        basePrice: 2800000,
        skuPrefix: 'EVT-CAR'
      },
      {
        name: 'Setup Hoa Nến Bàn Tiệc Tối Tình Nhân',
        category: 'tiec-va-su-kien',
        tags: ['ban-chay', 'moi-ve'],
        description: 'Biến bàn ăn tối thông thường thành không gian tình nhân ngọt ngào nhất với dải hoa hồng đỏ Ecuador, nến thơm lãng mạn và ly vang pha lê.',
        basePrice: 990000,
        skuPrefix: 'EVT-LOVE'
      }
    ];

    let imageIdx = 0;
    for (const p of rawBlueprints) {
      console.log(`🛒 Seeding Product [${imageIdx + 1}/52]: ${p.name}...`);

      // Determine main image and alternate images from Unsplash array
      const mainImageUrl = UNSPLASH_IMAGES[imageIdx % UNSPLASH_IMAGES.length];
      const altImages = [
        PINTEREST_AESTHETIC_FLOWER,
        UNSPLASH_IMAGES[(imageIdx + 7) % UNSPLASH_IMAGES.length],
        UNSPLASH_IMAGES[(imageIdx + 19) % UNSPLASH_IMAGES.length]
      ];

      // Define variant configurations based on category
      let variantsConf = [];
      if (p.category === 'loai-hoa-le') {
        // Single flowers usually have 1 basic variant or S/L bundles
        variantsConf = [
          { sizeName: 'Cành Tiêu Chuẩn', price: p.basePrice, stock: 50, skuSuffix: 'STD' },
          { sizeName: 'Bó Lớn (10 Cành)', price: Math.round(p.basePrice * 8.5), stock: 15, skuSuffix: '10C' }
        ];
      } else if (p.category === 'tiec-va-su-kien') {
        // Event items usually have Standard and Premium packages
        variantsConf = [
          { sizeName: 'Gói Standard', price: p.basePrice, stock: 10, skuSuffix: 'STD' },
          { sizeName: 'Gói Premium Luxe', price: Math.round(p.basePrice * 1.6), stock: 5, skuSuffix: 'PRM' }
        ];
      } else {
        // Bouquets (Anniversary, Congratulation) usually have S, M, L sizes
        variantsConf = [
          { sizeName: 'Size S (Thanh nhã)', price: p.basePrice, stock: 20, skuSuffix: 'S' },
          { sizeName: 'Size M (Thịnh soạn)', price: Math.round(p.basePrice * 1.5), stock: 15, skuSuffix: 'M' },
          { sizeName: 'Size L (Hoàng gia)', price: Math.round(p.basePrice * 2.3), stock: (imageIdx % 10 === 0) ? 0 : 8, skuSuffix: 'L' } // Some out-of-stock sizes
        ];
      }

      // Generate ObjectId for minifiedVariants in advance
      const minifiedVariants = variantsConf.map(v => ({
        variantId: new mongoose.Types.ObjectId(),
        sizeName: v.sizeName,
        price: mongoose.Types.Decimal128.fromString(v.price.toString()),
        inStock: v.stock > 0,
      }));

      // Create Product document
      const createdProduct = await Product.create({
        name: p.name,
        slug: p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: p.description,
        mainImageUrl: mainImageUrl,
        status: ProductStatus.ACTIVE,
        category: categories[p.category]._id,
        tags: p.tags.map(slug => tags[slug]._id),
        minifiedVariants: minifiedVariants,
        reviewStats: {
          averageRating: Number((4.3 + (imageIdx % 8) * 0.1).toFixed(1)),
          totalReviews: (imageIdx * 3 + 5) % 45
        }
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
      const reviewCount = createdProduct.reviewStats.totalReviews > 2 ? 2 : createdProduct.reviewStats.totalReviews;
      for (let r = 0; r < reviewCount; r++) {
        const ratings = [5, 4, 5, 4.5];
        const comments = [
          'Hoa siêu đẹp, đóng gói rất cẩn thận, shipper giao hàng thân thiện cực kỳ luôn!',
          'Hương thơm thanh tao ngọt ngào, đặt mua tặng sinh nhật mẹ ai cũng tấm tắc khen ngợi.',
          'Màu sắc pastel rất thơ, đúng gu nghệ thuật nhẹ nhàng lơ lửng của shop!',
          'Rất hài lòng về chất lượng phục vụ của UTE_SHOP, chắc chắn sẽ gắn bó lâu dài.'
        ];

        try {
          await Review.create({
            product: createdProduct._id,
            customer: customer._id,
            rating: ratings[(imageIdx + r) % ratings.length],
            comment: comments[(imageIdx + r) % comments.length],
            isVerified: true
          });
        } catch (e) {
          // Ignore unique index collision if any
        }
      }

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
