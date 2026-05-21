import { Request, Response } from 'express';
import * as addressService from '../services/address.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const getAddresses = async (req: Request, res: Response) => {
  sendSuccess(res, 200, 'OK', await addressService.getAddressesByCustomer(req.user!.id));
};

export const createAddress = async (req: Request, res: Response) => {
  sendSuccess(res, 201, 'Thêm địa chỉ thành công', await addressService.createAddress(req.user!.id, req.body));
};

export const deleteAddress = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await addressService.deleteAddress(id, req.user!.id);
  sendSuccess(res, 200, 'Đã xóa địa chỉ');
};

export const setDefaultAddress = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  sendSuccess(res, 200, 'OK', await addressService.setDefaultAddress(id, req.user!.id));
};
