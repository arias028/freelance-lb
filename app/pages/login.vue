<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Building2, User, Lock, ArrowRight, ShieldCheck, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-vue-next'

definePageMeta({
    layout: 'auth'
})

const { login } = useAuth()
const toast = useCustomToast()

const form = reactive({
    kode_user: '',
    password: ''
})

const isLoading = ref(false)
const showPassword = ref(false)

// Captcha State
const captchaCanvas = ref<HTMLCanvasElement | null>(null)
const captchaCode = ref('')
const captchaInput = ref('')

function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 3; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    captchaCode.value = result

    // Draw on next tick to ensure canvas is ready
    nextTick(() => {
        drawCaptcha(result)
    })
}

function drawCaptcha(text: string) {
    if (!captchaCanvas.value) return
    const ctx = captchaCanvas.value.getContext('2d')
    if (!ctx) return

    // Clear and set background
    ctx.clearRect(0, 0, captchaCanvas.value.width, captchaCanvas.value.height)
    ctx.fillStyle = '#f8fafc' // slate-50
    ctx.fillRect(0, 0, captchaCanvas.value.width, captchaCanvas.value.height)

    // Add noise (random lines)
    for (let i = 0; i < 7; i++) {
        ctx.strokeStyle = `rgba(100, 116, 139, ${Math.random() * 0.5})`
        ctx.beginPath()
        ctx.moveTo(Math.random() * captchaCanvas.value.width, Math.random() * captchaCanvas.value.height)
        ctx.lineTo(Math.random() * captchaCanvas.value.width, Math.random() * captchaCanvas.value.height)
        ctx.stroke()
    }

    // Draw Text
    ctx.font = 'bold 24px sans-serif'
    ctx.fillStyle = '#334155' // slate-700
    ctx.textBaseline = 'middle'

    const width = captchaCanvas.value.width
    const step = width / 4

    for (let i = 0; i < text.length; i++) {
        ctx.save()
        // Random position and rotation for each character
        const x = step * (i + 1) - 10
        const y = captchaCanvas.value.height / 2 + (Math.random() - 0.5) * 10
        const angle = (Math.random() - 0.5) * 0.4

        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillText(text.charAt(i), 0, 0)
        ctx.restore()
    }
}

onMounted(() => {
    generateCaptcha()
})

async function handleLogin() {
    // Validasi form dasar
    if (!form.kode_user || !form.password) {
        toast.add({ title: 'Perhatian', description: 'Mohon lengkapi form login.', color: 'warning' })
        return
    }

    // Validasi Captcha
    if (captchaInput.value.toUpperCase() !== captchaCode.value) {
        toast.add({ title: 'Captcha Salah', description: 'Kode keamanan tidak sesuai. Silakan coba lagi.', color: 'error' })
        captchaInput.value = ''
        generateCaptcha()
        return
    }

    isLoading.value = true
    try {
        await login(form.kode_user, form.password)
        toast.add({ title: 'Berhasil', description: 'Selamat datang kembali!', color: 'success' })
    } catch (error: any) {
        toast.add({ title: 'Akses Ditolak', description: error.message || 'Cek kembali kode user dan password.', color: 'error' })
        // Refresh captcha saat gagal login
        generateCaptcha()
        captchaInput.value = ''
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div
        class="w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-slate-100 overflow-hidden">

        <!-- Header Section -->
        <div class="px-8 pt-10 pb-6 text-center bg-gradient-to-b from-slate-50/50 to-transparent">
            <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-6 shadow-lg shadow-primary-500/30 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <Building2 class="w-8 h-8 text-white -rotate-3" />
            </div>

            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
                Freelance Portal
            </h1>
            <p class="mt-2 text-sm text-slate-500 font-medium">
                Masuk untuk mengakses dashboard Anda
            </p>
        </div>

        <!-- Form Section -->
        <div class="px-8 pb-10">
            <form @submit.prevent="handleLogin" class="space-y-5">

                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 ml-1">Kode User</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User
                                class="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200" />
                        </div>
                        <input v-model="form.kode_user" type="text"
                            class="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                            placeholder="Contoh: FRL0001" autofocus />
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 ml-1">Password</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock
                                class="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200" />
                        </div>
                        <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                            class="block w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                            placeholder="••••••••" />
                        <button type="button" @click="showPassword = !showPassword"
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors duration-200">
                            <Eye v-if="!showPassword" class="h-5 w-5" />
                            <EyeOff v-else class="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <!-- Captcha Section -->
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 ml-1">Kode Keamanan</label>
                    <div class="flex items-center gap-3">
                        <div class="relative group flex-1">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <ShieldCheck
                                    class="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200" />
                            </div>
                            <input v-model="captchaInput" type="text" maxlength="3"
                                class="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 uppercase tracking-widest font-bold"
                                placeholder="Kode..." />
                        </div>

                        <div class="relative cursor-pointer group flex-shrink-0" @click="generateCaptcha"
                            title="Klik untuk ganti kode">
                            <canvas ref="captchaCanvas" width="100" height="48"
                                class="rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-primary-400 transition-colors block"></canvas>
                            <div
                                class="absolute -right-2 -top-2 bg-white rounded-full p-1.5 shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110">
                                <RefreshCw class="w-3.5 h-3.5 text-primary-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pt-4">
                    <button type="submit" :disabled="isLoading"
                        class="w-full flex items-center justify-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]">
                        <Loader2 v-if="isLoading" class="animate-spin h-5 w-5" />
                        <span v-else>Masuk Dashboard</span>
                        <ArrowRight v-if="!isLoading" class="h-5 w-5" />
                    </button>
                </div>

            </form>

            <!-- Link to Change Password -->
            <div class="mt-6 text-center">
                <NuxtLink to="/changepw"
                    class="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-200">
                    Lupa Password? Ganti password di sini
                </NuxtLink>
            </div>

            <div class="mt-8 pt-6 border-t border-slate-100/80">
                <div
                    class="flex items-center justify-center space-x-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <ShieldCheck class="w-3.5 h-3.5 text-emerald-500" />
                    <span>Sistem Terenkripsi & Aman</span>
                </div>
            </div>
        </div>

    </div>
</template>