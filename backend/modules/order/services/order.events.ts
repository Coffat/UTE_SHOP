import { eventBus, AppEvent } from '../../../shared/utils/eventBus.js';
import { confirmOrderPayment, cancelOrder } from './order.service.js';

// Subscribe to Payment Success event
eventBus.on(AppEvent.PAYMENT_SUCCESS, async (payload) => {
  const { orderId, paymentMethod, transactionId, session } = payload;
  console.log(`[EventSubscriber] PAYMENT_SUCCESS received for Order: ${orderId}, Method: ${paymentMethod}`);
  try {
    await confirmOrderPayment(orderId, paymentMethod, transactionId, session);
  } catch (error: any) {
    console.error(`[EventSubscriber] Error handling PAYMENT_SUCCESS for Order ${orderId}:`, error.message);
    throw error; // Let exception bubble up to abort the transaction if applicable
  }
});

// Subscribe to Payment Failed event
eventBus.on(AppEvent.PAYMENT_FAILED, async (payload) => {
  const { orderId, paymentMethod, reason, session } = payload;
  console.log(`[EventSubscriber] PAYMENT_FAILED received for Order: ${orderId}, Method: ${paymentMethod}, Reason: ${reason}`);
  try {
    await cancelOrder(orderId, reason || `Payment failed via ${paymentMethod}`, 'SYSTEM', session);
  } catch (error: any) {
    console.error(`[EventSubscriber] Error handling PAYMENT_FAILED for Order ${orderId}:`, error.message);
    throw error; // Let exception bubble up to abort the transaction if applicable
  }
});
