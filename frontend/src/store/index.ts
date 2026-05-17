import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth/authSlice";
import { profileReducer } from "@/features/profile/profileSlice";
import { cartReducer } from "@/features/cart/cartSlice";
import { catalogReducer } from "@/features/catalog/catalogSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    cart: cartReducer,
    catalog: catalogReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
