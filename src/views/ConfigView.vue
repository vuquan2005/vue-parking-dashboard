<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, Wifi, Settings } from 'lucide-vue-next'
import { useConfigStore, WiFiMode } from '@/stores/config'
import { useWebSocket } from '@/composables/useWebSocket'
import WiFiNetworkList from '@/components/config/WiFiNetworkList.vue'
import WiFiConfigForm from '@/components/config/WiFiConfigForm.vue'
import NetworkInfo from '@/components/config/NetworkInfo.vue'

const router = useRouter()
const config = useConfigStore()
const { send } = useWebSocket()

/** Send scan command to ESP32 via WebSocket */
function requestScan() {
  config.isScanning = true
  send({ type: 'wifi_scan' })
}

/** Send connect command to ESP32 via WebSocket */
function requestConnect(payload: { ssid: string; password: string; mode: WiFiMode }) {
  send({
    type: 'wifi_connect',
    data: {
      ssid: payload.ssid,
      pass: payload.password,
    },
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between rounded-2xl bg-white px-8 py-5 shadow-sm">
      <div class="flex items-center gap-4">
        <button @click="router.push('/')"
          class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 active:scale-95">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm shadow-sky-200">
            <Settings class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl font-black text-gray-900 tracking-tight">Cấu hình WiFi ESP32</h1>
            <p class="text-xs font-medium text-gray-400"></p>
          </div>
        </div>
      </div>

      <!-- WS connection status -->
      <div class="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ring-1" :class="config.espStatus.connected
          ? 'bg-emerald-50 text-emerald-600 ring-emerald-200'
          : 'bg-gray-50 text-gray-500 ring-gray-200'
        ">
        <Wifi class="w-3.5 h-3.5" />
        {{ config.espStatus.connected ? config.espStatus.ssid : 'Chưa kết nối WiFi' }}
      </div>
    </div>

    <!-- Main content: 3 columns -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Col 1: Scan results -->
      <WiFiNetworkList @scan="requestScan" />

      <!-- Col 2: Connect form -->
      <WiFiConfigForm @connect="requestConnect" />

      <!-- Col 3: ESP32 Status -->
      <NetworkInfo />
    </div>
  </div>
</template>
