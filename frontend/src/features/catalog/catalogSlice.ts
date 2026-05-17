import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import { images } from "@/lib/images";

const { products: imgProducts } = images;

// Thể hiện cấu trúc một Variant của sản phẩm
export interface BackendVariant {
  _id: string;
  sku: string;
  sizeName: string;
  price: number;
  oldPrice?: number;
  images: string[];
  stock?: number;
}

// Thể hiện cấu trúc Product từ database Mongoose
export interface BackendProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  } | string;
  tags?: string[];
  minifiedVariants?: {
    sizeName: string;
    price: number;
    oldPrice?: number;
  }[];
  reviewStats?: {
    ratingAverage: number;
    ratingCount: number;
  };
  soldCount?: number;
  isPublished?: boolean;
  mainImageUrl?: string;
}

export interface CatalogState {
  products: BackendProduct[];
  homeProducts: {
    popular: BackendProduct[];
    comfort: BackendProduct[];
    bearCombo: BackendProduct[];
    congrats: BackendProduct[];
  };
  selectedProduct: BackendProduct | null;
  selectedVariants: BackendVariant[];
  loading: boolean;
  error: string | null;
}

const initialState: CatalogState = {
  products: [],
  homeProducts: {
    popular: [],
    comfort: [],
    bearCombo: [],
    congrats: [],
  },
  selectedProduct: null,
  selectedVariants: [],
  loading: false,
  error: null,
};

// Mock fallback dữ liệu khi chưa chạy backend hoặc db rỗng
export const MOCK_PRODUCTS: BackendProduct[] = [
  {
    _id: "lavender-dream",
    name: "Bó Lavender Mộng Mơ",
    slug: "lavender-dream",
    description: "Bó hoa được thiết kế độc bản với những cành hoa oải hương tươi tắn kết hợp cùng hoa hồng pastel và lá bạc mỏng manh. Mang lại cảm giác thư thái, mộng mơ và vô cùng sang trọng. Phù hợp để tặng người yêu, kỷ niệm ngày cưới hoặc trang trí không gian sống.",
    category: { _id: "cat-1", name: "Hoa Kỷ Niệm", slug: "hoa-ky-niem" },
    tags: ["ban-chay"],
    reviewStats: { ratingAverage: 4.8, ratingCount: 124 },
    soldCount: 452,
    minifiedVariants: [
      { sizeName: "Tiêu chuẩn", price: 1230000, oldPrice: 1500000 },
      { sizeName: "Cao cấp (Thịnh soạn)", price: 1850000 }
    ]
  },
  {
    _id: "blush-whisper",
    name: "Bó Blush Thì Thầm",
    slug: "blush-whisper",
    description: "Hoa tulip hồng nhập khẩu kết hợp cùng mao lương trắng mỏng manh, tạo nên tổng thể thanh tao dịu dàng.",
    category: { _id: "cat-1", name: "Hoa Kỷ Niệm", slug: "hoa-ky-niem" },
    tags: ["yeu-thich"],
    reviewStats: { ratingAverage: 5, ratingCount: 89 },
    soldCount: 128,
    minifiedVariants: [
      { sizeName: "Tiêu chuẩn", price: 1200000 }
    ]
  },
  {
    _id: "purple-symphony",
    name: "Bó Purple Symphony",
    slug: "purple-symphony",
    description: "Cát tường tím kiêu sa đi cùng cẩm tú cầu xanh nhạt và lá bạc tròn nhập khẩu.",
    category: { _id: "cat-2", name: "Hoa Chúc Mừng", slug: "hoa-chuc-mung" },
    tags: ["moi-ve"],
    reviewStats: { ratingAverage: 5, ratingCount: 42 },
    soldCount: 64,
    minifiedVariants: [
      { sizeName: "Tiêu chuẩn", price: 950000 }
    ]
  },
  {
    _id: "pure-elegance",
    name: "Bó Pure Elegance",
    slug: "pure-elegance",
    description: "Lan hồ điệp trắng sang trọng đi cùng hoa hồng kem sữa nhập khẩu mang vẻ đẹp tinh khiết hoàn mỹ.",
    category: { _id: "cat-3", name: "Tường Hoa Cưới", slug: "hoa-cuoi" },
    tags: ["khuyen-mai"],
    reviewStats: { ratingAverage: 5, ratingCount: 75 },
    soldCount: 92,
    minifiedVariants: [
      { sizeName: "Tiêu chuẩn", price: 2500000 }
    ]
  }
];

