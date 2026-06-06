<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const pipelineLogs = ref([])
const isBuilding = ref(false)
const activePipeline = ref('zena')
const buildProgress = ref(0)
const terminalRef = ref(null)
const autoAdvanceTimeout = ref(null)
let activeInterval = null

const sequence = ['zena', 'fuzpad', 'zerith', 'dorrafy']

const projectStars = ref({
  zena: 140, // Fallback values
  fuzpad: 161,
  zerith: 0,
  dorrafy: 0
})

const fetchStars = async () => {
  try {
    // Fetch personal repos
    const userReposPromise = fetch('https://api.github.com/users/JianZcar/repos').then(res => res.json())
    // Fetch Zena repo specifically from its organization
    const zenaRepoPromise = fetch('https://api.github.com/repos/Zena-Linux/Zena').then(res => res.json())

    const [userRepos, zenaRepo] = await Promise.all([userReposPromise, zenaRepoPromise])

    if (Array.isArray(userRepos)) {
      userRepos.forEach(repo => {
        const name = repo.name.toLowerCase()
        if (name === 'fuzpad') projectStars.value.fuzpad = repo.stargazers_count
        if (name === 'zerith') projectStars.value.zerith = repo.stargazers_count
        if (name === 'dorrafy') projectStars.value.dorrafy = repo.stargazers_count
      })
    }

    if (zenaRepo && zenaRepo.stargazers_count !== undefined) {
      projectStars.value.zena = zenaRepo.stargazers_count
    }
  } catch (e) {
    console.error('Telemetry: Failed to sync star counts', e)
  }
}

const logsDatabase = {
  zena: [
    { tag: 'RUNNER', text: 'Spinning up isolated virtual build environment...' },
    { tag: 'PODMAN', text: 'Pulling base image: registry.cachyos.org/bootc-niri:latest' },
    { tag: 'SOURCE', text: 'Fetching repositories: JianZcar/zena (main)...' },
    { tag: 'LAYERS', text: 'Layering atomic filesystems: configuring systemd-homed structures...' },
    { tag: 'KERNEL', text: 'Bootstrapping Cachy-LTO optimized kernel packages...' },
    { tag: 'COMP',   text: 'Assembling zix package configurations with Nuxt-driven panel' },
    { tag: 'SECURE', text: 'Generating signed unified kernel image (UKI) configurations...' },
    { tag: 'TEST',   text: 'Running system integrity tests: atomic boot sandbox rollback check' },
    { tag: 'OK',     text: 'Successfully generated bootc artifact. Deployment verified.' }
  ],
  fuzpad: [
    { tag: 'RUNNER', text: 'Allocating runner resources for release pipeline (v1.8.4)...' },
    { tag: 'DEPS',   text: 'Checking core dependencies: fzf, bat, grep, git' },
    { tag: 'MATRIX', text: 'Testing fuzzy-finder shell autocompletion matrix compatibility...' },
    { tag: 'BACKUP', text: 'Executing automated fallback repository synchronization scripts...' },
    { tag: 'PACK',   text: 'Building standalone shell utility binaries...' },
    { tag: 'OK',     text: 'FuzPad compilation successful. Binaries published to repository channels.' }
  ],
  zerith: [
    { tag: 'RUNNER', text: 'Preparing isolated MKOSI compiler container...' },
    { tag: 'CONFIG', text: 'Parsing mkosi.conf settings: systemd-repart target parameters...' },
    { tag: 'WARN',   text: 'System is currently in experimental development phase. Logs may vary.' },
    { tag: 'BUILD',  text: 'Assembling raw systemd rootfs matrix using targeted nix-flakes...' },
    { tag: 'OK',     text: 'MKOSI sandbox simulation completed successfully. System image archived.' }
  ],
  dorrafy: [
    { tag: 'RUNNER', text: 'Querying project records for Dorrafy search platform...' },
    { tag: 'WARN',   text: 'DEPRECATION FLAG TRIGGERED: Project marked archive-only per PALSU standards' },
    { tag: 'ARCHIVE',text: 'Dismantling Flask backend production microservices and SQL databases...' },
    { tag: 'OK',     text: 'All endpoints successfully deactivated. Cold-storage records locked.' }
  ]
}

