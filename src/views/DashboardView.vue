<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useWebSocket } from '@/composables/useWebSocket'
import ActivityLog from '@/components/ActivityLog.vue'
import ParkingGrid from '@/components/ParkingGrid.vue'
import StatCards from '@/components/StatCards.vue'
import { Wifi, WifiOff } from 'lucide-vue-next'

const router = useRouter()
const configStore = useConfigStore()
const { isConnected } = useWebSocket()
</script>

<template>
  <div class="h-screen bg-gray-100 p-6 flex flex-col">
    <!-- Header -->
    <div
      class="mb-6 shrink-0 flex items-center justify-between rounded-2xl bg-white px-8 py-5 shadow-sm"
    >
      <div class="flex items-center gap-4">
        <img
          src="@/assets/ETEK-logo.png"
          alt="ETEK Parking Logo"
          class="h-12 w-auto object-contain"
        />
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight leading-tight"></h1>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest"></p>
        </div>
      </div>
      <div
        @click="router.push('/config')"
        :class="[
          'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold cursor-pointer transition-colors',
          isConnected && configStore.espStatus.connected
            ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-100'
            : 'bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100',
        ]"
      >
        <Wifi
          v-if="isConnected && configStore.espStatus.connected"
          class="w-4 h-4 animate-pulse shrink-0"
        />
        <WifiOff v-else class="w-4 h-4 shrink-0" />
        <span>
          {{ isConnected ? configStore.espStatus.ssid || 'Connected' : 'Disconnected' }}
        </span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 flex-1 min-h-0">
      <!-- Left Column: Stat Cards + Grid -->
      <div class="lg:col-span-2 flex flex-col gap-6 min-h-0">
        <StatCards class="shrink-0" />
        <ParkingGrid class="flex-1 min-h-0" />
      </div>

      <!-- Right Column: Activity Log -->
      <div class="min-h-0">
        <ActivityLog class="h-full" />
      </div>
    </div>
  </div>
</template>
