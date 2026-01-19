    <script setup lang="ts">
    import { startOfDay, subDays, addDays, format, getDay } from 'date-fns'
    import { id } from 'date-fns/locale'

    definePageMeta({
        middleware: 'auth'
    })

    const { getDetailPayroll } = useEmployee()
    const isLoading = ref(false)
    const payrollData = ref<any>(null)

    // Options for Period
    const periods = [
        { label: 'Minggu Ini', value: 'current' },
        { label: 'Minggu Lalu', value: 'last' }
    ]
    const selectedPeriodValue = ref('current')

    // --- Date Logic (Wed - Tue) ---
    // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    function getWedTuePeriod(type: 'current' | 'last') {
        const today = startOfDay(new Date())
        const dayOfWeek = getDay(today) // 0-6

        // Calculate distance to most recent Wednesday
        // If today is Wed (3), diff is 0.
        // If today is Thu (4), diff is 1.
        // If today is Tue (2), we need prev Wed -> diff is (2 + 7 - 3) % 7? No.
        // Lets iterate back.

        let diffToWed = 0
        if (dayOfWeek >= 3) {
            diffToWed = dayOfWeek - 3
        } else {
            // Sun(0), Mon(1), Tue(2) -> Need last week's Wed
            // Sun(0) -> -3? No. Sat(6), Fri(5), Thu(4), Wed(3)
            // 0 -> Wed is -4 days.
            // 1 -> Wed is -5 days.
            // 2 -> Wed is -6 days.
            // Formula: (dayOfWeek + 7 - 3) % 7 ... wait.
            // 0 + 4 = 4 days ago? 
            // Simple: difference from 3.
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

    const dateRangeLabel = computed(() => {
        const periodValue = selectedPeriodValue.value || 'current'
        const { start, end } = getWedTuePeriod(periodValue as 'current' | 'last')
        return `${format(start, 'dd MMM', { locale: id })} - ${format(end, 'dd MMM yyyy', { locale: id })}`
    })

    // Currency Formatter
    const toRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
    }

    async function fetchPayroll() {
        isLoading.value = true
        payrollData.value = null

        try {
            const periodValue = selectedPeriodValue.value || 'current'
            const { start, end } = getWedTuePeriod(periodValue as 'current' | 'last')
            const startStr = format(start, 'yyyy-MM-dd')
            const endStr = format(end, 'yyyy-MM-dd')

            const data = await getDetailPayroll(startStr, endStr)
            if (data) {
                payrollData.value = data
            }
        } catch (e) {
            console.error(e)
        } finally {
            isLoading.value = false
        }
    }

    // Watch selection
    watch(selectedPeriodValue, () => {
        fetchPayroll()
    })

    onMounted(() => {
        fetchPayroll()
    })
</script>

    <template>
        <div class="min-h-screen bg-[#F1F5F9] pb-24 text-[#334155]">
            <!-- Header -->
            <div class="bg-white border-b border-slate-200 sticky top-0 z-20">
                <UContainer class="py-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-[#0F172A]">Payroll Saya</h1>
                    <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-[#166534]" />
                </UContainer>
            </div>

            <UContainer class="py-6 space-y-6">

                <!-- Filter Section -->
                <div
                    class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div class="w-full sm:w-auto">
                        <div class="relative">
                            <select v-model="selectedPeriodValue"
                                class="w-full sm:w-72 h-14 px-4 pr-10 text-lg font-bold text-[#0F172A] bg-white border-2 border-slate-200 rounded-xl shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#166534]/30 focus:border-[#166534] hover:border-[#166534] transition-all duration-200">
                                <option v-for="period in periods" :key="period.value" :value="period.value">
                                    {{ period.label }}
                                </option>
                            </select>
                            <!-- Custom dropdown arrow -->
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <UIcon name="i-heroicons-chevron-down-20-solid" class="w-5 h-5 text-[#166534]" />
                            </div>
                        </div>
                    </div>
                    <div class="text-right w-full sm:w-auto">
                        <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">Periode</p>
                        <p class="text-[#0F172A] font-bold text-lg">{{ dateRangeLabel }}</p>
                    </div>
                </div>

                <!-- Loading -->
                <div v-if="isLoading" class="space-y-4">
                    <USkeleton class="h-40 w-full rounded-2xl" />
                    <USkeleton class="h-64 w-full rounded-2xl" />
                </div>

                <!-- Empty State -->
                <div v-else-if="!payrollData" class="py-12 text-center text-slate-400">
                    <div class="bg-slate-100 p-4 rounded-full inline-flex mb-4">
                        <UIcon name="i-heroicons-document-magnifying-glass" class="w-8 h-8" />
                    </div>
                    <p>Data payroll belum tersedia untuk periode ini.</p>
                </div>

                <!-- Data Content -->
                <template v-else>
                    <!-- Summary Card -->
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

                    <!-- Financial Breakdown -->
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

                    <!-- Footer Note -->
                    <div class="text-center text-xs text-slate-400 mt-4 px-4 leading-relaxed">
                        *Total gaji di atas adalah estimasi sistem. Nilai akhir transfer mungkin berbeda sesuai
                        kebijakan
                        perusahaan.
                    </div>
                </template>

            </UContainer>
        </div>
    </template>