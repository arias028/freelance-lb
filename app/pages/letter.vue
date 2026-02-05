<script setup lang="ts">
import { format } from 'date-fns'
import { id } from 'date-fns/locale/id'

// SEO Meta
useHead({
    title: 'Surat - Freelance LB',
    meta: [{ name: 'description', content: 'Riwayat surat peringatan, tugas, dan dokumen resmi lainnya.' }]
})

definePageMeta({
    middleware: 'auth'
})

// Types
interface Surat {
    id: number
    name_letter: string
    kop: string
    ket: string
    date_from: string
    create_date: string
    [key: string]: any
}

interface SuratDetail {
    id: number
    name_letter: string
    kop: string
    ket: string
    kode_user: string
    nama_lengkap: string
    name_jabatan_from: string
    name_jabatan_to: string
    name_department: string
    cmp_desc: string
    cmp_addr: string
    logo: string
    email: string
    no_tlp: string
    website: string
    date_from: string
    create_by_name: string
    create_by_jabatan: string
    create_date: string
    [key: string]: any
}

const { getSuratList, getSuratDetail } = useEmployee()
const toast = useCustomToast()

// State
const isModalOpen = ref(false)
const selectedSurat = ref<SuratDetail | null>(null)
const isLoadingDetail = ref(false)

// Fetch surat list
const { data: suratList, status } = await useAsyncData<Surat[]>(
    'surat-list',
    async () => await getSuratList(),
    { default: () => [] }
)

const isLoading = computed(() => status.value === 'pending')

// Format date helper
const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
        return format(new Date(dateStr), 'dd MMMM yyyy', { locale: id })
    } catch {
        return dateStr
    }
}

// Get letter type badge styles
const getLetterBadge = (type: string) => {
    const lowerType = (type || '').toLowerCase()
    if (lowerType.includes('peringatan') || lowerType.includes('sp')) {
        return { bg: 'bg-red-100', text: 'text-red-700', icon: 'i-heroicons-exclamation-triangle' }
    }
    if (lowerType.includes('tugas') || lowerType.includes('penugasan')) {
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'i-heroicons-clipboard-document-list' }
    }
    if (lowerType.includes('keterangan') || lowerType.includes('sk')) {
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'i-heroicons-document-check' }
    }
    return { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'i-heroicons-document-text' }
}

// Open detail modal
const openDetail = async (surat: Surat) => {
    isModalOpen.value = true
    isLoadingDetail.value = true
    selectedSurat.value = null

    try {
        const response = await getSuratDetail(surat.id)
        // API returns array, extract first element
        const detail = Array.isArray(response) ? response[0] : response

        console.log('Surat Detail Response:', detail) // Debug

        if (detail) {
            selectedSurat.value = detail
        } else {
            toast.add({
                title: 'Gagal Memuat',
                description: 'Detail surat tidak ditemukan.',
                color: 'error'
            })
            isModalOpen.value = false
        }
    } catch (error) {
        console.error('Error fetching surat detail:', error)
        toast.add({
            title: 'Terjadi Kesalahan',
            description: 'Gagal memuat detail surat. Silakan coba lagi.',
            color: 'error'
        })
        isModalOpen.value = false
    } finally {
        isLoadingDetail.value = false
    }
}

// Close modal
const closeModal = () => {
    isModalOpen.value = false
    selectedSurat.value = null
}

// Format date for print header (e.g., "Bojonegoro, Februari 2026")
const formatMonthYear = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
        return format(new Date(dateStr), 'dd MMMM yyyy', { locale: id })
    } catch {
        return dateStr
    }
}

