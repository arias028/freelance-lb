<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

definePageMeta({ middleware: 'auth' })

const { getAbsensiList, uploadToS3, submitAbsen } = useEmployee()
const toast = useCustomToast() // Menggunakan Custom Toast yang lebih reliable

// --- State ---
const isLoading = ref(false)
const attendanceList = ref<any[]>([])
const locationCoords = ref<string>('')
const dateString = ref('')

const hasPermissions = ref(false)
const permissionErrorMessage = ref('')

// Camera State
const isCameraOpen = ref(false)
const videoEl = ref<HTMLVideoElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const currentImageFile = ref<File | null>(null)
const currentImageUrl = ref<string | null>(null)

// --- Lifecycle ---
onMounted(async () => {
    dateString.value = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
    await requestAllPermissions()
})

// --- Methods ---

// 1. Permission Check (New)
async function requestAllPermissions() {
    isLoading.value = true
    permissionErrorMessage.value = ''
    hasPermissions.value = false

    try {
        // A. Check Geolocation
        await new Promise<void>((resolve, reject) => {
            if (!navigator.geolocation) return reject('Geolocation tidak didukung browser ini.')
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    locationCoords.value = `${pos.coords.latitude},${pos.coords.longitude}`
                    resolve()
                },
                (err) => reject('Akses lokasi (GPS) ditolak. Harap izinkan akses lokasi untuk melanjutkan.')
            )
        })

        // B. Check Camera
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Browser tidak mendukung akses kamera.')

        // Request stream just to trigger permission prompt
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })

        // Stop immediately - we just needed permission granted
        stream.getTracks().forEach(track => track.stop())

        // If passed both
        hasPermissions.value = true
        await loadData()

    } catch (error: any) {
        console.warn('Permission Error:', error)
        permissionErrorMessage.value = typeof error === 'string'
            ? error
            : (error.message || 'Izin akses lokasi dan kamera diperlukan.')

        // Show permanent toast/alert as well
        toast.add({
            title: 'Akses Ditolak',
            description: permissionErrorMessage.value,
            color: 'error',
            duration: 10000
        })
    } finally {
        isLoading.value = false
    }
}

// 2. Data Loading
async function loadData() {
    isLoading.value = true
    try {
        // In a real app, this comes from the API. 
        // Mapped strictly to user requirements if API differs, but assuming API matches or we adapt.
        // Existing code used getAbsensiList. We will use it and trust it returns compatible data 
        // or the component will render what it can.
        attendanceList.value = await getAbsensiList()
    } catch (e) {
        toast.add({ title: 'Error', description: 'Gagal memuat jadwal', color: 'error' })
    } finally {
        isLoading.value = false
    }
}



// 3. Camera Handling
function openCameraModal() {
    isCameraOpen.value = true
    startCameraStream()
}

function startCameraStream() {
    nextTick(async () => {
        if (navigator.mediaDevices?.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' }
                })
                if (videoEl.value) videoEl.value.srcObject = stream
            } catch (err) {
                toast.add({ title: 'Error', description: 'Gagal akses kamera', color: 'error' })
                isCameraOpen.value = false
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

    const context = canvasEl.value.getContext('2d')
    canvasEl.value.width = videoEl.value.videoWidth
    canvasEl.value.height = videoEl.value.videoHeight
    context?.drawImage(videoEl.value, 0, 0)

    canvasEl.value.toBlob((blob) => {
        if (!blob) return
        currentImageFile.value = new File([blob], "capture.jpg", { type: "image/jpeg" })
        currentImageUrl.value = URL.createObjectURL(blob)
        stopCameraStream()
        isCameraOpen.value = false
    }, 'image/jpeg', 0.8)
}

// 4. Action / Submission
async function handleSave(row: any) {
    // Condition 1: Check validation
    if (!currentImageFile.value) {
        toast.add({ title: 'Foto Diperlukan', description: 'Please take a photo first', color: 'warning' })
        return
    }

    // Condition 2: Upload & Submit
    isLoading.value = true
    try {
        // A. Upload S3
        const s3Url = await uploadToS3(currentImageFile.value)

        // B. Submit API
        // Assuming row.id is the identifier as per requirements
        const result: any = await submitAbsen(row.id, s3Url, locationCoords.value)

        if (result == 1) {
            toast.add({ title: 'Sukses', description: 'Absen Berhasil', color: 'success' })
            // Reset & Refresh
            currentImageFile.value = null
            currentImageUrl.value = null
        } else {
            toast.add({ title: 'Gagal', description: 'Absen Gagal', color: 'error' })
        }

        await loadData()
    } catch (e) {
        toast.add({ title: 'Error', description: 'Terjadi kesalahan sistem', color: 'error' })
    } finally {
        isLoading.value = false
    }
}

// Formatters
const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
        // Try parsing assuming ISO or standard format
        const date = new Date(dateStr)
        // If invalid date
        if (isNaN(date.getTime())) return dateStr
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    } catch {
        return dateStr
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

            <!-- Permission Error State -->
            <div v-if="!hasPermissions && !isLoading && permissionErrorMessage"
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
            <div v-else class="py-20 text-center text-slate-400">
                <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin mx-auto mb-4" />
                <p>Memeriksa Izin Akses...</p>
            </div>
        </UContainer>

        <!-- Camera Modal -->
        <!-- Camera Modal -->
        <!-- Custom Camera Modal Overlay -->
        <Teleport to="body">
            <Transition name="camera-modal">
                <div v-if="isCameraOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <!-- Backdrop -->
                    <div class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                        @click="stopCameraStream">
                    </div>

                    <!-- Modal Content (Card Style) -->
                    <div
                        class="camera-modal-content relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col ring-1 ring-white/20">

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
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
/* Custom Scrollbar for table if needed */
.overflow-x-auto::-webkit-scrollbar {
    height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 20px;
}

/* Camera Modal Transitions */
.camera-modal-enter-active,
.camera-modal-leave-active {
    transition: opacity 0.3s ease;
}

.camera-modal-enter-from,
.camera-modal-leave-to {
    opacity: 0;
}

.camera-modal-enter-active .camera-modal-content {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}

.camera-modal-leave-active .camera-modal-content {
    transition: transform 0.2s ease-in, opacity 0.2s ease;
}

.camera-modal-enter-from .camera-modal-content {
    transform: scale(0.90) translateY(20px);
    opacity: 0;
}

.camera-modal-leave-to .camera-modal-content {
    transform: scale(0.95) translateY(10px);
    opacity: 0;
}
</style>