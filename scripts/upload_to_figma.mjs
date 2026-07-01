import fs from 'fs';
import path from 'path';

const CHANNEL = 'b7n1kgqm-72fn';
const WS_URL = 'ws://localhost:3055';
const SCREENSHOTS_DIR = './screenshots';

const screens = [
  // Guest / Storefront
  { name: '01_Guest_Login', h: 914, row: 0, col: 0 },
  { name: '02_Guest_Register', h: 1156, row: 0, col: 1 },
  { name: '03_Guest_Forgot_Password', h: 900, row: 0, col: 2 },
  { name: '04_Storefront_Home', h: 7205, row: 0, col: 3 },
  { name: '05_Storefront_Products', h: 3249, row: 0, col: 4 },
  { name: '06_Storefront_Categories', h: 2228, row: 0, col: 5 },
  { name: '07_Storefront_Product_Detail', h: 2650, row: 0, col: 6 },
  { name: '08_Storefront_Category_Detail', h: 2343, row: 0, col: 7 },
  { name: '09_Storefront_Cart', h: 1993, row: 0, col: 8 },
  { name: '10_Storefront_Checkout', h: 1428, row: 0, col: 9 },
  { name: '11_Storefront_Blog_List', h: 1991, row: 0, col: 10 },
  { name: '12_Storefront_Support', h: 1731, row: 0, col: 11 },
  { name: '13_Storefront_Profile_Overview', h: 1621, row: 0, col: 12 },
  { name: '14_Storefront_Profile_Orders', h: 2843, row: 0, col: 13 },
  { name: '15_Storefront_Profile_Addresses', h: 1321, row: 0, col: 14 },
  { name: '16_Storefront_Profile_Favorites', h: 1321, row: 0, col: 15 },
  { name: '17_Storefront_Profile_Notifications', h: 1321, row: 0, col: 16 },

  // Admin
  { name: '18_Admin_Dashboard', h: 914, row: 1, col: 0 },
  { name: '19_Admin_Orders', h: 914, row: 1, col: 1 },
  { name: '20_Admin_Products', h: 914, row: 1, col: 2 },
  { name: '21_Admin_Categories', h: 914, row: 1, col: 3 },
  { name: '22_Admin_Customers', h: 914, row: 1, col: 4 },
  { name: '23_Admin_Staff', h: 914, row: 1, col: 5 },
  { name: '24_Admin_Reports', h: 914, row: 1, col: 6 },
  { name: '25_Admin_Settings', h: 914, row: 1, col: 7 },
  { name: '26_Admin_Blogs', h: 914, row: 1, col: 8 },
  { name: '27_Admin_Reviews', h: 914, row: 1, col: 9 },
  { name: '28_Admin_Marketing', h: 914, row: 1, col: 10 },
  { name: '29_Admin_Chat', h: 914, row: 1, col: 11 },
  { name: '30_Admin_Notifications', h: 914, row: 1, col: 12 },

  // Warehouse
  { name: '31_Warehouse_Dashboard', h: 900, row: 2, col: 0 },
  { name: '32_Warehouse_Stock', h: 900, row: 2, col: 1 },
  { name: '33_Warehouse_Import', h: 900, row: 2, col: 2 },
  { name: '34_Warehouse_Recipes', h: 900, row: 2, col: 3 },
  { name: '35_Warehouse_Transactions', h: 900, row: 2, col: 4 },

  // Store POS
  { name: '36_Store_Dashboard', h: 900, row: 3, col: 0 },
  { name: '37_Store_Orders', h: 900, row: 3, col: 1 },
  { name: '38_Store_POS_Create', h: 900, row: 3, col: 2 }
];

const FRAME_WIDTH = 1440;
const GAP_X = 200;
const GAP_Y = 400;
const ROW_HEIGHT = 8000; // Large spacing to accommodate long storefront scrolls

function getCoords(row, col) {
  const x = col * (FRAME_WIDTH + GAP_X);
  const y = row * (ROW_HEIGHT + GAP_Y);
  return { x, y };
}

async function run() {
  console.log(`Connecting to WebSocket relay at ${WS_URL}...`);
  const ws = new WebSocket(WS_URL);

  ws.onopen = async () => {
    console.log(`Connected! Joining channel: ${CHANNEL}`);
    ws.send(JSON.stringify({
      type: 'join',
      channel: CHANNEL,
      role: 'agent'
    }));

    // Wait a bit for join approval
    await new Promise(r => setTimeout(r, 1000));

    // Upload in batches of 3 to avoid exceeding ws payload size limits
    const batchSize = 3;
    for (let i = 0; i < screens.length; i += batchSize) {
      const batch = screens.slice(i, i + batchSize);
      console.log(`\n--- Uploading Batch ${Math.floor(i / batchSize) + 1} (${batch.map(s => s.name).join(', ')}) ---`);

      const nodes = batch.map(screen => {
        const filePath = path.join(SCREENSHOTS_DIR, `${screen.name}.png`);
        const base64Bytes = fs.readFileSync(filePath).toString('base64');
        const coords = getCoords(screen.row, screen.col);

        return {
          type: 'FRAME',
          name: screen.name,
          x: coords.x,
          y: coords.y,
          width: FRAME_WIDTH,
          height: screen.h,
          fills: [
            {
              type: 'IMAGE',
              scaleMode: 'FILL',
              imageBytes: base64Bytes
            }
          ]
        };
      });

      const messageId = `msg-${Date.now()}-${i}`;
      
      const payload = {
        type: 'message',
        channel: CHANNEL,
        message: {
          id: messageId,
          command: 'write_nodes',
          params: {
            nodes: nodes
          }
        }
      };

      // Set up response listener
      const responsePromise = new Promise((resolve, reject) => {
        const handler = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.message && data.message.id === messageId) {
              ws.removeEventListener('message', handler);
              if (data.message.error) {
                reject(new Error(data.message.error));
              } else {
                resolve(data.message.result);
              }
            } else if (data.type === 'error' && data.id === messageId) {
              ws.removeEventListener('message', handler);
              reject(new Error(JSON.stringify(data.message)));
            }
          } catch (e) {
            // Ignore parse errors for unrelated messages
          }
        };
        ws.addEventListener('message', handler);
      });

      ws.send(JSON.stringify(payload));
      console.log(`Sent batch upload command... waiting for Figma plugin execution.`);

      try {
        const result = await responsePromise;
        console.log(`✓ Batch completed successfully!`);
      } catch (err) {
        console.error(`✗ Batch failed:`, err.message);
      }

      // Add a small delay between batches
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\nAll batches processed! Closing connection.');
    ws.close();
  };

  ws.onerror = (err) => {
    console.error('WebSocket Error:', err);
  };

  ws.onclose = () => {
    console.log('Connection closed.');
  };
}

run();
