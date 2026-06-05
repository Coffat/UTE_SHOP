import { configureStore } from "@reduxjs/toolkit";
import { authReducer, resetAuth } from "@/features/auth/authSlice";
import { profileReducer, resetProfile } from "@/features/profile/profileSlice";
import { cartReducer } from "@/features/cart/cartSlice";
import { catalogReducer } from "@/features/catalog/catalogSlice";
import { categoriesReducer } from "@/features/catalog/categoriesSlice";
import { wishlistReducer } from "@/features/wishlist/wishlistSlice";
import { registerUnauthorizedHandler } from "@/lib/unauthorizedHandler";

import { notificationReducer, resetNotifications } from "@/features/notification/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    cart: cartReducer,
    catalog: catalogReducer,
    categories: categoriesReducer,
    wishlist: wishlistReducer,
    notification: notificationReducer,
  },
});

registerUnauthorizedHandler(() => {
  store.dispatch(resetProfile());
  store.dispatch(resetAuth());
  store.dispatch(resetNotifications());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
