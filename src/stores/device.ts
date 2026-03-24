import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { AccessPoint, DeviceInfo } from '@/type'
import type { ConnectionStatus } from '@/services/websocket'

export const useDeviceStore = defineStore('device', () => {
    // -----------------------------------------------------------------------
    //  State
    // -----------------------------------------------------------------------

    /** List of discovered WiFi access points (from last scan). */
    const scanResults = ref<AccessPoint[]>([])

    /** Latest device status snapshot. */
    const deviceStatus = ref<DeviceInfo | null>(null)

    /** True while a WiFi scan request is in-flight. */
    const isScanning = ref(false)

    /** WebSocket connection status */
    const wsStatus = ref<ConnectionStatus>('disconnected')

    // -----------------------------------------------------------------------
    //  Computed
    // -----------------------------------------------------------------------

    /**
     * Human-readable signal strength derived from `deviceStatus.rssi`.
     *
     *   ≥ -50  → 'Excellent'
     *   ≥ -60  → 'Good'
     *   ≥ -70  → 'Fair'
     *   < -70  → 'Weak'
     *   null   → 'Unknown' (no status yet)
     */
    const signalStrength = computed<'Excellent' | 'Good' | 'Fair' | 'Weak' | 'Unknown'>(
        () => {
            if (!deviceStatus.value) return 'Unknown'
            const rssi = deviceStatus.value.rssi
            if (rssi >= -50) return 'Excellent'
            if (rssi >= -60) return 'Good'
            if (rssi >= -70) return 'Fair'
            return 'Weak'
        },
    )

    // -----------------------------------------------------------------------
    //  Actions
    // -----------------------------------------------------------------------

    function updateScanResults(aps: AccessPoint[]) {
        scanResults.value = aps
        isScanning.value = false
    }

    function updateDeviceStatus(status: DeviceInfo) {
        deviceStatus.value = status
    }

    function setScanning(value: boolean) {
        isScanning.value = value
    }

    function updateWsStatus(status: ConnectionStatus) {
        wsStatus.value = status
    }

    return {
        // state
        scanResults,
        deviceStatus,
        isScanning,
        wsStatus,
        // computed
        signalStrength,
        // actions
        updateScanResults,
        updateDeviceStatus,
        setScanning,
        updateWsStatus,
    }
})
