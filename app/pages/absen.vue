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
    await loadData()
    initLocation()
})

// --- Methods ---

// 1. Data Loading
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

// 2. Location (Always active)
function initLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                locationCoords.value = `${pos.coords.latitude},${pos.coords.longitude}`
            },
            (err) => {
                console.warn('GPS Error', err)
                // Non-blocking, but can warn user if strict
            }
        )
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

            <!-- SECTION A: Camera Placeholder -->
            <section class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">1. Foto Kehadiran</h2>

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
                                    class="p-4 w-28 text-center sticky left-0 bg-gray-50 z-10 border-r border-slate-200">
                                    Action</th>
                                <th class="p-4 min-w-[100px]">Jenis</th>
                                <th class="p-4 min-w-[100px]">Shift</th>
                                <th class="p-4">Start</th>
                                <th class="p-4">In</th>
                                <th class="p-4">End</th>
                                <th class="p-4">Out</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="isLoading">
                                <td colspan="7" class="p-8 text-center text-slate-400">Loading schedules...</td>
                            </tr>
                            <tr v-else-if="attendanceList.length === 0">
                                <td colspan="7" class="p-8 text-center text-slate-400">Tidak ada data jadwal hari ini.
                                </td>
                            </tr>
                            <tr v-for="row in attendanceList" :key="row.id" class="hover:bg-slate-50 transition-colors">
                                <!-- Column 1: Action -->
                                <td
                                    class="p-3 text-center sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
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
                                <td class="p-4">
                                    <UBadge :color="row.jenis_absen === 'NORMAL' ? 'primary' : 'warning'"
                                        variant="solid" size="xs">
                                        {{ row.jenis_absen }}
                                    </UBadge>
                                </td>

                                <!-- Column 3: Shift -->
                                <td class="p-4 font-medium text-slate-700">
                                    {{ row.shift }}
                                </td>

                                <!-- Column 4: Start -->
                                <td class="p-4 text-[#334155] font-mono">
                                    {{ formatTime(row.start_date) }}
                                </td>

                                <!-- Column 5: In -->
                                <td class="p-4 font-mono"
                                    :class="row.date_in ? 'text-[#166534] font-bold' : 'text-[#334155]'">
                                    {{ formatTime(row.date_in) }}
                                </td>

                                <!-- Column 6: End -->
                                <td class="p-4 text-[#334155] font-mono">
                                    {{ formatTime(row.end_date) }}
                                </td>

                                <!-- Column 7: Out -->
                                <td class="p-4 font-mono"
                                    :class="row.date_out ? 'text-[#166534] font-bold' : 'text-[#334155]'">
                                    {{ formatTime(row.date_out) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </UContainer>

        <!-- Camera Modal -->
        <!-- Camera Modal -->
        <!-- Custom Camera Modal Overlay -->
        <Teleport to="body">
            <div v-if="isCameraOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity"
                    @click="stopCameraStream"></div>

                <!-- Modal Content -->
                <div
                    class="relative w-full max-w-md bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] ring-1 ring-white/20 animate-[fade-in_0.2s_ease-out]">
                    <!-- Cam Header -->
                    <div
                        class="absolute top-0 left-0 right-0 p-5 z-20 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent">
                        <div class="text-white">
                            <h3 class="font-bold text-xl tracking-tight">Ambil Foto</h3>
                            <p class="text-xs text-slate-300 mt-1">Pastikan wajah terlihat jelas</p>
                        </div>
                        <button @click="stopCameraStream"
                            class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50">
                            <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
                        </button>
                    </div>

                    <!-- Video Feed -->
                    <div class="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
                        <video ref="videoEl" autoplay playsinline
                            class="absolute inset-0 w-full h-full object-cover transform -scale-x-100"></video>
                        <canvas ref="canvasEl" class="hidden"></canvas>

                        <!-- Guide Frame -->
                        <div
                            class="w-64 h-80 border-2 border-white/40 rounded-[2rem] z-10 border-dashed relative shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                            <div class="absolute inset-0 flex items-center justify-center opacity-50">
                                <UIcon name="i-heroicons-face-smile" class="w-24 h-24 text-white/30" />
                            </div>
                        </div>
                    </div>

                    <!-- Controls -->
                    <div class="h-auto py-8 bg-slate-950 flex justify-center items-center pb-10">
                        <button @click="capturePhoto"
                            class="group relative w-20 h-20 rounded-full border-4 border-white p-1 transition-transform hover:scale-105 active:scale-95 focus:outline-none">
                            <div
                                class="w-full h-full bg-[#166534] rounded-full group-hover:bg-[#15803d] transition-colors relative z-10 shadow-inner">
                            </div>
                        </button>
                    </div>
                </div>
            </div>
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

@keyframes fade-in {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>