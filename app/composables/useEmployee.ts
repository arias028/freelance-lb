// composables/useEmployee.ts
export const useEmployee = () => {
    const { user } = useAuth()
    const config = useRuntimeConfig()

    // Wrapper untuk panggil API C# dengan Header yang benar (Default Controller: FreelanceAbsensi)
    const fetchApi = async (endpoint: string, options: any = {}, controller = 'FreelanceAbsensi') => {
        const token = useCookie('auth_token')
        return await $fetch(`${config.public.apiBase}/${controller}/${endpoint}`, {
            ...options,
            headers: {
                [config.public.headerKey]: config.public.apiKey,
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
        const response: any = await fetchApi(`GetDetail?id_freelance=${user.value.id}`, {}, 'FreelanceProfile')
        return response.success ? response.data : null
    }

    return { getAbsensiList, uploadToS3, submitAbsen, getEmployeeProfile }
}