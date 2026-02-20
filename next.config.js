// Temporarily disabled Sentry to fix production issue
// const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  // Temporarily disabled instrumentationHook
  // experimental: {
  //   instrumentationHook: true,
  // },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    // Check for Vercel preview environment
    const isPreview = process.env.VERCEL_ENV === 'preview';
    const isVercel = !!process.env.VERCEL; // VERCEL is set to '1' on all Vercel deployments
    // Allow Vercel live feedback - Vercel only injects this script in preview deployments anyway
    // Safe to allow since it won't be present in production
    const allowVercelLive = isDev || isPreview || isVercel;
    // Allow unsafe-eval only in development/preview (Next.js Turbopack needs it for hot reload)
    const allowUnsafeEval = isDev || isPreview;
    
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Allow unsafe-eval only in development/preview (Next.js Turbopack hot reload)
              // Production CSP remains strict without unsafe-eval
              // Allow vercel.live for preview deployments (Vercel only injects this in preview, not production)
              `script-src 'self' 'unsafe-inline'${allowUnsafeEval ? " 'unsafe-eval'" : ''} https://*.sentry.io https://vercel.live`,
              "style-src 'self' 'unsafe-inline'", // Tailwind uses inline styles
              "img-src 'self' data: https: *.googleusercontent.com",
              "font-src 'self' data:",
              `connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://*.sentry.io https://vercel.live wss://vercel.live`,
              "frame-src 'self' https://accounts.google.com",
              "worker-src 'self'", // Allow service workers
            ].join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in production
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableClientWebpackPlugin: false,
  disableServerWebpackPlugin: false,
  // Automatically annotate React components to show their props in Sentry
  reactComponentAnnotation: {
    enabled: true,
  },
};

// Temporarily disabled Sentry wrapper to fix production issue
module.exports = nextConfig;

// Re-enable Sentry later once production is stable:
// if (process.env.SENTRY_ORG && process.env.SENTRY_PROJECT) {
//   module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
// } else {
//   module.exports = nextConfig;
// }
