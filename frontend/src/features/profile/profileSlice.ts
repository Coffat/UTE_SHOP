import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";

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

export const fetchProfile = createAsyncThunk<
  UserProfileDto,
  void,
  { rejectValue: string }
>("profile/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<ProfileResponse>("/api/user/profile");
    if (!data.success || !data.data) {
      return rejectWithValue(data.message ?? "Không tải được hồ sơ");
    }
    return data.data;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Không tải được hồ sơ"));
  }
});

export const updateProfile = createAsyncThunk<
  UserProfileDto,
  UpdateProfilePayload,
  { rejectValue: string }
>("profile/updateProfile", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.put<ProfileResponse>("/api/user/profile", payload);
    if (!data.success || !data.data) {
      return rejectWithValue(data.message ?? "Cập nhật thất bại");
    }
    return data.data;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Cập nhật thất bại"));
  }
});

type ProfileState = {
  profile: UserProfileDto | null;
  fetchStatus: ProfileFetchStatus;
  fetchError: string | null;
  saveStatus: ProfileSaveStatus;
  saveError: string | null;
  saveMessage: string | null;
};

const initialState: ProfileState = {
  profile: null,
  fetchStatus: "idle",
  fetchError: null,
  saveStatus: "idle",
  saveError: null,
  saveMessage: null,
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
      });
  },
});

export const { clearProfileErrors, clearSaveMessage, resetProfile } = profileSlice.actions;
export const profileReducer = profileSlice.reducer;
