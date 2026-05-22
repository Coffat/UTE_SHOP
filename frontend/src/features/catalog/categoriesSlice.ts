import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  parent: string | null;
}

export interface CategoriesState {
  items: CategoryItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

// Fallback mock categories matching backend seeder perfectly with beautiful high-res Unsplash links
export const MOCK_CATEGORIES: CategoryItem[] = [
  {
    _id: "cat-sinh-nhat",
    name: "Hoa Sinh Nhật",
    slug: "hoa-sinh-nhat",
    description: "Món quà sinh nhật rực rỡ, mang niềm vui và lời chúc tuổi mới trọn vẹn.",
    imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-tinh-yeu",
    name: "Hoa Tình Yêu",
    slug: "hoa-tinh-yeu",
    description: "Sắc hồng, sắc đỏ nồng nàn minh chứng cho tình yêu lãng mạn vĩnh cửu.",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-khai-truong",
    name: "Hoa Khai Trương",
    slug: "hoa-khai-truong",
    description: "Kệ hoa, lẵng hoa sang trọng chúc mừng hồng phát, thành công rực rỡ.",
    imageUrl: "https://images.unsplash.com/photo-1590004953392-5aba2e72269a?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-nghe-thuat",
    name: "Bình Hoa Nghệ Thuật",
    slug: "binh-hoa-nghe-thuat",
    description: "Những tác phẩm hoa cắm bình gốm, bình thủy tinh sang trọng cho không gian sống.",
    imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-dong-que",
    name: "Giỏ Hoa Đồng Quê",
    slug: "gio-hoa-dong-que",
    description: "Vẻ đẹp mộc mạc, bình dị từ giỏ mây tre đan đan cài hoa dại, cúc họa mi.",
    imageUrl: "https://images.unsplash.com/photo-1565118531796-763e5082d113?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-ngan-sach",
    name: "Bó Hoa Ngân Sách",
    slug: "hoa-ngan-sach",
    description: "Những bó hoa xinh xắn thiết kế tối giản với giá cả cực kỳ hợp lý dưới 250,000đ.",
    imageUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-gau-hoa",
    name: "Combo Gấu & Hoa",
    slug: "combo-gau-va-hoa",
    description: "Sự kết hợp hoàn hảo ngọt ngào giữa đóa hoa tươi và chú gấu bông dễ thương.",
    imageUrl: "https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-chia-buon",
    name: "Hoa Chia Buồn",
    slug: "hoa-chia-buon",
    description: "Vòng hoa kính viếng trang trọng, gửi gắm lời chia buồn sâu sắc và thành kính nhất.",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-ky-niem",
    name: "Hoa Kỷ Niệm",
    slug: "hoa-ky-niem",
    description: "Gửi trao yêu thương, kỷ niệm những khoảnh khắc ngọt ngào bên nhau.",
    imageUrl: "https://images.unsplash.com/photo-1562690868-60bbe7293e94?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-chuc-mung",
    name: "Hoa Chúc Mừng",
    slug: "hoa-chuc-mung",
    description: "Chúc mừng tốt nghiệp, kỷ niệm ngày thành lập hay thăng tiến sự nghiệp.",
    imageUrl: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-hoa-le",
    name: "Loại hoa lẻ",
    slug: "loai-hoa-le",
    description: "Tự do lựa chọn từng cành hoa yêu thích cắm trang trí phòng tại nhà.",
    imageUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  },
  {
    _id: "cat-su-kien",
    name: "Tiệc & Sự kiện",
    slug: "tiec-va-su-kien",
    description: "Thiết kế hoa bàn tiệc, cổng hoa cưới và decor trọn gói sự kiện sang trọng.",
    imageUrl: "https://images.unsplash.com/photo-1566393028639-d108a42c46a7?q=80&w=600&auto=format&fit=crop",
    isActive: true,
    parent: null
  }
];

export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async () => {
    try {
      const response = await api.get("/api/v1/categories");
      if (response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data as CategoryItem[];
      }
      return MOCK_CATEGORIES;
    } catch (err) {
      console.warn("Backend fetchCategories failed, using fallback mock categories.");
      return MOCK_CATEGORIES;
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<CategoryItem[]>) => {
        state.loading = false;
        state.items = action.payload.filter(c => c.isActive !== false);
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Không thể tải danh sách danh mục";
        // Even on error, populate with fallback so UI doesn't break
        state.items = MOCK_CATEGORIES;
      });
  },
});

export const categoriesReducer = categoriesSlice.reducer;
