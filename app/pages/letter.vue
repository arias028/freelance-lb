<script setup lang="ts">
definePageMeta({
    middleware: 'auth'
})
</script>

<template>
    <div class="min-h-screen bg-[#F1F5F9] pb-24 text-[#334155]">
        <!-- Header -->
        <div class="bg-white border-b border-slate-200 sticky top-0 z-20">
            <UContainer class="py-4 flex justify-between items-center">
                <h1 class="text-xl font-bold text-[#0F172A]">Surat & Izin</h1>
                <UIcon name="i-heroicons-envelope" class="w-6 h-6 text-[#166534]" />
            </UContainer>
        </div>

        <UContainer class="py-20 flex flex-col items-center justify-center text-center space-y-6">

            <div
                class="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg ring-1 ring-slate-100 mb-2">
                <UIcon name="i-heroicons-wrench-screwdriver" class="w-12 h-12 text-[#166534]" />
            </div>

            <div class="max-w-md space-y-2">
                <h2 class="text-2xl font-bold text-[#0F172A]">Fitur Sedang Dikembangkan</h2>
                <!-- <p class="text-slate-500 text-lg leading-relaxed">
                    Modul permohonan surat izin dan cuti akan segera tersedia dalam update berikutnya.
                </p> -->
            </div>

            <div class="pt-6">
                <UButton to="/" color="primary" variant="soft" size="lg" icon="i-heroicons-arrow-left"
                    class="font-bold">
                    Kembali ke Dashboard
                </UButton>
            </div>

        </UContainer>
    </div>
</template>