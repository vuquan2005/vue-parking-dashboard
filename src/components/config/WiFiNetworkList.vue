<script setup lang="ts">
import { useConfigStore } from '@/stores/config'
import { Wifi, Signal, Loader2, Check, Lock, LockOpen, Radio } from 'lucide-vue-next'

const config = useConfigStore()

function rssiToPercent(rssi: number): number {
  // Convert dBm to percentage (approx -30 = 100%, -90 = 0%)
  return Math.max(0, Math.min(100, Math.round(((rssi + 90) / 60) * 100)))
}

function rssiColor(rssi: number) {
  const q = config.rssiQuality(rssi)
  switch (q) {
    case 'excellent': return 'text-emerald-500'
    case 'good': return 'text-sky-500'
    case 'fair': return 'text-amber-500'
    case 'weak': return 'text-red-500'
  }
}

function rssiBars(rssi: number) {
  const q = config.rssiQuality(rssi)
  switch (q) {
    case 'excellent': return 4
    case 'good': return 3
    case 'fair': return 2
    case 'weak': return 1
  }
}

function rssiBarColor(rssi: number, connected: boolean) {
  if (connected) return 'bg-emerald-500'
  const q = config.rssiQuality(rssi)
  switch (q) {
    case 'excellent': return 'bg-emerald-400'
    case 'good': return 'bg-sky-400'
    case 'fair': return 'bg-amber-400'
    case 'weak': return 'bg-red-400'
  }
}

const emit = defineEmits<{
  scan: []
}>()
</script>

<template>
  <div class="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-sky-50/80 to-indigo-50/50">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-100 text-sky-600">
          <Radio class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-800">WiFi Scan (ESP32)</h3>
          <p class="text-xs text-gray-400">
            <template v-if="config.lastScanTime">
              Quét lúc {{ config.lastScanTime }} · {{ config.scannedNetworks.length }} mạng
            </template>
            <template v-else>Nhấn "Quét" để tìm mạng</template>
          </p>
        </div>
      </div>
      <button
        @click="emit('scan')"
        :disabled="config.isScanning"
        class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200
               bg-sky-500 text-white hover:bg-sky-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-sky-200"
      >
        <Loader2 v-if="config.isScanning" class="w-3.5 h-3.5 animate-spin" />
        <Signal v-else class="w-3.5 h-3.5" />
        {{ config.isScanning ? 'Đang quét...' : 'Quét WiFi' }}
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-if="!config.isScanning && config.scannedNetworks.length === 0"
      class="px-6 py-12 text-center"
    >
      <Wifi class="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p class="text-sm text-gray-400 font-medium">Chưa có dữ liệu scan</p>
      <p class="text-xs text-gray-300 mt-1">Nhấn "Quét WiFi" để ESP32 quét mạng xung quanh</p>
    </div>

    <!-- Network List -->
    <div v-else class="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
      <div
        v-for="network in config.sortedNetworks"
        :key="network.bssid"
        :class="[
          'flex items-center justify-between px-6 py-3.5 transition-all duration-200 group cursor-pointer',
          config.selectedSSID === network.ssid
            ? 'bg-sky-50/80 border-l-[3px] border-l-sky-500'
            : 'hover:bg-gray-50/80 border-l-[3px] border-l-transparent',
        ]"
        @click="config.selectNetwork(network.ssid)"
      >
        <div class="flex items-center gap-3.5">
          <!-- Signal bars visual -->
          <div class="flex items-end gap-0.5 h-5 w-5 shrink-0">
            <div
              v-for="i in 4"
              :key="i"
              :class="[
                'w-1 rounded-full transition-all duration-300',
                i <= rssiBars(network.rssi)
                  ? rssiBarColor(network.rssi, config.espStatus.connected && config.espStatus.ssid === network.ssid)
                  : 'bg-gray-200',
              ]"
              :style="{ height: `${(i / 4) * 100}%` }"
            />
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-gray-700 truncate">{{ network.ssid || '(Hidden)' }}</span>
              <Lock v-if="network.encryption !== 0" class="w-3 h-3 text-gray-400 shrink-0" />
              <LockOpen v-else class="w-3 h-3 text-gray-300 shrink-0" />
              <!-- Connected badge -->
              <span
                v-if="config.espStatus.connected && config.espStatus.ssid === network.ssid"
                class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider shrink-0"
              >
                <Check class="w-3 h-3" />
                Đã kết nối
              </span>
            </div>
            <div class="flex items-center gap-3 mt-0.5">
              <span class="text-[11px] text-gray-400">{{ config.encryptionLabel(network.encryption) }}</span>
              <span class="text-[11px]" :class="rssiColor(network.rssi)">
                {{ network.rssi }} dBm ({{ rssiToPercent(network.rssi) }}%)
              </span>
              <span class="text-[11px] text-gray-300">CH {{ network.channel }}</span>
            </div>
          </div>
        </div>

        <!-- Select indicator -->
        <div
          v-if="config.selectedSSID === network.ssid"
          class="w-2 h-2 rounded-full bg-sky-500 shrink-0 animate-pulse"
        />
      </div>
    </div>

    <!-- Scanning state -->
    <div
      v-if="config.isScanning"
      class="px-6 py-4 bg-sky-50/50 border-t border-sky-100 flex items-center gap-3"
    >
      <div class="relative flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
      </div>
      <span class="text-xs text-sky-600 font-medium">ESP32 đang quét mạng xung quanh...</span>
    </div>
  </div>
</template>
