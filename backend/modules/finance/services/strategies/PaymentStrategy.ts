export abstract class PaymentStrategy {
  /**
   * Processes the payment transaction
   * @param paymentRecord The payment model document (MOMO, COD, or Cash)
   * @param extraData Optional additional metadata from the checkout request
   */
  abstract processPayment(
    paymentRecord: any,
    extraData?: any
  ): Promise<{
    success: boolean;
    redirectUrl?: string;
    message?: string;
    [key: string]: any;
  }>;

  /**
   * Handles incoming webhook / IPN callback payloads
   * @param paymentRecord The payment model document
   * @param webhookPayload Raw body payload from the gateway callback
   */
  abstract handleWebhook(
    paymentRecord: any,
    webhookPayload: any
  ): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    transactionId?: string;
    [key: string]: any;
  }>;
}
