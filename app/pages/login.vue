<script setup lang="ts">
definePageMeta({
    layout: 'auth'
})

const { login } = useAuth()
const toast = useToast()

const form = reactive({
    kode_user: '',
    password: ''
})

const isLoading = ref(false)

async function handleLogin() {
    if (!form.kode_user || !form.password) {
        toast.add({ title: 'Error', description: 'Harap isi semua kolom', color: 'error' })
        return
    }

    isLoading.value = true
    try {
        await login(form.kode_user, form.password)
        toast.add({ title: 'Success', description: 'Login berhasil!', color: 'success' })
    } catch (error: any) {
        toast.add({ title: 'Gagal', description: error.message, color: 'error' })
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
            </template>

            <form @submit.prevent="handleLogin" class="space-y-4">
                <UFormField label="Kode User" name="kode_user">
                    <UInput v-model="form.kode_user" icon="i-heroicons-user" placeholder="Masukkan Kode User"
                        autofocus />
                </UFormField>

                <UFormField label="Password" name="password">
                    <UInput v-model="form.password" type="password" icon="i-heroicons-lock-closed"
                        placeholder="Masukkan Password" />
                </UFormField>

                <UButton type="submit" block :loading="isLoading" color="primary">
                    Masuk Dashboard
                </UButton>
            </form>
        </UCard>
    </div>
</template>