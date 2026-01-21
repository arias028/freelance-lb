<script setup lang="ts">
import { startOfDay, subDays, addDays, format, getDay } from 'date-fns'
import { id } from 'date-fns/locale/id'

// SEO Meta
useHead({
    title: 'Payroll - Freelance LB',
    meta: [{ name: 'description', content: 'Rincian gaji, insentif, dan slip gaji mingguan.' }]
})

definePageMeta({
    middleware: 'auth'
})

const { getDetailPayroll } = useEmployee()

// --- State ---
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const selectedPeriodValue = ref('')

const periods = [
    { label: 'Minggu Ini', value: 'current' },
    { label: 'Minggu Lalu', value: 'last' }
]

const selectedPeriod = computed(() => {
    if (!selectedPeriodValue.value) {
        return { label: 'Pilih Minggu', value: '' }
    }
    return periods.find(p => p.value === selectedPeriodValue.value) ?? periods[0]
})

// --- Date Logic ---
function getWedTuePeriod(type: string) {
    const today = startOfDay(new Date())
    const dayOfWeek = getDay(today) // 0=Sun, 1=Mon, ..., 6=Sat

    // Hitung jarak ke Rabu terdekat (Rabu minggu ini atau sebelumnya)
    let diffToWed = 0
    if (dayOfWeek >= 3) { // Rabu - Sabtu
        diffToWed = dayOfWeek - 3
    } else { // Minggu - Selasa (Mundur ke Rabu minggu lalu)
        diffToWed = dayOfWeek - 3 + 7
    }

    const currentPeriodStart = subDays(today, diffToWed)
    const currentPeriodEnd = addDays(currentPeriodStart, 6)

    if (type === 'current') {
        return { start: currentPeriodStart, end: currentPeriodEnd }
    } else {
        return {
            start: subDays(currentPeriodStart, 7),
            end: subDays(currentPeriodEnd, 7)
        }
    }
}

// --- SSR DATA FETCHING (OPTIMIZED) ---
// Ganti onMounted fetch dengan useAsyncData
// watch: [selectedPeriodValue] -> otomatis fetch ulang saat dropdown berubah
const { data: payrollData, status } = await useAsyncData(
    'payroll-data',
    async () => {
        const { start, end } = getWedTuePeriod(selectedPeriodValue.value)
        const startStr = format(start, 'yyyy-MM-dd')
        const endStr = format(end, 'yyyy-MM-dd')

        return await getDetailPayroll(startStr, endStr)
    },
    {
        watch: [selectedPeriodValue], // Auto-refetch reactivity
        default: () => null
    }
)

const isLoading = computed(() => status.value === 'pending')

// --- Computed UI ---
const dateRangeLabel = computed(() => {
    const { start, end } = getWedTuePeriod(selectedPeriodValue.value)
    return `${format(start, 'dd MMM', { locale: id })} - ${format(end, 'dd MMM yyyy', { locale: id })}`
})

const toRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0)
}

// --- Dropdown Logic (Client Side Interactions) ---
function toggleDropdown() { isDropdownOpen.value = !isDropdownOpen.value }

function selectPeriod(value: string) {
    selectedPeriodValue.value = value
    isDropdownOpen.value = false
}

// Fix: Clear cached data on mount to ensure fresh state on client-side navigation
onMounted(() => {
    // Reset the data when navigating to this page via client-side navigation
    // This ensures "Data payroll belum tersedia" shows correctly until user selects a period
    if (!selectedPeriodValue.value) {
        clearNuxtData('payroll-data')
    }

    // Klik di luar dropdown untuk menutup
    document.addEventListener('click', (event) => {
        if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
            isDropdownOpen.value = false
        }
    })
})
</script>

