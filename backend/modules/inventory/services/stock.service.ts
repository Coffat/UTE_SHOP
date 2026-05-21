import mongoose, { ClientSession } from 'mongoose';
import StockLevel, { IStockLevel } from '../models/StockLevel.js';
import StockTransaction from '../models/StockTransaction.js';
import ProductVariant from '../../catalog/models/ProductVariant.js';
import TransactionType from '../../../shared/enums/TransactionType.js';
import StockStatus from '../../../shared/enums/StockStatus.js';

/**
 * ⚡ HÀM NÀY ĐƯỢC GỌI BỞI order.service.js (Cross-Module Communication)
 *
 * Trừ số lượng tồn kho của một ProductVariant.
 * Nếu không đủ hàng → throw Error để order.service biết rollback transaction.
 */
export const decreaseStock = async (
  variantId: string,
  qty: number,
  performedBy: string,
  session: ClientSession | null = null
): Promise<void> => {
  // Tìm StockLevel cho variant (lấy kho đầu tiên có hàng)
  const stockLevel = await StockLevel.findOne({
    productVariant: variantId,
    quantity: { $gte: qty },
  }).session(session);

  if (!stockLevel) {
    throw new Error(`Không đủ tồn kho cho biến thể ${variantId}`);
  }

  // Trừ kho
  const currentQty = Number(stockLevel.quantity.toString());
  const newQty = currentQty - qty;
  stockLevel.quantity = mongoose.Types.Decimal128.fromString(newQty.toString()) as any;
  await stockLevel.save({ session });

  // Ghi log transaction
  await StockTransaction.create(
    [{ stockLevel: stockLevel._id, type: TransactionType.EXPORT, quantity: qty, reason: 'Order placed', performedBy }],
    { session }
  );

  // Cập nhật stockStatus trên ProductVariant
  const minThresholdVal = stockLevel.minThreshold ? Number(stockLevel.minThreshold.toString()) : 0;
  const newStatus = newQty <= 0
    ? StockStatus.OUT_OF_STOCK
    : newQty <= minThresholdVal
      ? StockStatus.LOW
      : StockStatus.IN_STOCK;

  await ProductVariant.findByIdAndUpdate(variantId, { stockStatus: newStatus }, { session });
};

/**
 * Hoàn trả số lượng tồn kho (khi order bị cancel/refund)
 * Được gọi bởi order.service.js hoặc finance.service.js
 */
export const increaseStock = async (
  variantId: string,
  qty: number,
  performedBy: string,
  reason: string = 'Order cancelled',
  session: ClientSession | null = null
): Promise<void> => {
  const stockLevel = await StockLevel.findOne({ productVariant: variantId }).session(session);

  if (!stockLevel) throw new Error(`Không tìm thấy StockLevel cho variant ${variantId}`);

  const currentQty = Number(stockLevel.quantity.toString());
  const newQty = currentQty + qty;
  stockLevel.quantity = mongoose.Types.Decimal128.fromString(newQty.toString()) as any;
  await stockLevel.save({ session });

  await StockTransaction.create(
    [{ stockLevel: stockLevel._id, type: TransactionType.IMPORT, quantity: qty, reason, performedBy }],
    { session }
  );

  // Cập nhật lại stockStatus
  const minThresholdVal = stockLevel.minThreshold ? Number(stockLevel.minThreshold.toString()) : 0;
  const newStatus = newQty <= minThresholdVal
    ? StockStatus.LOW
    : StockStatus.IN_STOCK;
  await ProductVariant.findByIdAndUpdate(variantId, { stockStatus: newStatus }, { session });
};

interface ImportStockParams {
  warehouseId: string;
  variantId?: string;
  materialId?: string;
  quantity: number;
  performedBy: string;
  reason: string;
}

/**
 * Import hàng vào kho (do WAREHOUSE_STAFF thực hiện)
 */
export const importStock = async ({
  warehouseId,
  variantId,
  materialId,
  quantity,
  performedBy,
  reason
}: ImportStockParams): Promise<IStockLevel> => {
  let stockLevel = await StockLevel.findOne({
    warehouse: warehouseId,
    ...(variantId ? { productVariant: variantId } : { material: materialId }),
  });

  if (!stockLevel) {
    stockLevel = await StockLevel.create({
      warehouse: warehouseId,
      productVariant: variantId || null,
      material: materialId || null,
      quantity: mongoose.Types.Decimal128.fromString(quantity.toString()) as any,
    });
  } else {
    const currentQty = Number(stockLevel.quantity.toString());
    const newQty = currentQty + quantity;
    stockLevel.quantity = mongoose.Types.Decimal128.fromString(newQty.toString()) as any;
    await stockLevel.save();
  }

  await StockTransaction.create({
    stockLevel: stockLevel._id,
    type: TransactionType.IMPORT,
    quantity,
    reason,
    performedBy,
  });

  return stockLevel;
};

/**
 * Lấy danh sách tồn kho
 */
export const getStockLevels = async (warehouseId?: string): Promise<IStockLevel[]> => {
  return StockLevel.find(warehouseId ? { warehouse: warehouseId } : {})
    .populate('productVariant', 'sku sizeName price')
    .populate('material', 'name unit')
    .populate('warehouse', 'name');
};
