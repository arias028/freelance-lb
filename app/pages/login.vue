<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Building2, User, Lock, ArrowRight, ShieldCheck, Loader2, Eye, EyeOff, Download } from 'lucide-vue-next'

definePageMeta({
    layout: 'auth'
})

const { login } = useAuth()
const toast = useCustomToast()

// PWA Install - untuk tombol install aplikasi
const { isInstallable, isInstalled, installApp, setupInstallPrompt } = usePwaInstall()

const form = reactive({
    kode_user: '',
    password: ''
})

const isLoading = ref(false)
const showPassword = ref(false)

onMounted(() => {
    setupInstallPrompt()
})

useHead({
    title: 'Login - Freelance LB',
    meta: [
        { name: 'description', content: 'Halaman login untuk dashboard Freelance LB' }
    ],
    htmlAttrs: {
        lang: 'id'
    }
})

async function handleLogin() {
    // Validasi form dasar
    if (!form.kode_user || !form.password) {
        toast.add({ title: 'Perhatian', description: 'Mohon lengkapi form login.', color: 'warning' })
        return
    }

    isLoading.value = true
    try {
        await login(form.kode_user, form.password)
        toast.add({ title: 'Berhasil', description: 'Selamat datang kembali!', color: 'success' })
    } catch (error: any) {
        toast.add({ title: 'Akses Ditolak', description: error.message || 'Cek kembali username dan password.', color: 'error' })
    } finally {
        isLoading.value = false
    }
}

async function handleInstall() {
    const outcome = await installApp()
    if (outcome === 'manual_required') {
        toast.add({
            title: 'Install Manual',
            description: 'Browser tidak mendukung install otomatis. Silakan pilih "Install App" atau "Tambahkan ke Layar Utama" di menu browser.',
            color: 'info',
            duration: 8000
        })
    }
}
</script>

