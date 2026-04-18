import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event) {
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>;
        for (const key of ["email", "phone", "password", "token"]) {
          if (key in data) data[key] = "[Filtered]";
        }
      }
      // Strip user PII from user context
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
}
