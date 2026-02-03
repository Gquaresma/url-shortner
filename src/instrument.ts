import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: 'https://1f81baf801b9d8f03d67bc41b6b09bcf@o4510823053787136.ingest.us.sentry.io/4510823055425536',

  enableLogs: true,

  sendDefaultPii: true,

  tracesSampleRate: 1.0,

  profilesSampleRate: 1.0,

  environment: process.env.NODE_ENV || 'development',

  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
});
