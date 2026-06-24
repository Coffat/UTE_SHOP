import 'dotenv/config';
import { ShippingService } from '../modules/logistics/services/shipping.service.js';

async function run() {
  console.log("Testing GHN integration...");
  
  try {
    const fee = await ShippingService.calculateFee({
      to_district_id: 1454, // District 3, HCM
      to_ward_code: "21211", // Ward 1, District 3
      subtotal: 500000,
      cart_items: [
        {
          product_id: "test",
          variant_id: "test_var",
          quantity: 1,
          weight: 1000, // 1kg
          length: 30, // 30cm
          width: 30, // 30cm
          height: 30, // 30cm
        }
      ]
    });
    
    console.log(`✅ Success! Calculated Shipping Fee: ${fee.toLocaleString('vi-VN')} VND`);
  } catch (err: any) {
    console.error("❌ Failed to calculate shipping fee:", err.message);
  }
}

run();
