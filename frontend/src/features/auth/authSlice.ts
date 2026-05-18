import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";

export type AuthStatus = "idle" | "loading" | "succeeded" | "failed";

const NETWORK_MSG =
  "Không kết nối được máy chủ. Hãy chạy backend (cổng 3000), hoặc mở trang bằng http://localhost:5173 (không dùng IP khác tab) nếu chưa bật proxy/CORS.";

type ApiErrorBody = {
  success?: boolean;
  message?: string;
  errors?: { field?: string; message?: string }[];
};

function rejectFromAxios(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) {
    return fallback;
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

type LoginResponse = {
  success: boolean;
  message?: string;
  redirectUrl?: string;
};

export const login = createAsyncThunk<
  LoginResponse,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post<LoginResponse>("/api/v1/auth/login", credentials);
    if (!data.success) {
      return rejectWithValue(data.message ?? "Đăng nhập thất bại");
    }
    return data;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Đăng nhập thất bại"));
  }
});

type MessageResponse = {
  success: boolean;
  message?: string;
};

export const registerUser = createAsyncThunk<
  MessageResponse,
  { fullName: string; email: string; password: string; phone: string },
  { rejectValue: string }
>("auth/registerUser", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<MessageResponse>("/api/v1/auth/register", payload);
    if (!data.success) {
      return rejectWithValue(data.message ?? "Đăng ký thất bại");
    }
    return data;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Đăng ký thất bại"));
  }
});

export const verifyRegistrationOtp = createAsyncThunk<
  MessageResponse,
  { email: string; otp: string },
  { rejectValue: string }
>("auth/verifyRegistrationOtp", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<MessageResponse>("/api/v1/auth/verify-otp", payload);
    if (!data.success) {
      return rejectWithValue(data.message ?? "Xác minh OTP thất bại");
    }
    return data;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Xác minh OTP thất bại"));
  }
});

export const forgotPassword = createAsyncThunk<
  MessageResponse,
  { email: string },
  { rejectValue: string }
>("auth/forgotPassword", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<MessageResponse>("/api/v1/auth/forgot-password", payload);
    if (!data.success) {
      return rejectWithValue(data.message ?? "Gửi email thất bại");
    }
    return data;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Gửi email thất bại"));
  }
});

export const resetPassword = createAsyncThunk<
  MessageResponse,
  { email: string; otp: string; newPassword: string },
  { rejectValue: string }
>("auth/resetPassword", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<MessageResponse>("/api/v1/auth/reset-password", payload);
    if (!data.success) {
      return rejectWithValue(data.message ?? "Đặt lại mật khẩu thất bại");
    }
    return data;
  } catch (err) {
    return rejectWithValue(rejectFromAxios(err, "Đặt lại mật khẩu thất bại"));
  }
});

type FlowState = {
  status: AuthStatus;
  error: string | null;
};

type LoginFlowState = FlowState & {
  redirectUrl: string | null;
};

const idleFlow = (): FlowState => ({
  status: "idle",
  error: null,
});

type AuthState = {
  login: LoginFlowState;
  register: FlowState;
  verifyOtp: FlowState;
  forgotPassword: FlowState;
  resetPassword: FlowState;
};

const initialState: AuthState = {
  login: { ...idleFlow(), redirectUrl: null },
  register: idleFlow(),
  verifyOtp: idleFlow(),
  forgotPassword: idleFlow(),
  resetPassword: idleFlow(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearLoginError(state) {
      state.login.error = null;
    },
    clearRegisterError(state) {
      state.register.error = null;
    },
    clearVerifyOtpError(state) {
      state.verifyOtp.error = null;
    },
    clearForgotPasswordError(state) {
      state.forgotPassword.error = null;
    },
    clearResetPasswordError(state) {
      state.resetPassword.error = null;
    },
    resetAuth(state) {
      state.login = { ...idleFlow(), redirectUrl: null };
      state.register = idleFlow();
      state.verifyOtp = idleFlow();
      state.forgotPassword = idleFlow();
      state.resetPassword = idleFlow();
    },
  },
  extraReducers(builder) {
    builder
      .addCase(login.pending, (state) => {
        state.login.status = "loading";
        state.login.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.login.status = "succeeded";
        state.login.error = null;
        state.login.redirectUrl = action.payload.redirectUrl ?? null;
      })
      .addCase(login.rejected, (state, action) => {
        state.login.status = "failed";
        state.login.error = action.payload ?? "Đăng nhập thất bại";
        state.login.redirectUrl = null;
      })
      .addCase(registerUser.pending, (state) => {
        state.register.status = "loading";
        state.register.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.register.status = "succeeded";
        state.register.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.register.status = "failed";
        state.register.error = action.payload ?? "Đăng ký thất bại";
      })
      .addCase(verifyRegistrationOtp.pending, (state) => {
        state.verifyOtp.status = "loading";
        state.verifyOtp.error = null;
      })
      .addCase(verifyRegistrationOtp.fulfilled, (state) => {
        state.verifyOtp.status = "succeeded";
        state.verifyOtp.error = null;
      })
      .addCase(verifyRegistrationOtp.rejected, (state, action) => {
        state.verifyOtp.status = "failed";
        state.verifyOtp.error = action.payload ?? "Xác minh OTP thất bại";
      })
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPassword.status = "loading";
        state.forgotPassword.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.forgotPassword.status = "succeeded";
        state.forgotPassword.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPassword.status = "failed";
        state.forgotPassword.error = action.payload ?? "Gửi email thất bại";
      })
      .addCase(resetPassword.pending, (state) => {
        state.resetPassword.status = "loading";
        state.resetPassword.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.resetPassword.status = "succeeded";
        state.resetPassword.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPassword.status = "failed";
        state.resetPassword.error = action.payload ?? "Đặt lại mật khẩu thất bại";
      });
  },
});

export const {
  clearLoginError,
  clearRegisterError,
  clearVerifyOtpError,
  clearForgotPasswordError,
  clearResetPasswordError,
  resetAuth,
} = authSlice.actions;

export const authReducer = authSlice.reducer;
