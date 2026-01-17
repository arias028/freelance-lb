export default defineNuxtRouteMiddleware((to, from) => {
  // Use useAuth to ensure we share the exact same cookie definition/options
  const { token } = useAuth()

  // Jika tidak ada token dan bukan di halaman login, redirect ke login
  if (!token.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  // Jika ada token dan user mencoba akses login, redirect ke home
  if (token.value && to.path === '/login') {
    return navigateTo('/')
  }
})