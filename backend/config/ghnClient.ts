import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GHN_API_URL = process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api';
const GHN_API_TOKEN = process.env.GHN_API_TOKEN || '';
const GHN_SHOP_ID = process.env.GHN_SHOP_ID || '';

export const ghnClient = axios.create({
  baseURL: GHN_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Token': GHN_API_TOKEN,
    'ShopId': GHN_SHOP_ID,
  },
});

// Optional: Add interceptors for logging or error handling
ghnClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('GHN API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
