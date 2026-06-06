<template>
  <div class="min-h-screen text-zinc-100 flex flex-col relative">
    <ShaderBackground />
    <div class="relative z-10 flex-1 flex flex-col">
      <header class="border-b border-zinc-900 px-6 py-4 flex items-center justify-between bg-zinc-950/40 backdrop-blur">
        <NuxtLink to="/blogs" class="flex items-center space-x-2 group">
          <span class="text-emerald-400 group-hover:translate-x-[-4px] transition-transform">←</span>
          <span class="font-mono-tech text-xs tracking-widest text-emerald-400">BACK_TO_LOGS</span>
        </NuxtLink>
      </header>

      <main class="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <article v-if="page" class="prose prose-invert prose-emerald max-w-none">
          <header class="mb-12 border-b border-zinc-900 pb-8">
            <h1 class="text-4xl font-extrabold text-white mb-4 !mt-0">{{ page.title }}</h1>
            <div class="flex items-center space-x-4 text-xs font-mono-tech text-zinc-500">
              <span>DATE: {{ page.date || 'UNKNOWN' }}</span>
              <span>|</span>
              <span>STATUS: ARCHIVED</span>
            </div>
          </header>
          <ContentRenderer :value="page" />
        </article>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string[]
const path = slug && slug.length > 0 ? `/${slug.join('/')}` : '/'

const { data: page } = await useAsyncData('page-' + path, () => {
  return queryCollection('blogs').path(path).first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Log entry not found', fatal: true })
}
</script>