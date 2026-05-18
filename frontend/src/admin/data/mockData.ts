import type {
  StatCard,
  OrderItem,
  Product,
  StaffMember,
  Customer,
  ActivityItem,
} from "../types/admin.types";

// ── Stat Cards ──────────────────────────────────────────────────────────────
export const ADMIN_STATS: StatCard[] = [
  { id: "revenue", label: "Doanh thu", value: "84.5M ₫", change: 12.6, changeLabel: "so với 12/05 - 18/05", icon: "revenue", color: "indigo" },
  { id: "orders",  label: "Đơn hàng",        value: "1,248",   change: 8.3,  changeLabel: "so với 12/05 - 18/05", icon: "orders", color: "purple" },
  { id: "users",   label: "Khách hàng mới",  value: 326,     change: 15.7, changeLabel: "so với 12/05 - 18/05", icon: "users", color: "emerald" },
  { id: "rate",    label: "Tỷ lệ chuyển đổi",value: "4.82%",  change: -3.1,  changeLabel: "so với 12/05 - 18/05", icon: "rate", color: "amber" },
];

export const STAFF_STATS: StatCard[] = [
  { id: "tasks",     label: "Nhiệm vụ hôm nay",   value: 12,    change: 2,   changeLabel: "so hôm qua",     icon: "tasks", color: "indigo" },
  { id: "orders",    label: "Đơn cần xử lý",       value: 38,    change: -5,  changeLabel: "so hôm qua",     icon: "orders", color: "emerald" },
  { id: "products",  label: "Sản phẩm cập nhật",   value: 7,     change: 3,   changeLabel: "tuần này",       icon: "products", color: "amber" },
  { id: "completed", label: "Hoàn thành hôm nay",  value: "91%", change: 4.2, changeLabel: "so hôm qua",     icon: "completed", color: "rose" },
];

// ── Revenue Chart Data ───────────────────────────────────────────────────────
export const REVENUE_DATA = [
  { month: "T1", revenue: 42000000, orders: 820 },
  { month: "T2", revenue: 38000000, orders: 740 },
  { month: "T3", revenue: 55000000, orders: 1050 },
  { month: "T4", revenue: 49000000, orders: 930 },
  { month: "T5", revenue: 63000000, orders: 1180 },
  { month: "T6", revenue: 58000000, orders: 1090 },
  { month: "T7", revenue: 71000000, orders: 1320 },
  { month: "T8", revenue: 67000000, orders: 1240 },
  { month: "T9", revenue: 79000000, orders: 1450 },
  { month: "T10", revenue: 84000000, orders: 1560 },
  { month: "T11", revenue: 91000000, orders: 1680 },
  { month: "T12", revenue: 84500000, orders: 1284 },
];

// ── Order Status Pie Data ────────────────────────────────────────────────────────
export const ORDER_STATUS_DATA = [
  { name: "Thành công", value: 842, fill: "#10b981", percentage: "67.5%" },
  { name: "Chờ xử lý",  value: 312, fill: "#f59e0b", percentage: "25.0%" },
  { name: "Đã hủy",     value: 94,  fill: "#ef4444", percentage: "7.5%" },
];

// ── Orders ───────────────────────────────────────────────────────────────────
export const RECENT_ORDERS: OrderItem[] = [
  { id: "ORD-1024", customer: "Nguyễn Minh Anh", product: "Giỏ hoa", amount: 1250000, status: "delivered",   date: "25/05/2024 09:43" },
  { id: "ORD-1023", customer: "Trần Quốc Bảo",    product: "Hoa",  amount: 850000, status: "processing", date: "25/05/2024 08:15" },
  { id: "ORD-1022", customer: "Lê Thị Thanh Mai",     product: "Lan",   amount: 2190000,  status: "delivered",    date: "24/05/2024 22:10" },
  { id: "ORD-1021", customer: "Phạm Hoàng Nam",     product: "Tulip",       amount: 640000,  status: "cancelled",    date: "24/05/2024 19:32" },
  { id: "ORD-1020", customer: "Đỗ Quỳnh Trang",   product: "Hoa",   amount: 1450000,  status: "delivered",  date: "24/05/2024 17:05" },
];

// ── Products ─────────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  { id: "SP-001", name: "Bó hoa hồng đỏ Premium 50 bông", category: "Hoa tươi",  price: 1250000, stock: 45,  status: "active",       sales: 312 },
  { id: "SP-002", name: "Lan hồ điệp trắng cao cấp",      category: "Cây cảnh",  price: 650000,  stock: 18,  status: "active",       sales: 187 },
  { id: "SP-003", name: "Hoa cưới combo Rustic",           category: "Hoa tươi",  price: 4800000, stock: 8,   status: "active",       sales: 94  },
  { id: "SP-004", name: "Hoa tulip Hà Lan mix màu",       category: "Hoa tươi",  price: 450000,  stock: 0,   status: "out_of_stock", sales: 256 },
  { id: "SP-005", name: "Giỏ hoa sinh nhật deluxe",       category: "Quà tặng",  price: 890000,  stock: 32,  status: "active",       sales: 148 },
  { id: "SP-006", name: "Hoa lụa trang trí nội thất",     category: "Hoa lụa",   price: 380000,  stock: 0,   status: "inactive",     sales: 67  },
  { id: "SP-007", name: "Bình hoa cúc vàng tươi",         category: "Hoa tươi",  price: 320000,  stock: 60,  status: "active",       sales: 203 },
  { id: "SP-008", name: "Hoa hướng dương bó lớn",         category: "Hoa tươi",  price: 380000,  stock: 28,  status: "active",       sales: 175 },
];

