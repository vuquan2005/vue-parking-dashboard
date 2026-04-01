<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useDeviceStore } from '@/stores/device'
import {
  Wifi,
  Radio,
  Globe,
  Signal,
  Clock,
  HardDrive,
  Database,
} from 'lucide-vue-next'

const device = useDeviceStore()

// Auto-tick logic for Uptime
const displayUptime = ref(device.deviceStatus?.uptimeSeconds || 0)
let lastUptimeSync = Date.now()

watch(() => device.deviceStatus?.uptimeSeconds, (newVal) => {
  displayUptime.value = newVal || 0
  lastUptimeSync = Date.now()
})

let uptimeTimer: number
onMounted(() => {
  // Update local uptime every second
  uptimeTimer = window.setInterval(() => {
    if (device.deviceStatus?.connected && device.deviceStatus?.uptimeSeconds) {
      const elapsedSeconds = Math.floor((Date.now() - lastUptimeSync) / 1000)
      displayUptime.value = device.deviceStatus.uptimeSeconds + elapsedSeconds
    }
  }, 1000)
})

onUnmounted(() => {
  if (uptimeTimer) clearInterval(uptimeTimer)
})

function rssiToPercent(rssi: number): number {
  return Math.max(0, Math.min(100, Math.round(((rssi + 90) / 60) * 100)))
}

function formatUptime(seconds?: number) {
  if (seconds == null) return '---'
  const s = seconds % 60
  const m = Math.floor(seconds / 60) % 60
  const h = Math.floor(seconds / 3600) % 24
  const d = Math.floor(seconds / 86400)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatBytes(bytes?: number) {
  if (bytes == null) return '---'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const isOnline = computed(() => device.wsStatus === 'connected')

const rssi = computed(() => device.deviceStatus?.rssi ?? 0)
const rssiPercent = computed(() => rssiToPercent(rssi.value))
const rssiColorClass = computed(() => {
  if (rssi.value >= -50) return 'text-emerald-600'
  if (rssi.value >= -60) return 'text-sky-600'
  if (rssi.value >= -70) return 'text-amber-600'
  return 'text-red-600'
})
const rssiBarClass = computed(() => {
  if (rssi.value >= -50) return 'bg-gradient-to-r from-emerald-400 to-emerald-500'
  if (rssi.value >= -60) return 'bg-gradient-to-r from-sky-400 to-sky-500'
  if (rssi.value >= -70) return 'bg-gradient-to-r from-amber-400 to-amber-500'
  return 'bg-gradient-to-r from-red-400 to-red-500'
})

const mode = computed(() => device.deviceStatus?.wifiMode || 'NULL')

const modeColor = computed(() => {
  if (mode.value === 'AP') return { bg: 'bg-amber-50/50 border-amber-100', icon: 'bg-amber-100 text-amber-600', text: 'text-amber-700' }
  if (mode.value === 'APSTA') return { bg: 'bg-blue-50/50 border-blue-100', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-700' }
  return { bg: 'bg-violet-50/50 border-violet-100', icon: 'bg-violet-100 text-violet-600', text: 'text-violet-700' }
})

const isAP = computed(() => mode.value === 'AP' || mode.value === 'APSTA')

/** Data-driven info items */
const networkItems = computed(() => [
  { icon: Wifi, label: 'STA SSID', value: device.deviceStatus?.staSsid || '---', color: 'bg-sky-100 text-sky-600' },
  { icon: Globe, label: 'STA IP', value: device.deviceStatus?.staIp || '---', color: 'bg-violet-100 text-violet-600', mono: true },
  { icon: Radio, label: 'AP SSID', value: device.deviceStatus?.apSsid || '---', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Globe, label: 'AP IP', value: device.deviceStatus?.apIp || '---', color: 'bg-amber-100 text-amber-600', mono: true },
])

const hardwareItems = computed(() => [
  { icon: HardDrive, label: 'Free RAM', value: formatBytes(device.deviceStatus?.freeHeap), color: 'bg-pink-100 text-pink-600' },
  { icon: HardDrive, label: 'Min Free Ever', value: formatBytes(device.deviceStatus?.minFreeHeap), color: 'bg-rose-100 text-rose-600' },
  { icon: Database, label: 'Largest Block', value: formatBytes(device.deviceStatus?.maxFreeBlockSize), color: 'bg-orange-100 text-orange-600' },
  { icon: Clock, label: 'Uptime', value: formatUptime(displayUptime.value), color: 'bg-blue-100 text-blue-600' },
])
</script>

<template>
  <div class="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden flex flex-col gap-0 pr-0">
    <div class="p-6 space-y-4 overflow-y-auto">
      <!-- WiFi Mode Badge -->
      <div class="flex items-center gap-3 rounded-xl p-4 border" :class="modeColor.bg">
        <div class="flex items-center justify-center w-10 h-10 rounded-xl" :class="modeColor.icon">
          <Radio v-if="isAP" class="w-5 h-5" />
          <Wifi v-else class="w-5 h-5" />
        </div>
        <div>
          <p class="text-sm font-bold" :class="modeColor.text">
            {{ mode }} Mode
          </p>
          <p class="text-xs text-gray-400 mt-0.5">
            <template v-if="mode === 'AP'">
              ESP32 phát WiFi
            </template>
            <template v-else-if="mode === 'APSTA'">
              Phát WiFi & Kết nối router
            </template>
            <template v-else>Kết nối tới router</template>
          </p>
        </div>
      </div>

      <!-- Signal strength -->
      <div v-if="isOnline" class="rounded-xl bg-gray-50 p-4 border border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Signal class="w-4 h-4 text-gray-500" />
            <span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tín hiệu</span>
          </div>
          <span class="text-sm font-bold" :class="rssiColorClass">
            {{ rssi }} dBm · {{ rssiPercent }}%
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            :class="rssiBarClass"
            :style="{ width: rssiPercent + '%' }"
          />
        </div>
      </div>

      <!-- Network Info Grid (data-driven) -->
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="item in networkItems"
          :key="item.label"
          class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100"
        >
          <div class="flex items-center justify-center w-8 h-8 rounded-lg" :class="item.color">
            <component :is="item.icon" class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{{ item.label }}</p>
            <p class="text-sm font-bold text-gray-700 truncate" :class="{ 'font-mono': item.mono }">
              {{ item.value }}
            </p>
          </div>
        </div>
      </div>

      <!-- Hardware Info Grid (data-driven) -->
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="item in hardwareItems"
          :key="item.label"
          class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100"
        >
          <div class="flex items-center justify-center w-8 h-8 rounded-lg" :class="item.color">
            <component :is="item.icon" class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{{ item.label }}</p>
            <p class="text-sm font-bold text-gray-700 truncate">{{ item.value }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
