import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { BackendProduct } from "@/features/catalog/catalogSlice";

export type WishlistStatus = "idle" | "loading" | "succeeded" | "failed";

const NETWORK_MSG =
  "Không kết nối được máy chủ. Hãy chạy backend và mở http://localhost:5173 nếu dùng proxy dev.";

export const UNAUTH = "UNAUTH";

type ApiErrorBody = {
  success?: boolean;
  message?: string;
};

function rejectFromAxios(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) {
    return fallback;
  }
  if (err.response?.status === 401 || err.response?.status === 403) {
    return UNAUTH;
  }
  if (err.response == null && (err.code === "ERR_NETWORK" || err.message === "Network Error")) {
    return NETWORK_MSG;
  }
  const body = err.response?.data as ApiErrorBody | undefined;
  const msg = body?.message ?? err.message;
  return typeof msg === "string" ? msg : fallback;
}

type FavoritesResponse = {
  success: boolean;
  data: BackendProduct[];
  message?: string;
};

export const fetchWishlist = createAsyncThunk<
  BackendProduct[],
  void,
  { rejectValue: string }
>("wishlist/fetchWishlist", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<FavoritesResponse>("/api/v1/users/favorites");
    if (!data.success || !data.data) {
      return rejectWithValue(data.message ?? "Không tải được danh sách yêu thích");
    }
    return data.data;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Không tải được danh sách yêu thích"));
  }
});

export const addToWishlist = createAsyncThunk<
  BackendProduct,
  BackendProduct,
  { rejectValue: string }
>("wishlist/addToWishlist", async (product, { rejectWithValue }) => {
  try {
    const { data } = await api.post<{ success: boolean; message?: string }>(`/api/v1/users/favorites/${product._id}`);
    if (!data.success) {
      return rejectWithValue(data.message ?? "Không thể thêm vào danh sách yêu thích");
    }
    return product;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Không thể thêm vào danh sách yêu thích"));
  }
});

export const removeFromWishlist = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("wishlist/removeFromWishlist", async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.delete<{ success: boolean; message?: string }>(`/api/v1/users/favorites/${productId}`);
    if (!data.success) {
      return rejectWithValue(data.message ?? "Không thể xóa khỏi danh sách yêu thích");
    }
    return productId;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Không thể xóa khỏi danh sách yêu thích"));
  }
});

type WishlistState = {
  items: BackendProduct[];
  status: WishlistStatus;
  error: string | null;
};

const initialState: WishlistState = {
  items: [],
  status: "idle",
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlistErrors(state) {
      state.error = null;
    },
    resetWishlist(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Không tải được danh sách yêu thích";
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        const exists = state.items.some((item) => item._id === action.payload._id);
        if (!exists) {
          state.items.push(action.payload);
        }
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
      });
  },
});

export const { clearWishlistErrors, resetWishlist } = wishlistSlice.actions;
export const wishlistReducer = wishlistSlice.reducer;
