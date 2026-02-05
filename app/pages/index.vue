<script setup lang="ts">
// FIX SEO: Tambahkan Meta Description & Title
useHead({
  title: 'Dashboard - Freelance LB',
  meta: [
    { name: 'description', content: 'Dashboard absensi dan aktivitas harian untuk freelancer PT. BINA.' }
  ]
})

definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()
const { getAbsensiList } = useEmployee()

// FIX LCP: Ganti onMounted dengan useAsyncData
// Data diambil di server, HTML dikirim sudah matang.
const { data: attendanceList, status } = await useAsyncData('attendance-today', () => getAbsensiList(), {
  default: () => [] // Default value agar tidak null
})

// Time Logic (Client Only untuk menghindari Hydration Mismatch)
const currentTime = ref('')
const dateString = ref('')

onMounted(() => {
  updateTime()
  const timer = setInterval(updateTime, 60000)
  onUnmounted(() => clearInterval(timer)) // Good practice: bersihkan interval
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  dateString.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Computed Status (Updated to use AsyncData status)
const todayStatus = computed(() => {
  // Gunakan status bawaan useAsyncData
  if (status.value === 'pending') {
    return { label: 'Memuat...', color: 'neutral', icon: 'i-heroicons-arrow-path', message: 'Sedang mengambil data...' }
  }

  const shifts = attendanceList.value || []

  if (shifts.length === 0) {
    return { label: 'Tidak Ada Jadwal', color: 'neutral', icon: 'i-heroicons-calendar', message: 'Tidak ada jadwal shift untuk hari ini.' }
  }

  const currentShift = shifts[0]

  if (currentShift.status === 'Hadir' || currentShift.status === 'Selesai') {
    return { label: 'Sudah Absen', color: 'success', icon: 'i-heroicons-check-circle', message: 'Terima kasih, kehadiran Anda telah tercatat.' }
  } else {
    return { label: 'Belum Absen', color: 'warning', icon: 'i-heroicons-exclamation-circle', message: 'Silahkan lakukan check-in untuk memulai shift.' }
  }
})
</script>

<template>
  <div class="min-h-screen pb-20 bg-[#F1F5F9]">
    <UContainer class="py-10 space-y-8">
      <div class="relative">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">

          <div>
            <p class="text-sm font-bold text-[#334155] mb-2 uppercase tracking-wide">Dashboard Freelance</p>
            <h1 class="text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Selamat Datang, {{ user?.nama || 'Freelancer' }}
            </h1>
            <p class="mt-3 text-lg text-[#334155] leading-relaxed max-w-2xl">
              Semoga harimu menyenangkan. Jangan lupa untuk melakukan absensi hari ini.
            </p>
          </div>

          <div class="text-right hidden md:block">
            <ClientOnly>
              <template #fallback>
                <div class="h-10 w-32 bg-slate-200 rounded animate-pulse mb-2 ml-auto"></div>
                <div class="h-6 w-48 bg-slate-200 rounded animate-pulse ml-auto"></div>
              </template>
              <h2 class="text-4xl font-bold text-[#0F172A] font-mono tracking-tight">{{ currentTime }}</h2>
              <p class="text-[#334155] font-semibold text-lg">{{ dateString }}</p>
            </ClientOnly>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>