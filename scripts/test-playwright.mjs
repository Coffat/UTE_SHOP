import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  if (!fs.existsSync('./scratch')) {
    fs.mkdirSync('./scratch');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('request', req => console.log('REQ:', req.method(), req.url()));
  page.on('response', res => console.log('RES:', res.status(), res.url()));

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[name="email"]', 'admin@uteshop.vn');
  await page.fill('input[name="password"]', '123456');
  
  console.log('Submitting login...');
  await page.click('button[type="submit"]');
  
  console.log('Waiting 5 seconds...');
  await page.waitForTimeout(5000);
  
  console.log('Current URL after login:', page.url());
  await page.screenshot({ path: './scratch/login-result.png', fullPage: true });

  console.log('Navigating to admin dashboard...');
  await page.goto('http://localhost:5173/admin/dashboard');
  
  console.log('Waiting 5 seconds on dashboard...');
  await page.waitForTimeout(5000);
  
  console.log('Current URL on dashboard:', page.url());
  await page.screenshot({ path: './scratch/dashboard-result.png', fullPage: true });

  await browser.close();
}

run().catch(console.error);