// Print surat method (Direct Print)
const printSurat = async (suratId: number) => {
    // Show loading feedback
    const loadingToast = toast.add({
        title: 'Menyiapkan Dokumen...',
        description: 'Mohon tunggu, sedang mengambil data surat.',
        color: 'info',
        duration: 30000 // Keep visible for a while (will be removed manually)
    })

    try {
        // Fetch detail
        const response = await getSuratDetail(suratId)
        const d = Array.isArray(response) ? response[0] : response

        if (!d) {
            toast.remove(loadingToast.id)
            toast.add({
                title: 'Gagal',
                description: 'Data surat tidak ditemukan.',
                color: 'error'
            })
            return
        }

        // Dynamically import print-js (client-side only)
        const printJS = (await import('print-js')).default

        const suratDate = d.create_date ? new Date(d.create_date) : new Date()
        const dateStringHeader = `Bojonegoro, ${format(suratDate, 'dd MMMM yyyy', { locale: id })}`
        const dateEffective = d.date_from ? format(new Date(d.date_from), 'dd MMMM yyyy', { locale: id }) : '-'

        // We use inline styles to ensure print.js renders it exactly as seen
        let printHtml = `
                <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 20px; max-width: 800px; margin: 0 auto;">

                    <table style="width: 100%; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
                        <tr>
                        <td style="width: 150px; text-align: left; vertical-align: middle;">
    <img src="${d.logo}" style="width: 100px; height: auto;" alt="Logo" onerror="this.style.display='none'">
</td>
                            <td style="text-align: center; vertical-align: middle;">
                                <div style="font-size: 26px; font-weight: bold; text-decoration: underline;">
                                     ${d.cmp_desc}
                                </div>
                                <div style="font-size: 16px;">
                                    ${d.cmp_addr} (${d.no_tlp || '-'})
                                </div>
                            </td>
                            <td style="width: 150px; text-align: right; vertical-align: middle;">
                                <img src="${d.logo}" style="width: 100px; height: auto;" alt="Logo" onerror="this.style.display='none'">
                            </td>
                        </tr>
                    </table>

                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr>
                            <td style="width: 100px; vertical-align: top;">Nomor</td>
                            <td style="width: 10px; vertical-align: top;">:</td>
                            <td style="vertical-align: top;">${d.kop}</td>
                            <td style="text-align: right; vertical-align: top;">${dateStringHeader}</td>
                        </tr>
                        <tr>
                            <td style="vertical-align: top;">Lampiran</td>
                            <td style="vertical-align: top;">:</td>
                            <td style="vertical-align: top;">-</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td style="vertical-align: top;">Perihal</td>
                            <td style="vertical-align: top;">:</td>
                            <td style="vertical-align: top; font-weight: bold; text-transform: uppercase;">${d.name_letter}</td>
                            <td></td>
                        </tr>
                    </table>

                    <div style="text-align: right; margin-bottom: 30px; line-height: 1.5;">
                        <div>KEPADA Yth,</div>
                        <div style="font-weight: bold; text-transform: uppercase;">PIMPINAN</div>
                        <div style="font-weight: bold; text-transform: uppercase;">DIVISI ${d.name_department}</div>
                        <div>Di <span style="text-decoration: underline;">Tempat</span></div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <span style="text-decoration: underline;">Assalamualaikum Warahmatullahi Wabarakatuh</span><br>
                        <span style="text-decoration: underline;">Dengan hormat,</span>
                    </div>

                    <div style="text-align: justify; margin-bottom: 15px; line-height: 1.5;">
                        Berdasarkan hasil evaluasi kinerja, dedikasi, serta kontribusi yang telah Bapak/Ibu berikan kepada perusahaan,
                        maka dengan ini manajemen DC BRANDING & KONSTRUKSI memutuskan untuk memberikan
                        <span style="font-weight: bold; text-decoration: underline;">promosi jabatan</span> kepada:
                    </div>

                    <table style="width: 100%; margin-left: 20px; margin-bottom: 15px; font-weight: bold;">
                        <tr>
                            <td style="width: 120px;">Nama</td>
                            <td style="width: 10px;">:</td>
                            <td>${d.nama_lengkap}</td>
                        </tr>
                        <tr>
                            <td>Jabatan Lama</td>
                            <td>:</td>
                            <td>${d.name_jabatan_from}</td>
                        </tr>
                        <tr>
                            <td>Jabatan Baru</td>
                            <td>:</td>
                            <td>${d.name_jabatan_to}</td>
                        </tr>
                    </table>

                    <div style="text-align: justify; margin-bottom: 15px; line-height: 1.5;">
                        <span style="text-decoration: underline;">Promosi jabatan ini berlaku efektif mulai tanggal <strong>${dateEffective}</strong>.</span>
                        Dengan jabatan baru tersebut, Bapak/Ibu diharapkan dapat menjalankan tanggung jawab dengan penuh komitmen
                        serta terus memberikan kontribusi terbaik bagi kemajuan perusahaan.
                    </div>

                    <div style="text-align: justify; margin-bottom: 15px; line-height: 1.5;">
                        Kami mengucapkan selamat atas promosi jabatan ini dan berharap Bapak/Ibu dapat terus
                        meningkatkan kinerja serta profesionalisme dalam menjalankan tugas.
                    </div>

                    <div style="text-align: justify; margin-bottom: 50px; line-height: 1.5;">
                        Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.
                    </div>

                    <div style="text-align: right; margin-top: 50px;">
                        <div style="margin-bottom: 80px;">Hormat kami,</div>
                        <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">${d.create_by_name}</div>
                        </div>

                </div>
                `;

        printJS({
            printable: printHtml,
            type: 'raw-html',
            style: '@page { size: A4; margin: 20mm; } body { margin: 0; }'
        })

        // Success toast (optional, replacing the loader)
        toast.remove(loadingToast.id)

    } catch (error) {
        console.error('Error printing surat:', error)
        toast.remove(loadingToast.id)
        toast.add({
            title: 'Terjadi Kesalahan',
            description: 'Gagal memuat dokumen untuk dicetak.',
            color: 'error'
        })
    }
}
</script>