<template>
    <!-- 
        CORPORATE NATURE COLOR PALETTE - High Readability for 40+ Users
        ================================================================
        Background Page: #F1F5F9 (Soft Cloud) - Set this on parent/layout
        Card: #FFFFFF (Pure White) with subtle shadow
        Primary Button: #0F172A (Midnight Navy) | Text: #FFFFFF
        Input Border Default: #CBD5E1 (Light Grey)
        Input Focus Border: #166534 (Forest Green)
        Input Text: #334155 (Slate Grey)
        Headings/Labels: #0F172A (Midnight Navy)
    -->
    <main
        class="login-card w-full bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden">

        <!-- Header Section -->
        <div class="px-8 pt-10 pb-8 text-center">
            <div
                class="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white mb-6 shadow-lg shadow-slate-200/50 transform transition-transform duration-300 overflow-hidden border border-[#E2E8F0]">
                <NuxtImg src="pwa-192x192.png" alt="Logo Konstruksi" class="w-20 h-20" loading="eager"
                    fetchpriority="high" />
            </div>

            <!-- Heading: Midnight Navy #0F172A -->
            <h1 class="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
                Freelance LB
            </h1>
            <p class="mt-3 text-base text-[#64748B] font-medium">
                Masuk untuk mengakses dashboard Anda
            </p>
        </div>

        <!-- Form Section -->
        <div class="px-8 pb-10">
            <form @submit.prevent="handleLogin" class="space-y-6">

                <!-- Username Field -->
                <div class="space-y-2">
                    <!-- Label: Midnight Navy #0F172A, 16px font -->
                    <label class="block text-base font-semibold text-[#0F172A] ml-1">Username</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User
                                class="h-5 w-5 text-[#94A3B8] group-focus-within:text-[#166534] transition-colors duration-200" />
                        </div>
                        <!-- Input: min-height 48px, 16px text, border #CBD5E1, focus border #166534 -->
                        <input v-model="form.kode_user" type="text"
                            @input="form.kode_user = form.kode_user.toUpperCase()"
                            class="login-input block w-full min-h-[48px] pl-12 pr-4 py-3 bg-white border-2 border-[#CBD5E1] rounded-xl text-[#334155] text-base placeholder-[#94A3B8] focus:outline-none focus:border-[#166534] focus:ring-4 focus:ring-[#166534]/15 transition-colors duration-200 uppercase"
                            placeholder="Contoh: UJANG" autofocus />
                    </div>
                </div>

                <!-- Password Field -->
                <div class="space-y-2">
                    <label class="block text-base font-semibold text-[#0F172A] ml-1">Password</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock
                                class="h-5 w-5 text-[#94A3B8] group-focus-within:text-[#166534] transition-colors duration-200" />
                        </div>
                        <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                            class="login-input block w-full min-h-[48px] pl-12 pr-12 py-3 bg-white border-2 border-[#CBD5E1] rounded-xl text-[#334155] text-base placeholder-[#94A3B8] focus:outline-none focus:border-[#166534] focus:ring-4 focus:ring-[#166534]/15 transition-colors duration-200"
                            placeholder="••••••••" />
                        <button type="button" @click="showPassword = !showPassword"
                            :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                            class="absolute inset-y-0 right-0 pr-4 flex items-center text-[#64748B] hover:text-[#0F172A] focus:outline-none transition-colors duration-200">
                            <Eye v-if="!showPassword" class="h-5 w-5" />
                            <EyeOff v-else class="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <!-- Login Button: min-height 50px, Midnight Navy #0F172A bg, white text -->
                <div class="pt-4">
                    <button type="submit" :disabled="isLoading"
                        class="login-btn w-full flex items-center justify-center gap-3 min-h-[50px] py-3.5 px-6 border-0 rounded-xl text-base font-bold text-white bg-[#0F172A] hover:bg-[#1E293B] focus:outline-none focus:ring-4 focus:ring-[#0F172A]/30 shadow-lg shadow-[#0F172A]/25 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 active:scale-[0.98]">
                        <Loader2 v-if="isLoading" class="animate-spin h-5 w-5" />
                        <span v-else>Masuk Dashboard</span>
                        <ArrowRight v-if="!isLoading" class="h-5 w-5" />
                    </button>
                </div>

            </form>

            <!-- Link to Change Password -->
            <div class="mt-8 text-center">
                <NuxtLink to="/changepw"
                    class="text-base font-medium text-[#166534] hover:text-[#14532D] hover:underline underline-offset-4 transition-colors duration-200">
                    Lupa Password? Ganti password di sini
                </NuxtLink>
            </div>

            <!-- PWA Install Button -->
            <div v-if="isInstallable && !isInstalled" class="mt-6 text-center">
                <button @click="handleInstall"
                    class="inline-flex items-center gap-2 min-h-[44px] px-5 py-3 text-base font-semibold text-white bg-gradient-to-r from-[#166534] to-[#15803D] hover:from-[#14532D] hover:to-[#166534] rounded-xl shadow-md shadow-[#166534]/20 transition-all duration-200 active:scale-[0.98]">
                    <Download class="w-5 h-5" />
                    <span>Install Aplikasi</span>
                </button>
                <p class="mt-3 text-sm text-[#64748B]">
                    Akses lebih cepat tanpa membuka browser
                </p>
            </div>

            <!-- Already Installed Badge -->
            <div v-else-if="isInstalled" class="mt-6 text-center">
                <div
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#166534] bg-[#DCFCE7] rounded-full border border-[#BBF7D0]">
                    <ShieldCheck class="w-4 h-4" />
                    <span>Aplikasi sudah terinstall</span>
                </div>
            </div>

            <div class="mt-10 pt-6 border-t border-[#E2E8F0]">
                <div
                    class="flex items-center justify-center gap-2 text-sm font-medium text-[#64748B] uppercase tracking-wider">
                    <Building2 class="w-4 h-4 text-[#166534]" />
                    <span>© 2026 PT. BINA.</span>
                </div>
            </div>
        </div>

    </main>
</template>