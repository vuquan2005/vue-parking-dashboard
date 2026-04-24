<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDebugStore } from '@/stores/debug'
import { Trash2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-vue-next'

const debugStore = useDebugStore()
const selectedMessageId = ref<number | null>(null)

const messages = computed(() => debugStore.messages)

const selectedMessage = computed(() => {
  return messages.value.find((m) => m.id === selectedMessageId.value) || null
})

function selectMessage(id: number) {
  selectedMessageId.value = id
}

function clearLogs() {
  debugStore.clearMessages()
  selectedMessageId.value = null
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-lg">
    <!-- Toolbar -->
    <div class="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
      <div>
        <h2 class="text-lg font-medium text-gray-900">Raw Messages</h2>
        <p class="text-sm text-gray-500">View recent decoded protobuf messages.</p>
      </div>
      <button
        @click="clearLogs"
        class="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
      >
        <Trash2 class="h-4 w-4" />
        Clear Logs
      </button>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 min-h-[400px] border border-gray-200 rounded-md overflow-hidden bg-gray-50">
      <!-- Left Panel: Message List -->
      <div class="w-1/3 border-r border-gray-200 overflow-y-auto bg-white flex flex-col">
        <div v-if="messages.length === 0" class="p-4 text-center text-sm text-gray-500 mt-10">
          No messages yet.
        </div>
        <div
          v-else
          v-for="msg in messages"
          :key="msg.id"
          @click="selectMessage(msg.id)"
          class="p-3 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors flex flex-col gap-1"
          :class="{'bg-blue-50 border-l-4 border-l-blue-500 pl-2': selectedMessageId === msg.id}"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 font-mono">{{ formatTime(msg.timestamp) }}</span>
            <span
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="msg.direction === 'in' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'"
            >
              <ArrowDownToLine v-if="msg.direction === 'in'" class="w-3 h-3" />
              <ArrowUpFromLine v-if="msg.direction === 'out'" class="w-3 h-3" />
              {{ msg.direction === 'in' ? 'RX' : 'TX' }}
            </span>
          </div>
          <div class="text-sm font-semibold text-gray-800 truncate" :title="msg.type">
            {{ msg.type }}
          </div>
        </div>
      </div>

      <!-- Right Panel: Message Details -->
      <div class="w-2/3 overflow-y-auto bg-slate-900 text-slate-300 p-4 relative">
        <div v-if="!selectedMessage" class="h-full flex items-center justify-center text-sm text-slate-500">
          Select a message to view details
        </div>
        <div v-else class="flex flex-col h-full">
          <div class="flex items-center gap-2 mb-4">
            <span class="px-2 py-1 rounded bg-slate-800 font-mono text-xs text-white">ID: {{ selectedMessage.id }}</span>
            <span class="px-2 py-1 rounded bg-slate-800 font-mono text-xs text-white">{{ selectedMessage.type }}</span>
            <span class="px-2 py-1 rounded bg-slate-800 font-mono text-xs text-white">{{ formatTime(selectedMessage.timestamp) }}</span>
          </div>
          <pre class="flex-1 overflow-x-auto text-xs font-mono leading-relaxed bg-slate-950 p-4 rounded border border-slate-800">{{ JSON.stringify(selectedMessage.payload, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
