import { PaymentStrategy } from './PaymentStrategy.ts';

export class MomoPaymentStrategy extends PaymentStrategy {
  /**
   * Initiates a mock MoMo payment by creating a redirection link
   * @param paymentRecord The payment MongoDB document
   * @param extraData Optional dynamic parameters (e.g., client return URL)
   */
  async processPayment(
    paymentRecord: any,
    extraData?: any
  ): Promise<{ success: boolean; redirectUrl?: string; message?: string }> {
    const paymentId = paymentRecord._id.toString();
    const amount = Number(paymentRecord.amount.toString());

    // Generate a secure-looking mock payment link pointing to our storefront mock MoMo gateway
    const redirectUrl = `/mock-momo?paymentId=${paymentId}&amount=${amount}`;

    return {
      success: true,
      redirectUrl,
      message: 'MoMo checkout session initiated successfully',
    };
  }

  /**
   * Handles server-to-server MoMo IPN callbacks (simulated)
   * @param paymentRecord The payment MongoDB document
   * @param webhookPayload Payload containing transaction details
   */
  async handleWebhook(
    paymentRecord: any,
    webhookPayload: any
  ): Promise<{ status: 'SUCCESS' | 'FAILED' | 'PENDING'; transactionId?: string }> {
    const { status, transactionId, secretToken } = webhookPayload;

    // Verify a simple mock webhook signature/token for security validation (SOLID Single Responsibility)
    if (secretToken !== 'MOMO_INTEGRATION_TOKEN_SECRET') {
      throw new Error('Unauthorized: Invalid IPN Webhook token signature');
    }

    const resolvedStatus = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';

    return {
      status: resolvedStatus,
      transactionId: transactionId || `MOMO-${Date.now()}`,
    };
  }
}
