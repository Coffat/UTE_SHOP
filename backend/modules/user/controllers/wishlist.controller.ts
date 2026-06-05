import { Request, Response } from 'express';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import Customer from '../models/Customer.js';
import mongoose from 'mongoose';

// Lấy danh sách sản phẩm yêu thích (wishlist)
export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  
  const customer = await Customer.findById(customerId).populate('favorites');
  if (!customer) {
    return sendError(res, 404, 'Không tìm thấy người dùng');
  }

  sendSuccess(res, 200, 'Lấy danh sách yêu thích thành công', customer.favorites);
});

// Thêm/Xóa sản phẩm khỏi wishlist
export const toggleWishlist = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const productIdParam = req.params.productId;
  const productId = Array.isArray(productIdParam) ? productIdParam[0] : productIdParam;

  if (!productId) {
    return sendError(res, 400, 'Thiếu ID sản phẩm');
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return sendError(res, 400, 'ID sản phẩm không hợp lệ');
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return sendError(res, 404, 'Không tìm thấy người dùng');
  }

  const index = customer.favorites.indexOf(productId as unknown as mongoose.Types.ObjectId);
  
  if (index > -1) {
    // Nếu đã có thì xóa
    customer.favorites.splice(index, 1);
  } else {
    // Nếu chưa có thì thêm
    customer.favorites.push(productId as unknown as mongoose.Types.ObjectId);
  }

  await customer.save();

  sendSuccess(res, 200, index > -1 ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích', customer.favorites);
});
