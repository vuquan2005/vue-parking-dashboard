<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore, WiFiMode } from '@/stores/config'
import {
  Wifi,
  Radio,
  Globe,
  Fingerprint,
  Signal,
  Smartphone,
  Cpu,
  Clock,
  HardDrive,
  Database,
  CircleCheck,
  CircleX,
  Activity,
} from 'lucide-vue-next'

const config = useConfigStore()

function rssiToPercent(rssi: number): number {
  return Math.max(0, Math.min(100, Math.round(((rssi + 90) / 60) * 100)))
}

function formatUptime(ms?: number) {
  if (!ms) return '---'
  const s = Math.floor((ms / 1000) % 60)
  const m = Math.floor((ms / (1000 * 60)) % 60)
  const h = Math.floor((ms / (1000 * 60 * 60)) % 24)
  const d = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatBytes(bytes?: number) {
  if (!bytes) return '---'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const rssi = computed(() => config.espStatus.rssi ?? 0)
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

const modeColor = computed(() => {
  if (config.espStatus.mode === WiFiMode.AP) return { bg: 'bg-amber-50/50 border-amber-100', icon: 'bg-amber-100 text-amber-600', text: 'text-amber-700' }
  if (config.espStatus.mode === WiFiMode.AP_STA) return { bg: 'bg-blue-50/50 border-blue-100', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-700' }
  return { bg: 'bg-violet-50/50 border-violet-100', icon: 'bg-violet-100 text-violet-600', text: 'text-violet-700' }
})

const isAP = computed(() => config.espStatus.mode === WiFiMode.AP || config.espStatus.mode === WiFiMode.AP_STA)

/** Data-driven info items */
const networkItems = computed(() => [
  { icon: Wifi, label: 'SSID', value: config.espStatus.ssid || '---', color: 'bg-sky-100 text-sky-600' },
  { icon: Globe, label: 'IP Address', value: config.espStatus.ip || '---', color: 'bg-violet-100 text-violet-600', mono: true },
  { icon: Fingerprint, label: 'MAC', value: config.espStatus.mac || '---', color: 'bg-emerald-100 text-emerald-600', mono: true },
  { icon: Radio, label: 'Channel', value: config.espStatus.channel || '---', color: 'bg-amber-100 text-amber-600', mono: true },
])

const hardwareItems = computed(() => [
  { icon: Cpu, label: 'CPU Freq', value: config.espStatus.cpu_freq ? config.espStatus.cpu_freq + ' MHz' : '---', color: 'bg-indigo-100 text-indigo-600' },
  { icon: HardDrive, label: 'Free RAM', value: formatBytes(config.espStatus.free_heap), color: 'bg-pink-100 text-pink-600' },
  { icon: HardDrive, label: 'Min Free Ever', value: formatBytes(config.espStatus.min_free_heap), color: 'bg-rose-100 text-rose-600' },
  { icon: Database, label: 'Largest Block', value: formatBytes(config.espStatus.max_free_block), color: 'bg-orange-100 text-orange-600' },
  { icon: Clock, label: 'Uptime', value: formatUptime(config.espStatus.uptime), color: 'bg-blue-100 text-blue-600' },
  { icon: Activity, label: 'Ping', value: config.espStatus.latency ? config.espStatus.latency + ' ms' : '---', color: 'bg-teal-100 text-teal-600' },
])
</script>

<template>
  <div class="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 to-teal-50/50">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600">
          <Signal class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-800">Trạng thái ESP32</h3>
          <p class="text-xs text-gray-400">Thông tin kết nối hiện tại</p>
        </div>
      </div>

      <!-- Connection status badge -->
      <div
        :class="[
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-all',
          config.espStatus.connected
            ? 'text-emerald-600 bg-emerald-50 ring-emerald-200'
            : 'text-gray-500 bg-gray-50 ring-gray-200',
        ]"
      >
        <CircleCheck v-if="config.espStatus.connected" class="w-3.5 h-3.5" />
        <CircleX v-else class="w-3.5 h-3.5" />
        {{ config.espStatus.connected ? 'Online' : 'Offline' }}
      </div>
    </div>

    <div class="p-6 space-y-4">
      <!-- WiFi Mode Badge -->
      <div class="flex items-center gap-3 rounded-xl p-4 border" :class="modeColor.bg">
        <div class="flex items-center justify-center w-10 h-10 rounded-xl" :class="modeColor.icon">
          <Radio v-if="isAP" class="w-5 h-5" />
          <Wifi v-else class="w-5 h-5" />
        </div>
        <div>
          <p class="text-sm font-bold" :class="modeColor.text">
            {{ config.wifiModeLabel(config.espStatus.mode ?? 0) }} Mode
          </p>
          <p class="text-xs text-gray-400 mt-0.5">
            <template v-if="config.espStatus.mode === WiFiMode.AP">
              ESP32 phát WiFi · {{ config.espStatus.apClients }} clients
            </template>
            <template v-else-if="config.espStatus.mode === WiFiMode.AP_STA">
              Phát WiFi & Kết nối router
            </template>
            <template v-else>Kết nối tới router</template>
          </p>
        </div>
      </div>

      <!-- Signal strength -->
      <div v-if="config.espStatus.connected" class="rounded-xl bg-gray-50 p-4 border border-gray-100">
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

      <!-- AP Clients (only in AP mode) -->
      <div
        v-if="config.espStatus.mode === WiFiMode.AP"
        class="flex items-center gap-3 rounded-xl bg-amber-50/50 p-3.5 border border-amber-100"
      >
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600">
          <Smartphone class="w-4 h-4" />
        </div>
        <div>
          <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">AP Clients</p>
          <p class="text-sm font-bold text-amber-700">
            {{ config.espStatus.apClients }} thiết bị đang kết nối
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
