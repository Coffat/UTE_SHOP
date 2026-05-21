import Address, { IAddress } from '../models/Address.js';

export const createAddress = async (customerId: string, data: Partial<IAddress>): Promise<IAddress> => {
  // Nếu isDefault = true, bỏ default của các địa chỉ cũ
  if (data.isDefault) {
    await Address.updateMany({ customer: customerId }, { isDefault: false });
  }
  return Address.create({ customer: customerId, ...data });
};

export const getAddressesByCustomer = async (customerId: string): Promise<IAddress[]> => {
  return Address.find({ customer: customerId }).sort({ isDefault: -1 });
};

export const deleteAddress = async (addressId: string, customerId: string): Promise<IAddress | null> => {
  return Address.findOneAndDelete({ _id: addressId, customer: customerId });
};

export const setDefaultAddress = async (addressId: string, customerId: string): Promise<IAddress | null> => {
  await Address.updateMany({ customer: customerId }, { isDefault: false });
  return Address.findByIdAndUpdate(addressId, { isDefault: true }, { new: true });
};
