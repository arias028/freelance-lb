<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

// SEO Meta
useHead({
    title: 'Manajemen Jadwal - Freelance LB',
    meta: [{ name: 'description', content: 'Pengaturan jadwal harian staff Freelance LB.' }]
})

definePageMeta({ middleware: 'auth' })

const { getFreelanceTeam, getShiftList, getJadwalHariIni, setJadwal, deleteJadwal } = useEmployee()
const { user } = useAuth()
const toast = useCustomToast()

// States
const teamList = ref<any[]>([])
const shiftList = ref<any[]>([])
const jadwalHariIni = ref<any[]>([])
const isLoadingTeams = ref(false)
const isLoadingShifts = ref(false)
const isLoadingJadwal = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref<number | null>(null) // Track ID jadwal yang sedang didelete
const isDeleteDialogOpen = ref(false)
const scheduleToDelete = ref<number | null>(null)

// Form States
const form = ref({
    id_team: 1,
    id_freelance: null as number | null,
    tgl: '',
    option: 1, // 1: Normal, 2: Lembur
    selectedShift: null as any
})

// Options for teams & jenis
const teamOptions = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `TIM ${i + 1}` }))
const typeOptions = [
    { value: 1, label: 'Normal' },
    { value: 2, label: 'Lembur' }
]

// Dropdown States
const isTeamDropdownOpen = ref(false)
const isFreelanceDropdownOpen = ref(false)
const isOptionDropdownOpen = ref(false)
const isShiftDropdownOpen = ref(false)

const teamDropdownRef = ref<HTMLElement | null>(null)
const freelanceDropdownRef = ref<HTMLElement | null>(null)
const optionDropdownRef = ref<HTMLElement | null>(null)
const shiftDropdownRef = ref<HTMLElement | null>(null)

const toggleTeamDropdown = () => isTeamDropdownOpen.value = !isTeamDropdownOpen.value
const toggleFreelanceDropdown = () => { if (!isLoadingTeams.value) isFreelanceDropdownOpen.value = !isFreelanceDropdownOpen.value }
const toggleOptionDropdown = () => isOptionDropdownOpen.value = !isOptionDropdownOpen.value
const toggleShiftDropdown = () => { if (!isLoadingShifts.value && form.value.tgl && shiftList.value.length > 0) isShiftDropdownOpen.value = !isShiftDropdownOpen.value }

const selectTeam = (val: number) => { form.value.id_team = val; isTeamDropdownOpen.value = false }
const selectFreelance = (val: number | null) => { form.value.id_freelance = val; isFreelanceDropdownOpen.value = false }
const selectOption = (val: number) => { form.value.option = val; isOptionDropdownOpen.value = false }
const selectShift = (val: any) => { form.value.selectedShift = val; isShiftDropdownOpen.value = false }

const selectedTeamLabel = computed(() => teamOptions.find(o => o.value === form.value.id_team)?.label || 'Pilih Tim')
const selectedOptionLabel = computed(() => typeOptions.find(o => o.value === form.value.option)?.label || 'Pilih Jenis')
const selectedFreelanceLabel = computed(() => {
    if (!form.value.id_freelance) return 'Pilih anggota tim'
    const member = teamList.value.find(f => f.id === form.value.id_freelance)
    return member ? member.username : 'Pilih anggota tim'
})
const selectedShiftLabel = computed(() => {
    const shift = form.value.selectedShift
    if (!shift) return 'Pilih shift'
    const masuk = shift.masuk ? shift.masuk.substring(11, 16) : '-'
    const pulang = shift.pulang ? shift.pulang.substring(11, 16) : '-'
    return `${masuk} - ${pulang}`
})

// Default to today
onMounted(async () => {
    form.value.tgl = new Date().toISOString().split('T')[0] || ''
    await loadInitialData()

    document.addEventListener('click', closeDropdownsOnOutsideClick)
})

onUnmounted(() => {
    document.removeEventListener('click', closeDropdownsOnOutsideClick)
})

const closeDropdownsOnOutsideClick = (event: MouseEvent) => {
    const target = event.target as Node
    if (teamDropdownRef.value && !teamDropdownRef.value.contains(target)) isTeamDropdownOpen.value = false
    if (freelanceDropdownRef.value && !freelanceDropdownRef.value.contains(target)) isFreelanceDropdownOpen.value = false
    if (optionDropdownRef.value && !optionDropdownRef.value.contains(target)) isOptionDropdownOpen.value = false
    if (shiftDropdownRef.value && !shiftDropdownRef.value.contains(target)) isShiftDropdownOpen.value = false
}

