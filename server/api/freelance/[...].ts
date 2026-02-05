// Server-side API Proxy - Securely forwards requests to external API
// This keeps the headerKey and apiKey on the server (never exposed to browser)

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    // 1. Clean up the path - remove /api/freelance prefix to get the actual endpoint
    const path = event.path.replace(/^\/api\/freelance/, '')
    const target = `${config.public.apiBase}${path}`

    // 2. Extract the "Origin" from your target URL
    let originUrl = ''
    try {
        originUrl = new URL(config.public.apiBase).origin
    } catch (e) {
        // If it fails, fallback to hardcoded
        originUrl = 'https://api.laskarbuah.com'
    }

    // 3. Get Authorization header if present (for authenticated requests)
    const authHeader = getHeader(event, 'Authorization')

    // 4. Build headers object
    const headers: Record<string, string> = {
        // Your Secret Key (from private config)
        [config.headerKey]: config.apiKey,

        // Standard Content Type
        'Content-Type': 'application/json',

        // Bypass headers
        'User-Agent': 'PostmanRuntime/7.50.0',
        'Origin': originUrl,
        'Referer': `${originUrl}/`,
        'Host': new URL(originUrl).host
    }

    // Include Authorization header if provided
    if (authHeader) {
        headers['Authorization'] = authHeader
    }

    // 5. Proxy the request with secure headers
    return proxyRequest(event, target, { headers })
})
