<template>
  <!-- 
    CORPORATE NATURE COLOR PALETTE - Auth Layout
    Background: Soft Cloud (#F1F5F9) with Dot Pattern & Ambient Glows
  -->
  <div
    class="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F1F5F9] font-sans relative overflow-x-hidden">

    <!-- FIXED Background Layer: Prevents scrollbar issues by staying out of flow -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <!-- 1. Geometric Dot Pattern -->
      <div class="absolute inset-0 opacity-[0.6]"
        style="background-image: radial-gradient(#CBD5E1 1px, transparent 1px); background-size: 24px 24px;">
      </div>

      <!-- 2. Organic Ambient Glows -->
      <!-- Top Left -->
      <div
        class="absolute top-0 left-0 w-[600px] h-[600px] bg-[#166534]/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2">
      </div>

      <!-- Bottom Right -->
      <div
        class="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#0F172A]/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2">
      </div>

      <!-- 3. Noise Texture -->
      <div
        class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-soft-light">
      </div>
    </div>

    <!-- Content Layer -->
    <div class="relative w-full max-w-md z-10">
      <slot />
    </div>

  </div>
</template>