export default defineNuxtRouteMiddleware((to, from) => {
  // --- 1. WHITELIST PWA FILES ---
  // If the browser is asking for the manifest or service worker, 
  // let it pass immediately. Do not check for a token.
  if (to.path === '/manifest.webmanifest' || to.path === '/sw.js') {
    return
  }

  // --- 2. AUTH LOGIC ---
  const { token } = useAuth()

  // If no token and NOT on login page -> Redirect to Login
  if (!token.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  // If token exists and trying to access login -> Redirect to Home
  if (token.value && to.path === '/login') {
    return navigateTo('/')
  }
})