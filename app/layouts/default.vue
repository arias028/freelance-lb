<script setup lang="ts">
import { ref } from 'vue'

const route = useRoute()

// Konfigurasi Menu Navigasi
const navItems = [
    { name: 'Home', path: '/', icon: 'i-heroicons-home' },
    { name: 'Absen', path: '/absen', icon: 'i-heroicons-clock' },
    { name: 'Gaji', path: '/payroll', icon: 'i-heroicons-banknotes' },
    { name: 'Profile', path: '/profile', icon: 'i-heroicons-user' }
]

const { getFreelanceMenu } = useEmployee()

const isSidebarOpen = ref(false)

// Fetch sidebar menus dynamically from API
const { data: sidebarMenus, status } = await useAsyncData(
    'sidebar-menus',
    async () => await getFreelanceMenu(),
    { default: () => [] }
)

const isMenuLoading = computed(() => status.value === 'pending')

function handleMenuClick(url: string) {
    isSidebarOpen.value = false
    if (url) {
        // Adjust url format
        const path = url.startsWith('/') ? url : `/${url}`
        navigateTo(path)
    }
}
</script>

<template>
    <div class="min-h-screen bg-[#F1F5F9] font-sans antialiased text-[#334155]">

        <!-- Main Content Wrapper -->
        <main
            class="w-full max-w-md mx-auto min-h-screen pb-28 bg-[#F1F5F9] sm:bg-white sm:shadow-2xl sm:my-8 sm:rounded-[2rem] sm:overflow-hidden sm:border sm:border-slate-200 relative">
            <!-- Gradient Top Glow (Optional Cool Factor) -->
            <div
                class="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none z-0">
            </div>

            <div class="relative z-10">
                <slot />
            </div>
        </main>

        <!-- Cool Floating Navbar -->
        <div class="fixed bottom-0 left-0 z-50 w-full h-auto pointer-events-none">
            <div class="max-w-md mx-auto relative h-24 flex items-end justify-center pb-4 px-4 pointer-events-auto">

                <!-- Navbar Container -->
                <div
                    class="w-full bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-slate-300/50 rounded-2xl h-16 px-2 flex items-center justify-between relative ring-1 ring-slate-200/50">

                    <NuxtLink v-for="item in navItems" :key="item.name" :to="item.path"
                        class="relative flex-1 flex flex-col items-center justify-center h-full group transition-all duration-300 ease-out"
                        active-class="is-active">

                        <!-- Active Indicator Glow -->
                        <div
                            class="absolute inset-0 bg-green-500/10 rounded-xl scale-0 opacity-0 transition-all duration-300 group-[.is-active]:scale-90 group-[.is-active]:opacity-100">
                        </div>

                        <!-- Icon -->
                        <div class="relative transition-all duration-300 group-[.is-active]:-translate-y-1">
                            <UIcon :name="item.icon" class="w-6 h-6 transition-all duration-300" :class="route.path === item.path
                                ? 'text-[#166534] scale-110'
                                : 'text-slate-400 group-hover:text-[#0F172A]'" />
                        </div>

                        <!-- Label (Animated) -->
                        <span
                            class="text-[10px] font-bold mt-0.5 transition-all duration-300 absolute bottom-2 opacity-0 translate-y-2 group-[.is-active]:opacity-100 group-[.is-active]:translate-y-0 text-[#0F172A]">
                            {{ item.name }}
                        </span>

                        <!-- Active Dot/Bar -->
                        <span
                            class="absolute bottom-1 w-1 h-1 rounded-full bg-[#166534] transition-all duration-300 scale-0 group-[.is-active]:scale-100 group-[.is-active]:delay-75"></span>

                    </NuxtLink>

                    <!-- Hamburger Button -->
                    <button type="button" @click.prevent="isSidebarOpen = true"
                        class="relative flex-1 flex flex-col items-center justify-center h-full group transition-all duration-300 ease-out focus:outline-none">

                        <div class="relative transition-all duration-300 group-active:scale-90">
                            <UIcon name="i-heroicons-bars-3"
                                class="w-6 h-6 text-slate-400 group-hover:text-[#0F172A]" />
                        </div>
                        <span
                            class="text-[10px] font-bold mt-0.5 transition-all duration-300 absolute bottom-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 text-[#0F172A]">
                            Menu
                        </span>
                    </button>

                </div>
            </div>
        </div>

        <!-- Custom Sidebar Implementation -->
        <Teleport to="body">
            <!-- Backdrop -->
            <Transition enter-active-class="transition-opacity ease-linear duration-300" enter-from-class="opacity-0"
                enter-to-class="opacity-100" leave-active-class="transition-opacity ease-linear duration-300"
                leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="isSidebarOpen" @click="isSidebarOpen = false"
                    class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999998]">
                </div>
            </Transition>

            <!-- Slideover Panel -->
            <Transition enter-active-class="transition ease-in-out duration-300 transform"
                enter-from-class="-translate-x-full" enter-to-class="translate-x-0"
                leave-active-class="transition ease-in-out duration-300 transform" leave-from-class="translate-x-0"
                leave-to-class="-translate-x-full">
                <div v-if="isSidebarOpen"
                    class="fixed top-0 left-0 bottom-0 w-80 max-w-full bg-white shadow-2xl z-[999999] flex flex-col h-screen overflow-hidden">

                    <!-- Header -->
                    <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div>
                            <h3 class="text-lg font-bold text-slate-800">
                                Menu Navigasi
                            </h3>
                            <p class="text-xs text-slate-500 mt-1">Akses menu utama aplikasi dari sini</p>
                        </div>
                        <button @click="isSidebarOpen = false"
                            class="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="flex-1 overflow-y-auto w-full bg-slate-50/50 p-4">
                        <div v-if="isMenuLoading" class="flex justify-center p-8">
                            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-green-600" />
                        </div>
                        <div v-else-if="!sidebarMenus || sidebarMenus.length === 0"
                            class="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm mt-4">
                            <UIcon name="i-heroicons-folder-open" class="w-12 h-12 text-slate-300 mb-3" />
                            <p class="text-sm font-medium text-slate-600">Tidak ada menu tambahan.</p>
                        </div>
                        <div v-else class="space-y-1.5">
                            <button v-for="menu in sidebarMenus" :key="menu.id" @click="handleMenuClick(menu.url_menu)"
                                class="w-full flex items-center px-4 py-3.5 text-left bg-white border border-slate-100 rounded-xl hover:border-green-200 hover:shadow-md hover:shadow-green-50 z-10 hover:-translate-y-0.5 transition-all duration-300 group">
                                <div
                                    class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mr-4 group-hover:bg-green-100 transition-colors">
                                    <UIcon name="i-heroicons-folder"
                                        class="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                                </div>
                                <span
                                    class="text-base font-semibold text-slate-700 group-hover:text-green-700 transition-colors">{{
                                        menu.name_menu }}</span>
                                <UIcon name="i-heroicons-chevron-right"
                                    class="w-5 h-5 text-slate-300 ml-auto group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>

                </div>
            </Transition>
        </Teleport>

    </div>
</template>