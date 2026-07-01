import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './modules/order/models/Order.js';
import Product from './modules/catalog/models/Product.js';
import Category from './modules/catalog/models/Category.js';
import ProductVariant from './modules/catalog/models/ProductVariant.js';
import User from './modules/user/models/User.js';
import OrderStatus from './shared/enums/OrderStatus.js';
import OrderType from './shared/enums/OrderType.js';
import PaymentMethod from './shared/enums/PaymentMethod.js';
import OrderPaymentStatus from './shared/enums/OrderPaymentStatus.js';

dotenv.config();

const RECIPIENT_NAMES = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Phạm Minh Cường', 'Lê Hoài Danh',
  'Hoàng Thu Giang', 'Phan Văn Hải', 'Trịnh Khánh Linh', 'Lý Quốc Nam'
];

const RECIPIENT_PHONES = [
  '0912345678', '0987654321', '0905123456', '0938112233',
  '0977445566', '0868778899', '0944001122', '0919223344'
];

const NOTES = [
  'Giao giờ hành chính giúp em.',
  'Gọi trước khi giao 15 phút.',
  'Nhờ shipper cẩn thận tránh làm hỏng hoa.',
  'Giao trước 5h chiều.',
  'Không gọi điện thoại trước 8h sáng.',
  ''
];

