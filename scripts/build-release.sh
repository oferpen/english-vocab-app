#!/bin/bash

# Build script for Google Play Store release
# This script builds the Android App Bundle (AAB) for Google Play Store submission

set -e  # Exit on error

echo "🚀 Building English Path for Google Play Store..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

# Step 1: Build Next.js app
echo -e "${YELLOW}📦 Step 1: Building Next.js app...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Next.js build complete${NC}"
echo ""

# Step 2: Sync with Capacitor
echo -e "${YELLOW}🔄 Step 2: Syncing with Capacitor...${NC}"
npx cap sync android

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Capacitor sync failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Capacitor sync complete${NC}"
echo ""

# Step 3: Check for signing key
if [ ! -f "android/key.properties" ]; then
    echo -e "${YELLOW}⚠️  Warning: android/key.properties not found${NC}"
    echo -e "${YELLOW}   You need to set up signing before building release${NC}"
    echo ""
    echo "To create signing key:"
    echo "  keytool -genkey -v -keystore english-path-release-key.jks \\"
    echo "    -keyalg RSA -keysize 2048 -validity 10000 \\"
    echo "    -alias english-path-key"
    echo ""
    echo "Then create android/key.properties with:"
    echo "  storeFile=../english-path-release-key.jks"
    echo "  storePassword=YOUR_STORE_PASSWORD"
    echo "  keyAlias=english-path-key"
    echo "  keyPassword=YOUR_KEY_PASSWORD"
    echo ""
    read -p "Continue with debug build? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 4: Build Android App Bundle
echo -e "${YELLOW}📱 Step 3: Building Android App Bundle (AAB)...${NC}"
cd android

# Clean previous builds
./gradlew clean

# Build release bundle
./gradlew bundleRelease

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ AAB build failed!${NC}"
    cd ..
    exit 1
fi

cd ..

# Step 5: Show output location
AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"

if [ -f "$AAB_PATH" ]; then
    AAB_SIZE=$(du -h "$AAB_PATH" | cut -f1)
    echo ""
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo ""
    echo "📦 AAB Location: $AAB_PATH"
    echo "📊 Size: $AAB_SIZE"
    echo ""
    echo "Next steps:"
    echo "1. Upload $AAB_PATH to Google Play Console"
    echo "2. Complete store listing information"
    echo "3. Submit for review"
    echo ""
    echo "See GOOGLE_PLAY_STORE_GUIDE.md for detailed instructions"
else
    echo -e "${RED}❌ AAB file not found at expected location${NC}"
    exit 1
fi
