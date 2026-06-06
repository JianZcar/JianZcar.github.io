<script setup>
const { data: blogs } = await useAsyncData('blogs-list', () => {
  return queryCollection('blogs').all()
})
</script>

<template>
  <div class="min-h-screen text-zinc-100 flex flex-col relative">
    <ShaderBackground />
    <div class="relative z-10 flex-1 flex flex-col">
      <header class="border-b border-zinc-900 px-6 py-4 flex items-center justify-between bg-zinc-950/40 backdrop-blur">
        <NuxtLink to="/" class="flex items-center space-x-2 group">
          <span class="text-emerald-400 group-hover:translate-x-[-4px] transition-transform">←</span>
          <span class="font-mono-tech text-xs tracking-widest text-emerald-400">RETURN_TO_PORTAL</span>
        </NuxtLink>
      </header>

      <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        <h1 class="text-4xl font-extrabold text-white mb-8 font-mono-tech tracking-tight">
          [05] SYSTEM_LOGS / BLOGS
        </h1>

        <div v-if="blogs && blogs.length > 0" class="space-y-6">
          <NuxtLink 
            v-for="blog in blogs" 
            :key="blog.path"
            :to="blog.path === '/' ? '/blogs' : `/blogs${blog.path}`"
            class="block border border-zinc-900 p-6 rounded-lg bg-zinc-950/40 backdrop-blur-md hover:border-emerald-500/50 transition-all group"
          >
            <h2 class="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
              {{ blog.title || 'Untitled Log' }}
            </h2>
            <p v-if="blog.description" class="text-zinc-400 text-sm mt-2">
              {{ blog.description }}
            </p>
            <div class="mt-4 flex items-center justify-between text-[10px] font-mono-tech text-zinc-600">
              <span>DATE: {{ blog.date || 'PENDING' }}</span>
              <span class="text-emerald-500">READ_MORE →</span>
            </div>
          </NuxtLink>
        </div>
        
        <div v-else class="text-center py-20 border border-dashed border-zinc-800 rounded-lg">
          <span class="font-mono-tech text-zinc-500 text-sm uppercase">No logs detected in the current sector.</span>
        </div>
      </main>
    </div>
  </div>
</template>
