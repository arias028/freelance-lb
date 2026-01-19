<script setup lang="ts">
definePageMeta({
    middleware: 'auth'
})

const { logout } = useAuth()
const { getEmployeeProfile } = useEmployee()
const toast = useCustomToast()

const isLoading = ref(false)
const isLogoutLoading = ref(false)
const profile = ref<any>(null)

onMounted(async () => {
    isLoading.value = true
    try {
        const data = await getEmployeeProfile()
        if (data) {
            profile.value = data
        }
    } catch (e) {
        console.error('Failed to load profile', e)
    } finally {
        isLoading.value = false
    }
})

async function handleLogout() {
    isLogoutLoading.value = true
    try {
        await logout()
        toast.add({ title: 'Logout Berhasil', description: 'Sampai jumpa kembali.', color: 'success' })
        navigateTo('/login')
    } catch (e) {
        navigateTo('/login')
    } finally {
        isLogoutLoading.value = false
    }
}

function formatDate(date: string) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    })
}
</script>

<template>
    <div class="min-h-screen bg-[#F1F5F9] pb-24 text-[#334155]">
        <!-- Page Header -->
        <div class="bg-white border-b border-slate-200 sticky top-0 z-20">
            <UContainer class="py-4">
                <h1 class="text-xl font-bold text-[#0F172A]">Profil Saya</h1>
            </UContainer>
        </div>

        <UContainer class="py-6 space-y-6">

            <!-- Loading State -->
            <div v-if="isLoading" class="space-y-4">
                <USkeleton class="h-32 w-full rounded-2xl" />
                <USkeleton class="h-64 w-full rounded-2xl" />
            </div>

            <template v-else>
                <!-- Profile Header Card -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#0F172A] to-[#1e293b] z-0">
                    </div>

                    <div class="relative z-10 flex flex-col items-center mt-8">
                        <div class="w-24 h-24 rounded-full bg-white p-1 shadow-lg ring-1 ring-slate-100">
                            <div
                                class="w-full h-full rounded-full bg-[#166534] flex items-center justify-center text-white text-3xl font-bold">
                                {{ profile?.nama_lengkap?.charAt(0) || 'U' }}
                            </div>
                        </div>

                        <div class="text-center mt-4">
                            <h2 class="text-xl font-bold text-[#0F172A]">{{ profile?.nama_lengkap || 'Guest User' }}
                            </h2>
                            <p class="text-[#166534] font-medium text-sm mt-1">{{ profile?.jabatan || 'Freelancer' }}
                            </p>
                            <UBadge color="neutral" variant="subtle" size="xs" class="mt-2 text-xs font-mono">
                                {{ profile?.kode_user || '-' }}
                            </UBadge>
                        </div>
                    </div>
                </div>

                <!-- Info Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <!-- Personal Info -->
                    <section class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                            <UIcon name="i-heroicons-identification" class="w-5 h-5 text-[#166534]" />
                            <h3 class="font-bold text-[#0F172A]">Informasi Pribadi</h3>
                        </div>
                        <div class="p-6 space-y-5">
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Nomor HP</label>
                                <p class="text-[#0F172A] font-medium mt-1">{{ profile?.phone || '-' }}</p>
                            </div>
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Jenis
                                    Kelamin</label>
                                <p class="text-[#0F172A] font-medium mt-1">{{ profile?.kelamin === 'L' ? 'Laki-laki' :
                                    'Perempuan' }}</p>
                            </div>
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Tanggal
                                    Lahir</label>
                                <p class="text-[#0F172A] font-medium mt-1">{{ formatDate(profile?.tanggal_lahir) }}</p>
                            </div>
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Alamat</label>
                                <p class="text-[#0F172A] font-medium mt-1 leading-relaxed">{{ profile?.alamat || '-' }}
                                </p>
                            </div>
                        </div>
                    </section>

                    <!-- Employment Info -->
                    <section class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                            <UIcon name="i-heroicons-briefcase" class="w-5 h-5 text-[#166534]" />
                            <h3 class="font-bold text-[#0F172A]">Data Kepegawaian</h3>
                        </div>
                        <div class="p-6 space-y-5">
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Tanggal
                                    Bergabung</label>
                                <p class="text-[#0F172A] font-medium mt-1">{{ formatDate(profile?.tanggal_masuk) }}</p>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        class="text-xs font-bold text-slate-400 uppercase tracking-wide">Golongan</label>
                                    <p class="text-[#0F172A] font-medium mt-1">{{ profile?.golongan || '-' }}</p>
                                </div>
                                <div>
                                    <label
                                        class="text-xs font-bold text-slate-400 uppercase tracking-wide">Rekening</label>
                                    <p class="text-[#0F172A] font-medium mt-1 font-mono">{{ profile?.rekening || '-' }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Action Button -->
                <div class="pt-6">
                    <UButton block size="xl" color="error" variant="soft" :loading="isLogoutLoading"
                        @click="handleLogout" icon="i-heroicons-arrow-right-on-rectangle" class="font-bold">
                        Keluar Aplikasi
                    </UButton>
                    <p class="text-center text-xs text-slate-400 mt-4">
                        Versi Aplikasi v1.0.0
                    </p>
                </div>

            </template>
        </UContainer>
    </div>
</template>