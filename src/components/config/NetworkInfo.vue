<script setup lang="ts">
import { useConfigStore, WiFiMode } from '@/stores/config'
import {
  Wifi,
  Radio,
  Globe,
  Fingerprint,
  Signal,
  Smartphone,
  Cpu,
  Clock,
  HardDrive,
  Database,
  CircleCheck,
  CircleX,
  Activity,
} from 'lucide-vue-next'

const config = useConfigStore()

function rssiToPercent(rssi: number): number {
  return Math.max(0, Math.min(100, Math.round(((rssi + 90) / 60) * 100)))
}

function formatUptime(ms?: number) {
  if (!ms) return '---'
  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function formatBytes(bytes?: number) {
  if (!bytes) return '---'
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / 1048576).toFixed(1) + ' MB'
}
</script>

<template>
  <div class="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 to-teal-50/50"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600"
        >
          <Signal class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-800">Trạng thái ESP32</h3>
          <p class="text-xs text-gray-400">Thông tin kết nối hiện tại</p>
        </div>
      </div>

      <!-- Connection status -->
      <div
        :class="[
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-all',
          config.espStatus.connected
            ? 'text-emerald-600 bg-emerald-50 ring-emerald-200'
            : 'text-gray-500 bg-gray-50 ring-gray-200',
        ]"
      >
        <CircleCheck v-if="config.espStatus.connected" class="w-3.5 h-3.5" />
        <CircleX v-else class="w-3.5 h-3.5" />
        {{ config.espStatus.connected ? 'Online' : 'Offline' }}
      </div>
    </div>

    <div class="p-6 space-y-4">
      <!-- WiFi Mode Badge -->
      <div
        class="flex items-center gap-3 rounded-xl p-4 border"
        :class="[
          config.espStatus.mode === WiFiMode.AP
            ? 'bg-amber-50/50 border-amber-100'
            : config.espStatus.mode === WiFiMode.AP_STA
              ? 'bg-blue-50/50 border-blue-100'
              : 'bg-violet-50/50 border-violet-100',
        ]"
      >
        <div
          :class="[
            'flex items-center justify-center w-10 h-10 rounded-xl',
            config.espStatus.mode === WiFiMode.AP
              ? 'bg-amber-100 text-amber-600'
              : config.espStatus.mode === WiFiMode.AP_STA
                ? 'bg-blue-100 text-blue-600'
                : 'bg-violet-100 text-violet-600',
          ]"
        >
          <Radio v-if="config.espStatus.mode === WiFiMode.AP || config.espStatus.mode === WiFiMode.AP_STA" class="w-5 h-5" />
          <Wifi v-else class="w-5 h-5" />
        </div>
        <div>
          <p
            class="text-sm font-bold"
            :class="[
              config.espStatus.mode === WiFiMode.AP
                ? 'text-amber-700'
                : config.espStatus.mode === WiFiMode.AP_STA
                  ? 'text-blue-700'
                  : 'text-violet-700'
            ]"
          >
            {{ config.wifiModeLabel(config.espStatus.mode ?? 0) }} Mode
          </p>
          <p class="text-xs text-gray-400 mt-0.5">
            <template v-if="config.espStatus.mode === WiFiMode.AP">
              ESP32 phát WiFi · {{ config.espStatus.apClients }} clients
            </template>
            <template v-else-if="config.espStatus.mode === WiFiMode.AP_STA">
              Phát WiFi & Kết nối router
            </template>
            <template v-else> Kết nối tới router </template>
          </p>
        </div>
      </div>

      <!-- Signal strength -->
      <div
        v-if="config.espStatus.connected"
        class="rounded-xl bg-gray-50 p-4 border border-gray-100"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Signal class="w-4 h-4 text-gray-500" />
            <span class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Tín hiệu</span
            >
          </div>
          <span
            class="text-sm font-bold"
            :class="[
              (config.espStatus.rssi ?? 0) >= -50
                ? 'text-emerald-600'
                : (config.espStatus.rssi ?? 0) >= -60
                  ? 'text-sky-600'
                  : (config.espStatus.rssi ?? 0) >= -70
                    ? 'text-amber-600'
                    : 'text-red-600',
            ]"
          >
            {{ config.espStatus.rssi ?? 0 }} dBm · {{ rssiToPercent(config.espStatus.rssi ?? 0) }}%
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            :class="[
              (config.espStatus.rssi ?? 0) >= -50
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                : (config.espStatus.rssi ?? 0) >= -60
                  ? 'bg-gradient-to-r from-sky-400 to-sky-500'
                  : (config.espStatus.rssi ?? 0) >= -70
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : 'bg-gradient-to-r from-red-400 to-red-500',
            ]"
            :style="{ width: rssiToPercent(config.espStatus.rssi ?? 0) + '%' }"
          />
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-2 gap-3">
        <!-- SSID -->
        <div class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-100 text-sky-600">
            <Wifi class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">SSID</p>
            <p class="text-sm font-bold text-gray-700 truncate">
              {{ config.espStatus.ssid || '---' }}
            </p>
          </div>
        </div>

        <!-- IP -->
        <div class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 text-violet-600"
          >
            <Globe class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">IP Address</p>
            <p class="text-sm font-bold text-gray-700 font-mono truncate">
              {{ config.espStatus.ip || '---' }}
            </p>
          </div>
        </div>

        <!-- MAC -->
        <div class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600"
          >
            <Fingerprint class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">MAC</p>
            <p class="text-sm font-bold text-gray-700 font-mono truncate">
              {{ config.espStatus.mac || '---' }}
            </p>
          </div>
        </div>

        <!-- Channel -->
        <div class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600"
          >
            <Radio class="w-4 h-4" />
          </div>
          <div>
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Channel</p>
            <p class="text-sm font-bold text-gray-700 font-mono">
              {{ config.espStatus.channel || '---' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Hardware Info Grid -->
      <div
        class="grid grid-cols-2 gap-3 mt-4"
      >
        <!-- CPU Freq -->
        <div class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600"
          >
            <Cpu class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">CPU Freq</p>
            <p class="text-sm font-bold text-gray-700 truncate">
              {{ config.espStatus.cpu_freq ? config.espStatus.cpu_freq + ' MHz' : '---' }}
            </p>
          </div>
        </div>

        <!-- Free Heap -->
        <div class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-100 text-pink-600"
          >
            <HardDrive class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Free Heap</p>
            <p class="text-sm font-bold text-gray-700 truncate">
              {{ formatBytes(config.espStatus.free_heap) }}
            </p>
          </div>
        </div>

        <!-- Min Free Heap -->
        <div class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 text-rose-600"
          >
            <HardDrive class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Min Free</p>
            <p class="text-sm font-bold text-gray-700 truncate">
              {{ formatBytes(config.espStatus.min_free_heap) }}
            </p>
          </div>
        </div>

        <!-- Max Free Block -->
        <div class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600"
          >
            <Database class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Max Free</p>
            <p class="text-sm font-bold text-gray-700 truncate">
              {{ formatBytes(config.espStatus.max_free_block) }}
            </p>
          </div>
        </div>

        <!-- Uptime -->
        <div class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600"
          >
            <Clock class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Uptime</p>
            <p class="text-sm font-bold text-gray-700 truncate">
              {{ formatUptime(config.espStatus.uptime) }}
            </p>
          </div>
        </div>

        <!-- Latency (Ping) -->
        <div class="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3.5 border border-gray-100">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 text-teal-600"
          >
            <Activity class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Ping</p>
            <p class="text-sm font-bold text-gray-700 truncate">
              {{ config.espStatus.latency ? config.espStatus.latency + ' ms' : '---' }}
            </p>
          </div>
        </div>
      </div>

      <!-- AP Clients (only in AP mode) -->
      <div
        v-if="config.espStatus.mode === WiFiMode.AP"
        class="flex items-center gap-3 rounded-xl bg-amber-50/50 p-3.5 border border-amber-100"
      >
        <div
          class="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600"
        >
          <Smartphone class="w-4 h-4" />
        </div>
        <div>
          <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">AP Clients</p>
          <p class="text-sm font-bold text-amber-700">
            {{ config.espStatus.apClients }} thiết bị đang kết nối
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
