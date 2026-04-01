<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

import InfoPanel from '@/components/config/InfoPanel.vue'
import WifiTab from '@/components/config/WifiTab.vue'

const router = useRouter()
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
        class="lg:col-span-2 flex flex-col min-h-[600px] lg:min-h-0 rounded-xl bg-white shadow-sm border border-gray-200">
        <div class="flex-1 min-h-0 overflow-y-auto p-6">
          <WifiTab />
        </div>
      </div>
    </div>
  </div>
</template>
