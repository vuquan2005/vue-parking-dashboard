<script setup lang="ts">
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
</script>

<template>
  <div class="space-y-5">
    <div class="rounded-lg border border-gray-200 p-5">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
        System Metrics
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <!-- Uptime -->
        <div class="rounded-lg bg-gray-50 p-4 text-center">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-1">Uptime</p>
          <p class="text-xl font-bold text-gray-800 font-mono">
            {{ formatUptime(device.deviceStatus?.uptimeSeconds) }}
          </p>
        </div>
        <!-- Free Heap -->
        <div class="rounded-lg bg-gray-50 p-4 text-center">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-1">Free Heap</p>
          <p class="text-xl font-bold text-gray-800">
            {{ formatBytes(device.deviceStatus?.freeHeap) }}
          </p>
        </div>
        <!-- Max Free Block -->
        <div class="rounded-lg bg-gray-50 p-4 text-center">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-1">Max Block</p>
          <p class="text-xl font-bold text-gray-800">
            {{ formatBytes(device.deviceStatus?.maxFreeBlockSize) }}
          </p>
        </div>
        <!-- Min Free Heap -->
        <div class="rounded-lg bg-gray-50 p-4 text-center">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-1">Min Free Heap</p>
          <p class="text-xl font-bold text-gray-800">
            {{ formatBytes(device.deviceStatus?.minFreeHeap) }}
          </p>
        </div>
        <!-- WiFi Mode -->
        <div class="rounded-lg bg-gray-50 p-4 text-center">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-1">WiFi Mode</p>
          <p class="text-xl font-bold text-gray-800">
            {{ device.deviceStatus?.wifiMode ?? '—' }}
          </p>
        </div>
        <!-- Signal Strength -->
        <div class="rounded-lg bg-gray-50 p-4 text-center">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-1">Signal</p>
          <p class="text-xl font-bold text-gray-800">
            {{ device.signalStrength }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
