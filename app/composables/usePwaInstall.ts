/**
 * Composable untuk menangani instalasi PWA
 * Menyediakan fungsi untuk menampilkan prompt install dan status instalasi
 */

export function usePwaInstall() {
    // State untuk menyimpan event install prompt
    const deferredPrompt = useState<any>('pwa-install-prompt', () => null)
    const isInstallable = useState<boolean>('pwa-installable', () => false)
    const isInstalled = useState<boolean>('pwa-installed', () => false)

    // Cek apakah sudah terinstall sebagai PWA
    const checkIfInstalled = () => {
        if (import.meta.client) {
            // Cek via display-mode media query
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            // Cek via navigator.standalone (iOS Safari)
            const isIOSStandalone = (window.navigator as any).standalone === true

            isInstalled.value = isStandalone || isIOSStandalone
        }
    }

    // Setup listener untuk beforeinstallprompt event
    const setupInstallPrompt = () => {
        if (import.meta.client) {
            checkIfInstalled()

            // 1. If already installed, hide button immediately
            if (isInstalled.value) {
                isInstallable.value = false
                return
            }

            // 2. Show button by default!
            // This ensures the button appears so users can at least see "Manual Install" instructions
            // if the browser doesn't support the automatic popup (like iOS).
            isInstallable.value = true

            // 3. Listen for the automatic prompt event (Chrome/Edge/Android)
            window.addEventListener('beforeinstallprompt', (e: any) => {
                e.preventDefault()
                deferredPrompt.value = e
                isInstallable.value = true // Ensure it stays true
                console.log('PWA Event fired! Automatic install is ready.')
            })

            // 4. Listen for appinstalled event
            window.addEventListener('appinstalled', () => {
                isInstalled.value = true
                isInstallable.value = false
                deferredPrompt.value = null
            })
        }
    }

    // Fungsi untuk memicu install prompt
    const installApp = async (): Promise<'accepted' | 'dismissed' | 'manual_required'> => {
        if (!deferredPrompt.value) {
            // Jika tidak ada prompt tersimpan (misal di desktop browser atau iOS)
            // Kita return status manual_required agar UI bisa menampilkan instruksi
            return 'manual_required'
        }

        // Tampilkan prompt install
        deferredPrompt.value.prompt()

        // Tunggu user merespon
        const { outcome } = await deferredPrompt.value.userChoice

        // Reset deferred prompt
        deferredPrompt.value = null

        if (outcome === 'accepted') {
            isInstallable.value = false
            return 'accepted'
        }

        return 'dismissed'
    }

    return {
        isInstallable,
        isInstalled,
        setupInstallPrompt,
        installApp
    }
}
