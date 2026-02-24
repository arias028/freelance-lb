<script setup lang="ts">
import { format } from 'date-fns'
import { id } from 'date-fns/locale/id'

// Tambahkan SEO Meta
useHead({
    title: 'Profil Saya - Freelance LB',
    meta: [{ name: 'description', content: 'Informasi profil dan data kepegawaian freelancer.' }]
})

definePageMeta({
    middleware: 'auth'
})

const { logout } = useAuth()
const { getEmployeeProfile, getSuratList, getSuratDetail } = useEmployee()
const toast = useCustomToast()

const isLogoutLoading = ref(false)

// --- SSR DATA FETCHING (FIX LCP) ---
// Data diambil di server sebelum halaman dikirim ke browser
const { data: profile, status } = await useAsyncData(
    'employee-profile',
    () => getEmployeeProfile(),
    {
        default: () => null // Mencegah error akses properti null
    }
)

const isLoading = computed(() => status.value === 'pending')

// --- Surat State & Fetch ---
const { data: suratList, status: suratStatus } = await useAsyncData(
    'surat-list',
    async () => await getSuratList(),
    { default: () => [] }
)

const isSuratLoading = computed(() => suratStatus.value === 'pending')

// Format date helper for letter
const formatDateLetter = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
        return format(new Date(dateStr), 'dd MMMM yyyy', { locale: id })
    } catch {
        return dateStr
    }
}

// Letter Badge
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

// Print surat method (Direct Print)
const printSurat = async (suratId: number) => {
    const loadingToast = toast.add({
        title: 'Menyiapkan Dokumen...',
        description: 'Mohon tunggu, sedang mengambil data surat.',
        color: 'info',
        duration: 30000
    })

    try {
        const response = await getSuratDetail(suratId)
        const d = Array.isArray(response) ? response[0] : response

        if (!d) {
            toast.remove(loadingToast.id)
            toast.add({ title: 'Gagal', description: 'Data surat tidak ditemukan.', color: 'error' })
            return
        }

        const printJS = (await import('print-js')).default

        const suratDate = d.create_date ? new Date(d.create_date) : new Date()
        const dateStringHeader = `Bojonegoro, ${format(suratDate, 'dd MMMM yyyy', { locale: id })}`
        const dateEffective = d.date_from ? format(new Date(d.date_from), 'dd MMMM yyyy', { locale: id }) : '-'

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
                        <tbody>
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
                        </tbody>
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

// --- Actions ---
async function handleLogout() {
    isLogoutLoading.value = true
    try {
        await logout()
        toast.add({ title: 'Logout Berhasil', description: 'Sampai jumpa kembali.', color: 'success' })
        navigateTo('/login')
    } catch (e) {
        navigateTo('/login')
    } finally {
        isLogoutLoading.value = false
    }
}

// Helper Format Date
function formatDate(date: string) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    })
}
</script>