const seedOrders = async () => {
  console.log('🌱 Starting seed orders script...');
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ Missing MONGO_URI in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Force register models by referencing them
    const _refProduct = Product.modelName;
    const _refCategory = Category.modelName;
    console.log(`Registered models: ${_refProduct}, ${_refCategory}`);

    // 1. Fetch real product variants
    console.log('🔍 Fetching product variants...');
    const variants = await ProductVariant.find({ isActive: true }).populate('product').lean();
    if (variants.length === 0) {
      console.error('❌ No active product variants found in MongoDB. Please run seed_catalog.js first!');
      process.exit(1);
    }
    console.log(`✅ Found ${variants.length} product variants.`);

    // 2. Fetch or create users
    console.log('🔍 Fetching customers...');
    let customers = await User.find({ email: { $ne: 'admin@uteshop.vn' } }).lean();
    if (customers.length === 0) {
      console.log('⚠️ No customers found. Seeding a test customer first...');
      const customer = await User.create({
        fullName: 'Khách Hàng Seed',
        email: 'customer.seed@uteshop.vn',
        passwordHash: '$2a$10$QO0X7jP1fX9q9Y6eX31ZzOm4H6qJcO5LpP2VvjZk3T1Q8nFzK1g3q', // password123
        phone: '0900000000',
        isEmailVerified: true,
        status: 'ACTIVE'
      });
      customers = [customer.toObject()];
    }
    console.log(`✅ Found ${customers.length} customers.`);

    // 3. Clear existing orders
    console.log('🧹 Cleaning existing orders...');
    const deleteRes = await Order.deleteMany({});
    console.log(`✅ Deleted ${deleteRes.deletedCount} orders.`);

    // 4. Generate orders distributed over the last 12 months
    console.log('✍️ Generating orders...');
    const ordersToInsert = [];
    const now = new Date();

    // Loop through past 12 months
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() - m + 1, 0).getDate();
      
      // Let's generate between 12 and 22 orders per month to make the charts look rich
      const ordersInMonth = Math.floor(Math.random() * 11) + 12;

      for (let o = 0; o < ordersInMonth; o++) {
        // Random day in that month
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const hour = Math.floor(Math.random() * 14) + 8; // 8:00 to 22:00
        const minute = Math.floor(Math.random() * 60);
        
        const orderDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day, hour, minute);
        
        // Skip dates in the future
        if (orderDate > now) continue;

        // Choose random customer
        const customer = customers[Math.floor(Math.random() * customers.length)];
        
        // Determine Order Type (80% Online, 20% At Store)
        const orderType = Math.random() < 0.8 ? OrderType.ONLINE : OrderType.AT_STORE;

        // Determine Status
        // 80% Completed, 15% Cancelled, 5% Processing/Delivering (if close to current date)
        let status = OrderStatus.COMPLETED;
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays < 3 && Math.random() < 0.4) {
          status = Math.random() < 0.5 ? OrderStatus.PENDING : OrderStatus.DELIVERING;
        } else if (Math.random() < 0.15) {
          status = OrderStatus.CANCELLED;
        }

        // Determine Payment Status & Method
        let paymentStatus = OrderPaymentStatus.PAID;
        let paymentMethod = PaymentMethod.COD;

        if (status === OrderStatus.CANCELLED) {
          paymentStatus = OrderPaymentStatus.CANCELLED;
        } else if (status === OrderStatus.PENDING) {
          paymentStatus = OrderPaymentStatus.UNPAID;
        }

        if (orderType === OrderType.AT_STORE) {
          paymentMethod = Math.random() < 0.6 ? PaymentMethod.CASH : PaymentMethod.VNPAY;
        } else {
          paymentMethod = Math.random() < 0.4 ? PaymentMethod.COD : (Math.random() < 0.5 ? PaymentMethod.MOMO : PaymentMethod.VNPAY);
        }

        // Generate 1 to 3 items
        const numItems = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let subtotalVal = 0;

        // Select random variants (unique per order)
        const selectedVariants = [];
        while (selectedVariants.length < numItems) {
          const v = variants[Math.floor(Math.random() * variants.length)];
          if (!selectedVariants.some(sv => sv._id.toString() === v._id.toString())) {
            selectedVariants.push(v);
          }
        }

        for (const variant of selectedVariants) {
          const quantity = Math.floor(Math.random() * 2) + 1;
          const price = parseFloat(variant.price.toString());
          const itemSubtotal = price * quantity;
          subtotalVal += itemSubtotal;

          items.push({
            productVariant: variant._id,
            quantity,
            unitPrice: mongoose.Types.Decimal128.fromString(price.toString()),
            snapshotName: (variant.product as any)?.name || 'Bó hoa tươi',
            subtotal: mongoose.Types.Decimal128.fromString(itemSubtotal.toString()),
          });
        }

        // Calculate discounts and final total
        const shippingFee = orderType === OrderType.ONLINE ? 30000 : 0;
        
        // 20% of orders have discount vouchers (randomly 20k to 100k)
        const discountAmount = status === OrderStatus.COMPLETED && Math.random() < 0.2 
          ? Math.min(subtotalVal, Math.floor(Math.random() * 5) * 20000 + 20000) 
          : 0;

        // Points discount (10% of completed orders use points)
        const pointsUsed = status === OrderStatus.COMPLETED && Math.random() < 0.1 
          ? Math.floor(Math.random() * 5) * 50 + 50 
          : 0;
        const pointsDiscount = pointsUsed * 1000; // 1 point = 1000 VND

        const finalTotalVal = Math.max(0, subtotalVal + shippingFee - discountAmount - pointsDiscount);

        const recipientIndex = Math.floor(Math.random() * RECIPIENT_NAMES.length);

        const orderCode = `ORD-${orderDate.getFullYear()}${(orderDate.getMonth() + 1).toString().padStart(2, '0')}${orderDate.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 900000 + 100000)}`;

        ordersToInsert.push({
          orderCode,
          customer: customer._id,
          status,
          orderType,
          items,
          recipient: {
            fullName: RECIPIENT_NAMES[recipientIndex],
            phone: RECIPIENT_PHONES[recipientIndex],
            deliveryNote: NOTES[Math.floor(Math.random() * NOTES.length)],
          },
          subtotal: mongoose.Types.Decimal128.fromString(subtotalVal.toString()),
          shippingFee: mongoose.Types.Decimal128.fromString(shippingFee.toString()),
          discountAmount: mongoose.Types.Decimal128.fromString(discountAmount.toString()),
          pointsUsed,
          pointsDiscount: mongoose.Types.Decimal128.fromString(pointsDiscount.toString()),
          finalTotal: mongoose.Types.Decimal128.fromString(finalTotalVal.toString()),
          totalAmount: mongoose.Types.Decimal128.fromString(finalTotalVal.toString()), // Legacy
          note: NOTES[Math.floor(Math.random() * NOTES.length)],
          paymentMethod,
          paymentStatus,
          createdAt: orderDate,
          updatedAt: orderDate,
          statusHistory: [
            {
              status: OrderStatus.PENDING,
              note: 'Đơn hàng được khởi tạo.',
              timestamp: orderDate
            },
            ...(status !== OrderStatus.PENDING ? [{
              status: OrderStatus.CONFIRMED,
              note: 'Đã xác nhận đơn hàng.',
              timestamp: new Date(orderDate.getTime() + 10 * 60 * 1000)
            }] : []),
            ...(status === OrderStatus.DELIVERING || status === OrderStatus.COMPLETED ? [{
              status: OrderStatus.DELIVERING,
              note: 'Shipper đã lấy hàng và đang đi giao.',
              timestamp: new Date(orderDate.getTime() + 30 * 60 * 1000)
            }] : []),
            ...(status === OrderStatus.COMPLETED ? [{
              status: OrderStatus.COMPLETED,
              note: 'Giao hàng thành công.',
              timestamp: new Date(orderDate.getTime() + 90 * 60 * 1000)
            }] : []),
            ...(status === OrderStatus.CANCELLED ? [{
              status: OrderStatus.CANCELLED,
              note: 'Khách hàng hủy đơn hoặc shop hết mẫu hoa.',
              timestamp: new Date(orderDate.getTime() + 15 * 60 * 1000)
            }] : [])
          ]
        });
      }
    }

    console.log(`✍️ Seeding ${ordersToInsert.length} orders to DB...`);
    const insertRes = await Order.insertMany(ordersToInsert);
    console.log(`✅ Successfully seeded ${insertRes.length} orders.`);

    console.log('\n🎉 Order seeding complete!');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error seeding orders:', err);
    process.exit(1);
  }
};

seedOrders();
