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

        // Panggil API change password
        const response = await $fetch<number>(`${config.public.apiBase}/FreelanceChangePassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [config.public.headerKey]: config.public.apiKey
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
    <div
        class="w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-slate-100 overflow-hidden">

        <!-- Header Section -->
        <div class="px-8 pt-10 pb-6 text-center bg-gradient-to-b from-slate-50/50 to-transparent">
            <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 mb-6 shadow-lg shadow-amber-500/30 transform -rotate-3 hover:rotate-3 transition-transform duration-300">
                <Key class="w-8 h-8 text-white rotate-3" />
            </div>

            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
                Ganti Password
            </h1>
            <p class="mt-2 text-sm text-slate-500 font-medium">
                Masukkan kode user dan password baru Anda
            </p>
        </div>

        <!-- Form Section -->
        <div class="px-8 pb-10">
            <form @submit.prevent="handleChangePassword" class="space-y-5">

                <!-- Kode User Input -->
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 ml-1">Kode User</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User
                                class="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors duration-200" />
                        </div>
                        <input v-model="form.kode_user" type="text"
                            class="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200"
                            placeholder="Contoh: FRL0001" autofocus />
                    </div>
                </div>

                <!-- Password Baru Input -->
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 ml-1">Password Baru</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock
                                class="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors duration-200" />
                        </div>
                        <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                            class="block w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200"
                            placeholder="Minimal 6 karakter" />
                        <button type="button" @click="showPassword = !showPassword"
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors duration-200">
                            <Eye v-if="!showPassword" class="h-5 w-5" />
                            <EyeOff v-else class="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <!-- Konfirmasi Password Input -->
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 ml-1">Konfirmasi Password</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock
                                class="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors duration-200" />
                        </div>
                        <input v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                            class="block w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200"
                            placeholder="Ulangi password baru" />
                        <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors duration-200">
                            <Eye v-if="!showConfirmPassword" class="h-5 w-5" />
                            <EyeOff v-else class="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <!-- Info Box -->
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p class="text-xs text-amber-700 leading-relaxed">
                        <strong>Penting:</strong> Pastikan Anda sudah menghubungi admin untuk melakukan reset password
                        sebelum mengisi form ini. Jika belum, silakan hubungi admin terlebih dahulu.
                    </p>
                </div>

                <!-- Submit Button -->
                <div class="pt-2">
                    <button type="submit" :disabled="isLoading"
                        class="w-full flex items-center justify-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-lg shadow-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]">
                        <Loader2 v-if="isLoading" class="animate-spin h-5 w-5" />
                        <span v-else>Ganti Password</span>
                        <Key v-if="!isLoading" class="h-5 w-5" />
                    </button>
                </div>

            </form>

            <!-- Back to Login Link -->
            <div class="mt-6 text-center">
                <NuxtLink to="/login"
                    class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200">
                    <ArrowLeft class="w-4 h-4" />
                    <span>Kembali ke halaman login</span>
                </NuxtLink>
            </div>

            <!-- Footer -->
            <div class="mt-8 pt-6 border-t border-slate-100/80">
                <div
                    class="flex items-center justify-center space-x-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <Building2 class="w-3.5 h-3.5 text-amber-500" />
                    <span>IT Support PT. BINA</span>
                </div>
            </div>
        </div>

    </div>
</template>
