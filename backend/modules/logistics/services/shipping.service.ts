import { ghnClient } from '../../../config/ghnClient.js';
import { 
  CalculateFeeClientRequest, 
  GHNAvailableServiceRequest, 
  GHNAvailableServiceResponse, 
  GHNFeeRequest, 
  GHNFeeResponse 
} from '../models/ghn.dto.js';

// Simple in-memory cache for shipping fees
const shippingFeeCache = new Map<string, { fee: number, timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export class ShippingService {
  /**
   * Tính toán kích thước và trọng lượng hộp hàng (Bounding Box logic cho hoa)
   */
  private static calculateDimensions(cartItems: CalculateFeeClientRequest['cart_items']) {
    let maxLen = 0;
    let maxWid = 0;
    let maxHeightItem = 0;
    let totalWeight = 0;
    let totalQuantity = 0;

    cartItems.forEach(item => {
      const w = item.weight || 500; // Default 500g
      const l = item.length || 30; // Default 30cm
      const wid = item.width || 20; // Default 20cm
      const h = item.height || 20; // Default 20cm

      totalWeight += w * item.quantity;
      totalQuantity += item.quantity;

      if (l > maxLen) maxLen = l;
      if (wid > maxWid) maxWid = wid;
      if (h > maxHeightItem) maxHeightItem = h;
    });

    // Default values if cart is somehow empty or missing data
    if (totalQuantity === 0) {
      return { weight: 0, length: 0, width: 0, height: 0 };
    }

    // Heuristic for flowers: Max(H) + (Quantity - 1) * 5cm
    const finalHeight = maxHeightItem + (totalQuantity - 1) * 5;

    return {
      weight: totalWeight,
      length: maxLen,
      width: maxWid,
      height: finalHeight
    };
  }

  /**
   * Lấy danh sách dịch vụ vận chuyển khả dụng
   */
  private static async getAvailableServices(fromDistrictId: number, toDistrictId: number): Promise<number | null> {
    try {
      const payload: GHNAvailableServiceRequest = {
        shop_id: Number(process.env.GHN_SHOP_ID),
        from_district: fromDistrictId,
        to_district: toDistrictId
      };

      const response = await ghnClient.post<GHNAvailableServiceResponse>(
        '/v2/shipping-order/available-services', 
        payload
      );

      if (response.data.code === 200 && response.data.data.length > 0) {
        // Priority: try to find 'Giao Chuẩn' (usually service_type_id: 2), otherwise pick first
        const standardService = response.data.data.find(s => s.service_type_id === 2);
        return standardService ? standardService.service_id : response.data.data[0].service_id;
      }
      return null;
    } catch (error) {
      console.error('Error fetching GHN available services:', error);
      return null;
    }
  }

  /**
   * Tính phí vận chuyển (Có cache)
   */
  public static async calculateFee(payload: CalculateFeeClientRequest): Promise<number> {
    const { to_district_id, to_ward_code, cart_items, subtotal } = payload;
    
    if (!cart_items || cart_items.length === 0) return 0;

    const dimensions = this.calculateDimensions(cart_items);
    const fromDistrictId = Number(process.env.GHN_FROM_DISTRICT_ID);

    // Cache Key: from_to_ward_weight_length_width_height_insurance
    const cacheKey = `${fromDistrictId}_${to_district_id}_${to_ward_code}_${dimensions.weight}_${dimensions.length}_${dimensions.width}_${dimensions.height}_${subtotal}`;
    
    // Check Cache
    const cached = shippingFeeCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.fee;
    }

    const serviceId = await this.getAvailableServices(fromDistrictId, to_district_id);
    
    if (!serviceId) {
      throw new Error('Không tìm thấy dịch vụ vận chuyển phù hợp cho tuyến đường này.');
    }

    // Limit max insurance value by GHN rule (e.g. max 5,000,000 to be safe, actual rule depends on GHN account)
    const insuranceValue = subtotal > 5000000 ? 5000000 : subtotal;

    const feePayload: GHNFeeRequest = {
      service_id: serviceId,
      insurance_value: insuranceValue,
      from_district_id: fromDistrictId,
      to_district_id: to_district_id,
      to_ward_code: to_ward_code,
      weight: dimensions.weight,
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height
    };

    try {
      const response = await ghnClient.post<GHNFeeResponse>(
        '/v2/shipping-order/fee', 
        feePayload
      );

      if (response.data.code === 200 && response.data.data) {
        const fee = response.data.data.total;
        
        // Save to cache
        shippingFeeCache.set(cacheKey, { fee, timestamp: Date.now() });
        
        return fee;
      } else {
        throw new Error(response.data.message || 'Lỗi từ hệ thống GHN.');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Lỗi tính phí vận chuyển: ${message}`);
    }
  }
}
