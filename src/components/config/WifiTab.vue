<script setup lang="ts">
import { ref } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { ScanSearch, Loader2, Wifi, Lock, Unlock, Radio, Signal } from 'lucide-vue-next'

const device = useDeviceStore()
const staForm = ref({ ssid: '', password: '' })
const apForm = ref({ ssid: '', password: '' })

// Get signal icon color based on rssi
function getSignalColor(rssi: number) {
  if (rssi >= -60) return 'text-emerald-500 group-hover:text-emerald-600'
  if (rssi >= -70) return 'text-blue-500 group-hover:text-blue-600'
  if (rssi >= -80) return 'text-amber-500 group-hover:text-amber-600'
  return 'text-red-500 group-hover:text-red-600'
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full min-h-0">
    <!-- Left Column: Configs -->
    <div class="flex flex-col gap-3 min-h-0 overflow-y-auto">
      <!-- STA Configuration -->
      <div class="rounded-2xl border border-gray-200/80 bg-white shadow-sm flex flex-col shrink-0">
        <div class="p-4 space-y-3">
          <div class="flex items-center gap-2">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <Wifi class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-gray-800">STA Configuration</h3>
              <p class="text-xs text-gray-400 mt-0.5">Kết nối tới Router / WiFi có sẵn</p>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">SSID</label>
              <input v-model="staForm.ssid" type="text" placeholder="Tên WiFi..."
                class="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100 transition-all font-medium" />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Mật
                khẩu</label>
              <input v-model="staForm.password" type="password" placeholder="Mật khẩu..."
                class="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium" />
            </div>
            <button
              class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all flex items-center justify-center gap-2">
              <Wifi class="w-4 h-4" /> Kết nối
            </button>
          </div>
        </div>
      </div>

      <!-- AP Configuration -->
      <div class="rounded-2xl border border-gray-200/80 bg-white shadow-sm flex flex-col shrink-0">
        <div class="p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <Radio class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-gray-800">AP Configuration</h3>
              <p class="text-xs text-gray-400 mt-0.5">Cấu hình ESP32 phát WiFi</p>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Tên WiFi
                (SSID)</label>
              <input v-model="apForm.ssid" type="text" placeholder="ESP32_WiFi..."
                class="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all font-medium" />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Mật
                khẩu</label>
              <input v-model="apForm.password" type="password" placeholder="Mật khẩu AP..."
                class="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all font-medium" />
            </div>
            <button
              class="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-all flex items-center justify-center gap-2">
              <Radio class="w-4 h-4" /> Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right column: WiFi Networks -->
    <div class="rounded-2xl border border-gray-200/80 bg-white shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      <!-- Header Fixed (Compact) -->
      <div class="p-2 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
        <div>
          <h3 class="text-base font-bold text-gray-800 ml-2">WiFi Networks</h3>
        </div>
        <button
          class="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-gray-700 active:bg-gray-900 transition-all font-medium">
          <ScanSearch class="w-3.5 h-3.5" />
          <span v-if="device.isScanning" class="flex items-center gap-1">
            <Loader2 class="w-3 h-3 animate-spin" /> Scanning…
          </span>
          <span v-else>Scan</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto w-full p-3 space-y-2 bg-gray-50/50">
        <div v-if="device.scanResults.length === 0"
          class="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-8">
          <ScanSearch class="w-10 h-10 opacity-20" />
          <p class="text-xs font-medium">Chưa có dữ liệu scan.</p>
        </div>

        <div v-for="ap in device.scanResults" :key="ap.bssid"
          class="group flex items-center justify-between p-4 rounded-xl border border-gray-200/80 bg-white hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
          @click="staForm.ssid = ap.ssid">
          <div class="flex items-center gap-4 min-w-0">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors shrink-0"
              :class="getSignalColor(ap.rssi)">
              <Signal class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-gray-800 truncate" :title="ap.ssid || '(hidden)'">
                {{ ap.ssid || '(hidden)' }}
              </p>
              <div
                class="flex items-center gap-2 text-[11px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">
                <span :class="getSignalColor(ap.rssi)" class="font-mono">{{ ap.rssi }} dBm</span>
                <span class="text-gray-300">•</span>
                <span>CH {{ ap.channel }}</span>
                <span class="text-gray-300">•</span>
                <span class="truncate font-mono lowercase tracking-normal">{{ ap.encryption }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 pl-3">
            <div class="flex items-center justify-center w-8 h-8 rounded-lg"
              :class="ap.encryption === 'OPEN' ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400'">
              <Unlock v-if="ap.encryption === 'OPEN'" class="w-4 h-4" />
              <Lock v-else class="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
