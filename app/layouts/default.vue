<script setup lang="ts">
const route = useRoute()

// Konfigurasi Menu Navigasi
const navItems = [
    { name: 'Home', path: '/', icon: 'i-heroicons-home' },
    { name: 'Absen', path: '/absen', icon: 'i-heroicons-clock' },
    { name: 'Payroll', path: '/payroll', icon: 'i-heroicons-banknotes' },
    { name: 'Letter', path: '/letter', icon: 'i-heroicons-envelope' },
    { name: 'Profile', path: '/profile', icon: 'i-heroicons-user' }
]
</script>

<template>
    <div class="min-h-screen bg-gray-50 text-gray-900 font-sans">

        <main
            class="w-full max-w-md mx-auto min-h-screen pb-24 bg-white shadow-sm sm:my-4 sm:rounded-xl sm:overflow-hidden sm:border sm:border-gray-200">
            <slot />
        </main>

        <div
            class="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div class="grid h-full max-w-md grid-cols-5 mx-auto">

                <NuxtLink v-for="item in navItems" :key="item.name" :to="item.path"
                    class="inline-flex flex-col items-center justify-center px-2 group transition-all duration-200 ease-in-out relative">
                    <span v-if="route.path === item.path"
                        class="absolute top-0 w-8 h-0.5 bg-primary-600 rounded-b-full"></span>

                    <UIcon :name="item.icon" class="w-6 h-6 mb-1 transition-colors duration-200"
                        :class="route.path === item.path ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'" />

                    <span class="text-[10px] font-medium transition-colors duration-200"
                        :class="route.path === item.path ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'">
                        {{ item.name }}
                    </span>
                </NuxtLink>

            </div>
        </div>

    </div>
</template>