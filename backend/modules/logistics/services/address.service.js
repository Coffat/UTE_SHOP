import Address from '../models/Address.js';

export const createAddress = async (customerId, data) => {
  // Nếu isDefault = true, bỏ default của các địa chỉ cũ
  if (data.isDefault) {
    await Address.updateMany({ customer: customerId }, { isDefault: false });
  }
  return Address.create({ customer: customerId, ...data });
};

export const getAddressesByCustomer = async (customerId) =>
  Address.find({ customer: customerId }).sort({ isDefault: -1 });

export const deleteAddress = async (addressId, customerId) =>
  Address.findOneAndDelete({ _id: addressId, customer: customerId });

export const setDefaultAddress = async (addressId, customerId) => {
  await Address.updateMany({ customer: customerId }, { isDefault: false });
  return Address.findByIdAndUpdate(addressId, { isDefault: true }, { new: true });
};
