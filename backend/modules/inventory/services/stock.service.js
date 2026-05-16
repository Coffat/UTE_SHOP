import StockLevel from '../models/StockLevel.js';
import StockTransaction from '../models/StockTransaction.js';
import ProductVariant from '../../catalog/models/ProductVariant.js';
import TransactionType from '../../../shared/enums/TransactionType.js';
import StockStatus from '../../../shared/enums/StockStatus.js';

/**
 * ⚡ HÀM NÀY ĐƯỢC GỌI BỞI order.service.js (Cross-Module Communication)
 *
 * Trừ số lượng tồn kho của một ProductVariant.
 * Nếu không đủ hàng → throw Error để order.service biết rollback transaction.
 *
 * @param {string} variantId
 * @param {number} qty - số lượng cần trừ
 * @param {string} performedBy - userId thực hiện (có thể là SALES bot)
 * @param {ClientSession} session - MongoDB session để tham gia transaction ACID
 */
export const decreaseStock = async (variantId, qty, performedBy, session = null) => {
  // Tìm StockLevel cho variant (lấy kho đầu tiên có hàng)
  const stockLevel = await StockLevel.findOne({
    productVariant: variantId,
    quantity: { $gte: qty },
  }).session(session);

  if (!stockLevel) {
    throw new Error(`Không đủ tồn kho cho biến thể ${variantId}`);
  }

  // Trừ kho
  stockLevel.quantity -= qty;
  await stockLevel.save({ session });

  // Ghi log transaction
  await StockTransaction.create(
    [{ stockLevel: stockLevel._id, type: TransactionType.EXPORT, quantity: qty, reason: 'Order placed', performedBy }],
    { session }
  );

  // Cập nhật stockStatus trên ProductVariant
  const newStatus = stockLevel.quantity <= 0
    ? StockStatus.OUT_OF_STOCK
    : stockLevel.quantity <= stockLevel.minThreshold
      ? StockStatus.LOW
      : StockStatus.IN_STOCK;

  await ProductVariant.findByIdAndUpdate(variantId, { stockStatus: newStatus }, { session });
};

/**
 * Hoàn trả số lượng tồn kho (khi order bị cancel/refund)
 * Được gọi bởi order.service.js hoặc finance.service.js
 */
export const increaseStock = async (variantId, qty, performedBy, reason = 'Order cancelled', session = null) => {
  const stockLevel = await StockLevel.findOne({ productVariant: variantId }).session(session);

  if (!stockLevel) throw new Error(`Không tìm thấy StockLevel cho variant ${variantId}`);

  stockLevel.quantity += qty;
  await stockLevel.save({ session });

  await StockTransaction.create(
    [{ stockLevel: stockLevel._id, type: TransactionType.IMPORT, quantity: qty, reason, performedBy }],
    { session }
  );

  // Cập nhật lại stockStatus
  const newStatus = stockLevel.quantity <= stockLevel.minThreshold
    ? StockStatus.LOW
    : StockStatus.IN_STOCK;
  await ProductVariant.findByIdAndUpdate(variantId, { stockStatus: newStatus }, { session });
};

/**
 * Import hàng vào kho (do WAREHOUSE_STAFF thực hiện)
 */
export const importStock = async ({ warehouseId, variantId, materialId, quantity, performedBy, reason }) => {
  let stockLevel = await StockLevel.findOne({
    warehouse: warehouseId,
    ...(variantId ? { productVariant: variantId } : { material: materialId }),
  });

  if (!stockLevel) {
    stockLevel = await StockLevel.create({
      warehouse: warehouseId,
      productVariant: variantId || null,
      material: materialId || null,
      quantity,
    });
  } else {
    stockLevel.quantity += quantity;
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
export const getStockLevels = async (warehouseId) => {
  return StockLevel.find(warehouseId ? { warehouse: warehouseId } : {})
    .populate('productVariant', 'sku sizeName price')
    .populate('material', 'name unit')
    .populate('warehouse', 'name');
};
