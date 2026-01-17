import type { Config } from 'tailwindcss'

export default <Config>{
    content: [
        './app/**/*.{vue,js,ts,jsx,tsx}',
        './app/app.vue',
        './app/error.vue'
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
