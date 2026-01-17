<template>
  <!-- 
    CORPORATE NATURE COLOR PALETTE - Auth Layout
    Page Background: #F1F5F9 (Soft Cloud) - Reduces glare for 40+ users
  -->
  <div class="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F1F5F9] font-sans">

    <!-- Subtle noise texture for depth -->
    <div
      class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] pointer-events-none">
    </div>

    <div class="relative w-full max-w-md z-10">
      <slot />
    </div>

    <!-- Footer with improved contrast -->
    <div class="absolute bottom-6 text-sm text-[#64748B] font-medium">
      &copy; {{ new Date().getFullYear() }} IT Support PT. BINA
    </div>
  </div>
</template>