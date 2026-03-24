<script setup lang="ts">
import { computed } from 'vue'
import { useDeviceStore } from '@/stores/device'

const device = useDeviceStore()

function formatUptime(seconds: number | undefined): string {
  if (!seconds) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function formatBytes(bytes: number | undefined): string {
  if (bytes == null) return '—'
  return bytes.toLocaleString() + ' bytes'
}

const wsConnected = computed(() => device.wsStatus === 'connected')
const statusLabel = computed(() => {
  switch (device.wsStatus) {
    case 'connected':
      return 'CONNECTED'
    case 'connecting':
      return 'CONNECTING…'
    case 'error':
      return 'ERROR'
    default:
      return 'DISCONNECTED'
  }
})
</script>

<template>
  <div class="flex flex-col gap-5 overflow-y-auto pr-1">
    <!-- Connection Status -->
    <div class="rounded-xl bg-white shadow-sm border border-gray-200 p-5">
      <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
        Connection Status
      </h2>

      <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div class="flex items-center gap-2">
          <span class="font-medium text-gray-500">Status</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span
            :class="[
              'inline-block w-2 h-2 rounded-full',
              wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300',
            ]"
          />
          <span :class="['font-semibold', wsConnected ? 'text-emerald-600' : 'text-gray-500']">
            {{ statusLabel }}
          </span>
        </div>

        <span class="font-medium text-gray-500">Mode</span>
        <span class="font-semibold text-gray-800">{{ device.deviceStatus?.wifiMode ?? '—' }}</span>

        <span class="font-medium text-gray-500">SSID</span>
        <span class="font-semibold text-gray-800">{{ device.deviceStatus?.staSsid ?? '—' }}</span>

        <span class="font-medium text-gray-500">RSSI</span>
        <span class="font-semibold text-gray-800">
          {{ device.deviceStatus ? device.deviceStatus.rssi + ' dBm' : '—' }}
        </span>

        <span class="font-medium text-gray-500">IP</span>
        <span class="font-semibold text-gray-800">{{ device.deviceStatus?.staIp ?? '—' }}</span>

        <span class="font-medium text-gray-500">Channel</span>
        <span class="font-semibold text-gray-800">{{ device.deviceStatus?.channel ?? '—' }}</span>
      </div>
    </div>

    <!-- System Info -->
    <div class="rounded-xl bg-white shadow-sm border border-gray-200 p-5">
      <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
        System Info
      </h2>

      <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <span class="font-medium text-gray-500">Uptime</span>
        <span class="font-semibold text-gray-800 font-mono">
          {{ formatUptime(device.deviceStatus?.uptimeSeconds) }}
        </span>

        <span class="font-medium text-gray-500">Heap Free</span>
        <span class="font-semibold text-gray-800">
          {{ formatBytes(device.deviceStatus?.freeHeap) }}
        </span>

        <span class="font-medium text-gray-500">Max Block</span>
        <span class="font-semibold text-gray-800">
          {{ formatBytes(device.deviceStatus?.maxFreeBlockSize) }}
        </span>
      </div>
    </div>
  </div>
</template>
