enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  READY = 'READY',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DELIVERY_FAILED = 'DELIVERY_FAILED', // Shipper báo khách boom hàng, sai địa chỉ, không nghe máy (giao thất bại)
  RETURNED = 'RETURNED'                // Shipper đã mang hoa trả lại về kho shop
}

export default OrderStatus;
