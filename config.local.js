// Hot Wheels Velocity - Local Development Configuration

module.exports = {
  // Server Configuration
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Development Settings
  devMode: process.env.DEV_MODE !== 'false',
  debug: process.env.DEBUG !== 'false',

  // API Configuration (if needed in future)
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.API_TIMEOUT) || 5000
  },

  // Feature Flags
  features: {
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    pwa: process.env.ENABLE_PWA !== 'false',
    view360: process.env.ENABLE_360_VIEW !== 'false'
  },

  // Image Configuration
  images: {
    fallbackEnabled: process.env.IMAGE_FALLBACK_ENABLED !== 'false',
    lazyLoading: process.env.IMAGE_LAZY_LOADING !== 'false'
  },

  // Build Configuration
  build: {
    tailwindPurge: process.env.TAILWIND_PURGE !== 'false',
    cssMinify: process.env.CSS_MINIFY === 'true'
  }
};
