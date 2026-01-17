import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
    // Mode kompatibilitas untuk Tailwind 4
    content: [
        "./app/components/**/*.{js,vue,ts}",
        "./app/layouts/**/*.vue",
        "./app/pages/**/*.vue",
        "./app/plugins/**/*.{js,ts}",
        "./app/app.vue",
        "./app/error.vue"
    ],
    theme: {
        extend: {
            // Nuxt UI membutuhkan colors extend agar tidak rusak
            colors: {
                gray: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                    950: '#030712',
                }
            }
        },
    },
}