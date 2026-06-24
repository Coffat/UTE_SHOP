import { useState, useEffect } from 'react';
import axios from 'axios';
import { env } from '../lib/env'; // Adjust according to your frontend env setup or use import.meta.env
import { useSelector } from 'react-redux';
import { RootState } from '../store/store'; // Adjust path if needed

interface UseShippingFeeProps {
  toDistrictId?: number | string | null;
  toWardCode?: string | null;
  subtotal: number;
}

export const useShippingFee = ({ toDistrictId, toWardCode, subtotal }: UseShippingFeeProps) => {
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Try to get cart items from Redux store, or you might pass them as props depending on architecture
  const cartItems = useSelector((state: RootState) => state.cart.items);

  useEffect(() => {
    // Edge Case: Empty cart
    if (!cartItems || cartItems.length === 0) {
      setShippingFee(0);
      return;
    }

    // Only trigger if we have valid address components
    if (!toDistrictId || !toWardCode) {
      setShippingFee(0);
      return;
    }

    const calculateFee = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const payload = {
          to_district_id: Number(toDistrictId),
          to_ward_code: toWardCode,
          cart_items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            weight: item.product?.weight,
            length: item.product?.length,
            width: item.product?.width,
            height: item.product?.height
          })),
          subtotal
        };

        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.post(`${backendUrl}/api/v1/shipping/calculate-fee`, payload);

        if (response.data.success) {
          setShippingFee(response.data.data.fee);
        } else {
          setError(response.data.message || 'Không thể tính phí vận chuyển.');
        }
      } catch (err: any) {
        console.error('Lỗi tính phí vận chuyển:', err);
        setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gọi API GHN.');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce to prevent spamming API on every keystroke/selection change
    const timeoutId = setTimeout(() => {
      calculateFee();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [toDistrictId, toWardCode, cartItems, subtotal]);

  return { shippingFee, isLoading, error };
};
