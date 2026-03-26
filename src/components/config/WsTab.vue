<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { connect, getStoredWsUrl, getDefaultWsUrl } from '@/services/websocket'

const wsUrl = ref('')
const defaultUrl = ref('')

onMounted(() => {
  wsUrl.value = getStoredWsUrl()
  defaultUrl.value = getDefaultWsUrl()
})

function save() {
  const urlToSave = wsUrl.value.trim()
  if (urlToSave) {
    localStorage.setItem('ws_url', urlToSave)
    connect()
  } else {
    localStorage.removeItem('ws_url')
    connect()
  }
}

function resetToDefault() {
  localStorage.removeItem('ws_url')
  wsUrl.value = ''
  connect()
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
    <!-- WebSocket Configuration form -->
    <div class="rounded-lg border border-gray-200 p-5">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
        WebSocket Configuration
      </h3>
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">Custom WebSocket URL</label>
          <input
            v-model="wsUrl"
            type="text"
            placeholder="e.g. wss://example.com/ws"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
          />
          <p class="text-xs text-gray-500 mt-2">
            Default: <span class="font-mono text-gray-400">{{ defaultUrl }}</span>
          </p>
        </div>

        <div v-if="wsUrl.trim()" class="flex gap-3 mt-4">
          <button
            @click="save"
            class="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
          >
            Save & Connect
          </button>
          <button
            @click="resetToDefault"
            class="flex-1 rounded-lg bg-gray-100 border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            Use Default
          </button>
        </div>
        <button
          v-else
          @click="resetToDefault"
          class="w-full mt-4 flex justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
        >
          Use Default
        </button>
      </div>
    </div>
  </div>
</template>
