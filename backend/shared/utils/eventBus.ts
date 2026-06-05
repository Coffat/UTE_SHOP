import { EventEmitter } from 'events';
import crypto from 'crypto';

export enum AppEvent {
  PAYMENT_SUCCESS = 'payment:success',
  PAYMENT_FAILED = 'payment:failed',
  ORDER_CREATED = 'order:created',
  ORDER_STATUS_CHANGED = 'order:status_changed',
  CHAT_MESSAGE_RECEIVED = 'chat:message_received',
}

export interface BaseEventPayload {
  eventId: string;
  occurredAt: Date;
  entityId: string;
  actorId?: string;
}

export interface PaymentSuccessPayload extends BaseEventPayload {
  orderId: string;
  paymentId: string;
  paymentMethod: string;
  transactionId?: string;
  session?: any; // To forward ACID transaction session if applicable
}

export interface PaymentFailedPayload extends BaseEventPayload {
  orderId: string;
  paymentId: string;
  paymentMethod: string;
  reason?: string;
  session?: any;
}

export interface OrderCreatedPayload extends BaseEventPayload {
  orderId: string;
  orderCode: string;
  totalAmount: number;
}

export interface OrderStatusChangedPayload extends BaseEventPayload {
  orderId: string;
  orderCode: string;
  oldStatus: string;
  newStatus: string;
}

export interface ChatMessageReceivedPayload extends BaseEventPayload {
  conversationId: string;
  messageId: string;
  senderType: 'customer' | 'staff' | 'system';
  contentPreview: string;
  recipientId: string; // The person receiving the message
}

export interface EventPayloadMap {
  [AppEvent.PAYMENT_SUCCESS]: PaymentSuccessPayload;
  [AppEvent.PAYMENT_FAILED]: PaymentFailedPayload;
  [AppEvent.ORDER_CREATED]: OrderCreatedPayload;
  [AppEvent.ORDER_STATUS_CHANGED]: OrderStatusChangedPayload;
  [AppEvent.CHAT_MESSAGE_RECEIVED]: ChatMessageReceivedPayload;
}

class TypedEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(20);
  }

  emit<E extends AppEvent>(event: E, payload: EventPayloadMap[E]): boolean {
    return this.emitter.emit(event, payload);
  }

  async emitAsync<E extends AppEvent>(event: E, payload: EventPayloadMap[E]): Promise<void> {
    const listeners = this.emitter.listeners(event) as ((payload: EventPayloadMap[E]) => void | Promise<void>)[];
    
    // Sử dụng Promise.allSettled để đảm bảo 1 listener lỗi không ảnh hưởng luồng chính
    const results = await Promise.allSettled(listeners.map((listener) => listener(payload)));
    
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`[EventBus] Error in listener for event ${event}:`, result.reason);
      }
    }
  }

  on<E extends AppEvent>(event: E, listener: (payload: EventPayloadMap[E]) => void | Promise<void>): this {
    this.emitter.on(event, listener);
    return this;
  }

  off<E extends AppEvent>(event: E, listener: (payload: EventPayloadMap[E]) => void): this {
    this.emitter.off(event, listener);
    return this;
  }
}

export const eventBus = new TypedEventBus();
