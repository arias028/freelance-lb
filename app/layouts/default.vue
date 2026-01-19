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

                </div>
            </div>
        </div>

    </div>
</template>