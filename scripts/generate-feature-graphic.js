#!/usr/bin/env node

/**
 * Generate Google Play Store Feature Graphic (1024x500)
 * Requirements: PNG or JPEG, up to 15 MB, 1024px by 500px
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FAVICON_PATH = path.join(PROJECT_ROOT, 'public', 'favicon.png');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'google-play-feature-graphic-1024x500.png');

async function generateFeatureGraphic() {
  try {
    const sharp = require('sharp');

    // Check if favicon exists
    if (!fs.existsSync(FAVICON_PATH)) {
      console.error(`❌ Error: favicon.png not found at ${FAVICON_PATH}`);
      process.exit(1);
    }

    console.log('🎨 Generating Google Play Store feature graphic...');
    console.log(`Input: ${FAVICON_PATH}`);
    console.log(`Output: ${OUTPUT_PATH}`);

    // Brand colors
    const BRAND_BLUE = { r: 59, g: 130, b: 246 }; // #3b82f6
    const WHITE = { r: 255, g: 255, b: 255 };
    const DARK_BLUE = { r: 37, g: 99, b: 235 }; // Darker blue for gradient

    // Create SVG for the feature graphic
    const svg = `
      <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
        <!-- Background gradient -->
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(59,130,246);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(37,99,235);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1024" height="500" fill="url(#bgGradient)"/>
        
        <!-- Decorative circles -->
        <circle cx="850" cy="100" r="80" fill="white" opacity="0.1"/>
        <circle cx="900" cy="400" r="60" fill="white" opacity="0.1"/>
        <circle cx="100" cy="400" r="50" fill="white" opacity="0.1"/>
        
        <!-- Main content area -->
        <g transform="translate(512, 250)">
          <!-- App icon placeholder (will be replaced with actual icon) -->
          <circle cx="0" cy="-50" r="80" fill="white" opacity="0.2"/>
          
          <!-- Title text area -->
          <text x="0" y="60" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">
            EnglishPath
          </text>
          <text x="0" y="110" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.9">
            הרפתקת האנגלית שלכם!
          </text>
          <text x="0" y="160" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.8">
            לימוד אנגלית לילדים בדרך המהנה ביותר
          </text>
        </g>
      </svg>
    `;

    // Create base image from SVG
    const baseImage = sharp(Buffer.from(svg))
      .png();

    // Load and resize favicon
    const favicon = await sharp(FAVICON_PATH)
      .resize(200, 200, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();

    // Composite: Add favicon on top
    const finalImage = await baseImage
      .composite([
        {
          input: favicon,
          top: 100, // Center vertically: (500 - 200) / 2 = 150, but we want it higher
          left: 412, // Center horizontally: (1024 - 200) / 2 = 412
        }
      ])
      .png()
      .toFile(OUTPUT_PATH);

    // Get file size
    const stats = fs.statSync(OUTPUT_PATH);
    const sizeKB = Math.round(stats.size / 1024);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('✅ Success! Feature graphic generated:', OUTPUT_PATH);
    console.log(`   Size: ${sizeKB}KB (${sizeMB}MB)`);
    console.log(`   Dimensions: 1024x500px`);
    console.log('');
    console.log('📤 Next steps:');
    console.log('   1. Review the graphic: open', OUTPUT_PATH);
    console.log('   2. Upload to Google Play Console → Store presence → Feature graphic');
    console.log('   3. Edit the script if you want to customize colors or layout');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('sharp')) {
      console.error('Install sharp with: npm install sharp');
    }
    process.exit(1);
  }
}

generateFeatureGraphic();
