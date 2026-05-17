import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
}

const CART_STORAGE_KEY = "uteshop_cart";
const FREE_SHIPPING_THRESHOLD = 1000000; // 1,000,000đ
const DEFAULT_SHIPPING_FEE = 30000; // 30,000đ

// Tải trạng thái giỏ hàng từ localStorage nếu có
const loadCartFromStorage = (): CartState => {
  try {
    const serialized = localStorage.getItem(CART_STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized) as CartState;
      if (Array.isArray(parsed.items)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Lỗi khi tải giỏ hàng từ localStorage:", e);
  }

  return {
    items: [],
    subtotal: 0,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 0,
  };
};

const initialState: CartState = loadCartFromStorage();

// Hàm tiện ích tính toán lại chi phí đơn hàng
const recalculateCartTotals = (state: CartState) => {
  state.subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  if (state.items.length === 0) {
    state.shippingFee = 0;
  } else {
    state.shippingFee = state.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  }
  
  state.totalAmount = Math.max(0, state.subtotal + state.shippingFee - state.discountAmount);
  
  // Lưu vào localStorage tự động
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Lỗi lưu giỏ hàng vào localStorage:", e);
  }
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const newItem = action.payload;
      const existingItem = state.items.find(
        (item) => item.productId === newItem.productId && item.variantId === newItem.variantId
      );

      if (existingItem) {
        // Cộng dồn số lượng nhưng giới hạn theo stock của biến thể
        const targetQty = existingItem.quantity + newItem.quantity;
        existingItem.quantity = Math.min(targetQty, newItem.stock);
      } else {
        // Thêm mới sản phẩm vào giỏ hàng
        state.items.push({
          ...newItem,
          quantity: Math.min(newItem.quantity, newItem.stock),
        });
      }

      recalculateCartTotals(state);
    },

    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; variantId: string; quantity: number }>
    ) {
      const { productId, variantId, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.productId === productId && i.variantId === variantId
      );

      if (item) {
        // Ràng buộc số lượng từ 1 đến lượng hàng tồn kho (stock)
        item.quantity = Math.max(1, Math.min(quantity, item.stock));
      }

      recalculateCartTotals(state);
    },

    removeFromCart(state, action: PayloadAction<{ productId: string; variantId: string }>) {
      const { productId, variantId } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      );

      recalculateCartTotals(state);
    },

    clearCart(state) {
      state.items = [];
      state.subtotal = 0;
      state.shippingFee = 0;
      state.discountAmount = 0;
      state.totalAmount = 0;

      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch (e) {
        console.error("Lỗi khi xóa giỏ hàng trong localStorage:", e);
      }
    },

    applyDiscount(state, action: PayloadAction<number>) {
      state.discountAmount = action.payload;
      recalculateCartTotals(state);
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart, applyDiscount } =
  cartSlice.actions;
export const cartReducer = cartSlice.reducer;
