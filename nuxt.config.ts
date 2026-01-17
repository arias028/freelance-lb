// nuxt.config.ts
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2026-01-13',

  // Konfigurasi head untuk mencegah Google Translate popup
  app: {
    head: {
      htmlAttrs: {
        lang: 'id', // Bahasa Indonesia
        translate: 'no' // Mencegah terjemahan otomatis
      },
      meta: [
        { name: 'google', content: 'notranslate' } // Mencegah Google Translate suggestion
      ]
    }
  },

  modules: ['@nuxt/ui', '@nuxt/image', '@vite-pwa/nuxt'],

  image: {
    // Whitelist your S3 bucket domain here
    domains: ['bina57.s3.ap-southeast-3.amazonaws.com'],

    // Optional: Set default quality
    quality: 80,
    format: ['webp']
  },

  // Konfigurasi PWA untuk install aplikasi
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Freelance Portal',
      short_name: 'Freelance',
      description: 'Portal Freelance PT. BINA',
      theme_color: '#1e40af',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: 'https://bina57.s3.ap-southeast-3.amazonaws.com/logo/freelance.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'https://bina57.s3.ap-southeast-3.amazonaws.com/logo/freelance.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      // globPatterns dikonfigurasi otomatis saat production build
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true,
      type: 'module',
      suppressWarnings: true // Suppress warnings di development mode
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    awsAccessKeyId: process.env.AWS_LASKARBUAH_HRD_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_LASKARBUAH_HRD_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_LASKARBUAH_HRD_REGION,
    awsBucket: process.env.AWS_LASKARBUAH_HRD_BUCKET,

    public: {
      siteName: 'Freelance Laskarbuah',
      appId: process.env.NUXT_PUBLIC_APP_ID || '16',
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      headerKey: process.env.NUXT_PUBLIC_HEADER_KEY,
      apiKey: process.env.NUXT_PUBLIC_API_KEY
    }
  },

  colorMode: {
    preference: 'system'
  }
})