# 🔍 Sentry Setup Guide

## ✅ What's Been Set Up

1. **Sentry package installed** (`@sentry/nextjs`)
2. **Configuration files created:**
   - `sentry.client.config.ts` - Client-side error tracking
   - `sentry.server.config.ts` - Server-side error tracking
   - `sentry.edge.config.ts` - Edge runtime error tracking
   - `instrumentation.ts` - Runtime instrumentation
   - `components/SentryProvider.tsx` - Client-side Sentry initialization
3. **Next.js config updated** with Sentry webpack plugin
4. **App layout updated** to include SentryProvider
5. **CSP headers updated** to allow Sentry connections
6. **Build verified** - App builds successfully ✅
7. **DSN configured** in `.env.local` ✅

## 📋 Environment Variables

### Local Development (`.env.local`)
✅ Already configured:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://4099cb1f231991d2c0015b80cd5ea072@o4510920248721408.ingest.de.sentry.io/4510920252850256
SENTRY_ORG=o4510920248721408
SENTRY_PROJECT=4510920252850256
```

### Vercel Production

**⚠️ IMPORTANT:** Add these to Vercel Environment Variables:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings** → **Environment Variables**
3. Add these three variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SENTRY_DSN` | `https://4099cb1f231991d2c0015b80cd5ea072@o4510920248721408.ingest.de.sentry.io/4510920252850256` |
   | `SENTRY_ORG` | `o4510920248721408` |
   | `SENTRY_PROJECT` | `4510920252850256` |

4. Select **Production**, **Preview**, and **Development** environments
5. Click **Save**
6. **Redeploy** your app for changes to take effect

## 🧪 Test Sentry

### Option 1: Test Error Page
Create a test page to trigger an error:

```typescript
// app/test-sentry/page.tsx
'use client';

export default function TestSentry() {
  const triggerError = () => {
    throw new Error('Test Sentry error - this is intentional!');
  };

  return (
    <div className="p-8">
      <button onClick={triggerError} className="bg-red-500 text-white px-4 py-2 rounded">
        Trigger Test Error
      </button>
    </div>
  );
}
```

Visit `/test-sentry` and click the button. Check your Sentry dashboard within seconds!

### Option 2: Test in Console
Open browser console and run:
```javascript
throw new Error('Test Sentry error');
```

## 🎯 Features Enabled

- ✅ **Error Tracking** - Automatic error capture (client & server)
- ✅ **Performance Monitoring** - Track slow API routes and pages
- ✅ **Session Replay** - Record user sessions when errors occur (10% of sessions, 100% on errors)
- ✅ **Source Maps** - See original source code in error stack traces
- ✅ **User Context** - See which users encountered errors
- ✅ **Release Tracking** - Track errors by deployment version

## 🔒 Privacy & Security

- ✅ Errors are **not sent in development** mode (only in production)
- ✅ Sensitive data (query params) is filtered out
- ✅ Session replay masks all text and media
- ✅ Only 10% of transactions sampled in production (to reduce costs)
- ✅ DSN is safe to expose (it's public in your client-side code)

## 📊 Monitoring

After setup, you can:
- View errors in real-time at [sentry.io](https://sentry.io)
- Get email/Slack alerts for new errors
- See error trends and patterns
- Track error resolution
- Monitor performance issues

## 🚀 Production Deployment

After adding environment variables to Vercel:
1. Redeploy your app
2. Sentry will automatically start tracking errors
3. Check your Sentry dashboard: https://sentry.io/organizations/o4510920248721408/projects/4510920252850256/

## 💡 Tips

- **Free tier**: 5,000 errors/month (plenty for most apps)
- **Alerts**: Set up alerts for critical errors in Sentry dashboard
- **Releases**: Tag deployments to track which version has errors
- **Performance**: Monitor slow API routes and pages
- **Filtering**: Use Sentry's filtering to focus on important errors

## 🔍 View Your Sentry Dashboard

Your Sentry project: https://sentry.io/organizations/o4510920248721408/projects/4510920252850256/

---

**Need help?** Check [Sentry Next.js docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
