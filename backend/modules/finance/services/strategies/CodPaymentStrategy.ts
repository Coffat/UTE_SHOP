import { PaymentStrategy } from './PaymentStrategy.ts';

export class CodPaymentStrategy extends PaymentStrategy {
  /**
   * Processes a Cash on Delivery payment
   * @param paymentRecord The payment MongoDB document
   * @param extraData Optional additional metadata
   */
  async processPayment(
    paymentRecord: any,
    extraData?: any
  ): Promise<{ success: boolean; message: string }> {
    // COD is processed immediately. The payment record remains PENDING until the shipper completes delivery.
    return {
      success: true,
      message: 'Cash on delivery method registered successfully. Settlement occurs upon delivery.',
    };
  }

  /**
   * Webhooks are not used for Cash on Delivery
   */
  async handleWebhook(
    paymentRecord: any,
    webhookPayload: any
  ): Promise<{ status: 'SUCCESS' | 'FAILED' | 'PENDING'; transactionId?: string }> {
    throw new Error('COD strategy does not support external webhooks / IPN callbacks');
  }
}
