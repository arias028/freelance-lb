<script setup lang="ts">
/**
 * Halaman Ganti Password
 * Untuk pengguna yang sudah menghubungi admin melakukan reset password
 */
import { reactive, ref } from 'vue'
import { Building2, User, Lock, ArrowRight, Key, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-vue-next'

definePageMeta({
    layout: 'auth'
})

const router = useRouter()
const config = useRuntimeConfig()
const toast = useCustomToast()

const form = reactive({
    kode_user: '',
    password: '',
    confirmPassword: ''
})

const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Fungsi untuk mendapatkan IP address (simulasi, di production bisa pakai service)
async function getClientIP(): Promise<string> {
    try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        return data.ip
    } catch {
        return '0.0.0.0'
    }
}

// Fungsi untuk mengganti password
async function handleChangePassword() {
    // Validasi form
    if (!form.kode_user || !form.password) {
        toast.add({
            title: 'Perhatian',
            description: 'Mohon lengkapi Kode User dan Password baru.',
            color: 'warning'
        })
        return
    }

    // Validasi panjang password minimal 6 karakter
    if (form.password.length < 6) {
        toast.add({
            title: 'Password Terlalu Pendek',
            description: 'Password minimal harus 6 karakter.',
            color: 'warning'
        })
        return
    }

    // Validasi konfirmasi password
    if (form.password !== form.confirmPassword) {
        toast.add({
            title: 'Password Tidak Cocok',
            description: 'Konfirmasi password tidak sesuai.',
            color: 'error'
        })
        return
    }

    isLoading.value = true

    try {
        // Dapatkan IP client
        const clientIP = await getClientIP()

        // Panggil API change password via internal proxy
        const response = await $fetch<number>(`/api/freelance/FreelanceChangePassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                kode_user: form.kode_user,
                password: form.password,
                ip: clientIP,
                aplikasi_id: parseInt(config.public.appId as string) || 16
            }
        })

        // Cek hasil response (1 = berhasil, 0 = gagal)
        if (response === 1) {
            toast.add({
                title: 'Berhasil!',
                description: 'Password berhasil diganti. Silakan login dengan password baru.',
                color: 'success'
            })

            // Tunggu sebentar agar user bisa melihat toast
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } else {
            toast.add({
                title: 'Gagal Mengganti Password',
                description: 'Pastikan sudah menghubungi admin sebelum penggantian password.',
                color: 'error'
            })
            // Tetap di halaman changepw agar user bisa mencoba lagi
        }
    } catch (error: any) {
        console.error('Change password error:', error)
        toast.add({
            title: 'Terjadi Kesalahan',
            description: 'Gagal menghubungi server. Silakan coba lagi.',
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <!-- 
        Change Password Page - Corporate Nature Palette 
        Matched with Login Page for consistency
    -->
    <div
        class="login-card w-full bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden">

        <!-- Header Section -->
        <div class="px-8 pt-10 pb-8 text-center">
            <div
                class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white mb-6 shadow-lg shadow-slate-200/50 transform transition-transform duration-300 overflow-hidden border border-[#E2E8F0]">
                <!-- Using Key icon with Forest Green accent -->
                <Key class="w-10 h-10 text-[#166534]" />
            </div>

            <!-- Heading: Midnight Navy #0F172A -->
            <h1 class="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
                Ganti Password
            </h1>
            <p class="mt-3 text-base text-[#64748B] font-medium">
                Masukkan kode user dan password baru Anda
            </p>
        </div>

        <!-- Form Section -->
        <div class="px-8 pb-10">
            <form @submit.prevent="handleChangePassword" class="space-y-6">

                <!-- Kode User Input -->
                <div class="space-y-2">
                    <label class="block text-base font-semibold text-[#0F172A] ml-1">Kode User</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User
                                class="h-5 w-5 text-[#94A3B8] group-focus-within:text-[#166534] transition-colors duration-200" />
                        </div>
                        <input v-model="form.kode_user" type="text"
                            class="login-input block w-full min-h-[48px] pl-12 pr-4 py-3 bg-white border-2 border-[#CBD5E1] rounded-xl text-[#334155] text-base placeholder-[#94A3B8] focus:outline-none focus:border-[#166534] focus:ring-4 focus:ring-[#166534]/15 transition-all duration-200"
                            placeholder="Contoh: FRL0001" autofocus />
                    </div>
                </div>

                <!-- Password Baru Input -->
                <div class="space-y-2">
                    <label class="block text-base font-semibold text-[#0F172A] ml-1">Password Baru</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock
                                class="h-5 w-5 text-[#94A3B8] group-focus-within:text-[#166534] transition-colors duration-200" />
                        </div>
                        <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                            class="login-input block w-full min-h-[48px] pl-12 pr-12 py-3 bg-white border-2 border-[#CBD5E1] rounded-xl text-[#334155] text-base placeholder-[#94A3B8] focus:outline-none focus:border-[#166534] focus:ring-4 focus:ring-[#166534]/15 transition-all duration-200"
                            placeholder="Minimal 6 karakter" />
                        <button type="button" @click="showPassword = !showPassword"
                            class="absolute inset-y-0 right-0 pr-4 flex items-center text-[#64748B] hover:text-[#0F172A] focus:outline-none transition-colors duration-200">
                            <Eye v-if="!showPassword" class="h-5 w-5" />
                            <EyeOff v-else class="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <!-- Konfirmasi Password Input -->
                <div class="space-y-2">
                    <label class="block text-base font-semibold text-[#0F172A] ml-1">Konfirmasi Password</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock
                                class="h-5 w-5 text-[#94A3B8] group-focus-within:text-[#166534] transition-colors duration-200" />
                        </div>
                        <input v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                            class="login-input block w-full min-h-[48px] pl-12 pr-12 py-3 bg-white border-2 border-[#CBD5E1] rounded-xl text-[#334155] text-base placeholder-[#94A3B8] focus:outline-none focus:border-[#166534] focus:ring-4 focus:ring-[#166534]/15 transition-all duration-200"
                            placeholder="Ulangi password baru" />
                        <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                            class="absolute inset-y-0 right-0 pr-4 flex items-center text-[#64748B] hover:text-[#0F172A] focus:outline-none transition-colors duration-200">
                            <Eye v-if="!showConfirmPassword" class="h-5 w-5" />
                            <EyeOff v-else class="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <!-- Info Box - Clean Slate/Blue Look -->
                <div class="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex gap-3">
                    <div class="shrink-0 mt-0.5">
                        <Building2 class="w-5 h-5 text-[#64748B]" />
                    </div>
                    <p class="text-sm text-[#475569] leading-relaxed">
                        <strong class="text-[#0F172A]">Penting:</strong> Pastikan Anda sudah menghubungi admin untuk
                        melakukan reset password
                        sebelum mengisi form ini.
                    </p>
                </div>

                <!-- Submit Button: Midnight Navy -->
                <div class="pt-2">
                    <button type="submit" :disabled="isLoading"
                        class="login-btn w-full flex items-center justify-center gap-3 min-h-[50px] py-3.5 px-6 border-0 rounded-xl text-base font-bold text-white bg-[#0F172A] hover:bg-[#1E293B] focus:outline-none focus:ring-4 focus:ring-[#0F172A]/30 shadow-lg shadow-[#0F172A]/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]">
                        <Loader2 v-if="isLoading" class="animate-spin h-5 w-5" />
                        <span v-else>Ganti Password</span>
                        <Key v-if="!isLoading" class="h-5 w-5" />
                    </button>
                </div>

            </form>

            <!-- Back to Login Link -->
            <div class="mt-8 text-center">
                <NuxtLink to="/login"
                    class="inline-flex items-center gap-2 text-base font-medium text-[#166534] hover:text-[#14532D] hover:underline underline-offset-4 transition-colors duration-200">
                    <ArrowLeft class="w-5 h-5" />
                    <span>Kembali ke halaman login</span>
                </NuxtLink>
            </div>

            <!-- Footer -->
            <div class="mt-10 pt-6 border-t border-[#E2E8F0]">
                <div
                    class="flex items-center justify-center gap-2 text-sm font-medium text-[#64748B] uppercase tracking-wider">
                    <Building2 class="w-4 h-4 text-[#166534]" />
                    <span>© 2026 PT. BINA.</span>
                </div>
            </div>
        </div>

    </div>
</template>
