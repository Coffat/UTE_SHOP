import { PaymentStrategy } from './PaymentStrategy.ts';
import { MomoPaymentStrategy } from './MomoPaymentStrategy.ts';
import { CodPaymentStrategy } from './CodPaymentStrategy.ts';

export class PaymentStrategyFactory {
  private static strategies: Record<string, PaymentStrategy> = {
    MOMO: new MomoPaymentStrategy(),
    COD: new CodPaymentStrategy(),
  };

  /**
   * Resolves the appropriate PaymentStrategy for a given payment method
   * @param paymentMethod The payment method enum name ('MOMO' or 'COD')
   */
  static getStrategy(paymentMethod: string): PaymentStrategy {
    const strategy = this.strategies[paymentMethod.toUpperCase()];
    if (!strategy) {
      throw new Error(`Unsupported payment method gateway: ${paymentMethod}`);
    }
    return strategy;
  }
}
