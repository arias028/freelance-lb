// composables/useEmployee.ts
export const useEmployee = () => {
    const { user } = useAuth()
    const config = useRuntimeConfig()

    // Wrapper untuk panggil API via internal proxy (headerKey/apiKey handled server-side)
    const fetchApi = async (endpoint: string, options: any = {}, controller = 'FreelanceAbsensi') => {
        const token = useCookie('auth_token')
        return await $fetch(`/api/freelance/${controller}/${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token.value}`,
                ...options.headers
            }
        })
    }

    // 1. Get List Jadwal Absen
    const getAbsensiList = async () => {
        if (!user.value?.id) return []
        const response: any = await fetchApi(`GetList?id_freelance=${user.value.id}`)
        // Handle raw array response or object wrapper
        if (Array.isArray(response)) return response
        return response.success ? response.data : []
    }

    // 2. Upload Foto ke Internal Nuxt Server -> S3
    const uploadToS3 = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await $fetch('/api/upload-s3', {
            method: 'POST',
            body: formData
        })
        return response.url // Mengembalikan URL S3
    }

    // 3. Submit Absen ke C# API
    const submitAbsen = async (idAbsen: number, fotoUrl: string, map: string) => {
        return await fetchApi('SetAbsen', {
            method: 'POST',
            body: {
                id_absen: idAbsen,
                foto: fotoUrl,
                map: map,
                id_freelance: user.value?.id
            }
        })
    }

    // 4. Get Profile Detail
    const getEmployeeProfile = async () => {
        if (!user.value?.id) return null
        // Menggunakan query params agar lebih bersih aripada string concatenation
        const response: any = await fetchApi('GetDetail', {
            query: { id_freelance: user.value.id }
        }, 'FreelanceProfile')
        return response.success ? response.data : null
    }

    // 5. Get Payroll Detail
    const getDetailPayroll = async (start: string, end: string) => {
        if (!user.value?.id) return null
        const response: any = await fetchApi('GetPayroll', {
            query: {
                id_freelance: user.value.id,
                start: start,
                end: end
            }
        }, 'FreelancePayroll')
        return response.success ? response.data : null
    }

    // 6. Get List Surat (Riwayat Surat: SP, Tugas, dll)
    const getSuratList = async () => {
        if (!user.value?.id) return []
        const response: any = await fetchApi('GetList', {
            query: { id_freelance: user.value.id }
        }, 'FreelanceSurat')
        if (Array.isArray(response)) return response
        return response.success ? response.data : []
    }

    // 7. Get Detail Surat (Untuk View / Cetak)
    const getSuratDetail = async (idSurat: number) => {
        const response: any = await fetchApi('GetDetail', {
            query: { id_surat: idSurat }
        }, 'FreelanceSurat')
        // Return raw response - could be array or object with success/data
        if (Array.isArray(response)) return response
        return response.success ? response.data : response
    }

    return { getAbsensiList, uploadToS3, submitAbsen, getEmployeeProfile, getDetailPayroll, getSuratList, getSuratDetail }
}