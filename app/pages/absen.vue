<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { getAbsensiList, uploadToS3, submitAbsen } = useEmployee()
const toast = useToast()

// State
const attendanceList = ref<any[]>([])
const isLoading = ref(false)
const isCameraOpen = ref(false)
const selectedScheduleId = ref<number | null>(null)
const locationCoords = ref<string>('') // Format: "-7.123,112.456"

// Camera Refs
const videoEl = ref<HTMLVideoElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

// 1. Load Data saat halaman dibuka
onMounted(async () => {
    await loadData()
})

async function loadData() {
    isLoading.value = true
    try {
        attendanceList.value = await getAbsensiList()
    } catch (e) {
        toast.add({ title: 'Error', description: 'Gagal memuat jadwal absen', color: 'error' })
    } finally {
        isLoading.value = false
    }
}

// 2. Buka Kamera & Cek Lokasi
const openCamera = (idAbsen: number) => {
    selectedScheduleId.value = idAbsen
    isCameraOpen.value = true

    // Cek Lokasi GPS
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                locationCoords.value = `${position.coords.latitude},${position.coords.longitude}`
            },
            (error) => {
                toast.add({ title: 'GPS Error', description: 'Aktifkan GPS untuk absen!', color: 'error' })
                isCameraOpen.value = false
            }
        )
    } else {
        toast.add({ title: 'Error', description: 'Browser tidak support GPS', color: 'error' })
        return
    }

    // Akses Kamera Depan
    nextTick(async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' } // Lock Front Camera
                })
                if (videoEl.value) videoEl.value.srcObject = stream
            } catch (err) {
                toast.add({ title: 'Kamera Error', description: 'Izinkan akses kamera', color: 'error' })
                isCameraOpen.value = false
            }
        }
    })
}

// 3. Capture Foto & Proses Absen
const captureAndSubmit = async () => {
    if (!videoEl.value || !canvasEl.value) return

    isLoading.value = true

    // Gambar video ke canvas
    const context = canvasEl.value.getContext('2d')
    canvasEl.value.width = videoEl.value.videoWidth
    canvasEl.value.height = videoEl.value.videoHeight
    context?.drawImage(videoEl.value, 0, 0)

    // Convert Canvas ke File Blob
    canvasEl.value.toBlob(async (blob) => {
        if (!blob) return

        try {
            // Step A: Upload ke AWS S3 via Nuxt Server
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" })
            const s3Url = await uploadToS3(file)

            // Step B: Kirim URL + Lokasi ke C# API
            if (selectedScheduleId.value) {
                const result: any = await submitAbsen(selectedScheduleId.value, s3Url, locationCoords.value)

                if (result.success) {
                    toast.add({ title: 'Sukses', description: 'Absen berhasil disimpan!', color: 'success' })
                    isCameraOpen.value = false
                    stopCamera()
                    await loadData() // Refresh list
                } else {
                    // Handle logic success=false (misal: "Terlalu cepat")
                    toast.add({ title: 'Gagal', description: result.message, color: 'warning' })
                }
            }

        } catch (e) {
            toast.add({ title: 'Error', description: 'Gagal memproses absen', color: 'error' })
        } finally {
            isLoading.value = false
        }
    }, 'image/jpeg', 0.8)
}

// Helper: Matikan Kamera
const stopCamera = () => {
    if (videoEl.value && videoEl.value.srcObject) {
        const stream = videoEl.value.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
    }
    isCameraOpen.value = false
}
</script>

<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-xl font-bold">Jadwal Absensi</h1>
            <UButton icon="i-heroicons-arrow-path" size="sm" variant="ghost" @click="loadData" />
        </div>

        <div v-if="isLoading && !isCameraOpen" class="space-y-3">
            <USkeleton class="h-24 w-full" v-for="n in 3" :key="n" />
        </div>

        <div v-else-if="attendanceList.length === 0" class="text-center py-10 text-gray-500">
            <UIcon name="i-heroicons-calendar" class="w-12 h-12 mb-2" />
            <p>Tidak ada jadwal absen hari ini.</p>
        </div>

        <div v-else class="space-y-3">
            <UCard v-for="item in attendanceList" :key="item.id_absen">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold">{{ item.nama_shift || 'Shift Regular' }}</h3>
                        <p class="text-sm text-gray-500">
                            {{ item.jam_masuk }} - {{ item.jam_pulang }}
                        </p>
                        <UBadge :color="item.status === 'Hadir' ? 'success' : 'neutral'" variant="subtle" class="mt-2">
                            {{ item.status || 'Belum Absen' }}
                        </UBadge>
                    </div>

                    <UButton v-if="item.status !== 'Selesai'" icon="i-heroicons-camera"
                        @click="openCamera(item.id_absen)">
                        Absen
                    </UButton>
                </div>
            </UCard>
        </div>

        <UModal v-model="isCameraOpen" prevent-close>
            <UCard :ui="{ root: 'ring-0 divide-y divide-gray-100 dark:divide-gray-800' }">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                            Ambil Foto Selfie
                        </h3>
                        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="stopCamera" />
                    </div>
                </template>

                <div class="relative overflow-hidden rounded-lg bg-black aspect-[3/4]">
                    <video ref="videoEl" autoplay playsinline
                        class="w-full h-full object-cover transform scale-x-[-1]"></video>

                    <canvas ref="canvasEl" class="hidden"></canvas>

                    <div class="absolute bottom-4 left-0 right-0 flex justify-center">
                        <UButton size="xl" color="neutral" variant="solid" icon="i-heroicons-camera"
                            :loading="isLoading"
                            class="rounded-full w-16 h-16 flex items-center justify-center shadow-lg ring-4 ring-white/30"
                            @click="captureAndSubmit" />
                    </div>
                </div>

                <template #footer>
                    <div class="text-xs text-gray-500 text-center">
                        <p>Lokasi: {{ locationCoords || 'Mencari GPS...' }}</p>
                        <p>Pastikan wajah terlihat jelas.</p>
                    </div>
                </template>
            </UCard>
        </UModal>
    </div>
</template>

<style scoped>
/* Mirror effect for selfie camera feel */
video {
    transform: scaleX(-1);
}
</style>