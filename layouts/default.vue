<script setup lang="ts">
const route = useRoute()

// Navigation items configuration
const navItems = [
    { name: 'Home', path: '/', icon: 'i-heroicons-home' },
    { name: 'Absen', path: '/absen', icon: 'i-heroicons-clock' },
    { name: 'Payroll', path: '/payroll', icon: 'i-heroicons-banknotes' },
    { name: 'Letter', path: '/letter', icon: 'i-heroicons-envelope' },
    { name: 'Profile', path: '/profile', icon: 'i-heroicons-user' }
]
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">

        <main class="pb-24 p-4">
            <slot />
        </main>

        <div
            class="fixed bottom-0 left-0 z-50 w-full h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div class="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">

                <NuxtLink v-for="item in navItems" :key="item.name" :to="item.path"
                    class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors"
                    active-class="text-primary-600 dark:text-primary-400">
                    <UIcon :name="item.icon"
                        class="w-6 h-6 mb-1 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400"
                        :class="route.path === item.path ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'" />

                    <span
                        class="text-xs transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400"
                        :class="route.path === item.path ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'">
                        {{ item.name }}
                    </span>
                </NuxtLink>

            </div>
        </div>

    </div>
</template>