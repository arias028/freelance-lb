// nuxt.config.ts
export default defineNuxtConfig({
  // Enable Nuxt 4 directory structure (app/ folder)
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2026-01-13',

  // Enable Nuxt UI
  modules: ['@nuxt/ui'],

  // Configuration for your API Keys
  runtimeConfig: {
    // Private keys (Server-side only) - Keeps your API Key safe!
    apiKey: '',
    apiUrl: '',

    // Public keys (Exposed to browser)
    public: {
      // Put things here only if the browser NEEDS to see them
      siteName: 'Employee Dashboard'
    }
  },

  // Color mode (Light/Dark)
  colorMode: {
    preference: 'system' // or 'light' or 'dark'
  }
})