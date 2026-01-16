export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2026-01-13',

  modules: ['@nuxt/ui'],

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
  },


})