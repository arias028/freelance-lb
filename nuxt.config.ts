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
        lang: 'id',
        translate: 'no'
      },
      meta: [
        { name: 'google', content: 'notranslate' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' }, // <--- Manual Link
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/pwa-192x192.png' } // Optional: for iPhone
      ],
      // FOUC Fix: Add 'loading' class to body by default
      bodyAttrs: {
        class: 'loading'
      },
      // Critical CSS for Immediate Loading State
      style: [
        {
          innerHTML: `
            /* Hide Vue app content until hydration */
            body.loading #__nuxt { opacity: 0; transition: opacity 0.5s ease-in-out; }
            
            /* Fullscreen Loader Background */
            body.loading::before {
              content: "";
              position: fixed;
              inset: 0;
              z-index: 999999;
              background-color: #F1F5F9; /* Soft Cloud */
              background-image: radial-gradient(#CBD5E1 1px, transparent 1px);
              background-size: 24px 24px;
            }

            /* Simple & Elegant Spinner */
            body.loading::after {
              content: "";
              position: fixed;
              top: 50%;
              left: 50%;
              z-index: 9999999;
              width: 48px;
              height: 48px;
              margin: -24px 0 0 -24px;
              border: 3px solid rgba(22, 101, 52, 0.1);
              border-top-color: #166534; /* Forest Green */
              border-radius: 50%;
              animation: initial-spin 0.8s linear infinite;
            }

            @keyframes initial-spin {
              to { transform: rotate(360deg); }
            }
          `
        }
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
    filename: 'manifest.webmanifest',
    registerType: 'autoUpdate',
    manifest: {
      name: 'Freelance LB',
      short_name: 'Freelance',
      description: 'Portal Freelance PT. BINA',
      theme_color: '#0F172A',
      background_color: '#F1F5F9',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      screenshots: [
        {
          src: '/screenshot-mobile.png', // Anda harus upload gambar screenshot tampilan HP (sekitar 1080x1920) ke folder public
          sizes: '1080x1920',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Tampilan Mobile'
        },
        {
          src: '/screenshot-desktop.png', // Upload gambar screenshot desktop (sekitar 1920x1080) ke folder public
          sizes: '1920x1080',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Tampilan Desktop'
        }
      ]
    },
    workbox: {
      // 1. Tell it that / is effectively index.html
      navigateFallback: '/',

      // 2. Don't try to cache API calls or dynamic routes
      navigateFallbackDenylist: [/^\/api\//],

      // 3. Cache these file types
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],

      // 4. IMPORTANT: Fix the "Precache" errors
      // This stops it from trying to find /login.html
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api'),
          handler: 'NetworkFirst'
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
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