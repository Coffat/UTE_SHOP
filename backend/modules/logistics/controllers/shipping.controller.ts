import { Request, Response } from 'express';
import { ShippingService } from '../services/shipping.service.js';
import { CalculateFeeClientRequest } from '../models/ghn.dto.js';

export class ShippingController {
  public static async calculateFee(req: Request, res: Response): Promise<void> {
    try {
      const payload: CalculateFeeClientRequest = req.body;

      if (!payload.to_district_id || !payload.to_ward_code || !payload.cart_items) {
        res.status(400).json({ success: false, message: 'Thiếu thông tin địa chỉ hoặc giỏ hàng.' });
        return;
      }

      if (payload.cart_items.length === 0) {
        res.status(200).json({ success: true, data: { fee: 0 } });
        return;
      }

      const fee = await ShippingService.calculateFee(payload);

      res.status(200).json({
        success: true,
        data: { fee }
      });
    } catch (error: any) {
      console.error('Calculate Shipping Fee Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống khi tính phí vận chuyển.'
      });
    }
  }
}
