// composables/useAuth.ts

interface User {
  id: number
  nama: string
  token: string
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const router = useRouter()

  // UBAH DISINI: Gunakan useCookie untuk user_profile agar data user (ID)
  // tetap tersimpan (persist) walaupun halaman di-refresh.
  const token = useCookie('auth_token', {
    maxAge: 60 * 60 * 24,
    path: '/'
  })

  // Kita simpan object user di cookie juga
  const user = useCookie<User | null>('user_profile', {
    maxAge: 60 * 60 * 24,
    path: '/',
    default: () => null
  })

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
        // Simpan token
        token.value = response.data.token

        // Simpan data user (ID & Nama) ke Cookie agar tidak hilang saat refresh
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
      user.value = null // Reset cookie user
      if (error.response?.status === 401) {
        throw new Error('Kode User atau Password salah.')
      }
      throw error
    }
  }

  const logout = async () => {
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
        console.error('Logout API error', error)
      }
    }

    // Hapus Cookie
    token.value = null
    user.value = null
    router.push('/login')
  }

  return {
    user,
    token,
    login,
    logout
  }
}