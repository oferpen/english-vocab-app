#!/usr/bin/env node

/**
 * Generate Google Play Store Icon (512x512) from favicon
 * Requires: sharp (npm install sharp)
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FAVICON_PATH = path.join(PROJECT_ROOT, 'public', 'favicon.png');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'google-play-icon-512x512.png');

async function generateIcon() {
  try {
    // Check if sharp is available
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.error('❌ Error: sharp package not found');
      console.error('Install it with: npm install sharp');
      process.exit(1);
    }

    // Check if favicon exists
    if (!fs.existsSync(FAVICON_PATH)) {
      console.error(`❌ Error: favicon.png not found at ${FAVICON_PATH}`);
      process.exit(1);
    }

    console.log('📱 Generating Google Play Store icon...');
    console.log(`Input: ${FAVICON_PATH}`);
    console.log(`Output: ${OUTPUT_PATH}`);

    // Read favicon
    const image = sharp(FAVICON_PATH);
    const metadata = await image.metadata();
    
    console.log(`Current size: ${metadata.width}x${metadata.height}`);

    // Resize to 512x512 with white background
    await image
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })
      .png()
      .toFile(OUTPUT_PATH);

    // Get file size
    const stats = fs.statSync(OUTPUT_PATH);
    const sizeKB = Math.round(stats.size / 1024);

    console.log('✅ Success! Icon generated:', OUTPUT_PATH);
    console.log(`   Size: ${sizeKB}KB`);
    console.log('');
    console.log('📤 Next steps:');
    console.log('   1. Review the icon: open', OUTPUT_PATH);
    console.log('   2. Upload to Google Play Console → Store presence → App icon');
    console.log('   3. If you want a different background color, edit this script');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateIcon();
