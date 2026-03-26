<script setup lang="ts">
import { ref, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Wifi, Radio, ScanSearch, Settings, Network } from 'lucide-vue-next'

import InfoPanel from '@/components/config/InfoPanel.vue'
import StaTab from '@/components/config/StaTab.vue'
import ApTab from '@/components/config/ApTab.vue'
import ScanTab from '@/components/config/ScanTab.vue'
import SystemTab from '@/components/config/SystemTab.vue'
import WsTab from '@/components/config/WsTab.vue'

const router = useRouter()

// ---------------------------------------------------------------------------
// Tab management
// ---------------------------------------------------------------------------
type TabId = 'STA' | 'AP' | 'SCAN' | 'SYSTEM' | 'WS'

const activeTab = ref<TabId>('STA')

const tabs: { id: TabId; label: string; icon: Component }[] = [
  { id: 'WS', label: 'WebSocket', icon: Network },
  { id: 'AP', label: 'AP', icon: Radio },
  { id: 'STA', label: 'STA', icon: Wifi },
  { id: 'SCAN', label: 'Scan', icon: ScanSearch },
  { id: 'SYSTEM', label: 'System', icon: Settings },
]
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

    <!-- Main two-panel layout -->
    <div class="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- ============================== -->
      <!-- LEFT: Info Panel               -->
      <!-- ============================== -->
      <div class="lg:col-span-1 min-h-[300px] lg:min-h-0">
        <InfoPanel />
      </div>

      <!-- ============================== -->
      <!-- RIGHT: Config Panel            -->
      <!-- ============================== -->
      <div
        class="lg:col-span-2 flex flex-col min-h-[600px] lg:min-h-0 rounded-xl bg-white shadow-sm border border-gray-200">
        <!-- Tab bar -->
        <div
          class="flex border-b border-gray-200 shrink-0 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden"
          style="scrollbar-width: none;">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
            'flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2',
            activeTab === tab.id
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-gray-400 hover:text-gray-600',
          ]">
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab content -->
        <div class="flex-1 min-h-0 overflow-y-auto p-6">
          <WsTab v-if="activeTab === 'WS'" />
          <StaTab v-else-if="activeTab === 'STA'" />
          <ApTab v-else-if="activeTab === 'AP'" />
          <ScanTab v-else-if="activeTab === 'SCAN'" />
          <SystemTab v-else-if="activeTab === 'SYSTEM'" />
        </div>
      </div>
    </div>
  </div>
</template>
