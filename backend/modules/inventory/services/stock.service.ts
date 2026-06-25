import mongoose, { ClientSession } from 'mongoose';
import StockLevel, { IStockLevel } from '../models/StockLevel.js';
import StockTransaction from '../models/StockTransaction.js';
import Material from '../models/Material.js';
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
  warehouseId?: string;
  variantId?: string;
  materialId?: string;
  newMaterialName?: string;
  newMaterialUnit?: string;
  quantity: number;
  unitPrice?: number;
  totalCost?: number;
  performedBy: string;
  reason: string;
  producedFromMaterials?: boolean;
  overrides?: Array<{ materialId: string; amount: number }>;
}

export const importStock = async (params: ImportStockParams): Promise<IStockLevel> => {
  const { variantId, quantity, unitPrice, totalCost, performedBy, reason, producedFromMaterials, overrides, newMaterialName, newMaterialUnit } = params;
  let { warehouseId, materialId } = params;

  if (!warehouseId) {
    const warehouse = await Warehouse.findOne({ isActive: true }).sort({ createdAt: 1 });
    if (!warehouse) throw new Error('Chưa cấu hình kho hàng (Warehouse).');
    warehouseId = (warehouse._id as mongoose.Types.ObjectId).toString();
  }

  const session = await mongoose.startSession();
  let finalStockLevel: IStockLevel | null = null;

  try {
    await session.withTransaction(async () => {
      if (newMaterialName && !materialId && !variantId) {
        const newMat = await Material.create([{ name: newMaterialName.trim(), unit: newMaterialUnit?.trim() || 'Cái' }], { session });
        materialId = (newMat[0]._id as mongoose.Types.ObjectId).toString();
      }

      if (producedFromMaterials) {
        if (!variantId) throw new Error("Phải chọn thành phẩm để sản xuất từ nguyên liệu");
        // import Recipe
        const Recipe = (await import('../../catalog/models/Recipe.js')).default;
        const recipe = await Recipe.findOne({ productVariant: variantId }).session(session);
        if (!recipe) throw new Error("Chưa có công thức (Recipe) cho thành phẩm này");

        const overrideMap = new Map<string, number>();
        if (overrides) {
          overrides.forEach(o => overrideMap.set(o.materialId.toString(), o.amount));
        }

        let totalCOGS = 0;
        for (const ingredient of recipe.ingredients) {
          const matIdStr = ingredient.material.toString();
          const standardAmount = Number(ingredient.amount.toString());
          const wastePercent = Number(ingredient.wastePercent.toString());
          
          let requiredAmount = (standardAmount * quantity) * (1 + wastePercent / 100);
          if (overrideMap.has(matIdStr)) {
            requiredAmount = overrideMap.get(matIdStr)!;
          }

          const matStock = await StockLevel.findOne({
            warehouse: warehouseId,
            material: ingredient.material,
          }).populate('material', 'costPerUnit').session(session);

          if (!matStock) throw new Error(`Kho không có nguyên liệu ${ingredient.material} để sản xuất`);

          const currentMatQty = Number(matStock.quantity.toString());
          if (currentMatQty < requiredAmount) {
            throw new Error(`Không đủ nguyên liệu ${ingredient.material}. Cần: ${requiredAmount}, Có: ${currentMatQty}`);
          }

          const matCost = matStock.material && (matStock.material as any).costPerUnit ? Number((matStock.material as any).costPerUnit.toString()) : 0;
          totalCOGS += matCost * requiredAmount;

          const newMatQty = currentMatQty - requiredAmount;
          matStock.quantity = mongoose.Types.Decimal128.fromString(newMatQty.toString()) as any;
          await matStock.save({ session });

          await StockTransaction.create([{
            stockLevel: matStock._id,
            type: TransactionType.EXPORT,
            quantity: requiredAmount,
            reason: `Sản xuất thành phẩm ${variantId}`,
            performedBy,
          }], { session });
        }

        // Set cost for Variant (Optionally average cost)
        const ProductVariant = mongoose.model('ProductVariant');
        const variantCost = totalCOGS / quantity;
        await ProductVariant.findByIdAndUpdate(variantId, { price: variantCost }, { session });
      }

      let stockLevel = await StockLevel.findOne({
        warehouse: warehouseId,
        ...(variantId ? { productVariant: variantId } : { material: materialId }),
      }).session(session);

      if (!stockLevel) {
        stockLevel = new StockLevel({
          warehouse: warehouseId,
          productVariant: variantId || null,
          material: materialId || null,
          quantity: mongoose.Types.Decimal128.fromString(quantity.toString()) as any,
        });
        await stockLevel.save({ session });
      } else {
        const currentQty = Number(stockLevel.quantity.toString());
        const newQty = currentQty + quantity;
        stockLevel.quantity = mongoose.Types.Decimal128.fromString(newQty.toString()) as any;
        await stockLevel.save({ session });
      }

      await StockTransaction.create([{
        stockLevel: stockLevel._id,
        type: TransactionType.IMPORT,
        quantity,
        unitPrice: unitPrice ? mongoose.Types.Decimal128.fromString(unitPrice.toString()) : undefined,
        totalCost: totalCost ? mongoose.Types.Decimal128.fromString(totalCost.toString()) : undefined,
        reason,
        performedBy,
      }], { session });

      finalStockLevel = stockLevel;
    });
  } finally {
    session.endSession();
  }

  if (!finalStockLevel) {
    throw new Error('Không thể import kho');
  }

  return finalStockLevel;
};

