import axios from "axios";

const PROVINCES_BASE_URL = "https://provinces.open-api.vn/api/v2";
const provincesClient = axios.create({
  baseURL: PROVINCES_BASE_URL,
  withCredentials: false,
});

export type ProvinceItem = {
  code: number;
  name: string;
  division_type?: string;
};

export type DistrictItem = {
  code: number;
  name: string;
  province_code?: number;
  division_type?: string;
};

export type WardItem = {
  code: number;
  name: string;
  district_code?: number;
  province_code?: number;
  division_type?: string;
};

type ProvinceWithDistricts = ProvinceItem & {
  districts?: DistrictItem[];
  wards?: WardItem[];
};

type DistrictWithWards = DistrictItem & {
  wards?: WardItem[];
};

let cachedProvinces: ProvinceItem[] | null = null;
const cachedDistricts = new Map<number, DistrictItem[]>();
const cachedWards = new Map<number, WardItem[]>();

export async function fetchProvincesVn(): Promise<ProvinceItem[]> {
  if (cachedProvinces) {
    return cachedProvinces;
  }
  const { data } = await provincesClient.get<ProvinceItem[]>("/p/");
  cachedProvinces = data;
  return data;
}

export async function fetchDistrictsByProvinceCode(provinceCode: number): Promise<DistrictItem[]> {
  if (cachedDistricts.has(provinceCode)) {
    return cachedDistricts.get(provinceCode) || [];
  }
  const { data } = await provincesClient.get<ProvinceWithDistricts>(`/p/${provinceCode}`, {
    params: { depth: 2 },
  });
  const districts = data.districts ?? [];
  cachedDistricts.set(provinceCode, districts);
  return districts;
}

export async function fetchWardsByProvinceCode(provinceCode: number): Promise<WardItem[]> {
  if (cachedWards.has(provinceCode)) {
    return cachedWards.get(provinceCode) || [];
  }
  const { data } = await provincesClient.get<ProvinceWithDistricts>(`/p/${provinceCode}`, {
    params: { depth: 2 },
  });
  const wards = data.wards ?? [];
  cachedWards.set(provinceCode, wards);
  return wards;
}

export async function fetchWardsByDistrictCode(districtCode: number): Promise<WardItem[]> {
  if (cachedWards.has(districtCode)) {
    return cachedWards.get(districtCode) || [];
  }
  const { data } = await provincesClient.get<DistrictWithWards>(`/d/${districtCode}`, {
    params: { depth: 2 },
  });
  const wards = data.wards ?? [];
  cachedWards.set(districtCode, wards);
  return wards;
}
