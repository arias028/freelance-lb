<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 font-sans">
    
    <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

    <div class="relative w-full max-w-md z-10">
      <slot />
    </div>

    <div class="absolute bottom-6 text-xs text-gray-400">
      &copy; {{ new Date().getFullYear() }} IT Support PT. BINA
    </div>
  </div>
</template>