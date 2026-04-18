const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["postgres", "bcrypt"],
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  // Upload source maps only in production CI
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  // Skip upload when DSN not set (local dev without Sentry)
  dryRun: !process.env.SENTRY_DSN,
});