export const MOCK_VARIANTS_MAP: Record<string, BackendVariant[]> = {
  "lavender-dream": [
    {
      _id: "var-1",
      sku: "LAV-STD",
      sizeName: "Tiêu chuẩn",
      price: 1230000,
      oldPrice: 1500000,
      images: [
        imgProducts.lavenderDream.src,
        imgProducts.blushWhisper.src,
        imgProducts.purpleSymphony.src,
        imgProducts.pureElegance.src,
      ],
      stock: 12
    },
    {
      _id: "var-2",
      sku: "LAV-PREM",
      sizeName: "Cao cấp (Thịnh soạn)",
      price: 1850000,
      images: [
        imgProducts.purpleSymphony.src,
        imgProducts.pureElegance.src,
      ],
      stock: 5
    }
  ],
  "blush-whisper": [
    {
      _id: "var-3",
      sku: "BLU-STD",
      sizeName: "Tiêu chuẩn",
      price: 1200000,
      images: [imgProducts.blushWhisper.src, imgProducts.lavenderDream.src],
      stock: 15
    }
  ],
  "purple-symphony": [
    {
      _id: "var-4",
      sku: "PUR-STD",
      sizeName: "Tiêu chuẩn",
      price: 950000,
      images: [imgProducts.purpleSymphony.src, imgProducts.blushWhisper.src],
      stock: 8
    }
  ],
  "pure-elegance": [
    {
      _id: "var-5",
      sku: "ELE-STD",
      sizeName: "Tiêu chuẩn",
      price: 2500000,
      images: [imgProducts.pureElegance.src, imgProducts.purpleSymphony.src],
      stock: 4
    }
  ]
};

// Async Thunks
export const fetchProducts = createAsyncThunk(
  "catalog/fetchProducts",
  async (params: { category?: string; tag?: string; search?: string } | undefined) => {
    try {
      const response = await api.get("/api/v1/products", { params });
      if (response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data as BackendProduct[];
      }
      return MOCK_PRODUCTS;
    } catch (err) {
      console.warn("Backend products fetch failed, using fallback mock catalog.");
      return MOCK_PRODUCTS;
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "catalog/fetchProductById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/products/${id}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data as BackendProduct;
      }
      // Tìm trong mock
      const mock = MOCK_PRODUCTS.find((p) => p._id === id || p.slug === id);
      if (mock) return mock;
      throw new Error("Không tìm thấy sản phẩm");
    } catch (err) {
      console.warn(`Backend fetch for product ${id} failed, using mock data.`);
      const mock = MOCK_PRODUCTS.find((p) => p._id === id || p.slug === id);
      if (mock) return mock;
      return rejectWithValue("Không tìm thấy sản phẩm");
    }
  }
);

export const fetchProductVariants = createAsyncThunk(
  "catalog/fetchProductVariants",
  async (productId: string) => {
    try {
      const response = await api.get(`/api/v1/products/${productId}/variants`);
      if (response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data as BackendVariant[];
      }
      return MOCK_VARIANTS_MAP[productId] || [];
    } catch (err) {
      console.warn(`Backend variants fetch for ${productId} failed, using mock variants.`);
      return MOCK_VARIANTS_MAP[productId] || [];
    }
  }
);

export const fetchHomeProducts = createAsyncThunk(
  "catalog/fetchHomeProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v1/storefront/home");
      if (response.data?.success && response.data?.data) {
        return response.data.data as {
          popular: BackendProduct[];
          comfort: BackendProduct[];
          bearCombo: BackendProduct[];
          congrats: BackendProduct[];
        };
      }
      return rejectWithValue("Dữ liệu không hợp lệ");
    } catch (err) {
      console.warn("Backend fetchHomeProducts failed.");
      return rejectWithValue("Lỗi tải trang chủ");
    }
  }
);

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    clearSelectedProduct(state) {
      state.selectedProduct = null;
      state.selectedVariants = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // List Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<BackendProduct[]>) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? "Lỗi tải danh mục sản phẩm";
      })
      // Get Product Details
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action: PayloadAction<BackendProduct>) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? "Lỗi tải chi tiết sản phẩm";
      })
      // List Variants
      .addCase(fetchProductVariants.fulfilled, (state, action: PayloadAction<BackendVariant[]>) => {
        state.selectedVariants = action.payload;
      })
      // Home Products
      .addCase(fetchHomeProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHomeProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.homeProducts = action.payload;
      })
      .addCase(fetchHomeProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedProduct } = catalogSlice.actions;
export const catalogReducer = catalogSlice.reducer;
