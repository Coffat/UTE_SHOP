import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve('./screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR);
}

const users = {
  customer: { email: 'vuthang@uteshop.vn', password: 'password123', role: 'customer' },
  admin: { email: 'admin@uteshop.vn', password: '123456', role: 'admin' },
  warehouse: { email: 'staff3@uteshop.vn', password: '123456', role: 'warehouse' },
  store: { email: 'staff5@uteshop.vn', password: '123456', role: 'store' }
};

const product_id = '6a100a4068068c52d2d1d99d';
const category_slug = 'hoa-sinh-nhat';

async function loginAndCapture(userKey, routes) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log(`🔑 Logging in as ${userKey} (${users[userKey].email})...`);
  await page.goto(`${FRONTEND_URL}/login`);
  await page.fill('input[name="email"]', users[userKey].email);
  await page.fill('input[name="password"]', users[userKey].password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForTimeout(3000); 

  for (const route of routes) {
    const url = `${FRONTEND_URL}${route.path}`;
    console.log(`📸 Capturing ${route.name} at ${url}...`);
    try {
      await page.goto(url);
      await page.waitForTimeout(3000); // Allow content to load & animation to play
      
      const filename = path.join(SCREENSHOT_DIR, `${route.name}.png`);
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`✅ Saved ${filename}`);
    } catch (e) {
      console.error(`❌ Failed to capture ${route.name}: ${e.message}`);
    }
  }

  await browser.close();
}

async function run() {
  console.log('🚀 Starting screenshot capture...');

  // 1. Guest pages
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  const guestRoutes = [
    { name: '01_Guest_Login', path: '/login' },
    { name: '02_Guest_Register', path: '/register' },
    { name: '03_Guest_Forgot_Password', path: '/forgot-password' }
  ];
  for (const route of guestRoutes) {
    console.log(`📸 Capturing Guest Page: ${route.name}...`);
    await page.goto(`${FRONTEND_URL}${route.path}`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${route.name}.png`), fullPage: true });
  }
  await browser.close();

  // 2. Customer pages
  await loginAndCapture('customer', [
    { name: '04_Storefront_Home', path: '/' },
    { name: '05_Storefront_Products', path: '/products' },
    { name: '06_Storefront_Categories', path: '/categories' },
    { name: '07_Storefront_Product_Detail', path: `/product/${product_id}` },
    { name: '08_Storefront_Category_Detail', path: `/category/${category_slug}` },
    { name: '09_Storefront_Cart', path: '/cart' },
    { name: '10_Storefront_Checkout', path: '/checkout' },
    { name: '11_Storefront_Blog_List', path: '/blogs' },
    { name: '12_Storefront_Support', path: '/support' },
    { name: '13_Storefront_Profile_Overview', path: '/user/profile/overview' },
    { name: '14_Storefront_Profile_Orders', path: '/user/profile/orders' },
    { name: '15_Storefront_Profile_Addresses', path: '/user/profile/addresses' },
    { name: '16_Storefront_Profile_Favorites', path: '/user/profile/favorites' },
    { name: '17_Storefront_Profile_Notifications', path: '/user/profile/notifications' }
  ]);

  // 3. Admin pages
  await loginAndCapture('admin', [
    { name: '18_Admin_Dashboard', path: '/admin/dashboard' },
    { name: '19_Admin_Orders', path: '/admin/orders' },
    { name: '20_Admin_Products', path: '/admin/products' },
    { name: '21_Admin_Categories', path: '/admin/categories' },
    { name: '22_Admin_Customers', path: '/admin/customers' },
    { name: '23_Admin_Staff', path: '/admin/staff' },
    { name: '24_Admin_Reports', path: '/admin/reports' },
    { name: '25_Admin_Settings', path: '/admin/settings' },
    { name: '26_Admin_Blogs', path: '/admin/blogs' },
    { name: '27_Admin_Reviews', path: '/admin/reviews' },
    { name: '28_Admin_Marketing', path: '/admin/marketing' },
    { name: '29_Admin_Chat', path: '/admin/chat' },
    { name: '30_Admin_Notifications', path: '/admin/notifications' }
  ]);

  // 4. Warehouse pages
  await loginAndCapture('warehouse', [
    { name: '31_Warehouse_Dashboard', path: '/warehouse/dashboard' },
    { name: '32_Warehouse_Stock', path: '/warehouse/stock' },
    { name: '33_Warehouse_Import', path: '/warehouse/import' },
    { name: '34_Warehouse_Recipes', path: '/warehouse/recipes' },
    { name: '35_Warehouse_Transactions', path: '/warehouse/transactions' }
  ]);

  // 5. Store pages
  await loginAndCapture('store', [
    { name: '36_Store_Dashboard', path: '/store/dashboard' },
    { name: '37_Store_Orders', path: '/store/orders' },
    { name: '38_Store_POS_Create', path: '/store/orders/create' }
  ]);

  console.log('🎉 Screenshot capture completed!');
}

run().catch(console.error);
