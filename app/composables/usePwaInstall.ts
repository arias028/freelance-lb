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
    // Setup listener untuk beforeinstallprompt event
    const setupInstallPrompt = () => {
        if (import.meta.client) {
            checkIfInstalled()

            // Jika sudah terinstall, set false
            if (isInstalled.value) {
                isInstallable.value = false
                return
            }

            // HAPUS ATAU KOMENTARI BARIS INI:
            // isInstallable.value = true  <-- INI PENYEBABNYA. 
            // Jangan paksa true. Biarkan event listener di bawah yang mengubahnya jadi true.

            // Listen untuk beforeinstallprompt event
            window.addEventListener('beforeinstallprompt', (e: any) => {
                // Prevent default browser prompt
                e.preventDefault()
                // Simpan event untuk digunakan nanti
                deferredPrompt.value = e
                isInstallable.value = true
                console.log('PWA Event fired!')
            })

            // Listen untuk appinstalled event
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