// ── Staff ────────────────────────────────────────────────────────────────────
export const STAFF_MEMBERS: StaffMember[] = [
  { id: "ST-001", fullName: "Trần Thị Bích",   email: "bich.tran@uteshop.vn",   role: "staff", department: "Kho vận",       isActive: true,  lastActive: "18/05/2026 10:30", tasksCompleted: 245 },
  { id: "ST-002", fullName: "Nguyễn Văn Dũng", email: "dung.nguyen@uteshop.vn", role: "staff", department: "Chăm sóc KH",  isActive: true,  lastActive: "18/05/2026 09:15", tasksCompleted: 189 },
  { id: "ST-003", fullName: "Lê Thị Hương",    email: "huong.le@uteshop.vn",    role: "staff", department: "Marketing",     isActive: false, lastActive: "15/05/2026 17:00", tasksCompleted: 312 },
  { id: "ST-004", fullName: "Phạm Minh Khoa",  email: "khoa.pham@uteshop.vn",   role: "staff", department: "Kho vận",       isActive: true,  lastActive: "18/05/2026 11:00", tasksCompleted: 156 },
  { id: "ST-005", fullName: "Võ Thị Linh",     email: "linh.vo@uteshop.vn",     role: "staff", department: "Chăm sóc KH",  isActive: true,  lastActive: "18/05/2026 10:45", tasksCompleted: 278 },
];

// ── Customers ────────────────────────────────────────────────────────────────
export const CUSTOMERS: Customer[] = [
  { id: "KH-001", fullName: "Nguyễn Minh Anh",   email: "minhanh@gmail.com",  phone: "0912 345 678", totalOrders: 28, totalSpent: 12450000, joinDate: "12/01/2025", isActive: true },
  { id: "KH-002", fullName: "Trần Thị Hoa",       email: "hoatran@gmail.com",  phone: "0987 654 321", totalOrders: 15, totalSpent: 28900000, joinDate: "03/03/2025", isActive: true },
  { id: "KH-003", fullName: "Lê Văn Bình",        email: "binhle@yahoo.com",   phone: "0903 111 222", totalOrders: 6,  totalSpent: 3200000,  joinDate: "20/07/2025", isActive: true },
  { id: "KH-004", fullName: "Phạm Thu Hà",        email: "hapham@gmail.com",   phone: "0978 333 444", totalOrders: 42, totalSpent: 54200000, joinDate: "05/11/2024", isActive: true },
  { id: "KH-005", fullName: "Hoàng Đức Nam",      email: "namhoang@gmail.com", phone: "0965 555 666", totalOrders: 3,  totalSpent: 980000,   joinDate: "10/04/2026", isActive: false },
  { id: "KH-006", fullName: "Võ Thị Lan",         email: "lanvo@gmail.com",    phone: "0912 777 888", totalOrders: 19, totalSpent: 16700000, joinDate: "28/02/2025", isActive: true },
];

// ── Activity Feed ────────────────────────────────────────────────────────────
export const ACTIVITY_FEED: ActivityItem[] = [
  { id: "a1", user: "Đơn hàng #ORD-1024 đã được tạo", action: "",  target: "", time: "09:43",  type: "order" },
  { id: "a2", user: "Khách hàng Nguyễn Minh Anh đã đăng ký",  action: "",   target: "",   time: "09:15", type: "user" },
  { id: "a3", user: "Sản phẩm Tai Nghe Bluetooth Sony WH-1000XM5 đã được cập nhật",action: "", target: "",   time: "08:32",   type: "product" },
  { id: "a4", user: "Nhân viên Trần Văn Nam đã đăng nhập",action: "",target: "", time: "08:05",   type: "system" },
];

// ── Low Stock Products ───────────────────────────────────────────────────────
export const LOW_STOCK_PRODUCTS = [
  { id: "SP-1001", name: "Giày Thể Thao Nam UltraBoost", stock: 5, icon: "👟" },
  { id: "SP-2005", name: "Tai Nghe Bluetooth Sony WH-1000XM5", stock: 8, icon: "🎧" },
  { id: "SP-3010", name: "Balo Laptop 15.6 inch", stock: 3, icon: "🎒" },
];

// ── Weekly Task Data (for staff chart) ──────────────────────────────────────
export const WEEKLY_TASKS = [
  { day: "T2", completed: 14, pending: 3 },
  { day: "T3", completed: 18, pending: 2 },
  { day: "T4", completed: 11, pending: 5 },
  { day: "T5", completed: 16, pending: 1 },
  { day: "T6", completed: 20, pending: 0 },
  { day: "T7", completed: 9,  pending: 4 },
  { day: "CN", completed: 5,  pending: 2 },
];
