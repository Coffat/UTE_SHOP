import Cart, { ICart } from '../models/Cart.js';

export class CartRepository {
  async findActiveByCustomer(customerId: string): Promise<ICart | null> {
    return Cart.findOne({ customer: customerId, status: 'ACTIVE' }).populate(
      'items.productVariant'
    );
  }

  async findActiveBySession(sessionId: string): Promise<ICart | null> {
    return Cart.findOne({ sessionId, status: 'ACTIVE' }).populate(
      'items.productVariant'
    );
  }

  async findById(cartId: string): Promise<ICart | null> {
    return Cart.findById(cartId);
  }

  async create(data: Partial<ICart>): Promise<ICart> {
    return Cart.create(data);
  }

  async removeItem(cartId: string, variantId: string): Promise<ICart | null> {
    return Cart.findByIdAndUpdate(
      cartId,
      { $pull: { items: { productVariant: variantId } } },
      { new: true }
    );
  }
}

export const cartRepository = new CartRepository();
