export async function register() {
  // Only load Sentry configs if DSN is available
  const hasDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!hasDsn) {
    return; // Skip Sentry initialization if DSN is not configured
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
