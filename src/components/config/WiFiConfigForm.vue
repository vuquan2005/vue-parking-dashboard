<script setup lang="ts">
import { useConfigStore, WiFiMode } from '@/stores/config'
import {
  Wifi,
  WifiOff,
  Shield,
  Eye,
  EyeOff,
  Send,
  Loader2,
  X,
  Radio,
  Router,
  TriangleAlert,
} from 'lucide-vue-next'
import { ref } from 'vue'

const config = useConfigStore()
const showPassword = ref(false)

const emit = defineEmits<{
  connect: [{ ssid: string; password: string; mode: WiFiMode }]
}>()

function handleConnect() {
  if (!config.selectedSSID) return
  config.isConnecting = true
  config.connectError = null
  emit('connect', {
    ssid: config.selectedSSID,
    password: config.password,
    mode: config.selectedMode,
  })
}

const modes = [
  {
    value: WiFiMode.STA,
    icon: Wifi,
    label: 'Station (STA)',
    desc: 'Kết nối tới Router',
    active: { border: 'border-violet-400', bg: 'bg-violet-50', ring: 'ring-violet-100', icon: 'bg-violet-500 text-white', text: 'text-violet-700' },
  },
  {
    value: WiFiMode.AP,
    icon: Radio,
    label: 'Access Point (AP)',
    desc: 'ESP32 phát WiFi',
    active: { border: 'border-amber-400', bg: 'bg-amber-50', ring: 'ring-amber-100', icon: 'bg-amber-500 text-white', text: 'text-amber-700' },
  },
]
</script>

<template>
  <div class="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/80 to-purple-50/50">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-100 text-violet-600">
          <Router class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-800">Kết nối WiFi</h3>
          <p class="text-xs text-gray-400">Chọn chế độ và nhập thông tin</p>
        </div>
      </div>
    </div>

    <!-- No network selected -->
    <div v-if="!config.selectedSSID" class="px-6 py-12 text-center">
      <Wifi class="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p class="text-sm text-gray-400 font-medium">Chọn một mạng WiFi</p>
      <p class="text-xs text-gray-300 mt-1">Chọn mạng từ danh sách scan bên trái</p>
    </div>

    <!-- Connect form -->
    <div v-else class="p-6 space-y-5">
      <!-- Selected network info -->
      <div class="flex items-center justify-between rounded-xl bg-sky-50/80 p-4 border border-sky-100">
        <div class="flex items-center gap-3">
          <Wifi class="w-5 h-5 text-sky-600" />
          <div>
            <p class="text-sm font-bold text-gray-800">{{ config.selectedSSID }}</p>
            <p v-if="config.selectedNetwork" class="text-xs text-gray-400 mt-0.5">
              {{ config.encryptionLabel(config.selectedNetwork.encryption) }} ·
              {{ config.selectedNetwork.rssi }} dBm · CH {{ config.selectedNetwork.channel }}
            </p>
          </div>
        </div>
        <button
          @click="config.clearSelection()"
          class="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- WiFi Mode (data-driven) -->
      <div>
        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Chế độ WiFi (ESP32)
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="mode in modes"
            :key="mode.value"
            @click="config.selectedMode = mode.value"
            :class="[
              'flex items-center gap-3 rounded-xl p-4 border-2 transition-all duration-200 text-left',
              config.selectedMode === mode.value
                ? `${mode.active.border} ${mode.active.bg} ring-2 ${mode.active.ring}`
                : 'border-gray-200 bg-gray-50/50 hover:border-gray-300',
            ]"
          >
            <div
              :class="[
                'flex items-center justify-center w-10 h-10 rounded-xl transition-all',
                config.selectedMode === mode.value ? mode.active.icon : 'bg-gray-200 text-gray-500',
              ]"
            >
              <component :is="mode.icon" class="w-5 h-5" />
            </div>
            <div>
              <p
                :class="[
                  'text-sm font-bold',
                  config.selectedMode === mode.value ? mode.active.text : 'text-gray-600',
                ]"
              >
                {{ mode.label }}
              </p>
              <p class="text-[11px] text-gray-400 mt-0.5">{{ mode.desc }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Password -->
      <div v-if="config.needsPassword">
        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Mật khẩu WiFi
        </label>
        <div class="relative">
          <Shield class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="config.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Nhập mật khẩu WiFi..."
            class="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-12 text-sm text-gray-700 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 focus:outline-none transition-all duration-200"
            @keyup.enter="handleConnect"
          />
          <button
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <EyeOff v-if="showPassword" class="w-4 h-4" />
            <Eye v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Open network notice -->
      <div v-else class="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 border border-emerald-100">
        <WifiOff class="w-4 h-4 text-emerald-600" />
        <span class="text-xs text-emerald-600 font-medium">Mạng mở - không cần mật khẩu</span>
      </div>

      <!-- Error message -->
      <div
        v-if="config.connectError"
        class="flex items-center gap-2 rounded-xl bg-red-50 p-3 border border-red-100"
      >
        <TriangleAlert class="w-4 h-4 text-red-500 shrink-0" />
        <span class="text-xs text-red-600 font-medium">{{ config.connectError }}</span>
      </div>

      <!-- Connect button -->
      <button
        @click="handleConnect"
        :disabled="config.isConnecting || (config.needsPassword && !config.password)"
        class="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-200/50"
      >
        <Loader2 v-if="config.isConnecting" class="w-4 h-4 animate-spin" />
        <Send v-else class="w-4 h-4" />
        {{
          config.isConnecting
            ? 'Đang kết nối...'
            : `Kết nối (${config.selectedMode === WiFiMode.AP ? 'AP' : 'STA'})`
        }}
      </button>

      <!-- Mode description -->
      <div class="rounded-xl bg-gray-50 p-3 border border-gray-100">
        <p class="text-[11px] text-gray-400 leading-relaxed">
          <template v-if="config.selectedMode === WiFiMode.STA">
            <strong class="text-gray-500">STA Mode:</strong> ESP32 sẽ kết nối tới mạng WiFi đã chọn
            như một client. Dashboard sẽ giao tiếp qua IP của ESP32 trên mạng LAN.
          </template>
          <template v-else>
            <strong class="text-gray-500">AP Mode:</strong> ESP32 sẽ phát WiFi riêng với SSID và mật
            khẩu này. Các thiết bị kết nối trực tiếp vào ESP32 mà không cần router.
          </template>
        </p>
      </div>
    </div>
  </div>
</template>
