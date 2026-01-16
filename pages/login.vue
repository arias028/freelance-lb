<script setup lang="ts">
definePageLayout('auth')

const { login } = useAuth()
const toast = useToast()

const form = reactive({
    kode_user: '',
    password: ''
})

const isLoading = ref(false)

async function handleLogin() {
    if (!form.kode_user || !form.password) {
        toast.add({ title: 'Error', description: 'Harap isi semua kolom', color: 'red' })
        return
    }

    isLoading.value = true
    try {
        await login(form.kode_user, form.password)
        toast.add({ title: 'Success', description: 'Login berhasil!', color: 'green' })
    } catch (error: any) {
        toast.add({ title: 'Gagal', description: error.message, color: 'red' })
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="w-full max-w-md">
        <UCard>
            <template #header>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white text-center">
                    Freelance Login
                </h1>
                <p class="text-sm text-gray-500 text-center mt-1">
                    App ID: 16 (Laskar Buah)
                </p>
            </template>

            <form @submit.prevent="handleLogin" class="space-y-4">
                <UFormGroup label="Kode User" name="kode_user">
                    <UInput v-model="form.kode_user" icon="i-heroicons-user" placeholder="Masukkan Kode User"
                        autofocus />
                </UFormGroup>

                <UFormGroup label="Password" name="password">
                    <UInput v-model="form.password" type="password" icon="i-heroicons-lock-closed"
                        placeholder="Masukkan Password" />
                </UFormGroup>

                <UButton type="submit" block :loading="isLoading" color="primary">
                    Masuk Dashboard
                </UButton>
            </form>
        </UCard>
    </div>
</template>