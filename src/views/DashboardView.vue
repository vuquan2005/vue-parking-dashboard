<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ActivityLog from '@/components/ActivityLog.vue'
import ParkingGrid from '@/components/ParkingGrid.vue'
import StatCards from '@/components/StatCards.vue'
import { Wifi, WifiOff, Loader2 } from 'lucide-vue-next'
import { useParkingStore } from '@/stores/parking'

const router = useRouter()
const store = useParkingStore()

const statusConfig = computed(() => {
  switch (store.wsStatus) {
    case 'connected':
      return {
        label: 'Connected',
        classes: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-100',
        icon: Wifi,
        pulse: true,
      }
    case 'connecting':
      return {
        label: 'Connecting…',
        classes: 'bg-yellow-50 text-yellow-600 ring-1 ring-yellow-200',
        icon: Loader2,
        pulse: false,
      }
    case 'error':
      return {
        label: 'Error',
        classes: 'bg-red-50 text-red-600 ring-1 ring-red-200',
        icon: WifiOff,
        pulse: false,
      }
    case 'disconnected':
    default:
      return {
        label: 'Disconnected',
        classes: 'bg-gray-50 text-gray-500 ring-1 ring-gray-200',
        icon: WifiOff,
        pulse: false,
      }
  }
})
</script>

<template>
  <div class="h-screen bg-gray-100 p-6 flex flex-col">
    <!-- Header -->
    <div class="mb-6 shrink-0 flex items-center justify-between rounded-2xl bg-white px-8 py-5 shadow-sm">
      <div class="flex items-center gap-4">
        <img src="@/assets/ETEK-logo.png" alt="ETEK Parking Logo" class="h-12 w-auto object-contain" />
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight leading-tight"></h1>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest"></p>
        </div>
      </div>
      <div @click="router.push('/config')" :class="['flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold cursor-pointer transition-colors', statusConfig.classes]">
        <component :is="statusConfig.icon" :class="['w-4 h-4 shrink-0', statusConfig.pulse ? 'animate-pulse' : '', statusConfig.icon === Loader2 ? 'animate-spin' : '']" />
        <span>{{ statusConfig.label }}</span>
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

