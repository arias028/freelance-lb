<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

// SEO Meta
useHead({
    title: 'Absensi - Freelance LB',
    meta: [{ name: 'description', content: 'Halaman absensi harian staff Freelance LB.' }]
})

definePageMeta({ middleware: 'auth' })

const { getAbsensiList, uploadToS3, submitAbsen } = useEmployee()
const toast = useCustomToast()

// --- State ---
const locationCoords = ref<string>('')
const dateString = ref('')
const hasPermissions = ref(false)
const checkingPermissions = ref(true) // Track loading state for permission check
const permissionErrorMessage = ref('')

// Camera State
const isCameraOpen = ref(false)
const videoEl = ref<HTMLVideoElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const currentImageFile = ref<File | null>(null)
const currentImageUrl = ref<string | null>(null)

// --- 1. DATA FETCHING (OPTIMIZED) ---
// Menggunakan useAsyncData agar data ditarik di SERVER (SSR).
// Halaman sampai ke user sudah berisi tabel jadwal. LCP INSTAN.
const { data: attendanceList, status, refresh: refreshData } = await useAsyncData('attendance-list',
    () => getAbsensiList(),
    {
        default: () => [], // Mencegah flicker null
        lazy: false // Load eager untuk LCP bagus
    }
)

const isLoading = computed(() => status.value === 'pending')

// --- Lifecycle ---
onMounted(() => {
    // Set tanggal (Client side only untuk hindari hydration mismatch)
    dateString.value = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    // JALANKAN PERMISSION CHECK SECARA BACKGROUND (NON-BLOCKING)
    // Biarkan user melihat data dulu, pop-up izin muncul belakangan.
    requestAllPermissions()
})

// --- Methods ---

// 2. Permission Check - PROPERLY TRIGGERS PROMPTS ON MOBILE
async function requestAllPermissions() {
    permissionErrorMessage.value = ''
    checkingPermissions.value = true

    // Cek apakah browser support
    if (!navigator.geolocation || !navigator.mediaDevices?.getUserMedia) {
        permissionErrorMessage.value = 'Browser tidak mendukung Geolocation atau Kamera.'
        checkingPermissions.value = false
        return
    }

    let locationGranted = false
    let cameraGranted = false

    try {
        // === A. Request LOCATION Permission ===
        // Wrap getCurrentPosition in Promise for proper async handling on mobile
        locationGranted = await new Promise<boolean>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    locationCoords.value = `${pos.coords.latitude},${pos.coords.longitude}`
                    console.log('Location granted:', locationCoords.value)
                    resolve(true)
                },
                (err) => {
                    console.warn('Location denied:', err.code, err.message)
                    resolve(false)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000, // 15 seconds timeout for mobile GPS
                    maximumAge: 60000 // Cache for 1 minute
                }
            )
        })

        // === B. Request CAMERA Permission ===
        // On mobile, enumerateDevices() does NOT trigger permission prompt!
        // We MUST call getUserMedia() to trigger the permission dialog
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            })
            // Immediately stop the stream, we just needed the permission
            stream.getTracks().forEach(track => track.stop())
            cameraGranted = true
            console.log('Camera permission granted')
        } catch (camErr: any) {
            console.warn('Camera permission denied:', camErr.name, camErr.message)
            cameraGranted = false
        }

        // === Set final permission state ===
        if (locationGranted && cameraGranted) {
            hasPermissions.value = true
            permissionErrorMessage.value = ''
        } else if (!locationGranted && !cameraGranted) {
            permissionErrorMessage.value = 'Izinkan akses Lokasi dan Kamera untuk melakukan absensi.'
        } else if (!locationGranted) {
            permissionErrorMessage.value = 'Izinkan akses Lokasi untuk validasi absensi.'
        } else if (!cameraGranted) {
            permissionErrorMessage.value = 'Izinkan akses Kamera untuk foto absensi.'
        }

    } catch (error) {
        console.error('Permission check error:', error)
        permissionErrorMessage.value = 'Terjadi kesalahan saat memeriksa izin akses.'
    } finally {
        checkingPermissions.value = false
    }
}

