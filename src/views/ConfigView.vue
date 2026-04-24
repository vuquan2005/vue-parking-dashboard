<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Wifi, TerminalSquare } from 'lucide-vue-next'

import InfoPanel from '@/components/config/InfoPanel.vue'
import WifiTab from '@/components/config/WifiTab.vue'
import DebugTab from '@/components/config/DebugTab.vue'

const router = useRouter()
const activeTab = ref<'wifi' | 'debug'>('wifi')
const buildTimestamp = ref<string | null>(null)

onMounted(() => {
  const ts = (window as unknown as { BUILD_TIMESTAMP?: string | number }).BUILD_TIMESTAMP
  if (ts) {
    const tsNum = Number(ts)
    if (!isNaN(tsNum)) {
      const date = new Date(tsNum * 1000)
      buildTimestamp.value = date.toLocaleString()
    }
  }
})
</script>

<template>
  <div class="min-h-screen lg:h-screen bg-gray-100 p-4 lg:p-6 flex flex-col">
    <!-- Header -->
    <div class="mb-6 shrink-0 flex items-center justify-between rounded-2xl bg-white px-4 lg:px-8 py-4 shadow-sm">
      <button @click="router.push('/')"
        class="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft class="w-4 h-4" />
        Dashboard
      </button>
      <h1 class="text-lg font-bold text-gray-800 tracking-tight">Device Configuration</h1>
    </div>

    <div class="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 min-h-[300px] lg:min-h-0">
        <InfoPanel />
      </div>

      <div
        class="lg:col-span-2 flex flex-col min-h-[600px] lg:min-h-0 rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">

        <!-- Tabs Header -->
        <div class="border-b border-gray-200 px-6 pt-4 flex gap-6 shrink-0 bg-white">
          <button
            @click="activeTab = 'wifi'"
            :class="[
              'pb-3 text-sm font-medium transition-colors relative',
              activeTab === 'wifi' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
            ]"
          >
            <div class="flex items-center gap-2">
              <Wifi class="w-4 h-4" />
              WiFi Settings
            </div>
            <div v-if="activeTab === 'wifi'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
          </button>

          <button
            @click="activeTab = 'debug'"
            :class="[
              'pb-3 text-sm font-medium transition-colors relative',
              activeTab === 'debug' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
            ]"
          >
            <div class="flex items-center gap-2">
              <TerminalSquare class="w-4 h-4" />
              Raw Messages
            </div>
            <div v-if="activeTab === 'debug'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
          </button>
        </div>

        <div class="flex-1 min-h-0 p-6 bg-gray-50/50">
          <WifiTab v-if="activeTab === 'wifi'" />
          <!-- Re-use DebugTab height without scrolling wrapper to let it manage its own height -->
          <DebugTab v-if="activeTab === 'debug'" class="h-full" />
        </div>
      </div>
    </div>

    <div v-if="buildTimestamp" class="fixed bottom-2 right-2 text-xs text-gray-500/50 pointer-events-none z-50">
      Build: {{ buildTimestamp }}
    </div>
  </div>
</template>
