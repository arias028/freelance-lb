/**
 * Composable untuk Custom Toast System
 * Alternatif untuk useToast() dari Nuxt UI yang tidak berfungsi
 */

interface ToastOptions {
    title: string
    description: string
    color?: 'success' | 'error' | 'warning' | 'info'
    duration?: number
}

interface ToastItem {
    id: string
    title: string
    description: string
    color: 'success' | 'error' | 'warning' | 'info'
    visible: boolean
}

export function useCustomToast() {
    // Mengakses state yang sama dengan app.vue
    const toasts = useState<ToastItem[]>('custom-toasts', () => [])

    // Fungsi untuk menambahkan toast baru
    function add(options: ToastOptions) {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const toast: ToastItem = {
            id,
            title: options.title,
            description: options.description,
            color: options.color || 'info',
            visible: true
        }

        toasts.value = [...toasts.value, toast]

        // Auto-remove setelah duration (default 5 detik)
        setTimeout(() => {
            remove(id)
        }, options.duration || 5000)

        return toast
    }

    // Fungsi untuk menghapus toast
    function remove(id: string) {
        const index = toasts.value.findIndex(t => t.id === id)
        if (index !== -1 && toasts.value[index]) {
            // Fade out first
            toasts.value[index]!.visible = false
            // Kemudian hapus dari array
            setTimeout(() => {
                toasts.value = toasts.value.filter(t => t.id !== id)
            }, 300)
        }
    }

    // Fungsi untuk menghapus semua toast
    function clear() {
        toasts.value = []
    }

    return {
        toasts,
        add,
        remove,
        clear
    }
}