// 3. Camera Handling
async function openCameraModal() {
    // Cek permission kamera hanya saat user KLIK tombol foto
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        // Stop stream test, kita pakai di startCameraStream
        stream.getTracks().forEach(track => track.stop())

        isCameraOpen.value = true
        startCameraStream()
    } catch (err) {
        toast.add({
            title: 'Akses Kamera Ditolak',
            description: 'Mohon izinkan akses kamera di pengaturan browser.',
            color: 'error'
        })
    }
}

function startCameraStream() {
    nextTick(async () => {
        if (navigator.mediaDevices?.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 720 } } // Optimasi resolusi
                })
                if (videoEl.value) videoEl.value.srcObject = stream
            } catch (err) {
                console.error(err)
            }
        }
    })
}

function stopCameraStream() {
    if (videoEl.value?.srcObject) {
        const stream = videoEl.value.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
    }
    isCameraOpen.value = false
}

function capturePhoto() {
    if (!videoEl.value || !canvasEl.value) return

    const context = canvasEl.value.getContext('2d', { alpha: false }) // Optimasi rendering
    canvasEl.value.width = videoEl.value.videoWidth
    canvasEl.value.height = videoEl.value.videoHeight
    context?.drawImage(videoEl.value, 0, 0)

    canvasEl.value.toBlob((blob) => {
        if (!blob) return
        // Kompresi image (quality 0.7) untuk upload lebih cepat
        currentImageFile.value = new File([blob], "capture.jpg", { type: "image/jpeg" })
        currentImageUrl.value = URL.createObjectURL(blob)
        stopCameraStream()
    }, 'image/jpeg', 0.7)
}

// 4. Action / Submission
async function handleSave(row: any) {
    // Validasi Foto
    if (!currentImageFile.value) {
        toast.add({ title: 'Foto Diperlukan', description: 'Silakan ambil foto selfie terlebih dahulu.', color: 'warning' })
        window.scrollTo({ top: 0, behavior: 'smooth' }) // Scroll ke atas biar user lihat kamera
        return
    }

    // Validasi Lokasi (Cek ulang saat submit)
    if (!locationCoords.value) {
        toast.add({ title: 'Lokasi Diperlukan', description: 'Sedang mengambil lokasi, coba sesaat lagi...', color: 'info' })
        // Coba minta lokasi lagi force
        navigator.geolocation.getCurrentPosition(
            (pos) => { locationCoords.value = `${pos.coords.latitude},${pos.coords.longitude}` },
            () => toast.add({ title: 'Gagal', description: 'Pastikan GPS aktif.', color: 'error' })
        )
        return
    }

    // Submit Process
    try {
        // Tampilkan loading di button baris tersebut (opsional, butuh state tambahan)
        // Untuk sekarang kita pakai loading global atau toast
        const loadingToast = toast.add({ title: 'Proses...', description: 'Mengupload data...', color: 'info', duration: 0 })

        // A. Upload S3
        const s3Url = await uploadToS3(currentImageFile.value)

        // B. Submit API
        const result: any = await submitAbsen(row.id, s3Url, locationCoords.value)

        toast.remove(loadingToast.id) // Hapus toast loading

        if (result == 1) {
            toast.add({ title: 'Sukses', description: 'Absensi berhasil dicatat!', color: 'success' })
            currentImageFile.value = null
            currentImageUrl.value = null
            refreshData() // Refresh data tabel
        } else {
            toast.add({ title: 'Gagal', description: 'Terjadi kesalahan saat submit.', color: 'error' })
        }
    } catch (e) {
        toast.add({ title: 'Error', description: 'Gagal menghubungi server.', color: 'error' })
    }
}
</script>