<template>
    <div class="min-h-screen bg-[#F1F5F9] pb-24 text-[#334155]">
        <div class="bg-white border-b border-slate-200 sticky top-0 z-20">
            <UContainer class="py-4 flex justify-between items-center">
                <h1 class="text-xl font-bold text-[#0F172A]">Payroll Saya</h1>
                <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-[#166534]" />
            </UContainer>
        </div>

        <UContainer class="py-6 space-y-6">

            <div
                class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div class="w-full sm:w-auto">
                    <div ref="dropdownRef" class="relative">
                        <button @click="toggleDropdown"
                            class="w-full sm:w-72 h-14 px-4 flex items-center justify-between gap-3 text-lg font-bold text-[#0F172A] bg-gradient-to-r from-white to-slate-50 border-2 rounded-xl shadow-sm cursor-pointer transition-all duration-300"
                            :class="[
                                isDropdownOpen
                                    ? 'border-[#166534] ring-4 ring-[#166534]/10 shadow-lg'
                                    : 'border-slate-200 hover:border-[#166534]/50 hover:shadow-md'
                            ]">
                            <div class="flex items-center gap-3">
                                <span>{{ selectedPeriod?.label }}</span>
                            </div>
                            <UIcon name="i-heroicons-chevron-down-20-solid"
                                class="w-5 h-5 text-[#166534] transition-transform duration-300"
                                :class="{ 'rotate-180': isDropdownOpen }" />
                        </button>

                        <Transition enter-active-class="transition duration-200 ease-out"
                            enter-from-class="opacity-0 -translate-y-2 scale-95"
                            enter-to-class="opacity-100 translate-y-0 scale-100"
                            leave-active-class="transition duration-150 ease-in"
                            leave-from-class="opacity-100 translate-y-0 scale-100"
                            leave-to-class="opacity-0 -translate-y-2 scale-95">
                            <div v-if="isDropdownOpen"
                                class="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                <div class="py-1">
                                    <button v-for="period in periods" :key="period.value"
                                        @click="selectPeriod(period.value)"
                                        class="w-full px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200"
                                        :class="[
                                            selectedPeriodValue === period.value
                                                ? 'bg-[#166534]/10 text-[#166534]'
                                                : 'text-[#0F172A] hover:bg-slate-50'
                                        ]">
                                        <div class="flex items-center gap-3">
                                            <span class="font-semibold">{{ period.label }}</span>
                                        </div>

                                        <div v-if="selectedPeriodValue === period.value"
                                            class="p-1 bg-[#166534] rounded-full">
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>

                <div v-if="selectedPeriodValue" class="text-right w-full sm:w-auto">
                    <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">Periode</p>
                    <ClientOnly>
                        <p class="text-[#0F172A] font-bold text-lg">{{ dateRangeLabel }}</p>
                        <template #fallback>
                            <div class="h-7 w-40 bg-slate-200 rounded animate-pulse ml-auto"></div>
                        </template>
                    </ClientOnly>
                </div>
            </div>

            <div v-if="isLoading" class="space-y-4">
                <USkeleton class="h-40 w-full rounded-2xl" />
                <USkeleton class="h-64 w-full rounded-2xl" />
            </div>

            <div v-else-if="!payrollData" class="py-12 text-center text-slate-400">
                <div class="bg-slate-100 p-4 rounded-full inline-flex mb-4">
                    <UIcon name="i-heroicons-document-magnifying-glass" class="w-8 h-8" />
                </div>
                <p>Data payroll belum tersedia untuk periode ini.</p>
            </div>

            <template v-else>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div
                        class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <span class="text-xs text-slate-400 font-bold uppercase">Work Days</span>
                        <span class="text-2xl font-bold text-[#0F172A] mt-1">{{ payrollData.score_work }}</span>
                    </div>
                    <div
                        class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <span class="text-xs text-slate-400 font-bold uppercase">Lembur</span>
                        <span class="text-2xl font-bold text-amber-600 mt-1">{{ payrollData.score_lembur }}</span>
                    </div>
                    <div
                        class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <span class="text-xs text-slate-400 font-bold uppercase">Terlambat</span>
                        <span class="text-2xl font-bold text-red-600 mt-1">{{ payrollData.count_terlambat }}x</span>
                    </div>
                    <div
                        class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
                        <span class="text-xs text-slate-400 font-bold uppercase">Golongan</span>
                        <span class="text-xl font-bold text-[#166534] mt-1">{{ payrollData.golongan }}</span>
                    </div>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 class="font-bold text-[#0F172A]">Rincian Pendapatan</h3>
                    </div>
                    <div class="divide-y divide-slate-100">
                        <div class="p-4 flex justify-between items-center hover:bg-slate-50">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <UIcon name="i-heroicons-briefcase" class="w-5 h-5" />
                                </div>
                                <span class="font-medium">Upah Kerja</span>
                            </div>
                            <span class="font-bold text-[#0F172A]">{{ toRupiah(payrollData.rupiah_work) }}</span>
                        </div>
                        <div class="p-4 flex justify-between items-center hover:bg-slate-50">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-amber-50 rounded-lg text-amber-600">
                                    <UIcon name="i-heroicons-clock" class="w-5 h-5" />
                                </div>
                                <span class="font-medium">Upah Lembur</span>
                            </div>
                            <span class="font-bold text-[#0F172A]">{{ toRupiah(payrollData.rupiah_lembur) }}</span>
                        </div>
                        <div class="p-4 flex justify-between items-center hover:bg-slate-50">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <UIcon name="i-heroicons-gift" class="w-5 h-5" />
                                </div>
                                <span class="font-medium">Bonus / Insentif</span>
                            </div>
                            <span class="font-bold text-[#0F172A]">{{ toRupiah(payrollData.rupiah_bonus) }}</span>
                        </div>
                    </div>
                    <div class="p-6 bg-[#0F172A] text-white flex justify-between items-center">
                        <div>
                            <p class="text-xs text-slate-400 uppercase tracking-widest font-bold">Total Diterima</p>
                            <p class="text-xs text-slate-500 mt-1">Estimasi Transfer</p>
                        </div>
                        <div class="text-right">
                            <span class="text-2xl sm:text-3xl font-bold text-[#22c55e]">{{
                                toRupiah(payrollData.grand_total) }}</span>
                        </div>
                    </div>
                </div>

                <div class="text-center text-xs text-slate-400 mt-4 px-4 leading-relaxed">
                    *Total gaji di atas adalah estimasi sistem. Nilai akhir transfer mungkin berbeda sesuai
                    kebijakan perusahaan.
                </div>
            </template>

        </UContainer>
    </div>
</template>