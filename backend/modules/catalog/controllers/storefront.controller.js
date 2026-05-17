import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import ProductStatus from '../../../shared/enums/ProductStatus.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';

export const getHomeProducts = asyncHandler(async (req, res) => {
  const limit = 4; // limit 4 per section for homepage

  // Find tags and categories
  const [banChayTag, comfortCat, bearComboCat, congratsCat] = await Promise.all([
    Tag.findOne({ slug: 'ban-chay' }),
    Category.findOne({ slug: 'loai-hoa-le' }), // Fallback for Hoa an ủi
    Category.findOne({ slug: 'tiec-va-su-kien' }), // Fallback for Combo gấu
    Category.findOne({ slug: 'hoa-chuc-mung' })
  ]);

  const fetchProducts = (filter) => {
    return Product.find({ ...filter, status: ProductStatus.ACTIVE })
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
  };

  const [popular, comfort, bearCombo, congrats] = await Promise.all([
    banChayTag ? fetchProducts({ tags: banChayTag._id }) : Promise.resolve([]),
    comfortCat ? fetchProducts({ category: comfortCat._id }) : Promise.resolve([]),
    bearComboCat ? fetchProducts({ category: bearComboCat._id }) : Promise.resolve([]),
    congratsCat ? fetchProducts({ category: congratsCat._id }) : Promise.resolve([])
  ]);

  sendSuccess(res, 200, 'Lấy dữ liệu trang chủ thành công', {
    popular,
    comfort,
    bearCombo,
    congrats
  });
});
