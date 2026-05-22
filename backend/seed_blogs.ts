import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BlogPost from './modules/system/models/BlogPost.js';
import User from './modules/user/models/User.js';
import { Notification, UserNotification } from './modules/notification/models/Notification.js';
import NotificationType from './shared/enums/NotificationType.js';
import NotificationChannel from './shared/enums/NotificationChannel.js';

dotenv.config();

const mockBlogs = (authorId: string) => [
  {
    title: 'Cẩm nang giữ hoa tươi lâu tại nhà cực kỳ hiệu quả',
    slug: 'cam-nang-giu-hoa-tuoi-lau-tai-nha-cuc-ky-hieu-qua',
    excerpt: 'Làm thế nào để bó hoa tươi thắm được tặng lưu giữ hương sắc bền lâu nhất? Xem ngay 5 bí quyết từ nghệ nhân cắm hoa của UTESHOP.',
    content: `
      <p>Một bó hoa tươi rực rỡ không chỉ làm bừng sáng không gian sống mà còn mang lại năng lượng tích cực cho cả gia đình. Tuy nhiên, làm sao để giữ hoa tươi lâu luôn là nỗi băn khoăn của nhiều người yêu hoa. Dưới đây là 5 bí quyết đơn giản nhưng vô cùng hiệu quả được chia sẻ bởi nghệ nhân cắm hoa tại <strong>UTESHOP</strong>.</p>
      
      <h3>1. Rửa sạch bình cắm hoa</h3>
      <p>Vi khuẩn tích tụ trong bình cũ chính là nguyên nhân hàng đầu khiến cuống hoa nhanh thối rữa và héo úa. Hãy dùng xà phòng diệt khuẩn và rửa thật sạch bình cắm trước khi đổ nước mới vào cắm hoa.</p>
      
      <h3>2. Cắt chéo cuống hoa góc 45 độ</h3>
      <p>Khi cắm hoa, bạn nên dùng kéo thật bén cắt bỏ khoảng 2-3 cm phần gốc cuống hoa theo góc chéo 45 độ dưới dòng nước chảy. Việc cắt chéo giúp tăng tối đa diện tích bề mặt tiếp xúc của cuống với nước, giúp hoa hấp thụ nước tốt nhất.</p>
      
      <h3>3. Loại bỏ bớt lá ở phần ngập nước</h3>
      <p>Lá ngâm lâu trong nước sẽ dễ phân hủy, tạo ra vi khuẩn và làm nước bị hôi thối. Do đó, hãy nhớ tỉa sạch lá ở phần gốc ngập trong bình, chỉ giữ lại một ít lá phía trên để bó hoa trông tự nhiên.</p>
      
      <h3>4. Thay nước cắm hoa mỗi ngày</h3>
      <p>Hãy chăm sóc bình hoa bằng cách thay nước sạch mỗi buổi sáng. Điều này giúp ngăn ngừa vi khuẩn sinh sôi. Mỗi lần thay nước, bạn nên tráng bình và cắt bớt cuống hoa đi một chút.</p>
      
      <h3>5. Đặt bình hoa nơi mát mẻ</h3>
      <p>Tránh đặt bình hoa trực tiếp dưới ánh nắng mặt trời, gần lò sưởi, quạt máy hoặc luồng gió của máy lạnh. Nhiệt độ cao và gió mạnh sẽ làm hoa bị mất nước nhanh chóng và chóng héo.</p>
      
      <p>Chúc bạn sẽ luôn giữ được những đóa hoa tươi xinh lâu dài để ngắm nhìn mỗi ngày nhé!</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800',
    category: 'Cẩm nang hoa',
    tags: ['Mẹo hay', 'Chăm sóc hoa', 'Cuộc sống'],
    views: 128,
    isPublished: true,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 ngày trước
    author: authorId,
  },
  {
    title: 'Ý nghĩa sâu sắc của các loài hoa trong tình yêu đôi lứa',
    slug: 'y-nghia-sau-sac-cua-cac-loai-hoa-trong-tinh-yeu-doi-lua',
    excerpt: 'Hoa hồng tượng trưng cho tình yêu mãnh liệt, cẩm chướng gửi gắm lòng son sắt. Hãy chọn đóa hoa phù hợp nhất để gửi trao tâm ý.',
    content: `
      <p>Mỗi loài hoa mang một thông điệp thầm kín, một ngôn ngữ riêng để truyền tải những cung bậc cảm xúc tinh tế nhất của tình yêu. Chọn hoa tặng người ấy không chỉ cần đẹp, mà hiểu được ý nghĩa đằng sau sẽ giúp món quà của bạn trở nên sâu sắc và ghi dấu ấn khó phai.</p>
      
      <h3>1. Hoa hồng đỏ: Tình yêu nồng cháy và vĩnh cửu</h3>
      <p>Không có gì ngạc nhiên khi hoa hồng đỏ dẫn đầu danh sách các loài hoa tình yêu. Từ thời cổ đại, hồng đỏ đã là biểu tượng của nữ thần tình yêu Aphrodite. Tặng hồng đỏ là lời tuyên bố trực tiếp: "Anh yêu em bằng tất cả sự đam mê và chân thành nhất".</p>
      
      <h3>2. Hoa Tulip: Sự hoàn hảo và lòng tin</h3>
      <p>Đặc biệt là Tulip đỏ, loài hoa này tượng trưng cho một tình yêu hoàn mỹ và sự tin tưởng tuyệt đối. Dáng hoa thanh lịch, gọn gàng nhưng kiêu sa gửi gắm lời hứa bảo vệ và đồng hành bền lâu.</p>
      
      <h3>3. Hoa Baby trắng: Tình yêu trong sáng, thuần khiết</h3>
      <p>Những bông hoa bé nhỏ như những bông tuyết mang vẻ đẹp tinh khôi, tượng trưng cho tình yêu ban sơ, không toan tính. Hoa Baby thường được làm hoa phụ hoặc bó riêng một bó lớn gửi trao lời khen ngợi sự dịu dàng của nàng.</p>
      
      <h3>4. Hoa Cát tường: Hạnh phúc giản dị, bền bỉ</h3>
      <p>Đúng như cái tên "Cát tường", loài hoa này biểu trưng cho sự may mắn và hạnh phúc dài lâu. Sắc hoa nhẹ nhàng, mềm mại thể hiện một tình yêu bình yên, dịu ngọt nhưng lại vô cùng kiên cường vượt qua sóng gió.</p>
      
      <p>Đến với <strong>UTESHOP</strong>, chúng tôi sẽ giúp bạn thiết kế những bó hoa truyền tải trọn vẹn tâm ý yêu thương gửi đến một nửa đặc biệt nhất của cuộc đời mình.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=800',
    category: 'Ý nghĩa hoa',
    tags: ['Tình yêu', 'Quà tặng', 'Lãng mạn'],
    views: 245,
    isPublished: true,
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 ngày trước
    author: authorId,
  },
  {
    title: 'Xu hướng thiết kế hoa cưới sang trọng và tối giản năm 2026',
    slug: 'xu-huong-thiet-ke-hoa-cuoi-sang-trong-va-toi-gian-nam-2026',
    excerpt: 'Phong cách tối giản lên ngôi với sự lên ngôi của tone trắng tinh khôi kết hợp sắc xanh tự nhiên. Đón đầu xu hướng cùng các mẫu hoa cưới UTESHOP.',
    content: `
      <p>Năm 2026 ghi nhận sự chuyển dịch mạnh mẽ trong xu hướng thiết kế hoa cưới từ cầu kỳ, hoành tráng sang phong cách <strong>Simple & Elegant (Tối giản & Sang trọng)</strong>. Các cặp đôi hiện đại ưu tiên sự tinh tế, tập trung tôn vinh vẻ đẹp tự nhiên và cảm xúc chân thật nhất.</p>
      
      <h3>1. Tone màu đơn sắc trắng - xanh lá cây (White & Greenery)</h3>
      <p>Sự kết hợp bất hủ giữa hoa chủ đạo màu trắng tinh khôi (như hoa hồng ngoại, hoa lan Nam Phi, hoa mẫu đơn) và lá bạc sang trọng tạo nên cảm giác vô cùng thanh tao, nhã nhặn nhưng không kém phần đẳng cấp.</p>
      
      <h3>2. Thiết kế bó hoa cưới cầm tay dạng rủ nhẹ (Cascade Minimalist)</h3>
      <p>Không còn bó tròn chặt cứng, dáng hoa cưới cầm tay cô dâu năm nay chuộng phom dáng tự nhiên, có độ rủ mềm mại như một dòng suối nhỏ lướt đi cùng bước chân uyển chuyển của cô dâu trong lễ đường.</p>
      
      <h3>3. Hoa cưới bền vững (Eco-Friendly Weddings)</h3>
      <p>Ưu tiên sử dụng hoa nội địa chất lượng cao phối hợp cùng các vật liệu thân thiện môi trường, hạn chế mút xốp nhựa. Các bó hoa sau tiệc có thể dễ dàng được khách mời mang về trồng hoặc trang trí lại.</p>
      
      <p>Hãy liên hệ với đội ngũ thiết kế chuyên nghiệp tại <strong>UTESHOP</strong> để cùng vẽ nên câu chuyện cổ tích ngọt ngào nhất cho ngày trọng đại của bạn.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1546842931-886c185b4c8c?q=80&w=800',
    category: 'Sự kiện & Lễ hội',
    tags: ['Đám cưới', 'Xu hướng', 'Trang trí'],
    views: 95,
    isPublished: true,
    publishedAt: new Date(),
    author: authorId,
  },
];

const seedBlogsAndNotifications = async () => {
  console.log('🌱 Starting seed blogs & notifications script...');
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ Missing MONGO_URI in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // 1. Find Admin
    const admin = await User.findOne({ email: 'admin@uteshop.vn' });
    if (!admin) {
      console.error('❌ Could not find admin user (admin@uteshop.vn). Please run seed_data.ts first!');
      process.exit(1);
    }
    console.log(`✅ Found Admin: ${admin.email} (_id: ${admin._id})`);

    // 2. Find Customer
    const customer = await User.findOne({ email: 'vuthang@uteshop.vn' });
    if (!customer) {
      console.error('❌ Could not find customer user (vuthang@uteshop.vn). Please run seed_data.ts first!');
      process.exit(1);
    }
    console.log(`✅ Found Customer: ${customer.email} (_id: ${customer._id})`);

    // 3. Clear and seed Blogs
    await BlogPost.deleteMany({});
    console.log('🧹 Cleaned existing blog posts.');

    const blogs = mockBlogs(admin._id.toString());
    await BlogPost.insertMany(blogs);
    console.log(`✅ Successfully seeded ${blogs.length} beautiful blog posts.`);

    // 4. Clear and seed User Notifications
    await UserNotification.deleteMany({ user: customer._id });
    console.log('🧹 Cleaned existing user notifications.');

    const notificationsData = [
      {
        title: 'Đặt hàng thành công! 🎉',
        body: 'Đơn hàng #10024 của bạn đã được giao hàng thành công đến địa chỉ nhà. Cảm ơn bạn đã tin dùng UTE SHOP!',
        type: NotificationType.PERSONAL,
        channel: NotificationChannel.PUSH,
        isRead: false,
      },
      {
        title: 'Quà tặng độc quyền cho bạn 🎁',
        body: 'Tặng riêng bạn mã giảm giá UTESHOP15 giảm 15% cho hóa đơn tiếp theo mừng bạn thăng hạng khách hàng vàng.',
        type: NotificationType.PROMOTION,
        channel: NotificationChannel.PUSH,
        isRead: false,
      },
      {
        title: 'Yêu thích sản phẩm mới 💖',
        body: 'Bó hoa tươi Lavender Dream bạn hằng mong chờ đã sẵn sàng lên kệ và được tự động thêm vào danh sách yêu thích.',
        type: NotificationType.PROMOTION,
        channel: NotificationChannel.PUSH,
        isRead: true,
      },
      {
        title: 'Chào mừng bạn gia nhập gia đình UTE SHOP! ✨',
        body: 'Tài khoản của bạn đã được kích hoạt thành công. Hãy khám phá ngay hàng trăm mẫu hoa tươi chất lượng cao.',
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.PUSH,
        isRead: true,
      },
    ];

    for (const item of notificationsData) {
      const notification = await Notification.create({
        title: item.title,
        body: item.body,
        type: item.type,
        channel: item.channel,
      });

      await UserNotification.create({
        user: customer._id,
        notification: notification._id,
        isRead: item.isRead,
        readAt: item.isRead ? new Date() : null,
      });
    }

    console.log(`✅ Successfully seeded 4 user notifications for ${customer.email}.`);

    console.log('\n🎉 Seeding complete successfully!');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
};

seedBlogsAndNotifications();