const loadInitialData = async () => {
    isLoadingJadwal.value = true
    try {
        jadwalHariIni.value = await getJadwalHariIni() || []
    } catch (e) {
        console.error('Error loading jadwal:', e)
    } finally {
        isLoadingJadwal.value = false
    }
    await loadTeamMembers()
    await loadShifts()
}

const loadTeamMembers = async () => {
    isLoadingTeams.value = true
    try {
        const teams = await getFreelanceTeam(form.value.id_team)
        teamList.value = teams || []
    } catch (e) {
        console.error('Error loading team members:', e)
    } finally {
        isLoadingTeams.value = false
    }
}

// Watch for team change to reload members
watch(() => form.value.id_team, async () => {
    form.value.id_freelance = null
    await loadTeamMembers()
})

// Watch for date or option changes to reload shifts
watch([() => form.value.tgl, () => form.value.option], async () => {
    form.value.selectedShift = null
    await loadShifts()
})

const loadShifts = async () => {
    if (!form.value.tgl) return
    isLoadingShifts.value = true
    try {
        const shifts = await getShiftList(form.value.tgl, form.value.option)
        shiftList.value = shifts || []
    } catch (e) {
        console.error('Error loading shifts:', e)
    } finally {
        isLoadingShifts.value = false
    }
}

