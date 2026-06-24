export interface GHNAvailableServiceRequest {
  shop_id: number;
  from_district: number;
  to_district: number;
}

export interface GHNAvailableServiceResponse {
  code: number;
  message: string;
  data: {
    service_id: number;
    short_name: string;
    service_type_id: number;
  }[];
}

export interface GHNFeeRequest {
  service_id: number;
  insurance_value: number;
  coupon?: string;
  from_district_id: number;
  to_district_id: number;
  to_ward_code: string;
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface GHNFeeResponse {
  code: number;
  message: string;
  data: {
    total: number;
    service_fee: number;
    insurance_fee: number;
    pick_station_fee: number;
    coupon_value: number;
    r2s_fee: number;
  } | null;
}

export interface CalculateFeeClientRequest {
  to_district_id: number;
  to_ward_code: string;
  cart_items: {
    productId: any;
    quantity: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
  }[];
  subtotal: number;
}
