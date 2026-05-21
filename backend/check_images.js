import fs from 'fs';

// Read seed_catalog.js content
const filePath = './seed_catalog.js';
const content = fs.readFileSync(filePath, 'utf-8');

// Find the FLOWER_IMAGES block
const blockMatch = content.match(/const FLOWER_IMAGES = \{([\s\S]*?)\};/);
if (!blockMatch) {
  console.error("Could not find FLOWER_IMAGES definition!");
  process.exit(1);
}

const blockText = blockMatch[1];

// Parse category keys and their URLs
const categories = {};
let currentCategory = null;

// Split lines
const lines = blockText.split('\n');
for (const line of lines) {
  // Check for category definition (e.g., "red_rose: [")
  const catMatch = line.match(/^\s*([a-zA-Z_0-9]+):\s*\[/);
  if (catMatch) {
    currentCategory = catMatch[1];
    categories[currentCategory] = [];
    continue;
  }

  // Check for URL in the line
  if (currentCategory) {
    const urlMatch = line.match(/'(https:\/\/images\.unsplash\.com\/[^']+)'/);
    if (urlMatch) {
      categories[currentCategory].push(urlMatch[1]);
    }
  }
}

console.log(`Extracted ${Object.keys(categories).length} categories of images.`);

async function checkUrls() {
  const allResults = [];
  
  for (const [category, urls] of Object.entries(categories)) {
    console.log(`Checking category: ${category} (${urls.length} URLs)...`);
    for (let idx = 0; idx < urls.length; idx++) {
      const url = urls[idx];
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`  [OK] ${category}[${idx}]: ${url}`);
          allResults.push({ category, idx, url, status: 'OK' });
        } else {
          console.log(`  [BROKEN] ${category}[${idx}]: ${url} - Status: ${response.status}`);
          allResults.push({ category, idx, url, status: 'BROKEN', statusCode: response.status });
        }
      } catch (err) {
        console.log(`  [ERROR] ${category}[${idx}]: ${url} - ${err.message}`);
        allResults.push({ category, idx, url, status: 'ERROR', message: err.message });
      }
    }
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  const broken = allResults.filter(r => r.status !== 'OK');
  console.log(`Total URLs checked: ${allResults.length}`);
  console.log(`Working URLs: ${allResults.length - broken.length}`);
  console.log(`Broken/Error URLs: ${broken.length}`);
  
  if (broken.length > 0) {
    console.log('\nList of broken/error URLs:');
    broken.forEach(r => {
      console.log(`- ${r.category}[${r.idx}]: ${r.url} (${r.status}${r.statusCode ? ' ' + r.statusCode : ''})`);
    });
  }
}

checkUrls();
