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

    <!-- Custom Toast Container -->
    <Teleport to="body">
      <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <TransitionGroup name="toast">
          <div v-for="toast in toasts" :key="toast.id" :class="[
            'pointer-events-auto rounded-xl border-l-4 p-4 shadow-lg backdrop-blur-sm transition-all duration-300',
            colorClasses[toast.color],
            toast.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
          ]">
            <div class="flex items-start gap-3">
              <!-- Icon -->
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

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold">{{ toast.title }}</h4>
                <p class="text-sm mt-0.5 opacity-90">{{ toast.description }}</p>
              </div>

              <!-- Close Button -->
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

<style>
/* Toast transition animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>