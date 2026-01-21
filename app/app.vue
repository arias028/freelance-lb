<script setup lang="ts">
/**
 * Custom Toast Composable
 * Sistem toast kustom sebagai solusi alternatif karena UApp toaster tidak berfungsi
 */

interface ToastItem {
  id: string
  title: string
  description: string
  color: 'success' | 'error' | 'warning' | 'info'
  visible: boolean
}

// State untuk hydration loading - mencegah user interaksi sebelum Vue siap
const isHydrating = useState('is-hydrating', () => true)

// Fungsi untuk mengunci scroll body saat loading aktif
function lockBodyScroll(lock: boolean) {
  if (import.meta.client) {
    document.body.style.overflow = lock ? 'hidden' : ''
    document.body.style.touchAction = lock ? 'none' : ''
  }
}

// Watch perubahan state hydrating untuk lock/unlock scroll
watch(isHydrating, (loading) => {
  lockBodyScroll(loading)
}, { immediate: true })

// Set hydration selesai saat app mounted di client
// Import composable for global PWA install prompt listener
const { setupInstallPrompt } = usePwaInstall()

onMounted(() => {
  try {
    // Lock scroll saat pertama kali mount
    lockBodyScroll(true)

    // Remove FOUC loader class
    document.body.classList.remove('loading')

    // JALANKAN DI SINI (GLOBAL)
    // Agar event install tertangkap walau user belum masuk halaman login
    setupInstallPrompt()

    // --- SESSION CHECK ---
    const { user, logout } = useAuth()
    const config = useRuntimeConfig()
    const token = useCookie('auth_token')

    if (token.value && user.value?.id) {
      $fetch(`${config.public.apiBase}/FreelanceCheckSession`, {
        method: 'POST',
        headers: {
          [config.public.headerKey]: config.public.apiKey,
          'Authorization': `Bearer ${token.value}`
        },
        body: { id_freelance: user.value.id }
      })
        .then((status) => {
          // Jika status bukan 1, berarti sesi tidak valid (force logout)
          if (status !== 1) {
            logout().then(() => {
              addToast({
                title: 'Sesi Berakhir',
                description: 'Akun Anda telah login di perangkat lain atau sesi habis. Silahkan login kembali.',
                color: 'warning',
                duration: 8000
              })
              navigateTo('/login')
            })
          }
        })
        .catch((err) => {
          console.warn('Session check failed', err)
        })
    }
  } catch (error) {
    console.error('App initialization error:', error)
  } finally {
    // Delay sedikit untuk memastikan semua komponen sudah di-mount
    // Pastikan overlay hilang apapun yang terjadi
    setTimeout(() => {
      isHydrating.value = false
    }, 150)
  }
})

// State reaktif untuk menyimpan toast
const toasts = useState<ToastItem[]>('custom-toasts', () => [])

// Fungsi untuk menambahkan toast baru (maksimum 1 toast, menggantikan yang sebelumnya)
function addToast(options: { title: string; description: string; color?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) {
  // Clear semua toast yang ada sebelum menambahkan yang baru
  // Ini memastikan hanya 1 toast yang tampil sekaligus
  toasts.value = []

  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const toast: ToastItem = {
    id,
    title: options.title,
    description: options.description,
    color: options.color || 'info',
    visible: true
  }

  toasts.value = [toast]

  // Auto-remove setelah duration (default 5 detik)
  setTimeout(() => {
    removeToast(id)
  }, options.duration || 5000)

  return toast
}

// Fungsi untuk menghapus toast
function removeToast(id: string) {
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

// Expose fungsi untuk digunakan di komponen lain
provide('customToast', { addToast, removeToast, toasts })

// Warna ring/shadow halus untuk toast professional
const colorClasses = {
  success: 'ring-1 ring-emerald-500/20 shadow-emerald-500/10',
  error: 'ring-1 ring-red-500/20 shadow-red-500/10',
  warning: 'ring-1 ring-amber-500/20 shadow-amber-500/10',
  info: 'ring-1 ring-blue-500/20 shadow-blue-500/10'
}

// Icon background & color styling
const iconClasses = {
  success: 'bg-emerald-100 text-emerald-600',
  error: 'bg-red-100 text-red-600',
  warning: 'bg-amber-100 text-amber-600',
  info: 'bg-blue-100 text-blue-600'
}
</script>

<template>
  <UApp :toaster="null">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <Teleport to="body">
      <div v-show="isHydrating"
        class="fixed inset-0 w-screen h-screen z-[999999] flex items-center justify-center bg-[#F1F5F9] select-none touch-none transition-opacity duration-300"
        :class="isHydrating ? 'opacity-100' : 'opacity-0 pointer-events-none'" @click.stop.prevent
        @touchstart.stop.prevent @touchmove.stop.prevent @wheel.stop.prevent @keydown.stop.prevent>

        <div class="flex flex-col items-center gap-6">
          <svg class="animate-spin w-[50px] h-[50px] text-[#166534]" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </div>

      </div>
    </Teleport>

    <!-- Professional Top-Center Toast Container (Mobile & 40+ UX Optimized) -->
    <ClientOnly>
      <Teleport to="body">
        <div
          class="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-md sm:max-w-lg pointer-events-none items-center px-4">
          <TransitionGroup enter-active-class="transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="opacity-0 -translate-y-full scale-90" leave-to-class="opacity-0 -translate-y-4 scale-95"
            move-class="transition-transform duration-300 ease-out">
            <div v-for="toast in toasts" :key="toast.id" :class="[
              'pointer-events-auto flex items-start gap-4 w-full bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl shadow-slate-200/40 transition-all duration-300',
              colorClasses[toast.color],
              toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
            ]">
              <!-- Icon Box (Larger for visibility) -->
              <div
                :class="['flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center', iconClasses[toast.color]]">
                <svg v-if="toast.color === 'success'" class="w-6 h-6" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="toast.color === 'error'" class="w-6 h-6" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else-if="toast.color === 'warning'" class="w-6 h-6" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <!-- Content (Larger text for 40+ readability) -->
              <div class="flex-1 min-w-0 pt-0.5">
                <h4 class="text-base sm:text-lg font-bold text-slate-900">{{ toast.title }}</h4>
                <p class="text-base font-medium text-slate-600 leading-normal mt-1">{{ toast.description }}</p>
              </div>

              <!-- Close Button (Larger touch target) -->
              <button @click="removeToast(toast.id)"
                class="flex-shrink-0 text-slate-400 hover:text-slate-600 p-3 -mr-2 rounded-xl hover:bg-slate-100 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </TransitionGroup>
        </div>
      </Teleport>
    </ClientOnly>
  </UApp>
</template>