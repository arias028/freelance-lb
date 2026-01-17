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

    <!-- Hydration Loading Overlay - Professional design with interaction blocking -->
    <Teleport to="body">
      <Transition name="loading-fade">
        <div v-if="isHydrating" class="loading-overlay" @click.stop.prevent @touchstart.stop.prevent
          @touchmove.stop.prevent @wheel.stop.prevent @keydown.stop.prevent>

          <div class="loading-content">
            <!-- Logo atau Brand (opsional) -->
            <div class="loading-logo">
              <NuxtImg src="https://bina57.s3.ap-southeast-3.amazonaws.com/logo/konstruksi.png" alt="Logo"
                class="w-16 h-16 object-contain" loading="eager" />
            </div>

            <!-- Spinner Animation -->
            <div class="loading-spinner-container">
              <!-- Outer ring - pulse effect -->
              <div class="loading-ring-outer"></div>
              <!-- Middle ring - rotating -->
              <div class="loading-ring-middle"></div>
              <!-- Inner dot - pulse -->
              <div class="loading-dot-inner"></div>
            </div>

            <!-- Loading Text -->
            <div class="loading-text-container">
              <p class="loading-text">Memuat<span class="loading-dots"></span></p>
              <p class="loading-subtext">Mohon tunggu sebentar</p>
            </div>
          </div>

        </div>
      </Transition>
    </Teleport>

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
/* ===== LOADING OVERLAY STYLES ===== */

/* Main overlay - full viewport coverage with high z-index */
.loading-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0F172A;
  /* Midnight Navy */
  /* Prevent any interaction pass-through */
  pointer-events: all;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

/* Content container */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

/* Logo styling */
.loading-logo {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: logo-float 3s ease-in-out infinite;
}

@keyframes logo-float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

/* Spinner container */
.loading-spinner-container {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Outer ring - pulse effect */
.loading-ring-outer {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(22, 101, 52, 0.2);
  /* Forest Green with low opacity */
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* Middle ring - rotating spinner */
.loading-ring-middle {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 4px solid transparent;
  border-top-color: #166534;
  /* Forest Green */
  border-right-color: #166534;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Inner dot - pulsing */
.loading-dot-inner {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #166534;
  /* Forest Green */
  box-shadow: 0 0 20px rgba(22, 101, 52, 0.6);
  animation: dot-pulse 1.5s ease-in-out infinite;
}

@keyframes dot-pulse {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(22, 101, 52, 0.6);
  }

  50% {
    transform: scale(1.2);
    box-shadow: 0 0 30px rgba(22, 101, 52, 0.8);
  }
}

/* Text container */
.loading-text-container {
  text-align: center;
}

/* Main loading text */
.loading-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #F1F5F9;
  /* Light text on dark bg */
  letter-spacing: 0.05em;
  margin: 0;
}

/* Animated dots after "Memuat" */
.loading-dots::after {
  content: '';
  animation: loading-dots 1.5s steps(4, end) infinite;
}

@keyframes loading-dots {
  0% {
    content: '';
  }

  25% {
    content: '.';
  }

  50% {
    content: '..';
  }

  75% {
    content: '...';
  }

  100% {
    content: '';
  }
}

/* Subtext */
.loading-subtext {
  font-size: 0.875rem;
  color: rgba(241, 245, 249, 0.6);
  /* Subdued light text */
  margin: 0.5rem 0 0 0;
  font-weight: 400;
}

/* ===== LOADING FADE TRANSITION ===== */
.loading-fade-enter-active {
  transition: opacity 0.3s ease-out;
}

.loading-fade-leave-active {
  transition: opacity 0.5s ease-in;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

/* ===== TOAST TRANSITION ANIMATIONS ===== */
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