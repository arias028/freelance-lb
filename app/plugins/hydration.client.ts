/**
 * Plugin untuk menangani hydration loading screen
 * Mencegah user berinteraksi sebelum Vue selesai hydrating
 */
export default defineNuxtPlugin((nuxtApp) => {
    // State untuk tracking hydration
    const isHydrating = useState('is-hydrating', () => true)

    // Saat app sudah siap (hydration selesai)
    nuxtApp.hook('app:suspense:resolve', () => {
        // Delay sedikit untuk memastikan semua komponen sudah di-mount
        setTimeout(() => {
            isHydrating.value = false
        }, 100)
    })

    // Provide state untuk digunakan di komponen
    return {
        provide: {
            isHydrating
        }
    }
})
