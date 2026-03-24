<script setup lang="ts">
import { useDeviceStore } from '@/stores/device'
import { ScanSearch, Loader2 } from 'lucide-vue-next'

const device = useDeviceStore()
</script>

<template>
  <div class="flex flex-col h-full gap-4">
    <div class="flex items-center justify-between shrink-0">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest">
        WiFi Networks
      </h3>
      <button
        class="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
      >
        <ScanSearch class="w-4 h-4" />
        <span v-if="device.isScanning" class="flex items-center gap-1">
          <Loader2 class="w-3.5 h-3.5 animate-spin" /> Scanning…
        </span>
        <span v-else>Scan</span>
      </button>
    </div>

    <!-- Results table with independent scroll -->
    <div class="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-200">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-4 py-2.5 text-left font-semibold text-gray-500">#</th>
            <th class="px-4 py-2.5 text-left font-semibold text-gray-500">SSID</th>
            <th class="px-4 py-2.5 text-left font-semibold text-gray-500">RSSI</th>
            <th class="px-4 py-2.5 text-left font-semibold text-gray-500">Channel</th>
            <th class="px-4 py-2.5 text-left font-semibold text-gray-500">Auth Mode</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(ap, i) in device.scanResults"
            :key="ap.bssid"
            class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-2.5 text-gray-400 font-mono">{{ i + 1 }}</td>
            <td class="px-4 py-2.5 font-semibold text-gray-800">{{ ap.ssid || '(hidden)' }}</td>
            <td class="px-4 py-2.5 text-gray-600">{{ ap.rssi }} dBm</td>
            <td class="px-4 py-2.5 text-gray-600">{{ ap.channel }}</td>
            <td class="px-4 py-2.5">
              <span
                :class="[
                  'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  ap.encryption === 'OPEN'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-emerald-100 text-emerald-700',
                ]"
              >
                {{ ap.encryption }}
              </span>
            </td>
          </tr>
          <tr v-if="device.scanResults.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">
              No scan results yet. Click <strong>Scan</strong> to discover networks.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
