import Address, { IAddress } from '../models/Address.js';
import { AppError } from '../../../shared/utils/AppError.js';

type AddressPayload = {
  label?: string;
  street: string;
  city: string;
  district?: string;
  ward?: string;
  isDefault?: boolean;
};

type AddressUpdatePayload = {
  label?: string;
  street?: string;
  city?: string;
  district?: string;
  ward?: string;
  isDefault?: boolean;
};

const promoteOldestAddressAsDefault = async (customerId: string, excludeAddressId?: string): Promise<void> => {
  const existingDefault = await Address.findOne({ customer: customerId, isDefault: true }).select('_id').lean();
  if (existingDefault) {
    return;
  }

  const candidate = await Address.findOne({
    customer: customerId,
    ...(excludeAddressId ? { _id: { $ne: excludeAddressId } } : {}),
  }).sort({ createdAt: 1 });
  if (candidate) {
    candidate.isDefault = true;
    await candidate.save();
  }
};

export const createAddress = async (customerId: string, payload: AddressPayload): Promise<IAddress> => {
  const existingCount = await Address.countDocuments({ customer: customerId });
  const shouldSetDefault = Boolean(payload.isDefault) || existingCount === 0;

  if (shouldSetDefault) {
    await Address.updateMany({ customer: customerId }, { isDefault: false });
  }

  try {
    return await Address.create({
      customer: customerId,
      label: payload.label,
      street: payload.street,
      city: payload.city,
      district: payload.district,
      ward: payload.ward,
      isDefault: shouldSetDefault,
    });
  } catch (error: unknown) {
    const dbError = error as { code?: number };
    if (dbError?.code === 11000) {
      throw new AppError('Địa chỉ mặc định đã tồn tại, vui lòng thử lại', 409);
    }
    throw error;
  }
};

export const getAddressesByCustomer = async (customerId: string): Promise<IAddress[]> => {
  return Address.find({ customer: customerId }).sort({ isDefault: -1, updatedAt: -1 });
};

export const getAddressByIdForCustomer = async (addressId: string, customerId: string): Promise<IAddress | null> => {
  return Address.findOne({ _id: addressId, customer: customerId });
};

export const updateAddress = async (
  addressId: string,
  customerId: string,
  payload: AddressUpdatePayload
): Promise<IAddress> => {
  const address = await Address.findOne({ _id: addressId, customer: customerId });
  if (!address) {
    throw new AppError('Không tìm thấy địa chỉ', 404);
  }

  if (typeof payload.label === 'string') address.label = payload.label;
  if (typeof payload.street === 'string') address.street = payload.street;
  if (typeof payload.city === 'string') address.city = payload.city;
  if (typeof payload.district === 'string') address.district = payload.district;
  if (typeof payload.ward === 'string') address.ward = payload.ward;

  if (payload.isDefault === true) {
    await Address.updateMany({ customer: customerId }, { isDefault: false });
    address.isDefault = true;
  } else if (payload.isDefault === false && address.isDefault) {
    address.isDefault = false;
    await address.save();
    await promoteOldestAddressAsDefault(customerId, String(address._id));
    const updatedAddress = await Address.findOne({ _id: addressId, customer: customerId });
    if (!updatedAddress) {
      throw new AppError('Không tìm thấy địa chỉ', 404);
    }
    return updatedAddress;
  }

  await address.save();
  await promoteOldestAddressAsDefault(customerId);
  return address;
};

export const deleteAddress = async (addressId: string, customerId: string): Promise<IAddress | null> => {
  const deleted = await Address.findOneAndDelete({ _id: addressId, customer: customerId });
  if (!deleted) {
    throw new AppError('Không tìm thấy địa chỉ', 404);
  }

  if (deleted.isDefault) {
    await promoteOldestAddressAsDefault(customerId);
  }

  return deleted;
};

export const setDefaultAddress = async (addressId: string, customerId: string): Promise<IAddress> => {
  const target = await Address.findOne({ _id: addressId, customer: customerId });
  if (!target) {
    throw new AppError('Không tìm thấy địa chỉ', 404);
  }

  await Address.updateMany({ customer: customerId }, { isDefault: false });
  target.isDefault = true;
  await target.save();
  return target;
};
