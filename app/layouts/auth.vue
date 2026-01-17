<template>
  <!-- 
    CORPORATE NATURE COLOR PALETTE - Auth Layout
    Background: Soft Cloud (#F1F5F9) with Dot Pattern & Ambient Glows
  -->
  <div
    class="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F1F5F9] font-sans relative overflow-hidden">

    <!-- 1. Geometric Dot Pattern Texture -->
    <div class="absolute inset-0 z-0 opacity-[0.6] pointer-events-none select-none"
      style="background-image: radial-gradient(#CBD5E1 1px, transparent 1px); background-size: 24px 24px;">
    </div>

    <!-- 2. Organic Ambient Glows (Nature Touches) -->
    <!-- Top Left: Soft Forest Green Breath -->
    <div
      class="absolute top-0 left-0 w-[600px] h-[600px] bg-[#166534]/5 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3 pointer-events-none">
    </div>

    <!-- Bottom Right: Deep Midnight Navy Depth -->
    <div
      class="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#0F172A]/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none">
    </div>

    <!-- 3. Existing Noise for Texture (Subtle) -->
    <div
      class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] pointer-events-none z-0 mix-blend-soft-light">
    </div>

    <div class="relative w-full max-w-md z-10">
      <slot />
    </div>

    <!-- Footer with improved contrast -->
    <div
      class="absolute bottom-6 text-sm text-[#64748B] font-medium z-10 transition-colors duration-300 hover:text-[#0F172A]">
      &copy; {{ new Date().getFullYear() }} IT Support PT. BINA
    </div>
  </div>
</template>