/**
 * Lấy danh sách tồn kho
 */
export const getStockLevels = async (warehouseId?: string, type?: 'material' | 'variant'): Promise<IStockLevel[]> => {
  const filter: any = warehouseId ? { warehouse: warehouseId } : {};
  if (type === 'material') filter.material = { $ne: null };
  if (type === 'variant') filter.productVariant = { $ne: null };

  return StockLevel.find(filter)
    .populate('productVariant', 'sku sizeName price stockStatus')
    .populate('material', 'name unit costPerUnit shelfLifeDays')
    .populate('warehouse', 'name');
};

// ─── Warehouse-specific functions ──────────────────────────────────────────────

/**
 * Thống kê tổng quan kho cho dashboard WAREHOUSE_STAFF
 */
export const getWarehouseSummary = async () => {
  const [allLevels, todayTransactions] = await Promise.all([
    StockLevel.find({})
      .populate('productVariant', 'sku sizeName')
      .populate('material', 'name unit'),
    StockTransaction.find({
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  const totalSkus = allLevels.length;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const lowStockItems: any[] = [];

  for (const level of allLevels) {
    const qty = Number(level.quantity.toString());
    const min = level.minThreshold ? Number(level.minThreshold.toString()) : 0;
    const name = (level.material as any)?.name || (level.productVariant as any)?.sizeName || 'Unknown';
    const unit = (level.material as any)?.unit || 'cái';

    if (qty <= 0) {
      outOfStockCount++;
      lowStockItems.push({ id: level._id, name, unit, quantity: qty, minThreshold: min, status: 'OUT_OF_STOCK' });
    } else if (min > 0 && qty <= min) {
      lowStockCount++;
      lowStockItems.push({ id: level._id, name, unit, quantity: qty, minThreshold: min, status: 'LOW' });
    }
  }

  const todayImports = todayTransactions
    .filter(t => t.type === TransactionType.IMPORT)
    .reduce((sum, t) => sum + Number(t.quantity.toString()), 0);

  const recentTransactions = await StockTransaction.find({})
    .sort({ timestamp: -1 })
    .limit(5)
    .populate({
      path: 'stockLevel',
      populate: [
        { path: 'material', select: 'name unit' },
        { path: 'productVariant', select: 'sku sizeName' },
      ],
    })
    .populate('performedBy', 'fullName');

  return {
    totalSkus,
    lowStockCount,
    outOfStockCount,
    todayImports,
    lowStockItems: lowStockItems.slice(0, 10),
    recentTransactions,
  };
};

interface GetTransactionsParams {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Lấy lịch sử giao dịch có filter và phân trang
 */
export const getTransactions = async ({ type, dateFrom, dateTo, page = 1, limit = 20, search }: GetTransactionsParams) => {
  const filter: any = {};

  if (type && Object.values(TransactionType).includes(type as TransactionType)) {
    filter.type = type;
  }
  if (dateFrom || dateTo) {
    filter.timestamp = {};
    if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.timestamp.$lte = end;
    }
  }

  const skip = (page - 1) * limit;
  const [total, items] = await Promise.all([
    StockTransaction.countDocuments(filter),
    StockTransaction.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'stockLevel',
        populate: [
          { path: 'material', select: 'name unit' },
          { path: 'productVariant', select: 'sku sizeName' },
          { path: 'warehouse', select: 'name' },
        ],
      })
      .populate('performedBy', 'fullName email'),
  ]);

  // Filter by search on populated fields (post-query filter)
  const filteredItems = search
    ? items.filter(t => {
        const sl = t.stockLevel as any;
        const name = sl?.material?.name || sl?.productVariant?.sizeName || sl?.productVariant?.sku || '';
        const performer = (t.performedBy as any)?.fullName || '';
        const q = search.toLowerCase();
        return name.toLowerCase().includes(q) || performer.toLowerCase().includes(q) || t.reason?.toLowerCase().includes(q);
      })
    : items;

  return {
    items: filteredItems,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Lấy danh sách Material (nguyên liệu) cho form nhập kho
 */
export const getMaterials = async () => {
  return Material.find({}).sort({ name: 1 });
};
