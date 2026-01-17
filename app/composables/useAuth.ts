// composables/useAuth.ts

interface User {
  id: number
  nama: string
  token: string
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const router = useRouter()

  const token = useCookie('auth_token', { maxAge: 60 * 60 * 24 })
  const user = useState<User | null>('user_profile', () => null)

  const getBrowserIp = async (): Promise<string> => {
    try {
      const data = await $fetch<{ ip: string }>('https://api.ipify.org?format=json')
      return data.ip
    } catch (e) {
      return '0.0.0.0'
    }
  }

  const login = async (kode_user: string, password: string) => {
    const ipAddress = await getBrowserIp()

    const payload = {
      kode_user: kode_user,
      password: password,
      ip: ipAddress,
      aplikasi_id: Number(config.public.appId)
    }

    try {
      const apiEndpoint = `${config.public.apiBase}/FreelanceLogin`

      const response = await $fetch<any>(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [config.public.headerKey]: config.public.apiKey
        },
        body: payload
      })

      if (response.success && response.data) {
        token.value = response.data.token
        user.value = {
          id: response.data.id,
          nama: response.data.nama,
          token: response.data.token
        }
        await router.push('/')
      } else {
        throw new Error(response.message || 'Login failed')
      }

    } catch (error: any) {
      token.value = null
      user.value = null
      if (error.response?.status === 401) {
        throw new Error('Kode User atau Password salah.')
      }
      throw error
    }
  }

  // --- LOGIC LOGOUT BARU ---
  const logout = async () => {
    // 1. Jika user punya ID dan Token, panggil API Logout
    if (user.value?.id && token.value) {
      try {
        const apiEndpoint = `${config.public.apiBase}/FreelanceLogout`

        await $fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [config.public.headerKey]: config.public.apiKey,
            'Authorization': `Bearer ${token.value}`
          },
          body: {
            id_freelance: user.value.id
          }
        })
      } catch (error) {
        console.error('Gagal logout dari server, membersihkan sesi lokal...', error)
      }
    }

    // 2. Hapus Token & Data Lokal (Penting!)
    token.value = null
    user.value = null

    // 3. Redirect ke halaman Login
    router.push('/login')
  }

  return {
    user,
    token,
    login,
    logout
  }
}