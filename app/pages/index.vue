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
  { id: 1, title: 'Login Berhasil', time: 'Baru saja', icon: 'i-heroicons-check-circle', color: 'text-green-500' },
  // { id: 2, title: 'Absensi Masuk', time: '08:00 WIB', icon: 'i-heroicons-clock', color: 'text-blue-500' },
]
</script>

<template>
  <div class="min-h-screen pb-20 bg-[#F1F5F9]">
    <!-- Header Section -->
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

      <!-- Quick Stats / Highlights -->
      <!-- <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <NuxtLink v-for="item in modules" :key="item.title" :to="item.to"
          class="group relative bg-white border border-slate-200 rounded-xl p-6 transition-all duration-300 hover:border-[#166534] hover:shadow-md">

          <div class="flex items-start justify-between">
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-[#F0FDF4] transition-colors">
              <UIcon :name="item.icon" class="w-8 h-8 text-[#0F172A]" />
            </div>
            <UIcon name="i-heroicons-arrow-right"
              class="w-5 h-5 text-slate-400 group-hover:text-[#166534] transition-colors" />
          </div>

          <div class="mt-5">
            <h3 class="text-xl font-bold text-[#0F172A] group-hover:text-[#166534] transition-colors">
              {{ item.title }}
            </h3>
            <p class="text-sm text-[#334155] mt-2 font-medium">
              {{ item.desc }}
            </p>
          </div>
        </NuxtLink>
      </div> -->

      <!-- Main Content Area: Status & Announcements -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- Left Column: Status Card -->
        <div class="lg:col-span-2">
          <UCard class="h-full ring-1 ring-slate-200 shadow-sm border-0">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                  <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-[#0F172A]" />
                  Status Hari Ini
                </h3>
                <UBadge :color="todayStatus.color" variant="solid" size="lg" class="rounded-md px-3 font-bold">
                  {{ todayStatus.label }}
                </UBadge>
              </div>
            </template>

            <div class="flex flex-col items-center justify-center text-center py-10">
              <div class="p-5 bg-slate-50 rounded-full mb-6 border border-slate-100">
                <UIcon :name="todayStatus.icon" class="w-16 h-16 text-[#0F172A]" />
              </div>
              <h4 class="text-2xl font-bold text-[#0F172A] mb-3">{{ todayStatus.message }}</h4>

              <div v-if="todayStatus.label === 'Belum Absen'" class="w-full max-w-md space-y-6">
                <p class="text-base text-[#334155]">
                  Silahkan lakukan check-in untuk memulai penghitungan waktu kerja hari ini.
                </p>
                <UButton to="/absen" size="xl" icon="i-heroicons-clock"
                  class="w-full justify-center font-bold !bg-[#166534] !text-white hover:!bg-[#14532d] transition-all">
                  Check In Sekarang
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Right Column: Recent Activity / Notifications -->
        <div class="space-y-6">
          <UCard class="ring-1 ring-slate-200 shadow-sm border-0">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-[#0F172A]">Aktivitas Terbaru</h3>
                <UButton variant="ghost" color="neutral" size="sm" icon="i-heroicons-ellipsis-horizontal" />
              </div>
            </template>

            <div class="space-y-5">
              <div v-for="activity in recentActivities" :key="activity.id" class="flex items-start gap-4">
                <div class="relative mt-1">
                  <div class="p-2 rounded-full bg-slate-50 ring-1 ring-slate-100">
                    <UIcon :name="activity.icon" class="w-5 h-5 text-[#166534]" />
                  </div>
                </div>
                <div>
                  <h5 class="text-base font-semibold text-[#0F172A]">{{ activity.title }}</h5>
                  <p class="text-sm text-[#334155]">{{ activity.time }}</p>
                </div>
              </div>

              <div class="pt-4 border-t border-slate-100">
                <UButton block variant="outline" color="neutral" size="md" to="/absen"
                  class="font-semibold text-[#334155]">
                  Lihat Semua
                </UButton>
              </div>
            </div>
          </UCard>

          <UCard class="bg-[#0F172A] text-white ring-0 shadow-lg border-0">
            <div class="relative z-10">
              <h3 class="font-bold text-xl mb-2 text-white">Butuh Bantuan?</h3>
              <p class="text-slate-300 text-sm mb-6 leading-relaxed">Hubungi admin jika ada kendala payroll atau
                absensi.</p>
              <UButton color="neutral" variant="solid" size="md" class="font-bold text-[#0F172A] w-full justify-center">
                Hubungi Admin
              </UButton>
            </div>
          </UCard>
        </div>

      </div>
    </UContainer>
  </div>
</template>