const autoScroll = () => {
  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTo({
        top: terminalRef.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

const triggerPipeline = (projectKey) => {
  if (autoAdvanceTimeout.value) clearTimeout(autoAdvanceTimeout.value)
  if (activeInterval) clearInterval(activeInterval)

  isBuilding.value = true
  activePipeline.value = projectKey
  buildProgress.value = 0
  pipelineLogs.value = []

  const targetLogs = logsDatabase[projectKey] || []
  let logIndex = 0

  activeInterval = setInterval(() => {
    if (logIndex < targetLogs.length) {
      const item = targetLogs[logIndex]
      const formattedLog = `[ ${item.tag.padEnd(7)} ] ${item.text}`
      pipelineLogs.value.push(formattedLog)
      
      buildProgress.value = Math.round(((logIndex + 1) / targetLogs.length) * 100)
      logIndex++
      autoScroll()
    } else {
      clearInterval(activeInterval)
      isBuilding.value = false

      autoAdvanceTimeout.value = setTimeout(() => {
        const currentIndex = sequence.indexOf(projectKey)
        const nextIndex = (currentIndex + 1) % sequence.length
        triggerPipeline(sequence[nextIndex])
      }, 4000)
    }
  }, 400)
}

const getLogColorClass = (log) => {
  if (log.includes("[ OK    ]")) return "text-emerald-400 font-bold"
  if (log.includes("[ WARN   ]")) return "text-yellow-500 font-semibold"
  if (log.includes("[ SECURE ]")) return "text-blue-400"
  if (log.includes("[ PODMAN ]")) return "text-purple-400"
  return "text-zinc-400"
}

onMounted(() => {
  fetchStars()
  triggerPipeline('zena')
})

onUnmounted(() => {
  if (autoAdvanceTimeout.value) clearTimeout(autoAdvanceTimeout.value)
  if (activeInterval) clearInterval(activeInterval)
})
</script>

<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative select-none selection:bg-emerald-500 selection:text-black">
    <!-- Decorative Matrix Scanline effect on absolute background -->
    <div class="absolute inset-0 scanlines pointer-events-none opacity-[0.03]"></div>

    <!-- Header telemetry & Custom Nav Section -->
    <header class="border-b border-zinc-900 px-6 py-4 flex items-center justify-between relative z-10 bg-zinc-950/80 backdrop-blur">
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-2">
          <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span class="font-mono-tech text-xs tracking-widest text-emerald-400">JIAN_PORTAL v4.0_NUXT</span>
        </div>
        
        <nav class="hidden md:flex space-x-4 font-mono-tech text-xs">
          <span class="text-zinc-800">|</span>
          <span class="text-white border-b border-emerald-500 pb-1 cursor-default">TELEMETRY</span>
          <NuxtLink to="/blogs" class="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center space-x-1">
            <span>BLOGS</span>
          </NuxtLink>
        </nav>
      </div>
      
      <div class="flex items-center space-x-4 font-mono-tech text-xs text-zinc-500">
        <span>HOST: JIAN_NUXT_NODE</span>
        <span class="hidden sm:inline">|</span>
        <span class="hidden sm:inline">LOC: PH</span>
      </div>
    </header>

    <!-- Main stacked layout -->
    <main class="flex-1 flex flex-col relative z-10 max-w-5xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
      
      <!-- TOP SECTION: Biography & Capabilities -->
      <section class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        <!-- Left Side: Bio Info & Core Technologies -->
        <div class="md:col-span-5 space-y-6">
          <div>
            <div class="font-mono-tech text-emerald-400 text-xs tracking-wider uppercase mb-3 flex items-center space-x-2">
              <span>// IDENTITY ENVELOPE</span>
              <span class="text-zinc-800">|</span>
              <span>JIAN_ZCAR</span>
            </div>

            <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              Jian Z'car
            </h1>
            <p class="font-mono-tech text-zinc-400 text-xs md:text-sm leading-relaxed">
              Specialized systems engineer specializing in container-native Linux systems and designing high-performance, lightweight web deployment structures.
            </p>
          </div>

          <!-- Quick telemetry parameters -->
          <div class="grid grid-cols-2 gap-4 border border-zinc-900 rounded-lg p-4 bg-zinc-900/10 font-mono-tech text-[11px]">
            <div>
              <span class="block text-zinc-600 mb-0.5">CURRENT STACK</span>
              <span class="text-zinc-300">Nuxt.js & Flask</span>
            </div>
            <div>
              <span class="block text-zinc-600 mb-0.5">CONTAINERS</span>
              <span class="text-emerald-400">Podman & MKOSI</span>
            </div>
            <div>
              <span class="block text-zinc-600 mb-0.5">LANGUAGES</span>
              <span class="text-zinc-300">Bash, Python, JS, TS</span>
            </div>
            <div>
              <span class="block text-zinc-600 mb-0.5">STYLES / CSS</span>
              <span class="text-emerald-400">Tailwind & SCSS</span>
            </div>
          </div>

          <!-- Direct Contact links -->
          <div class="pt-2">
            <span class="font-mono-tech text-[10px] text-zinc-600 block uppercase mb-1.5">TELEMETRY ACCESS</span>
            <a 
              href="mailto:jian.zcar.defiant834@simplelogin.com" 
              class="font-mono-tech text-xs text-white hover:text-emerald-400 transition-colors flex items-center space-x-1"
            >
              <span>EMAIL: jian.zcar.defiant834@simplelogin.com</span>
              <span>↗</span>
            </a>
            <div class="flex space-x-4 mt-3 font-mono-tech text-[11px]">
              <a href="https://github.com/JianZcar" target="_blank" rel="noreferrer" class="text-zinc-400 hover:text-white transition-colors">github.com/JianZcar</a>
              <span class="text-zinc-800">•</span>
              <span class="text-zinc-600">Region: PH</span>
            </div>
          </div>
        </div>

        <!-- Right Side: Capabilities Matrix -->
        <div class="md:col-span-7 space-y-6">
          <div class="space-y-4">
            <h2 class="font-mono-tech text-xs text-zinc-600 uppercase tracking-widest flex items-center space-x-2">
              <span>[01] FULLSTACK & WEB CAPABILITIES</span>
              <span class="h-[1px] bg-zinc-900 flex-1" />
            </h2>

            <div class="border border-zinc-900 p-5 rounded-lg bg-zinc-900/5 hover:border-zinc-800 transition-all space-y-4">
              <p class="font-mono-tech text-xs text-zinc-400 leading-relaxed">
                I focus on writing minimal, high-efficiency system configurations, combined with intuitive full-stack web systems. I prefer simpler, highly modular architectures that deploy quickly and scale easily.
              </p>

              <div class="grid grid-cols-2 gap-4 font-mono-tech text-[11px]">
                <div>
                  <span class="text-zinc-500 block mb-1">FRONTEND LAYER</span>
                  <ul class="space-y-1 text-zinc-300">
                    <li>• Nuxt.js & Vue Ecosystem</li>
                    <li>• Tailwind CSS & Nested SCSS</li>
                    <li>• Modular Component Logic</li>
                  </ul>
                </div>
                <div>
                  <span class="text-zinc-500 block mb-1">BACKEND & STACK</span>
                  <ul class="space-y-1 text-zinc-300">
                    <li>• Node.js & Python Flask APIs</li>
                    <li>• MySQL & SQLite Architecture</li>
                    <li>• Raw JSON RESTful Endpoints</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- MIDDLE SECTION: Projects Register Matrix -->
      <section class="space-y-4 pt-4">
        <h2 class="font-mono-tech text-xs text-zinc-600 uppercase tracking-widest flex items-center space-x-2">
          <span>[02] PROJECT MATRIX REGISTER</span>
          <span class="h-[1px] bg-zinc-900 flex-1" />
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Project: Zena -->
          <div 
            @click="triggerPipeline('zena')" 
            :class="['group relative p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between', activePipeline === 'zena' ? 'border-emerald-500/50 bg-zinc-900/30' : 'border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/10']"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-mono-tech font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Zena Linux
                </h3>
                <div class="flex items-center space-x-2">
                  <span class="font-mono-tech text-[10px] text-yellow-500/90 flex items-center space-x-1 bg-yellow-500/5 border border-yellow-500/10 px-1.5 py-0.5 rounded">
                    <span>STARS: {{ projectStars.zena }}</span>
                  </span>
                  <span class="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    ACTIVE
                  </span>
                </div>
              </div>
              <p class="text-zinc-400 text-xs leading-relaxed mb-4">
                Bootc-based, immutable operating system leveraging the Cachy kernel. Tailored for developer efficiency, Wayland, and clean cryptographic user configurations.
              </p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-zinc-900/40">
              <span class="font-mono-tech text-[10px] text-zinc-600">Simulating pipeline target</span>
              <a 
                href="https://github.com/Zena-Linux/Zena" 
                target="_blank" 
                rel="noreferrer"
                @click.stop
                class="font-mono-tech text-xs text-emerald-500 hover:text-white transition-colors"
              >
                [ SOURCE_CODE ↗ ]
              </a>
            </div>
          </div>

          <!-- Project: FuzPad -->
          <div 
            @click="triggerPipeline('fuzpad')" 
            :class="['group relative p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between', activePipeline === 'fuzpad' ? 'border-emerald-500/50 bg-zinc-900/30' : 'border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/10']"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-mono-tech font-bold text-white group-hover:text-emerald-400 transition-colors">
                  FuzPad TUI
                </h3>
                <div class="flex items-center space-x-2">
                  <span class="font-mono-tech text-[10px] text-yellow-500/90 flex items-center space-x-1 bg-yellow-500/5 border border-yellow-500/10 px-1.5 py-0.5 rounded">
                    <span>STARS: {{ projectStars.fuzpad }}</span>
                  </span>
                  <span class="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    RELEASED
                  </span>
                </div>
              </div>
              <p class="text-zinc-400 text-xs leading-relaxed mb-4">
                An open-source, minimalist note management system written completely in Bash. Leverages an optimized fzf fuzzy-finder backend with direct Git integration.
              </p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-zinc-900/40">
              <span class="font-mono-tech text-[10px] text-zinc-600">Simulating pipeline target</span>
              <a 
                href="https://github.com/JianZcar/fuzpad" 
                target="_blank" 
                rel="noreferrer"
                @click.stop
                class="font-mono-tech text-xs text-emerald-500 hover:text-white transition-colors"
              >
                [ SOURCE_CODE ↗ ]
              </a>
            </div>
          </div>

          <!-- Project: Zerith -->
          <div 
            @click="triggerPipeline('zerith')" 
            :class="['group relative p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between', activePipeline === 'zerith' ? 'border-emerald-500/50 bg-zinc-900/30' : 'border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/10']"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-mono-tech font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Zerith OS
                </h3>
                <span class="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">
                  COMING SOON
                </span>
              </div>
              <p class="text-zinc-400 text-xs leading-relaxed mb-4">
                Highly reproducible operating system constructed from scratch using systemd's MKOSI toolset to define secure, declarative image-based system states.
              </p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-zinc-900/40">
              <span class="font-mono-tech text-[10px] text-zinc-600">Simulating pipeline target</span>
              <a 
                href="https://github.com/JianZcar" 
                target="_blank" 
                rel="noreferrer"
                @click.stop
                class="font-mono-tech text-xs text-emerald-500 hover:text-white transition-colors"
              >
                [ SOURCE_CODE ↗ ]
              </a>
            </div>
          </div>

          <!-- Project: Dorrafy -->
          <div 
            @click="triggerPipeline('dorrafy')" 
            :class="['group relative p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between opacity-75', activePipeline === 'dorrafy' ? 'border-emerald-500/50 bg-zinc-900/30' : 'border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/10']"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-mono-tech font-bold text-zinc-450 group-hover:text-red-400 transition-colors">
                  Dorrafy
                </h3>
                <span class="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                  DEPRECATED
                </span>
              </div>
              <p class="text-zinc-500 text-xs leading-relaxed mb-4">
                A legacy Document Retrieval Platform built to optimize retrieval of student documents in PALSU.
              </p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-zinc-900/40">
              <span class="font-mono-tech text-[10px] text-zinc-600">Simulating pipeline target</span>
              <a 
                href="https://github.com/JianZcar" 
                target="_blank" 
                rel="noreferrer"
                @click.stop
                class="font-mono-tech text-xs text-emerald-500 hover:text-white transition-colors"
              >
                [ SOURCE_CODE ↗ ]
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- BOTTOM SECTION: Anchor Telemetry Terminal Container (Height exact 10 lines, isolated scroll) -->
      <section class="w-full pt-4">
        <div class="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10 backdrop-blur flex flex-col">
          <!-- Panel Header -->
          <div class="bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-center space-x-3">
              <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <div>
                <span class="font-mono-tech text-[11px] font-bold text-zinc-200 block">SYSTEM_TELEMETRY_ENGINE</span>
              </div>
            </div>
            
            <!-- Target Selector -->
            <div class="flex items-center space-x-2 font-mono-tech text-[11px] self-stretch sm:self-auto justify-between sm:justify-start">
              <span class="text-zinc-500">MONITORING_TARGET:</span>
              <select 
                v-model="activePipeline"
                @change="triggerPipeline(activePipeline)"
                class="bg-zinc-950 border border-zinc-900 rounded text-[11px] px-2 py-0.5 font-mono-tech text-zinc-300 focus:outline-none focus:border-emerald-500/60"
              >
                <option value="zena">zena.cfg</option>
                <option value="fuzpad">fuzpad.sh</option>
                <option value="zerith">zerith.mkosi</option>
                <option value="dorrafy">dorrafy.deprecated</option>
              </select>
            </div>
          </div>

          <!-- Build telemetry workspace with explicit height (Exactly 10 lines of text scrolling) -->
          <div 
            ref="terminalRef"
            class="p-4 font-mono-tech text-[12px] overflow-y-auto space-y-1.5 custom-scrollbar bg-zinc-950 h-[180px]"
          >
            <div v-if="pipelineLogs.length === 0" class="h-full flex flex-col items-center justify-center text-zinc-700 text-center space-y-1">
              <span class="text-sm">STATION_IDLE</span>
              <span class="text-[10px]">Processing data streams...</span>
            </div>
            <div v-else v-for="(log, index) in pipelineLogs" :key="index" 
                 :class="['leading-normal border-l border-zinc-900 pl-3', getLogColorClass(log)]">
              {{ log }}
            </div>
          </div>

          <!-- Build actions and dynamic progress indicator -->
          <div class="border-t border-zinc-900 p-4 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex-1 w-full">
              <div class="flex justify-between font-mono-tech text-[9px] text-zinc-500 mb-1">
                <span>RUNNER STACK COMPILATION</span>
                <span>{{ buildProgress }}%</span>
              </div>
              <div class="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                <div 
                  class="bg-emerald-500 h-full transition-all duration-150"
                  :style="{ width: buildProgress + '%' }"
                ></div>
              </div>
            </div>
            <button 
              @click="triggerPipeline(activePipeline)"
              :disabled="isBuilding"
              :class="['w-full sm:w-auto font-mono-tech text-[11px] px-4 py-2 rounded border transition-all', isBuilding ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500 hover:text-black font-bold']"
            >
              {{ isBuilding ? 'EXECUTING...' : 'FORCE BUILD RUNNER' }}
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- Ticker bottom system footer -->
    <footer class="border-t border-zinc-900 bg-zinc-950 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-600 font-mono-tech relative z-10">
      <div>
        <span>Jian Z'car Esteban. System automated deployments.</span>
      </div>
      <div class="flex space-x-6 mt-2 md:mt-0">
        <span>LATENCY: ~14ms</span>
        <span>HEALTH: OPTIMAL</span>
        <span>STAGES: NO_ERRORS</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.scanlines {
  background: linear-gradient(
    rgba(18, 16, 16, 0) 50%, 
    rgba(0, 0, 0, 0.25) 50%
  ), linear-gradient(
    90deg, 
    rgba(255, 0, 0, 0.06), 
    rgba(0, 255, 0, 0.02), 
    rgba(0, 0, 255, 0.06)
  );
  background-size: 100% 4px, 6px 100%;
}
</style>