<template>
    <div class="min-h-screen bg-[#F1F5F9] pb-20">
        <UContainer class="py-8 space-y-8">

            <!-- Header -->
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
                    <UIcon name="i-heroicons-clipboard-document-list" class="text-primary-600" />
                    Absensi Staff
                </h1>
                <div class="text-sm text-slate-500">
                    {{ dateString }}
                </div>
            </div>

            <!-- Permission Error State (Show only AFTER checking is complete) -->
            <div v-if="!checkingPermissions && !hasPermissions && permissionErrorMessage"
                class="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div class="p-6 bg-red-50 rounded-full ring-1 ring-red-100">
                    <UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-600" />
                </div>
                <div class="max-w-md space-y-2">
                    <h3 class="text-xl font-bold text-[#0F172A]">Akses Diperlukan</h3>
                    <p class="text-slate-600 leading-relaxed">{{ permissionErrorMessage }}</p>
                </div>
                <UButton size="xl" color="primary" variant="solid" @click="requestAllPermissions"
                    icon="i-heroicons-arrow-path" class="font-bold">
                    Coba Lagi
                </UButton>
            </div>

            <!-- Main Content (Only if Permissions Granted) -->
            <template v-else-if="hasPermissions">
                <!-- SECTION A: Camera Placeholder -->
                <section class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">1. Foto Kehadiran
                    </h2>

                    <div @click="openCameraModal"
                        class="group w-full h-64 sm:h-80 md:h-96 rounded-xl border-2 border-dashed transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center gap-3"
                        :class="[
                            currentImageUrl
                                ? 'border-[#166534] bg-slate-900'
                                : 'border-[#334155] bg-white hover:bg-slate-50'
                        ]">
                        <!-- Result Image -->
                        <img v-if="currentImageUrl" :src="currentImageUrl"
                            class="absolute inset-0 w-full h-full object-contain z-10" alt="Captured Result" />

                        <!-- Overlay Info if Image Exists -->
                        <div v-if="currentImageUrl"
                            class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[#166534] backdrop-blur-md rounded-full text-white text-sm font-medium flex items-center gap-2 shadow-lg">
                            <UIcon name="i-heroicons-check-circle" class="text-white w-5 h-5" />
                            Foto Tersimpan
                            <span class="text-xs text-white/70 ml-2 border-l border-white/30 pl-2">Tap to Retake</span>
                        </div>

                        <!-- Placeholder State -->
                        <div v-if="!currentImageUrl"
                            class="flex flex-col items-center text-[#334155] group-hover:text-[#0F172A] transition-colors">
                            <div
                                class="p-4 rounded-full bg-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                                <UIcon name="i-heroicons-camera" class="w-10 h-10 text-[#0F172A]" />
                            </div>
                            <span class="mt-3 font-bold text-lg text-[#0F172A]">Tap to Take Photo</span>
                            <p class="text-xs text-[#334155] mt-1">Pastikan wajah terlihat jelas</p>
                        </div>
                    </div>
                </section>

                <!-- SECTION B: Shift List (Table) -->
                <section class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div class="px-6 py-5 border-b border-slate-200 bg-white">
                        <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">2. Jadwal & Shift</h2>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-sm">
                            <thead class="bg-gray-50 text-[#0F172A] font-bold">
                                <tr>
                                    <th
                                        class="p-4 text-center sticky left-0 bg-gray-50 z-10 border-r border-slate-200 whitespace-nowrap">
                                        Action</th>
                                    <th class="p-4 whitespace-nowrap">Jenis</th>
                                    <th class="p-4 whitespace-nowrap">Shift</th>
                                    <th class="p-4 whitespace-nowrap">Start Absen</th>
                                    <th class="p-4 whitespace-nowrap">Absen Masuk</th>
                                    <th class="p-4 whitespace-nowrap">End Absen</th>
                                    <th class="p-4 whitespace-nowrap">Absen Keluar</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-if="isLoading">
                                    <td colspan="7" class="p-8 text-center text-slate-400">Loading schedules...</td>
                                </tr>
                                <tr v-else-if="attendanceList.length === 0">
                                    <td colspan="7" class="p-8 text-center text-slate-400">Tidak ada data jadwal hari
                                        ini.
                                    </td>
                                </tr>
                                <tr v-for="row in attendanceList" :key="row.id"
                                    class="hover:bg-slate-50 transition-colors">
                                    <!-- Column 1: Action -->
                                    <td
                                        class="p-3 text-center sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 whitespace-nowrap">
                                        <UButton :color="row.can_absen === 1 ? 'neutral' : 'neutral'"
                                            :disabled="row.can_absen === 0"
                                            :variant="row.can_absen === 1 ? 'solid' : 'ghost'" size="sm"
                                            icon="i-heroicons-paper-airplane"
                                            class="font-bold shadow-sm transition-colors text-white"
                                            :class="row.can_absen === 1 ? '!bg-[#166534] hover:!bg-[#166534]/90' : '!bg-transparent !text-[#94A3B8] cursor-not-allowed'"
                                            @click="row.can_absen === 1 ? handleSave(row) : null">
                                        </UButton>
                                    </td>

                                    <!-- Column 2: Jenis -->
                                    <td class="p-4 whitespace-nowrap">
                                        <UBadge :color="row.jenis_absen === 'NORMAL' ? 'primary' : 'warning'"
                                            variant="solid" size="xs">
                                            {{ row.jenis_absen }}
                                        </UBadge>
                                    </td>

                                    <!-- Column 3: Shift -->
                                    <td class="p-4 font-medium text-slate-700 whitespace-nowrap">
                                        {{ row.shift }}
                                    </td>

                                    <!-- Column 4: Start -->
                                    <td class="p-4 text-[#334155] font-mono whitespace-nowrap">
                                        {{ row.start_date }}
                                    </td>

                                    <!-- Column 5: In -->
                                    <td class="p-4 font-mono whitespace-nowrap"
                                        :class="row.date_in ? 'text-[#166534] font-bold' : 'text-[#334155]'">
                                        {{ row.date_in }}
                                    </td>

                                    <!-- Column 6: End -->
                                    <td class="p-4 text-[#334155] font-mono whitespace-nowrap">
                                        {{ row.end_date }}
                                    </td>

                                    <!-- Column 7: Out -->
                                    <td class="p-4 font-mono whitespace-nowrap"
                                        :class="row.date_out ? 'text-[#166534] font-bold' : 'text-[#334155]'">
                                        {{ row.date_out }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </template>
            <!-- Loading State: Checking Permissions -->
            <div v-else-if="checkingPermissions" class="py-20 text-center text-slate-400">
                <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin mx-auto mb-4" />
                <p>Memeriksa Izin Akses...</p>
                <p class="text-xs mt-2 text-slate-400">Mohon izinkan akses lokasi dan kamera</p>
            </div>
        </UContainer>

        <!-- Camera Modal -->
        <!-- Camera Modal -->
        <!-- Custom Camera Modal Overlay -->
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-300 ease-out" enter-from-class="opacity-0"
                enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200 ease-in"
                leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="isCameraOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <!-- Backdrop -->
                    <div class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                        @click="stopCameraStream">
                    </div>

                    <!-- Modal Content (Card Style) with enter animation -->
                    <Transition appear
                        enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        enter-from-class="opacity-0 scale-90 translate-y-5"
                        enter-to-class="opacity-100 scale-100 translate-y-0"
                        leave-active-class="transition-all duration-200 ease-in"
                        leave-from-class="opacity-100 scale-100 translate-y-0"
                        leave-to-class="opacity-0 scale-95 translate-y-2.5">
                        <div
                            class="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col ring-1 ring-white/20">

                            <!-- Header -->
                            <div
                                class="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-white z-10">
                                <div>
                                    <h3 class="font-bold text-lg text-[#0F172A]">Ambil Foto</h3>
                                    <p class="text-xs text-[#64748B]">Pastikan wajah terlihat jelas</p>
                                </div>
                                <button @click="stopCameraStream"
                                    class="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors focus:outline-none">
                                    <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
                                </button>
                            </div>

                            <!-- Video Feed (Professional Ratio 3:4) -->
                            <div class="relative bg-black w-full aspect-[3/4] overflow-hidden group">
                                <video ref="videoEl" autoplay playsinline
                                    class="absolute inset-0 w-full h-full object-cover transform -scale-x-100"></video>
                                <canvas ref="canvasEl" class="hidden"></canvas>
                            </div>

                            <!-- Controls (Footer) -->
                            <div
                                class="p-6 bg-white border-t border-slate-100 flex flex-col items-center justify-center gap-2">
                                <button @click="capturePhoto"
                                    class="group relative w-16 h-16 rounded-full border-4 border-slate-200 p-1 transition-all hover:border-[#166534] hover:scale-105 active:scale-95 focus:outline-none">
                                    <div
                                        class="w-full h-full bg-[#166534] rounded-full group-hover:bg-[#15803d] transition-colors relative z-10 shadow-inner">
                                    </div>
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>