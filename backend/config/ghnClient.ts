import axios from 'axios';
import dotenv from 'dotenv';
import StoreSettings from '../modules/admin/models/StoreSettings.js';

dotenv.config();

const DEFAULT_GHN_API_URL = 'https://dev-online-gateway.ghn.vn/shiip/public-api';

export const ghnClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

ghnClient.interceptors.request.use(
  async (config) => {
    try {
      const settings = await StoreSettings.findOne({ key: 'default' });
      const apiToken = settings?.ghnApiToken || process.env.GHN_API_TOKEN || '';
      const shopId = settings?.ghnShopId || process.env.GHN_SHOP_ID || '';
      const apiUrl = settings?.ghnApiUrl || process.env.GHN_API_URL || DEFAULT_GHN_API_URL;

      config.baseURL = apiUrl;
      config.headers['Token'] = apiToken;
      config.headers['ShopId'] = shopId;
    } catch (err) {
      console.error('Error in GHN request interceptor:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Add interceptors for logging or error handling
ghnClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('GHN API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
