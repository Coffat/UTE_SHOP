import { api } from "@/lib/api";

export type AddressDto = {
  _id: string;
  label?: string;
  street: string;
  city: string;
  district?: string;
  ward?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AddressPayload = {
  label?: string;
  street: string;
  city: string;
  district?: string;
  ward?: string;
  isDefault?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

const normalizeAddressPayload = (payload: AddressPayload): AddressPayload => ({
  ...payload,
  label: payload.label?.trim(),
  street: payload.street.trim(),
  city: payload.city.trim(),
  district: payload.district?.trim(),
  ward: payload.ward?.trim(),
});

export const formatAddressLine = (address: Pick<AddressDto, "street" | "ward" | "district" | "city">): string =>
  [address.street, address.ward, address.district, address.city].filter(Boolean).join(", ");

export async function fetchAddresses(): Promise<AddressDto[]> {
  const { data } = await api.get<ApiEnvelope<AddressDto[]>>("/api/v1/addresses");
  return data.data ?? [];
}

export async function createAddress(payload: AddressPayload): Promise<AddressDto> {
  const { data } = await api.post<ApiEnvelope<AddressDto>>("/api/v1/addresses", normalizeAddressPayload(payload));
  if (!data.data) throw new Error(data.message ?? "Không thể thêm địa chỉ");
  return data.data;
}

export async function updateAddress(id: string, payload: AddressPayload): Promise<AddressDto> {
  const { data } = await api.patch<ApiEnvelope<AddressDto>>(`/api/v1/addresses/${id}`, normalizeAddressPayload(payload));
  if (!data.data) throw new Error(data.message ?? "Không thể cập nhật địa chỉ");
  return data.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`/api/v1/addresses/${id}`);
}

export async function setDefaultAddress(id: string): Promise<AddressDto> {
  const { data } = await api.patch<ApiEnvelope<AddressDto>>(`/api/v1/addresses/${id}/default`);
  if (!data.data) throw new Error(data.message ?? "Không thể đặt địa chỉ mặc định");
  return data.data;
}
