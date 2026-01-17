<script setup lang="ts">
// Proteksi halaman agar tidak bisa diakses tanpa login
definePageMeta({
    middleware: 'auth'
})

const { user, logout } = useAuth()
const toast = useToast()
const isLoading = ref(false)

async function handleLogout() {
    isLoading.value = true
    try {
        await logout()
        toast.add({ title: 'Logout', description: 'Anda telah keluar.', color: 'neutral' })
    } catch (e) {
        // Fallback jika terjadi sesuatu, paksa redirect
        navigateTo('/login')
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="max-w-md mx-auto mt-10 space-y-6">

        <UCard>
            <template #header>
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                        <UIcon name="i-heroicons-user" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold">Profil Karyawan</h2>
                        <p class="text-gray-500 text-sm">Freelance Laskar Buah</p>
                    </div>
                </div>
            </template>

            <div class="space-y-4">
                <div>
                    <label class="text-sm font-medium text-gray-500">Nama Lengkap</label>
                    <p class="text-lg font-semibold">{{ user?.nama || '-' }}</p>
                </div>

                <UDivider />

                <div>
                    <label class="text-sm font-medium text-gray-500">ID Freelance</label>
                    <p class="font-mono text-gray-700 dark:text-gray-300">#{{ user?.id || '0' }}</p>
                </div>
            </div>
        </UCard>

        <UButton block color="error" variant="soft" size="lg" :loading="isLoading"
            icon="i-heroicons-arrow-right-on-rectangle" @click="handleLogout">
            Keluar Aplikasi
        </UButton>

    </div>
</template>