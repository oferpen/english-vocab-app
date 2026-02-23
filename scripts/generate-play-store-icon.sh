#!/bin/bash

# Generate Google Play Store Icon (512x512) from existing favicon
# Requirements: ImageMagick (install with: brew install imagemagick)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FAVICON="$PROJECT_ROOT/public/favicon.png"
OUTPUT="$PROJECT_ROOT/google-play-icon-512x512.png"

if [ ! -f "$FAVICON" ]; then
    echo "❌ Error: favicon.png not found at $FAVICON"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null && ! command -v magick &> /dev/null; then
    echo "❌ Error: ImageMagick not found"
    echo "Install it with: brew install imagemagick"
    echo ""
    echo "Alternatively, use an online tool:"
    echo "1. Go to https://www.iloveimg.com/resize-image"
    echo "2. Upload $FAVICON"
    echo "3. Resize to 512x512"
    echo "4. Add white background if needed"
    echo "5. Download as PNG"
    exit 1
fi

echo "📱 Generating Google Play Store icon..."
echo "Input: $FAVICON"
echo "Output: $OUTPUT"

# Use 'magick' (ImageMagick 7) or 'convert' (ImageMagick 6)
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
else
    CONVERT_CMD="convert"
fi

# Resize to 512x512, add white background, remove transparency
$CONVERT_CMD "$FAVICON" \
    -resize 512x512 \
    -background white \
    -gravity center \
    -extent 512x512 \
    -alpha remove \
    -alpha off \
    "$OUTPUT"

if [ -f "$OUTPUT" ]; then
    SIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)
    SIZE_KB=$((SIZE / 1024))
    
    echo "✅ Success! Icon generated: $OUTPUT"
    echo "   Size: ${SIZE_KB}KB"
    echo ""
    echo "📤 Next steps:"
    echo "   1. Review the icon: open $OUTPUT"
    echo "   2. Upload to Google Play Console → Store presence → App icon"
    echo "   3. If background color needs to change, edit the script (line 33: -background white)"
else
    echo "❌ Error: Failed to generate icon"
    exit 1
fi