// Helper formats
const formatTableDate = (dtStr: string) => {
    if (!dtStr) return '-'
    const d = new Date(dtStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}-${month}-${year} ${hours}:${minutes}`
}

const submitForm = async () => {
    if (!form.value.id_freelance || !form.value.selectedShift) {
        toast.add({ title: 'Peringatan', description: 'Pilih Anggota Tim dan Shift terlebih dahulu.', color: 'warning' })
        return
    }

    isSubmitting.value = true
    try {
        const usrId = user.value?.id || 0
        const res: any = await setJadwal(
            form.value.option,
            form.value.id_freelance,
            form.value.selectedShift.nama_shift,
            form.value.selectedShift.masuk,
            form.value.selectedShift.pulang,
            usrId
        )

        if (res && res.success) {
            toast.add({ title: 'Sukses', description: res.message || 'Jadwal berhasil ditambahkan.', color: 'success' })
            form.value.id_freelance = null
            form.value.selectedShift = null
            await refreshJadwal()
        } else {
            toast.add({ title: 'Gagal', description: res?.message || 'Gagal menyimpan jadwal.', color: 'error' })
        }
    } catch (e) {
        toast.add({ title: 'Error', description: 'Terjadi kesalahan sistem saat menyimpan jadwal.', color: 'error' })
        console.error(e)
    } finally {
        isSubmitting.value = false
    }
}

const refreshJadwal = async () => {
    isLoadingJadwal.value = true
    try {
        jadwalHariIni.value = await getJadwalHariIni() || []
    } catch (e) {
        console.error(e)
    } finally {
        isLoadingJadwal.value = false
    }
}

const confirmDelete = (id_jadwal: number) => {
    scheduleToDelete.value = id_jadwal
    isDeleteDialogOpen.value = true
}

const cancelDelete = () => {
    isDeleteDialogOpen.value = false
    scheduleToDelete.value = null
}

const executeDelete = async () => {
    if (scheduleToDelete.value === null) return
    const id_jadwal = scheduleToDelete.value
    isDeleteDialogOpen.value = false
    isDeleting.value = id_jadwal
    try {
        const usrId = user.value?.id || 0
        const res: any = await deleteJadwal(id_jadwal, usrId)
        if (res && res.success) {
            toast.add({ title: 'Sukses', description: res.message || 'Jadwal dihapus.', color: 'success' })
            await refreshJadwal()
        } else {
            toast.add({ title: 'Gagal', description: res?.message || 'Gagal menghapus jadwal.', color: 'error' })
        }
    } catch (e) {
        toast.add({ title: 'Error', description: 'Terjadi kesalahan sistem saat menghapus.', color: 'error' })
        console.error(e)
    } finally {
        isDeleting.value = null
        scheduleToDelete.value = null
    }
}
</script>

<template>
    <div class="min-h-screen bg-[#F1F5F9] pb-20">
        <!-- Top bar sticky -->
        <div class="bg-white border-b border-slate-200 sticky top-0 z-20">
            <UContainer class="py-4 flex items-center justify-between">
                <h1 class="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                    <UIcon name="i-heroicons-calendar-days" class="w-6 h-6 text-[#166534]" />
                    Manajemen Jadwal Tim
                </h1>
            </UContainer>
        </div>

        <UContainer class="py-8 space-y-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <!-- KIRI: FORM SET JADWAL -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-1">
                            <h2 class="font-bold text-[#0F172A] text-lg">Tambah Jadwal Baru</h2>
                            <p class="text-xs text-slate-500">Atur jadwal/shift untuk anggota tim</p>
                        </div>

                        <div class="p-6 space-y-5">
                            <!-- Pilihan Tim -->
                            <div>
                                <label class="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2 block">
                                    Pilih Tim <span class="text-red-500">*</span>
                                </label>
                                <div ref="teamDropdownRef" class="relative">
                                    <button type="button" @click="toggleTeamDropdown"
                                        class="w-full min-h-[48px] px-4 flex items-center justify-between gap-3 text-base text-[#334155] bg-white border-2 rounded-xl cursor-pointer transition-all duration-300"
                                        :class="[isTeamDropdownOpen ? 'border-[#166534] ring-4 ring-[#166534]/15 shadow-sm' : 'border-[#CBD5E1] hover:border-[#166534]/50']">
                                        <span>{{ selectedTeamLabel }}</span>
                                        <UIcon name="i-heroicons-chevron-down-20-solid"
                                            class="w-5 h-5 text-[#64748B] transition-transform duration-300"
                                            :class="{ 'rotate-180': isTeamDropdownOpen }" />
                                    </button>

                                    <Transition enter-active-class="transition duration-200 ease-out"
                                        enter-from-class="opacity-0 -translate-y-2 scale-95"
                                        enter-to-class="opacity-100 translate-y-0 scale-100"
                                        leave-active-class="transition duration-150 ease-in"
                                        leave-from-class="opacity-100 translate-y-0 scale-100"
                                        leave-to-class="opacity-0 -translate-y-2 scale-95">
                                        <div v-if="isTeamDropdownOpen"
                                            class="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                            <div class="py-1 max-h-60 overflow-y-auto">
                                                <button v-for="opt in teamOptions" :key="opt.value" type="button"
                                                    @click="selectTeam(opt.value)"
                                                    class="w-full px-4 py-3 flex items-center justify-between gap-3 transition-colors duration-200"
                                                    :class="[form.id_team === opt.value ? 'bg-[#166534]/10 text-[#166534] font-semibold' : 'text-[#334155] hover:bg-slate-50']">
                                                    <span>{{ opt.label }}</span>
                                                    <div v-if="form.id_team === opt.value"
                                                        class="p-1 bg-[#166534] rounded-full"></div>
                                                </button>
                                            </div>
                                        </div>
                                    </Transition>
                                </div>
                            </div>

                            <!-- Anggota Tim -->
                            <div>
                                <label class="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2 block">
                                    Anggota Tim <span class="text-red-500">*</span>
                                </label>
                                <div ref="freelanceDropdownRef" class="relative">
                                    <button type="button" @click="toggleFreelanceDropdown" :disabled="isLoadingTeams"
                                        class="w-full min-h-[48px] px-4 flex items-center justify-between gap-3 text-base text-[#334155] bg-white border-2 rounded-xl transition-all duration-300"
                                        :class="[
                                            isFreelanceDropdownOpen ? 'border-[#166534] ring-4 ring-[#166534]/15 shadow-sm' : 'border-[#CBD5E1] hover:border-[#166534]/50',
                                            isLoadingTeams ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'cursor-pointer'
                                        ]">
                                        <span :class="{ 'text-[#94A3B8]': !form.id_freelance }">
                                            {{ isLoadingTeams ? 'Memuat data...' : selectedFreelanceLabel }}
                                        </span>
                                        <UIcon name="i-heroicons-chevron-down-20-solid"
                                            class="w-5 h-5 text-[#64748B] transition-transform duration-300"
                                            :class="{ 'rotate-180': isFreelanceDropdownOpen }" />
                                    </button>

                                    <Transition enter-active-class="transition duration-200 ease-out"
                                        enter-from-class="opacity-0 -translate-y-2 scale-95"
                                        enter-to-class="opacity-100 translate-y-0 scale-100"
                                        leave-active-class="transition duration-150 ease-in"
                                        leave-from-class="opacity-100 translate-y-0 scale-100"
                                        leave-to-class="opacity-0 -translate-y-2 scale-95">
                                        <div v-if="isFreelanceDropdownOpen"
                                            class="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                            <div class="py-1 max-h-60 overflow-y-auto">
                                                <button type="button" @click="selectFreelance(null)"
                                                    class="w-full px-4 py-3 text-left text-[#94A3B8] hover:bg-slate-50 transition-colors">
                                                    Pilih anggota tim
                                                </button>
                                                <button v-for="member in teamList" :key="member.id" type="button"
                                                    @click="selectFreelance(member.id)"
                                                    class="w-full px-4 py-3 flex items-center justify-between gap-3 transition-colors duration-200"
                                                    :class="[form.id_freelance === member.id ? 'bg-[#166534]/10 text-[#166534] font-semibold' : 'text-[#334155] hover:bg-slate-50']">
                                                    <span>{{ member.username }}</span>
                                                    <div v-if="form.id_freelance === member.id"
                                                        class="p-1 bg-[#166534] rounded-full"></div>
                                                </button>
                                            </div>
                                        </div>
                                    </Transition>
                                </div>
                            </div>

                            <!-- Jenis Jadwal -->
                            <div>
                                <label class="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2 block">
                                    Jenis Jadwal <span class="text-red-500">*</span>
                                </label>
                                <div ref="optionDropdownRef" class="relative">
                                    <button type="button" @click="toggleOptionDropdown"
                                        class="w-full min-h-[48px] px-4 flex items-center justify-between gap-3 text-base text-[#334155] bg-white border-2 rounded-xl cursor-pointer transition-all duration-300"
                                        :class="[isOptionDropdownOpen ? 'border-[#166534] ring-4 ring-[#166534]/15 shadow-sm' : 'border-[#CBD5E1] hover:border-[#166534]/50']">
                                        <span>{{ selectedOptionLabel }}</span>
                                        <UIcon name="i-heroicons-chevron-down-20-solid"
                                            class="w-5 h-5 text-[#64748B] transition-transform duration-300"
                                            :class="{ 'rotate-180': isOptionDropdownOpen }" />
                                    </button>

                                    <Transition enter-active-class="transition duration-200 ease-out"
                                        enter-from-class="opacity-0 -translate-y-2 scale-95"
                                        enter-to-class="opacity-100 translate-y-0 scale-100"
                                        leave-active-class="transition duration-150 ease-in"
                                        leave-from-class="opacity-100 translate-y-0 scale-100"
                                        leave-to-class="opacity-0 -translate-y-2 scale-95">
                                        <div v-if="isOptionDropdownOpen"
                                            class="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                            <div class="py-1 max-h-60 overflow-y-auto">
                                                <button v-for="opt in typeOptions" :key="opt.value" type="button"
                                                    @click="selectOption(opt.value)"
                                                    class="w-full px-4 py-3 flex items-center justify-between gap-3 transition-colors duration-200"
                                                    :class="[form.option === opt.value ? 'bg-[#166534]/10 text-[#166534] font-semibold' : 'text-[#334155] hover:bg-slate-50']">
                                                    <span>{{ opt.label }}</span>
                                                    <div v-if="form.option === opt.value"
                                                        class="p-1 bg-[#166534] rounded-full"></div>
                                                </button>
                                            </div>
                                        </div>
                                    </Transition>
                                </div>
                            </div>

                            <!-- Tanggal -->
                            <div>
                                <label class="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2 block">
                                    Tanggal Masuk <span class="text-red-500">*</span>
                                </label>
                                <input v-model="form.tgl" type="date"
                                    class="block w-full min-h-[48px] px-4 py-3 bg-white border-2 border-[#CBD5E1] rounded-xl text-[#334155] text-base focus:outline-none focus:border-[#166534] focus:ring-4 focus:ring-[#166534]/15 transition-colors duration-200" />
                            </div>

                            <!-- Shift -->
                            <div>
                                <label class="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2 block">
                                    Pilih Shift <span class="text-red-500">*</span>
                                </label>
                                <div ref="shiftDropdownRef" class="relative">
                                    <button type="button" @click="toggleShiftDropdown"
                                        :disabled="!form.tgl || shiftList.length === 0 || isLoadingShifts"
                                        class="w-full min-h-[48px] px-4 flex items-center justify-between gap-3 text-base text-[#334155] bg-white border-2 rounded-xl transition-all duration-300"
                                        :class="[
                                            isShiftDropdownOpen ? 'border-[#166534] ring-4 ring-[#166534]/15 shadow-sm' : 'border-[#CBD5E1] hover:border-[#166534]/50',
                                            (!form.tgl || shiftList.length === 0 || isLoadingShifts) ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'cursor-pointer'
                                        ]">
                                        <span :class="{ 'text-[#94A3B8]': !form.selectedShift }">
                                            {{ isLoadingShifts ? 'Memuat data...' : (shiftList.length === 0 && form.tgl
                                                ? 'Tidak ada shift tersedia' : selectedShiftLabel) }}
                                        </span>
                                        <UIcon name="i-heroicons-chevron-down-20-solid"
                                            class="w-5 h-5 text-[#64748B] transition-transform duration-300"
                                            :class="{ 'rotate-180': isShiftDropdownOpen }" />
                                    </button>

                                    <Transition enter-active-class="transition duration-200 ease-out"
                                        enter-from-class="opacity-0 -translate-y-2 scale-95"
                                        enter-to-class="opacity-100 translate-y-0 scale-100"
                                        leave-active-class="transition duration-150 ease-in"
                                        leave-from-class="opacity-100 translate-y-0 scale-100"
                                        leave-to-class="opacity-0 -translate-y-2 scale-95">
                                        <div v-if="isShiftDropdownOpen"
                                            class="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                            <div class="py-1 max-h-60 overflow-y-auto">
                                                <button type="button" @click="selectShift(null)"
                                                    class="w-full px-4 py-3 text-left text-[#94A3B8] hover:bg-slate-50 transition-colors">
                                                    Pilih shift
                                                </button>
                                                <button v-for="shift in shiftList" :key="shift.id || shift.nama_shift"
                                                    type="button" @click="selectShift(shift)"
                                                    class="w-full px-4 py-3 flex items-center justify-between gap-3 transition-colors duration-200"
                                                    :class="[form.selectedShift?.nama_shift === shift.nama_shift ? 'bg-[#166534]/10 text-[#166534] font-semibold' : 'text-[#334155] hover:bg-slate-50']">
                                                    <span>{{ shift.masuk ? shift.masuk.substring(11, 16) : '-' }} - {{
                                                        shift.pulang ? shift.pulang.substring(11, 16) : '-' }}</span>
                                                    <div v-if="form.selectedShift?.nama_shift === shift.nama_shift"
                                                        class="p-1 bg-[#166534] rounded-full"></div>
                                                </button>
                                            </div>
                                        </div>
                                    </Transition>
                                </div>

                                <div v-if="form.selectedShift"
                                    class="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-3">
                                    <UIcon name="i-heroicons-information-circle"
                                        class="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div class="text-sm text-emerald-800">
                                        Jadwal akan dimulai pada <strong class="font-mono">{{
                                            formatTableDate(form.selectedShift.masuk) }}</strong> dan berakhir <strong
                                            class="font-mono">{{ formatTableDate(form.selectedShift.pulang) }}</strong>.
                                    </div>
                                </div>
                            </div>

                            <div class="pt-4 border-t border-slate-100">
                                <button type="button" :disabled="isSubmitting" @click="submitForm"
                                    class="w-full flex items-center justify-center gap-3 min-h-[50px] py-3.5 px-6 border-0 rounded-xl text-base font-bold text-white bg-[#166534] hover:bg-[#14532D] focus:outline-none focus:ring-4 focus:ring-[#166534]/30 shadow-lg shadow-[#166534]/25 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 active:scale-[0.98]">
                                    <UIcon v-if="isSubmitting" name="i-heroicons-arrow-path"
                                        class="w-5 h-5 animate-spin" />
                                    <UIcon v-else name="i-heroicons-plus-circle" class="w-5 h-5" />
                                    <span>Simpan Jadwal</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- KANAN: LIST JADWAL -->
                <div class="lg:col-span-2">
                    <section
                        class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 class="font-bold text-[#0F172A] text-lg">Jadwal Aktif Hari Ini</h2>
                            <p class="text-xs text-slate-500 mt-1">Daftar anggota tim yang dijadwalkan hari ini.</p>
                        </div>

                        <div class="overflow-x-auto flex-1">
                            <table class="w-full text-left border-collapse text-sm">
                                <thead class="bg-slate-50/50 text-[#0F172A] font-bold border-b border-slate-200">
                                    <tr>
                                        <th class="p-4 text-center whitespace-nowrap w-16">Aksi</th>
                                        <th class="p-4 whitespace-nowrap">Anggota Tim</th>
                                        <th class="p-4 whitespace-nowrap">Shift</th>
                                        <th class="p-4 whitespace-nowrap">Jam Kerja</th>
                                        <th class="p-4 text-center whitespace-nowrap">Jenis</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr v-if="isLoadingJadwal && jadwalHariIni.length === 0">
                                        <td colspan="5" class="p-12 text-center">
                                            <UIcon name="i-heroicons-arrow-path"
                                                class="w-8 h-8 animate-spin mx-auto text-slate-400 mb-3" />
                                            <p class="text-slate-500 font-medium">Memuat data jadwal...</p>
                                        </td>
                                    </tr>
                                    <tr v-else-if="jadwalHariIni.length === 0">
                                        <td colspan="5" class="p-16 text-center text-slate-400">
                                            <div
                                                class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-slate-100">
                                                <UIcon name="i-heroicons-calendar" class="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p class="font-medium text-[#0F172A]">Belum Ada Jadwal</p>
                                            <p class="text-sm mt-1">Silakan tambahkan jadwal melalui form di samping.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr v-for="row in jadwalHariIni" :key="row.id"
                                        class="hover:bg-slate-50/80 transition-colors">
                                        <!-- Column 1: Aksi -->
                                        <td class="p-4 text-center whitespace-nowrap">
                                            <button type="button" :disabled="isDeleting === row.id"
                                                @click="confirmDelete(row.id)"
                                                class="p-2 inline-flex justify-center items-center rounded-lg transition-colors focus:outline-none"
                                                :class="isDeleting === row.id ? 'text-red-400 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'">
                                                <UIcon v-if="isDeleting === row.id" name="i-heroicons-arrow-path"
                                                    class="w-5 h-5 animate-spin" />
                                                <UIcon v-else name="i-heroicons-trash" class="w-5 h-5" />
                                            </button>
                                        </td>

                                        <!-- Column 2: Anggota -->
                                        <td class="p-4">
                                            <div class="font-bold text-[#0F172A] whitespace-nowrap">
                                                {{ row.nama_lengkap }}
                                            </div>
                                        </td>

                                        <!-- Column 3: Shift -->
                                        <td class="p-4 font-bold text-slate-700 whitespace-nowrap">
                                            {{ row.shift }}
                                        </td>

                                        <!-- Column 4: Jam -->
                                        <td class="p-4 whitespace-nowrap text-[#0F172A] font-mono text-sm">
                                            {{ formatTableDate(row.start_date) }} - {{ formatTableDate(row.end_date) }}
                                        </td>

                                        <!-- Column 5: Jenis -->
                                        <td class="p-4 text-center whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                                                :class="row.is_lembur === 'true' ? 'bg-amber-100 text-amber-800' : 'bg-[#166534]/10 text-[#166534]'">
                                                {{ row.is_lembur === 'true' ? 'Lembur' : 'Normal' }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </UContainer>

        <!-- Delete Confirmation Modal -->
        <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="isDeleteDialogOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="cancelDelete"></div>

                <!-- Modal Box -->
                <Transition enter-active-class="transition duration-300 ease-out"
                    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enter-to-class="opacity-100 translate-y-0 sm:scale-100"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="opacity-100 translate-y-0 sm:scale-100"
                    leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">

                    <div v-if="isDeleteDialogOpen"
                        class="relative bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm mx-4 overflow-hidden">
                        <div class="p-6 text-center">
                            <div
                                class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-red-50/50">
                                <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-500" />
                            </div>
                            <h3 class="text-lg font-bold text-[#0F172A] mb-2">Hapus Jadwal</h3>
                            <p class="text-sm text-slate-500 mb-6 flex flex-col items-center">
                                <span>Apakah Anda yakin ingin menghapus jadwal ini?</span>
                                <span>Tindakan ini tidak dapat dibatalkan.</span>
                            </p>

                            <div class="flex flex-col sm:flex-row gap-3">
                                <button type="button" @click="cancelDelete"
                                    class="flex-1 min-h-[44px] px-4 rounded-xl font-bold bg-slate-100 text-[#334155] hover:bg-slate-200 focus:ring-4 focus:ring-slate-100 active:scale-[0.98] transition-all outline-none">
                                    Batal
                                </button>
                                <button type="button" @click="executeDelete"
                                    class="flex-1 min-h-[44px] px-4 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-600/20 active:scale-[0.98] transition-all outline-none">
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </div>
</template>
