<script setup lang="ts">
import { ref } from 'vue'
import { useDeviceStore } from '@/stores/device'

const device = useDeviceStore()
const apForm = ref({ ssid: '', password: '' })
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
    <!-- Current AP Info -->
    <div class="rounded-lg border border-gray-200 p-5">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
        Current AP Info
      </h3>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">SSID</span>
          <span class="font-semibold text-gray-800">{{ device.deviceStatus?.apSsid ?? '—' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">IP</span>
          <span class="font-semibold text-gray-800">{{ device.deviceStatus?.apIp ?? '—' }}</span>
        </div>
      </div>
    </div>

    <!-- AP Configuration form -->
    <div class="rounded-lg border border-gray-200 p-5">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
        Configuration
      </h3>
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">SSID</label>
          <input
            v-model="apForm.ssid"
            type="text"
            placeholder="Enter AP SSID"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">Password</label>
          <input
            v-model="apForm.password"
            type="password"
            placeholder="Enter AP password"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
          />
        </div>
        <button
          class="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
</template>