<template>
    <div class="min-h-screen md:bg-slate-100 text-[#334155] flex justify-center">
        <div
            class="w-full md:max-w-md bg-[#F1F5F9] min-h-screen md:shadow-xl md:border-x md:border-slate-200 relative pb-24">
            <div class="bg-white border-b border-slate-200 sticky top-0 z-20">
                <UContainer class="py-4">
                    <h1 class="text-xl font-bold text-[#0F172A]">Profil Saya</h1>
                </UContainer>
            </div>

            <UContainer class="py-6 space-y-6">

                <div v-if="isLoading" class="space-y-4">
                    <USkeleton class="h-32 w-full rounded-2xl" />
                    <USkeleton class="h-64 w-full rounded-2xl" />
                </div>

                <template v-else>
                    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#0F172A] to-[#1e293b] z-0">
                        </div>

                        <div class="relative z-10 flex flex-col items-center mt-8">
                            <div class="w-24 h-24 rounded-full bg-white p-1 shadow-lg ring-1 ring-slate-100">
                                <div
                                    class="w-full h-full rounded-full bg-[#166534] flex items-center justify-center text-white text-3xl font-bold">
                                    {{ profile?.nama_lengkap?.charAt(0) || 'U' }}
                                </div>
                            </div>

                            <div class="text-center mt-4">
                                <h2 class="text-xl font-bold text-[#0F172A]">{{ profile?.nama_lengkap || 'Guest User' }}
                                </h2>
                                <p class="text-[#166534] font-medium text-sm mt-1">{{ profile?.jabatan || 'Freelancer'
                                    }}
                                </p>
                                <UBadge color="neutral" variant="subtle" size="xs" class="mt-2 text-xs font-mono">
                                    {{ profile?.kode_user || '-' }}
                                </UBadge>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-6">

                        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <UIcon name="i-heroicons-identification" class="w-5 h-5 text-[#166534]" />
                                <h3 class="font-bold text-[#0F172A]">Informasi Pribadi</h3>
                            </div>
                            <div class="p-6 space-y-5">
                                <div>
                                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Nomor
                                        HP</label>
                                    <p class="text-[#0F172A] font-medium mt-1">{{ profile?.phone || '-' }}</p>
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Jenis
                                        Kelamin</label>
                                    <p class="text-[#0F172A] font-medium mt-1">{{ profile?.kelamin === 'L' ? 'Laki-laki'
                                        :
                                        'Perempuan' }}</p>
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Tanggal
                                        Lahir</label>
                                    <ClientOnly>
                                        <p class="text-[#0F172A] font-medium mt-1">{{ formatDate(profile?.tanggal_lahir)
                                            }}
                                        </p>
                                        <template #fallback>
                                            <div class="h-6 w-32 bg-slate-100 rounded animate-pulse"></div>
                                        </template>
                                    </ClientOnly>
                                </div>
                                <div>
                                    <label
                                        class="text-xs font-bold text-slate-400 uppercase tracking-wide">Alamat</label>
                                    <p class="text-[#0F172A] font-medium mt-1 leading-relaxed">{{ profile?.alamat || '-'
                                        }}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <UIcon name="i-heroicons-briefcase" class="w-5 h-5 text-[#166534]" />
                                <h3 class="font-bold text-[#0F172A]">Data Kepegawaian</h3>
                            </div>
                            <div class="p-6 space-y-5">
                                <div>
                                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Tanggal
                                        Bergabung</label>
                                    <ClientOnly>
                                        <p class="text-[#0F172A] font-medium mt-1">{{ formatDate(profile?.tanggal_masuk)
                                            }}
                                        </p>
                                        <template #fallback>
                                            <div class="h-6 w-32 bg-slate-100 rounded animate-pulse"></div>
                                        </template>
                                    </ClientOnly>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            class="text-xs font-bold text-slate-400 uppercase tracking-wide">Golongan</label>
                                        <p class="text-[#0F172A] font-medium mt-1">{{ profile?.golongan || '-' }}</p>
                                    </div>
                                    <div>
                                        <label
                                            class="text-xs font-bold text-slate-400 uppercase tracking-wide">Rekening</label>
                                        <p class="text-[#0F172A] font-medium mt-1 font-mono">{{ profile?.rekening || '-'
                                            }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <!-- Surat List Section -->
                    <div class="mt-8 space-y-4">
                        <div class="flex items-center gap-2 mb-4">
                            <UIcon name="i-heroicons-envelope" class="w-6 h-6 text-[#166534]" />
                            <h2 class="text-lg font-bold text-[#0F172A]">Riwayat Surat</h2>
                        </div>

                        <!-- Loading State -->
                        <div v-if="isSuratLoading" class="space-y-4">
                            <USkeleton v-for="i in 3" :key="i" class="h-20 w-full rounded-2xl" />
                        </div>

                        <!-- Empty State -->
                        <div v-else-if="!suratList || suratList.length === 0"
                            class="py-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 flex flex-col items-center">
                            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <UIcon name="i-heroicons-inbox" class="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 class="text-base font-bold text-[#0F172A] mb-1">Tidak Ada Surat</h3>
                            <p class="text-sm text-slate-500">Belum ada riwayat surat.</p>
                        </div>

                        <!-- List -->
                        <template v-else>
                            <div class="space-y-3">
                                <button v-for="surat in suratList" :key="surat.id" @click="printSurat(surat.id)"
                                    class="w-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#166534]/30 transition-all duration-200 p-4 text-left group">
                                    <div class="flex items-start gap-4">
                                        <div :class="[
                                            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
                                            getLetterBadge(surat.name_letter).bg
                                        ]">
                                            <UIcon :name="getLetterBadge(surat.name_letter).icon"
                                                :class="['w-6 h-6', getLetterBadge(surat.name_letter).text]" />
                                        </div>
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
                                                <UIcon name="i-heroicons-printer"
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
                                                    {{ formatDateLetter(surat.date_from || surat.create_date) }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                            <div class="text-center text-xs text-slate-400 mt-4 leading-relaxed">
                                *Klik pada surat untuk mencetaknya.
                            </div>
                        </template>
                    </div>

                    <div class="pt-6">
                        <UButton block size="xl" color="error" variant="soft" :loading="isLogoutLoading"
                            @click="handleLogout" icon="i-heroicons-arrow-right-on-rectangle" class="font-bold">
                            Keluar Aplikasi
                        </UButton>
                        <p class="text-center text-xs text-slate-400 mt-4">
                            Versi Aplikasi v1.0.0
                        </p>
                    </div>

                </template>
            </UContainer>
        </div>
    </div>
</template>