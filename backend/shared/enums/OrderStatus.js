/** @enum {string} */
const OrderStatus = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  READY: 'READY',
  DELIVERING: 'DELIVERING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

export default OrderStatus;