<template>
    <div class="min-h-screen bg-[#F1F5F9] pb-24 text-[#334155]">
        <!-- Header -->
        <div class="bg-white border-b border-slate-200 sticky top-0 z-20">
            <UContainer class="py-4 flex justify-between items-center">
                <h1 class="text-xl font-bold text-[#0F172A]">Riwayat Surat</h1>
                <UIcon name="i-heroicons-envelope" class="w-6 h-6 text-[#166534]" />
            </UContainer>
        </div>

        <UContainer class="py-6 space-y-4">

            <!-- Loading State -->
            <div v-if="isLoading" class="space-y-4">
                <USkeleton v-for="i in 3" :key="i" class="h-24 w-full rounded-2xl" />
            </div>

            <!-- Empty State -->
            <div v-else-if="!suratList || suratList.length === 0"
                class="py-16 text-center text-slate-400 flex flex-col items-center">
                <div
                    class="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg ring-1 ring-slate-100 mb-6">
                    <UIcon name="i-heroicons-inbox" class="w-12 h-12 text-slate-300" />
                </div>
                <h2 class="text-xl font-bold text-[#0F172A] mb-2">Tidak Ada Surat</h2>
                <p class="text-slate-500 max-w-sm">
                    Belum ada riwayat surat yang tercatat untuk akun Anda.
                </p>
            </div>

            <!-- Surat List -->
            <template v-else>
                <div class="space-y-3">
                    <button v-for="surat in suratList" :key="surat.id" @click="printSurat(surat.id)"
                        class="w-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#166534]/30 transition-all duration-200 p-4 text-left group">
                        <div class="flex items-start gap-4">
                            <!-- Icon Badge -->
                            <div :class="[
                                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
                                getLetterBadge(surat.name_letter).bg
                            ]">
                                <UIcon :name="getLetterBadge(surat.name_letter).icon"
                                    :class="['w-6 h-6', getLetterBadge(surat.name_letter).text]" />
                            </div>

                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                        <h3
                                            class="font-bold text-[#0F172A] text-base truncate group-hover:text-[#166534] transition-colors">
                                            {{ surat.name_letter || 'Surat' }}
                                        </h3>
                                        <p class="text-sm text-slate-500 font-medium truncate mt-0.5">
                                            {{ surat.kop || 'No. -' }}
                                        </p>
                                    </div>
                                    <UIcon name="i-heroicons-chevron-right"
                                        class="w-5 h-5 text-slate-400 group-hover:text-[#166534] transition-colors flex-shrink-0" />
                                </div>

                                <div class="flex items-center gap-3 mt-3">
                                    <span :class="[
                                        'px-2.5 py-1 rounded-full text-xs font-bold',
                                        getLetterBadge(surat.name_letter).bg,
                                        getLetterBadge(surat.name_letter).text
                                    ]">
                                        {{ surat.name_letter?.split(' ')[0] || 'Dokumen' }}
                                    </span>
                                    <span class="text-xs text-slate-400 flex items-center gap-1">
                                        <UIcon name="i-heroicons-calendar" class="w-3.5 h-3.5" />
                                        {{ formatDate(surat.date_from || surat.create_date) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                <!-- Info Footer -->
                <div class="text-center text-xs text-slate-400 mt-6 px-4 leading-relaxed">
                    *Klik pada surat untuk melihat detail lengkap dan mencetaknya.
                </div>
            </template>

        </UContainer>

        <!-- Detail Modal -->
        <UModal v-model:open="isModalOpen">
            <template #content>
                <div class="bg-white rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto max-w-3xl mx-auto">
                    <!-- Modal Header -->
                    <div
                        class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                        <h2 class="text-lg font-bold text-[#0F172A]">Detail Surat</h2>
                        <div class="flex items-center gap-2">
                            <button v-if="selectedSurat && !isLoadingDetail" @click="printSurat(selectedSurat.id)"
                                class="px-4 py-2 bg-[#166534] text-white text-sm font-bold rounded-xl hover:bg-[#14532D] transition-colors flex items-center gap-2">
                                <UIcon name="i-heroicons-printer" class="w-4 h-4" />
                                Cetak
                            </button>
                            <button @click="closeModal" class="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div v-if="isLoadingDetail" class="p-8 space-y-4">
                        <USkeleton class="h-8 w-1/2 mx-auto" />
                        <USkeleton class="h-4 w-3/4 mx-auto" />
                        <USkeleton class="h-32 w-full mt-6" />
                        <USkeleton class="h-24 w-full" />
                    </div>

                    <!-- Surat Content (Print-friendly) -->
                    <div v-else-if="selectedSurat" id="surat-content" class="p-6 md:p-8 print:p-0">
                        <!-- Kop Surat / Letterhead -->
                        <div class="border-b-4 border-[#0F172A] pb-4 mb-6 print:border-b-2">
                            <div class="flex items-center gap-4">
                                <div v-if="selectedSurat.logo" class="flex-shrink-0">
                                    <NuxtImg :src="selectedSurat.logo" alt="Logo" class="w-16 h-16 object-contain" />
                                </div>
                                <div class="flex-1 text-center">
                                    <h1 class="text-xl md:text-2xl font-bold text-[#0F172A] uppercase tracking-wide">
                                        {{ selectedSurat.cmp_desc || 'PT. KONSTRUKSI' }}
                                    </h1>
                                    <p class="text-sm text-slate-600 mt-1">
                                        {{ selectedSurat.cmp_addr || '' }}
                                    </p>
                                    <div
                                        class="text-xs text-slate-500 mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1">
                                        <span v-if="selectedSurat.no_tlp">📞 {{ selectedSurat.no_tlp }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Judul Surat -->
                        <div class="text-center mb-6">
                            <h2
                                class="text-lg md:text-xl font-bold text-[#0F172A] uppercase underline underline-offset-4">
                                {{ selectedSurat.name_letter || 'SURAT' }}
                            </h2>
                            <p class="text-sm text-slate-600 mt-1">
                                No: {{ selectedSurat.kop || '-' }}
                            </p>
                        </div>

                        <!-- Info Penerima -->
                        <div
                            class="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200 print:bg-transparent print:border-0 print:p-0 print:mb-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span class="text-slate-500">Department:</span>
                                    <p class="font-bold text-[#0F172A]">{{ selectedSurat.name_department || '-' }}</p>
                                </div>
                                <div>
                                    <span class="text-slate-500">Tanggal Dibuat:</span>
                                    <p class="font-bold text-[#0F172A]">{{ formatDate(selectedSurat.create_date) }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Body (Simulated to match Print) -->
                        <div class="mb-8 font-serif">
                            <div class="mb-4">
                                <p>Kepada Yth,</p>
                                <p class="font-bold uppercase">PIMPINAN</p>
                                <p class="font-bold uppercase">DIVISI {{ selectedSurat.name_department }}</p>
                                <p>Di <span class="underline">Tempat</span></p>
                            </div>

                            <div class="mb-4">
                                <p class="underline">Assalamualaikum Warahmatullahi Wabarakatuh</p>
                                <p class="underline">Dengan hormat,</p>
                            </div>

                            <div class="text-justify mb-4 leading-relaxed">
                                Berdasarkan hasil evaluasi kinerja, dedikasi, serta kontribusi yang telah Bapak/Ibu
                                berikan kepada perusahaan,
                                maka dengan ini manajemen DC BRANDING & KONSTRUKSI memutuskan untuk memberikan
                                <span class="font-bold underline">promosi jabatan</span> kepada:
                            </div>

                            <table class="w-full ml-4 mb-4 font-bold text-sm">
                                <tr>
                                    <td class="w-32">Nama</td>
                                    <td class="w-4">:</td>
                                    <td>{{ selectedSurat.nama_lengkap }}</td>
                                </tr>
                                <tr>
                                    <td>Jabatan Lama</td>
                                    <td>:</td>
                                    <td>{{ selectedSurat.name_jabatan_from }}</td>
                                </tr>
                                <tr>
                                    <td>Jabatan Baru</td>
                                    <td>:</td>
                                    <td>{{ selectedSurat.name_jabatan_to }}</td>
                                </tr>
                            </table>

                            <div class="text-justify mb-4 leading-relaxed">
                                <span class="underline">Promosi jabatan ini berlaku efektif mulai tanggal <strong>{{
                                        formatDate(selectedSurat.date_from) }}</strong>.</span>
                                Dengan jabatan baru tersebut, Bapak/Ibu diharapkan dapat menjalankan tanggung jawab
                                dengan penuh komitmen
                                serta terus memberikan kontribusi terbaik bagi kemajuan perusahaan.
                            </div>

                            <div class="text-justify mb-4 leading-relaxed">
                                Kami mengucapkan selamat atas promosi jabatan ini dan berharap Bapak/Ibu dapat terus
                                meningkatkan kinerja serta profesionalisme dalam menjalankan tugas.
                            </div>

                            <div class="text-justify mb-12 leading-relaxed">
                                Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan
                                terima kasih.
                            </div>
                        </div>

                        <!-- Tanda Tangan -->
                        <div class="flex justify-end">
                            <div class="text-center min-w-[200px]">
                                <p class="text-sm text-slate-600 mb-16">Hormat kami,</p>
                                <p class="font-bold text-[#0F172A] underline uppercase">{{ selectedSurat.create_by_name
                                    || '-' }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Error State -->
                    <div v-else class="p-8 text-center text-slate-400">
                        <UIcon name="i-heroicons-exclamation-circle" class="w-12 h-12 mx-auto mb-4" />
                        <p>Gagal memuat detail surat.</p>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>