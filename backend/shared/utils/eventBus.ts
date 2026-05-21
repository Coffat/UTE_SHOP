import { EventEmitter } from 'events';

export enum AppEvent {
  PAYMENT_SUCCESS = 'payment:success',
  PAYMENT_FAILED = 'payment:failed',
}

export interface PaymentSuccessPayload {
  orderId: string;
  paymentId: string;
  paymentMethod: string;
  transactionId?: string;
  session?: any; // To forward ACID transaction session if applicable
}

export interface PaymentFailedPayload {
  orderId: string;
  paymentId: string;
  paymentMethod: string;
  reason?: string;
  session?: any;
}

export interface EventPayloadMap {
  [AppEvent.PAYMENT_SUCCESS]: PaymentSuccessPayload;
  [AppEvent.PAYMENT_FAILED]: PaymentFailedPayload;
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
    for (const listener of listeners) {
      await listener(payload);
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
