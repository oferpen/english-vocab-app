# 📱 Google Play Store Icon Guide

## Requirements

Google Play Store requires:
- **512x512 pixels** PNG image
- **Square format** (1:1 aspect ratio)
- **No transparency** (solid background)
- **High quality** - should look good at small sizes too
- **File size**: Under 1MB (usually 50-200KB)

## Current Icons

Your app currently uses:
- `public/favicon.png` - Used for web favicon
- `public/apple-touch-icon.png` - Used for iOS

## Creating the Google Play Icon

### Option 1: Use Existing Favicon (If it's 512x512)

If your `favicon.png` is already 512x512 and has no transparency:

1. Copy it to create the Play Store icon:
   ```bash
   cp public/favicon.png google-play-icon-512x512.png
   ```

2. Upload this file to Google Play Console when publishing

### Option 2: Generate from Existing Icon

If your favicon is smaller or needs adjustments:

**Using ImageMagick (if installed):**
```bash
# Resize to 512x512 (maintains aspect ratio, adds padding if needed)
convert public/favicon.png -resize 512x512 -background white -gravity center -extent 512x512 google-play-icon-512x512.png

# Or with transparent background made white
convert public/favicon.png -resize 512x512 -background white -alpha remove -alpha off google-play-icon-512x512.png
```

**Using online tools:**
1. Go to https://www.iloveimg.com/resize-image or https://www.resizepixel.com/
2. Upload your `favicon.png`
3. Resize to 512x512 pixels
4. If it has transparency, add a solid background color (white or your brand color)
5. Download as PNG

**Using design tools:**
- **Figma**: Import favicon → Resize canvas to 512x512 → Export as PNG
- **Canva**: Create 512x512 design → Add your icon → Export as PNG
- **Photoshop/GIMP**: Open favicon → Resize to 512x512 → Add background if needed → Export as PNG

### Option 3: Create New Icon

If you want to create a new icon specifically for Google Play:

1. **Design Requirements:**
   - 512x512 pixels
   - Square format
   - Your app logo/icon centered
   - Solid background color (match your brand - blue #3b82f6?)
   - No text (Google Play shows app name separately)
   - Simple, recognizable at small sizes

2. **Design Tips:**
   - Use your owl emoji (🦉) or logo
   - Keep it simple - details get lost at small sizes
   - Use high contrast colors
   - Leave some padding around edges (safe zone)

## Icon Specifications Summary

| Platform | Size | Format | Transparency | Location |
|----------|------|--------|--------------|----------|
| **Google Play Store** | 512x512 | PNG | No | Upload to Play Console |
| **Android App** | Multiple sizes | PNG | Yes | `android/app/src/main/res/mipmap-*/` |
| **iOS App** | 180x180 | PNG | Yes | `ios/App/App/Assets.xcassets/AppIcon.appiconset/` |
| **Web Favicon** | 192x192 | PNG | Yes | `public/favicon.png` |
| **Web Apple Touch** | 180x180 | PNG | Yes | `public/apple-touch-icon.png` |

## Next Steps

1. **Create the 512x512 icon** using one of the methods above
2. **Save it** as `google-play-icon-512x512.png` in your project root (or keep it separate)
3. **When publishing to Google Play:**
   - Go to Google Play Console
   - Navigate to your app → Store presence → Main store listing
   - Upload the 512x512 icon under "App icon"
   - Google Play will automatically generate smaller sizes

## Quick Command to Generate Icon (Automated)

If you have ImageMagick installed:

```bash
# Generate 512x512 icon from your favicon
./scripts/generate-play-store-icon.sh
```

This will create `google-play-icon-512x512.png` in your project root.

## Quick Command to Check Current Icon Size

```bash
# Check dimensions of current favicon
file public/favicon.png
# Or
identify public/favicon.png  # (if ImageMagick installed)
```

## Recommended Icon Design

Based on your app:
- **Icon**: Owl emoji (🦉) or your app logo
- **Background**: Blue (#3b82f6) to match your theme
- **Style**: Simple, friendly, educational
- **Colors**: Blue background, white/light icon

---

**Note**: The Google Play icon is separate from your app's launcher icon. The launcher icon is configured in `android/app/src/main/res/mipmap-*/` and is generated automatically by Capacitor from your web icons.
