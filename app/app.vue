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
onMounted(() => {
  // Lock scroll saat pertama kali mount
  lockBodyScroll(true)

  // Delay sedikit untuk memastikan semua komponen sudah di-mount
  setTimeout(() => {
    isHydrating.value = false
  }, 150)
})

// State reaktif untuk menyimpan toast
const toasts = useState<ToastItem[]>('custom-toasts', () => [])

// Fungsi untuk menambahkan toast baru
function addToast(options: { title: string; description: string; color?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) {
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

// Warna berdasarkan tipe toast
const colorClasses = {
  success: 'bg-emerald-50 border-emerald-500 text-emerald-800',
  error: 'bg-red-50 border-red-500 text-red-800',
  warning: 'bg-amber-50 border-amber-500 text-amber-800',
  info: 'bg-blue-50 border-blue-500 text-blue-800'
}

const iconClasses = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500'
}
</script>

<template>
  <UApp :toaster="null">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-200 ease-out"
        leave-active-class="transition-opacity duration-300 ease-in" enter-from-class="opacity-0"
        leave-to-class="opacity-0">
        <div v-if="isHydrating"
          class="fixed inset-0 w-screen h-screen z-[999999] flex items-center justify-center bg-[#F1F5F9] select-none touch-none"
          @click.stop.prevent @touchstart.stop.prevent @touchmove.stop.prevent @wheel.stop.prevent
          @keydown.stop.prevent>

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
      </Transition>
    </Teleport>

    <Teleport to="body">
      <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <TransitionGroup enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-300 ease-in" enter-from-class="opacity-0 translate-x-full"
          leave-to-class="opacity-0 translate-x-full" move-class="transition-transform duration-300 ease-out">
          <div v-for="toast in toasts" :key="toast.id" :class="[
            'pointer-events-auto rounded-xl border-l-4 p-4 shadow-lg backdrop-blur-sm transition-all duration-300',
            colorClasses[toast.color],
            toast.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
          ]">
            <div class="flex items-start gap-3">
              <div :class="['flex-shrink-0 mt-0.5', iconClasses[toast.color]]">
                <svg v-if="toast.color === 'success'" class="w-5 h-5" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="toast.color === 'error'" class="w-5 h-5" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="toast.color === 'warning'" class="w-5 h-5" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold">{{ toast.title }}</h4>
                <p class="text-sm mt-0.5 opacity-90">{{ toast.description }}</p>
              </div>

              <button @click="removeToast(toast.id)"
                class="flex-shrink-0 rounded-lg p-1 hover:bg-black/5 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </UApp>
</template>