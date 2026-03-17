import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
    WiFiMode,
    type BeaconNetwork,
    type ESPWiFiStatus,
    type EncryptionType,
} from '@/services/type'

export { WiFiMode }

export const useConfigStore = defineStore('config', () => {
    // --- Beacon networks from ESP32 scan ---
    const scannedNetworks = ref<BeaconNetwork[]>([])
    const isScanning = ref(false)
    const lastScanTime = ref<string | null>(null)

    // --- ESP32 WiFi Status ---
    const espStatus = ref<ESPWiFiStatus>({
        type: 'wifi_status',
        mode: WiFiMode.AP,
        connected: false,
        ssid: '',
        ip: '',
        mac: '',
        rssi: 0,
        channel: 0,
        apClients: 0,
        free_heap: 0,
        min_free_heap: 0,
        max_free_block: 0,
        uptime: 0,
        cpu_freq: 0,
        latency: 0,
    })

    // --- User input for connecting ---
    const selectedSSID = ref<string | null>(null)
    const password = ref('')
    const selectedMode = ref<WiFiMode>(WiFiMode.STA)
    const isConnecting = ref(false)
    const connectError = ref<string | null>(null)

    // --- Computed ---
    const selectedNetwork = computed(() =>
        scannedNetworks.value.find((n) => n.ssid === selectedSSID.value),
    )

    const sortedNetworks = computed(() =>
        [...scannedNetworks.value].sort((a, b) => b.rssi - a.rssi),
    )

    const needsPassword = computed(() => {
        if (!selectedNetwork.value) return false
        return selectedNetwork.value.encryption !== 0
    })

    // --- Actions called from WS messages ---

    /** Called when ESP32 sends beacon scan results */
    function handleBeaconData(networks: BeaconNetwork[]) {
        scannedNetworks.value = networks
        isScanning.value = false
        lastScanTime.value = new Date().toLocaleTimeString('vi-VN')
    }

    /** Called when ESP32 sends its current WiFi status */
    function handleWiFiStatus(status: ESPWiFiStatus) {
        espStatus.value = status
        isConnecting.value = false
        if (status.connected) {
            connectError.value = null
        }
    }

    /** Called when ESP32 reports a connection error */
    function handleConnectError(error: string) {
        connectError.value = error
        isConnecting.value = false
    }

    /** Select a network from scan results */
    function selectNetwork(ssid: string) {
        selectedSSID.value = ssid
        password.value = ''
        connectError.value = null
    }

    /** Clear selection */
    function clearSelection() {
        selectedSSID.value = null
        password.value = ''
        connectError.value = null
    }

    /** Get RSSI quality label */
    function rssiQuality(rssi: number): 'excellent' | 'good' | 'fair' | 'weak' {
        if (rssi >= -50) return 'excellent'
        if (rssi >= -60) return 'good'
        if (rssi >= -70) return 'fair'
        return 'weak'
    }

    /** Get encryption display label */
    function encryptionLabel(enc: EncryptionType): string {
        const labels: Record<number, string> = {
            0: 'Mở',
            1: 'WEP',
            2: 'WPA',
            3: 'WPA2',
            4: 'WPA/WPA2',
            5: 'WPA2-E',
            6: 'WPA3',
            7: 'WPA2/WPA3',
        }
        return labels[enc] || 'N/A'
    }

    /** Get WiFi mode display label */
    function wifiModeLabel(mode: WiFiMode): string {
        const labels: Record<number, string> = {
            0: 'NULL',
            1: 'STA',
            2: 'AP',
            3: 'STA+AP',
        }
        return labels[mode] || 'N/A'
    }

    return {
        // State
        scannedNetworks,
        isScanning,
        lastScanTime,
        espStatus,
        selectedSSID,
        password,
        selectedMode,
        isConnecting,
        connectError,

        // Computed
        selectedNetwork,
        sortedNetworks,
        needsPassword,

        // Actions
        handleBeaconData,
        handleWiFiStatus,
        handleConnectError,
        selectNetwork,
        clearSelection,
        rssiQuality,
        encryptionLabel,
        wifiModeLabel,
    }
})
