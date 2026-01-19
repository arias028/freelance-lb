<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()
const { getAbsensiList } = useEmployee()
const currentTime = ref('')
const dateString = ref('')
const attendanceList = ref<any[]>([])
const loadingStatus = ref(true)

// Initialize time and data
onMounted(async () => {
  updateTime()
  setInterval(updateTime, 60000)

  try {
    attendanceList.value = await getAbsensiList()
  } catch (e) {
    console.error('Failed to load attendance', e)
  } finally {
    loadingStatus.value = false
  }
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  dateString.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const todayStatus = computed<{
  label: string
  color: "neutral" | "success" | "warning" | "primary" | "secondary" | "info" | "error" | undefined
  icon: string
  message: string
}>(() => {
  if (loadingStatus.value) return { label: 'Memuat...', color: 'neutral', icon: 'i-heroicons-arrow-path', message: 'Sedang mengambil data...' }

  if (!attendanceList.value || attendanceList.value.length === 0) {
    return { label: 'Tidak Ada Jadwal', color: 'neutral', icon: 'i-heroicons-calendar', message: 'Tidak ada jadwal shift untuk hari ini.' }
  }

  // Cari yang belum absen atau statusnya 'Hadir'
  const currentShift = attendanceList.value[0] // Simple logic: ambil shift pertama

  if (currentShift.status === 'Hadir' || currentShift.status === 'Selesai') {
    return { label: 'Sudah Absen', color: 'success', icon: 'i-heroicons-check-circle', message: 'Terima kasih, kehadiran Anda telah tercatat.' }
  } else {
    return { label: 'Belum Absen', color: 'warning', icon: 'i-heroicons-exclamation-circle', message: 'Silahkan lakukan check-in untuk memulai shift.' }
  }
})


const recentActivities = [
  { id: 1, title: 'Login Berhasil', time: 'Baru saja', icon: 'i-heroicons-check-circle', color: 'text-[#166534]' },
  // { id: 2, title: 'Absensi Masuk', time: '08:00 WIB', icon: 'i-heroicons-clock', color: 'text-blue-500' },
]
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
            <h2 class="text-4xl font-bold text-[#0F172A] font-mono tracking-tight">{{ currentTime }}</h2>
            <p class="text-[#334155] font-semibold text-lg">{{ dateString }}</p>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>