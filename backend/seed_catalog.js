/**
 * seed_catalog.js – Seeding comprehensive catalog data for UTE_SHOP (Categories, Tags, Products, ProductVariants, StockLevels, Reviews)
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
import User from './modules/user/models/User.js'; // Needed to reference customers for reviews
import Customer from './modules/user/models/Customer.js';

import ProductStatus from './shared/enums/ProductStatus.js';
import StockStatus from './shared/enums/StockStatus.js';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/uteshop';

const seedCatalog = async () => {
  console.log('🌱 Starting catalog seed data script...');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

    // 1. Clean existing records (Optional, uncomment if you want fresh seed every time)
    console.log('🗑️ Cleaning existing catalog & inventory collections...');
    await Category.deleteMany({});
    await Tag.deleteMany({});
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});
    await Review.deleteMany({});
    await Warehouse.deleteMany({});
    await StockLevel.deleteMany({});
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

    // 5. Get a Customer for Mock Reviews
    let customer = await Customer.findOne({ email: 'vuthang@uteshop.vn' });
    if (!customer) {
      console.log('⚠️ vuthang@uteshop.vn not found, creating a mock customer for reviews...');
      customer = await Customer.create({
        fullName: 'Thắng Vũ',
        email: 'vuthang@uteshop.vn',
        passwordHash: '$2a$10$vY3Z.Yp75d3fXz9Vpx1OQeT3l9EpyQ2Wl/xTfF1Q9D2WwA0T2mUuW', // 'password123'
        phone: '0123456789',
        isEmailVerified: true,
        status: 'ACTIVE',
      });
    }

    // 6. Define Products & Variants
    console.log('📦 Seeding Products & Variants...');
    const productsData = [
      {
        name: 'Bó Hoa Lavender Pháp Ngọt Ngào',
        slug: 'bo-hoa-lavender-phap-ngot-ngao',
        description: 'Bó hoa Lavender Pháp sấy khô nhập khẩu cao cấp giữ được hương thơm ngào ngạt suốt nhiều năm. Thiết kế bọc giấy kiếng bóng mờ phong cách Pháp thanh lịch, lãng mạn thích hợp làm quà tặng kỷ niệm.',
        mainImageUrl: 'https://i.pinimg.com/564x/44/22/e1/4422e118991a0c86b24524c8b7cf7283.jpg',
        status: ProductStatus.ACTIVE,
        category: categories['hoa-ky-niem']._id,
        tags: [tags['ban-chay']._id, tags['yeu-thich']._id],
        reviewStats: { averageRating: 4.8, totalReviews: 24 },
        variants: [
          { sizeName: 'S (Mộc mạc)', price: '250000', sku: 'LVD-FR-S', stock: 15 },
          { sizeName: 'M (Thanh lịch)', price: '450000', sku: 'LVD-FR-M', stock: 30 },
          { sizeName: 'L (Hoàng gia)', price: '750000', sku: 'LVD-FR-L', stock: 5 },
        ],
        reviewComments: [
          { customer: customer._id, rating: 5, comment: 'Hoa siêu thơm luôn ạ! Hộp và nơ gói rất cẩn thận, sẽ ủng hộ shop tiếp.', isVerified: true },
          { customer: customer._id, rating: 4.5, comment: 'Màu tím oải hương rất thơ, đúng style Pinterest mình thích.', isVerified: true }
        ],
        alternateImages: [
          'https://i.pinimg.com/564x/e7/8f/a7/e78fa7f79a957814b726058e0a300065.jpg',
          'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=600&auto=format&fit=crop'
        ]
      },
      {
        name: 'Bó Hồng Pastel Giọt Nước Lãng Mạn',
        slug: 'bo-hong-pastel-giot-nuoc-lang-man',
        description: 'Sự kết hợp tinh tế giữa những đóa hoa hồng pastel ngọt ngào nhập khẩu từ Ecuador, kết nơ lụa mềm mại cùng cành lá bạch đàn tròn thanh nhã. Tạo nên cảm giác dịu êm như giọt sương ban mai.',
        mainImageUrl: 'https://i.pinimg.com/564x/d2/84/7c/d2847c170d10c14b2d184bf6c2ee2188.jpg',
        status: ProductStatus.ACTIVE,
        category: categories['hoa-ky-niem']._id,
        tags: [tags['ban-chay']._id, tags['moi-ve']._id],
        reviewStats: { averageRating: 4.9, totalReviews: 48 },
        variants: [
          { sizeName: 'Size S (12 bông)', price: '380000', sku: 'ROS-PST-S', stock: 20 },
          { sizeName: 'Size M (24 bông)', price: '680000', sku: 'ROS-PST-M', stock: 12 },
          { sizeName: 'Size L (50 bông)', price: '1280000', sku: 'ROS-PST-L', stock: 8 },
        ],
        reviewComments: [
          { customer: customer._id, rating: 5, comment: 'Mẫu bó hoa đẹp xuất sắc! Ảnh chụp không diễn tả hết độ lung linh bên ngoài.', isVerified: true }
        ],
        alternateImages: [
          'https://i.pinimg.com/564x/0f/c2/f7/0fc2f7902d26fdfbfb54ff4beed84910.jpg',
          'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop'
        ]
      },
      {
        name: 'Bó Tulip Hồng Kiêu Kỳ Thơ Mộng',
        slug: 'bo-tulip-hong-kieu-ky-tho-mong',
        description: 'Những cánh Tulip tươi rói phớt hồng thơ mộng, là biểu tượng cho sự kiêu sa, chân thành và lời chúc mừng rạng ngời nhất. Được gói gọn trong lớp giấy pastel chống thấm nước cao cấp.',
        mainImageUrl: 'https://i.pinimg.com/564x/5a/b6/2d/5ab62df4bc31885b736b4121516e877e.jpg',
        status: ProductStatus.ACTIVE,
        category: categories['hoa-chuc-mung']._id,
        tags: [tags['moi-ve']._id, tags['yeu-thich']._id],
        reviewStats: { averageRating: 4.7, totalReviews: 18 },
        variants: [
          { sizeName: 'S (10 cành)', price: '390000', sku: 'TLP-PNK-S', stock: 10 },
          { sizeName: 'M (20 cành)', price: '720000', sku: 'TLP-PNK-M', stock: 8 },
          { sizeName: 'L (30 cành)', price: '990000', sku: 'TLP-PNK-L', stock: 0 }, // Out of stock demo
        ],
        reviewComments: [
          { customer: customer._id, rating: 5, comment: 'Hoa tulip rất tươi, giao đúng hẹn! Đóng gói sang xịn mịn.', isVerified: true }
        ],
        alternateImages: [
          'https://images.unsplash.com/photo-1587334206574-35113ab64062?q=80&w=600&auto=format&fit=crop'
        ]
      },
      {
        name: 'Giỏ Hoa Cẩm Tú Cầu Xanh Hy Vọng',
        slug: 'gio-hoa-cam-tu-cau-xanh-hy-vong',
        description: 'Thiết kế giỏ đan mây mộc mạc làm nổi bật đóa Cẩm Tú Cầu màu xanh pastel khổng lồ đầy đặn, xen kẽ là các đóa hoa cát tường kem lấp lánh như ngàn hy vọng tốt đẹp cho người nhận.',
        mainImageUrl: 'https://i.pinimg.com/564x/41/50/be/4150be8507c393bc3eb6e73f41e57c65.jpg',
        status: ProductStatus.ACTIVE,
        category: categories['hoa-chuc-mung']._id,
        tags: [tags['ban-chay']._id, tags['khuyen-mai']._id],
        reviewStats: { averageRating: 4.6, totalReviews: 12 },
        variants: [
          { sizeName: 'Giỏ Vừa (1 bông chính)', price: '450000', sku: 'HYD-BLU-M', stock: 25 },
          { sizeName: 'Giỏ Lớn (2 bông chính)', price: '790000', sku: 'HYD-BLU-L', stock: 14 },
        ],
        reviewComments: [
          { customer: customer._id, rating: 4, comment: 'Giỏ hoa to đùng, cẩm tú cầu nở rất đẹp và đều màu.', isVerified: true }
        ],
        alternateImages: [
          'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=600&auto=format&fit=crop'
        ]
      },
      {
        name: 'Hũ Bạch Liên Hoa Cổ Điển',
        slug: 'hu-bach-lien-hoa-co-dien',
        description: 'Những đóa ly trắng tinh khôi nở rộ tỏa hương thơm quý phái được cắm trong hũ gốm tráng men màu lục bảo cổ kính. Phù hợp cho không gian làm việc hoặc làm quà tri ân tinh tế.',
        mainImageUrl: 'https://i.pinimg.com/564x/87/40/e3/8740e340cf39dfb39d6cf128ecff6b82.jpg',
        status: ProductStatus.ACTIVE,
        category: categories['loai-hoa-le']._id,
        tags: [tags['ban-chay']._id],
        reviewStats: { averageRating: 4.5, totalReviews: 9 },
        variants: [
          { sizeName: 'Nhỏ (3 cành)', price: '180000', sku: 'LIL-WHT-S', stock: 30 },
          { sizeName: 'Lớn (5 cành)', price: '280000', sku: 'LIL-WHT-L', stock: 20 },
        ],
        reviewComments: [
          { customer: customer._id, rating: 5, comment: 'Đóng gói cực cẩn thận không gãy cành nào luôn ạ, ly nở thơm ngát nhà.', isVerified: true }
        ],
        alternateImages: [
          'https://images.unsplash.com/photo-1508784932216-4b55da6376bc?q=80&w=600&auto=format&fit=crop'
        ]
      },
      {
        name: 'Thiết Kế Hoa Bàn Tiệc Sunny Day',
        slug: 'thiet-ke-hoa-ban-tiec-sunny-day',
        description: 'Thiết kế hoa để bàn rực rỡ với sắc vàng chủ đạo từ hoa hướng dương kiêu hãnh phối hợp ăn ý với cẩm chướng kem và hồng vàng ấm áp. Đem lại năng lượng tươi mới, bừng sáng mọi bữa tiệc sự kiện.',
        mainImageUrl: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600&auto=format&fit=crop',
        status: ProductStatus.ACTIVE,
        category: categories['tiec-va-su-kien']._id,
        tags: [tags['ban-chay']._id, tags['yeu-thich']._id],
        reviewStats: { averageRating: 4.9, totalReviews: 32 },
        variants: [
          { sizeName: 'Bàn Tròn Standard', price: '850000', sku: 'EVT-SUN-S', stock: 8 },
          { sizeName: 'Bàn Dài Premium', price: '1500000', sku: 'EVT-SUN-P', stock: 6 },
        ],
        reviewComments: [
          { customer: customer._id, rating: 5, comment: 'Khách mời ai cũng khen hoa của bàn tiệc xinh xắn, shop hỗ trợ set up cực nhiệt tình.', isVerified: true }
        ],
        alternateImages: [
          'https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=600&auto=format&fit=crop'
        ]
      }
    ];

    for (const p of productsData) {
      console.log(`🛒 Creating Product: ${p.name}...`);

      // Prepare list of variants with temporary ObjectIds
      const minifiedVariants = p.variants.map(v => ({
        variantId: new mongoose.Types.ObjectId(),
        sizeName: v.sizeName,
        price: mongoose.Types.Decimal128.fromString(v.price),
        inStock: v.stock > 0,
      }));

      // Create Product first
      const product = await Product.create({
        name: p.name,
        slug: p.slug,
        description: p.description,
        mainImageUrl: p.mainImageUrl,
        status: p.status,
        category: p.category,
        tags: p.tags,
        minifiedVariants: minifiedVariants,
        reviewStats: p.reviewStats
      });

      // Now create ProductVariants and their StockLevels
      for (let i = 0; i < p.variants.length; i++) {
        const v = p.variants[i];
        const minified = minifiedVariants[i];

        const variant = await ProductVariant.create({
          _id: minified.variantId,
          product: product._id,
          sku: v.sku,
          sizeName: v.sizeName,
          price: mongoose.Types.Decimal128.fromString(v.price),
          stockStatus: v.stock === 0 ? StockStatus.OUT_OF_STOCK : (v.stock < 5 ? StockStatus.LOW : StockStatus.IN_STOCK),
          isActive: true,
          imageUrls: [product.mainImageUrl, ...(p.alternateImages || [])]
        });

        // Seed stock levels linked to variant & main warehouse
        await StockLevel.create({
          warehouse: warehouse._id,
          productVariant: variant._id,
          quantity: mongoose.Types.Decimal128.fromString(v.stock.toString()),
          minThreshold: mongoose.Types.Decimal128.fromString('5'),
        });
      }

      // Seed mock reviews
      if (p.reviewComments) {
        for (const rev of p.reviewComments) {
          try {
            await Review.create({
              product: product._id,
              customer: rev.customer,
              rating: rev.rating,
              comment: rev.comment,
              isVerified: rev.isVerified
            });
          } catch (e) {
            // Might fail if user already reviews, ignore
          }
        }
      }

      console.log(`   └─ Successfully created product & ${p.variants.length} variants!`);
    }

    console.log('\n🌟 Seeding comprehensive catalog completed beautifully! 🌟');
    process.exit(0);
  } catch (err) {
    console.error('❌ Catalog Seed error:', err);
    process.exit(1);
  }
};

seedCatalog();
