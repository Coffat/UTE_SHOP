import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { clearAuthSessionFlag, hasAuthSessionFlag } from "@/lib/authSession";

export type ProfileFetchStatus = "idle" | "loading" | "succeeded" | "failed";
export type ProfileSaveStatus = "idle" | "loading" | "succeeded" | "failed";

const NETWORK_MSG =
  "Không kết nối được máy chủ. Hãy chạy backend và mở http://localhost:5173 nếu dùng proxy dev.";

export const UNAUTH = "UNAUTH";

type ApiErrorBody = {
  success?: boolean;
  message?: string;
  errors?: { field?: string; message?: string }[];
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
  if (body?.errors?.length) {
    const first = body.errors.map((e) => e.message).filter(Boolean).join(" ");
    if (first) {
      return first;
    }
  }
  const msg = body?.message ?? err.message;
  return typeof msg === "string" ? msg : fallback;
}

export type UserProfileDto = {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role?: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ProfileResponse = {
  success: boolean;
  data?: UserProfileDto;
  message?: string;
};

type UpdateProfilePayload = {
  fullName: string;
  phone: string;
  address: string;
};

/** Chỉ dev + env: dùng khi capture Figma/screenshot không có backend đăng nhập. Không bật trên production. */
function getProfileCaptureMock(): UserProfileDto | null {
  if (!import.meta.env.DEV || import.meta.env.VITE_PROFILE_CAPTURE_MOCK !== "true") {
    return null;
  }
  return {
    _id: "mock-profile-id",
    fullName: "Nguyễn Minh Anh",
    email: "minhanh@uteshop.example",
    phone: "0901 234 567",
    address: "Quận 3, TP. Hồ Chí Minh",
    role: "user",
    is_active: true,
    createdAt: "2024-06-15T08:00:00.000Z",
    updatedAt: "2025-05-01T10:00:00.000Z",
  };
}

function normalizeProfile(data: UserProfileDto): UserProfileDto {
  return {
    ...data,
    fullName: data.fullName?.trim() || data.email?.trim() || "User",
    email: data.email ?? "",
  };
}

export const fetchProfile = createAsyncThunk<
  UserProfileDto,
  void,
  { rejectValue: string }
>("profile/fetchProfile", async (_, { rejectWithValue }) => {
  if (!hasAuthSessionFlag()) {
    return rejectWithValue(UNAUTH);
  }
  const mock = getProfileCaptureMock();
  if (mock) {
    return normalizeProfile(mock);
  }
  try {
    const { data } = await api.get<ProfileResponse>("/api/v1/users/profile");
    if (!data.success || !data.data) {
      return rejectWithValue(data.message ?? "Không tải được hồ sơ");
    }
    return normalizeProfile(data.data);
  } catch (err) {
    const code = rejectFromAxios(err, "Không tải được hồ sơ");
    if (code === UNAUTH) {
      clearAuthSessionFlag();
    }
    return rejectWithValue(code);
  }
});

export const updateProfile = createAsyncThunk<
  UserProfileDto,
  UpdateProfilePayload,
  { rejectValue: string }
>("profile/updateProfile", async (payload, { rejectWithValue }) => {
  const mockBase = getProfileCaptureMock();
  if (mockBase) {
    return {
      ...mockBase,
      fullName: payload.fullName,
      phone: payload.phone,
      address: payload.address,
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const { data } = await api.put<ProfileResponse>("/api/v1/users/profile", payload);
    if (!data.success || !data.data) {
      return rejectWithValue(data.message ?? "Cập nhật thất bại");
    }
    return data.data;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Cập nhật thất bại"));
  }
});

export type OrderItemDto = {
  _id: string;
  productVariant: string | {
    _id: string;
    sku: string;
    sizeName?: string;
    price: number;
  };
  quantity: number;
  unitPrice: number;
  snapshotName: string;
  subtotal: number;
};

export type OrderDto = {
  _id: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItemDto[];
};

type OrdersResponse = {
  success: boolean;
  data?: {
    items: OrderDto[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
};

export const fetchUserOrders = createAsyncThunk<
  OrderDto[],
  void,
  { rejectValue: string }
>("profile/fetchUserOrders", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<OrdersResponse>("/api/v1/orders");
    if (!data.success || !data.data) {
      return rejectWithValue(data.message ?? "Không tải được lịch sử đơn hàng");
    }
    return data.data.items;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Không tải được lịch sử đơn hàng"));
  }
});

type ProfileState = {
  profile: UserProfileDto | null;
  fetchStatus: ProfileFetchStatus;
  fetchError: string | null;
  saveStatus: ProfileSaveStatus;
  saveError: string | null;
  saveMessage: string | null;
  orders: OrderDto[];
  ordersStatus: "idle" | "loading" | "succeeded" | "failed";
  ordersError: string | null;
};

const initialState: ProfileState = {
  profile: null,
  fetchStatus: "idle",
  fetchError: null,
  saveStatus: "idle",
  saveError: null,
  saveMessage: null,
  orders: [],
  ordersStatus: "idle",
  ordersError: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileErrors(state) {
      state.fetchError = null;
      state.saveError = null;
    },
    clearSaveMessage(state) {
      state.saveMessage = null;
    },
    resetProfile(state) {
      state.profile = null;
      state.fetchStatus = "idle";
      state.fetchError = null;
      state.saveStatus = "idle";
      state.saveError = null;
      state.saveMessage = null;
      state.orders = [];
      state.ordersStatus = "idle";
      state.ordersError = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.fetchStatus = "loading";
        state.fetchError = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.fetchError = null;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.fetchError = action.payload ?? "Không tải được hồ sơ";
        state.profile = null;
        if (action.payload === UNAUTH) {
          clearAuthSessionFlag();
        }
      })
      .addCase(updateProfile.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
        state.saveMessage = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        state.saveError = null;
        state.saveMessage = "Đã lưu thông tin hồ sơ.";
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload ?? "Cập nhật thất bại";
      })
      .addCase(fetchUserOrders.pending, (state) => {
        state.ordersStatus = "loading";
        state.ordersError = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.ordersStatus = "succeeded";
        state.ordersError = null;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.ordersStatus = "failed";
        state.ordersError = action.payload ?? "Không tải được lịch sử đơn hàng";
      });
  },
});

export const { clearProfileErrors, clearSaveMessage, resetProfile } = profileSlice.actions;
export const profileReducer = profileSlice.reducer;

