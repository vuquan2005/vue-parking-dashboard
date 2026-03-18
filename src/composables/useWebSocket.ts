import { ref } from 'vue'
import { wsClient } from '@/services/websocket'
import { useConfigStore } from '@/stores/config'
import { useParkingStore } from '@/stores/parking'

import type { ParkingEvent, ParkingSlot, WsMessage } from '@/type'

const isConnected = ref(false)
let isInitialized = false

function isParkingSlotArray(data: unknown): data is ParkingSlot[][] {
    if (!Array.isArray(data)) return false
    return data.every(
        (row) =>
            Array.isArray(row) &&
            row.every(
                (s) =>
                    s &&
                    typeof s === 'object' &&
                    typeof (s as Record<string, unknown>).id === 'string' &&
                    typeof (s as Record<string, unknown>).status === 'string',
            ),
    )
}

function isParkingEvent(data: unknown): data is ParkingEvent {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    return (
        typeof d.id === 'number' &&
        (d.type === 'IN' || d.type === 'OUT') &&
        typeof d.plateNumber === 'string' &&
        typeof d.slotId === 'string' &&
        (d.status === 'Success' || d.status === 'Processing') &&
        typeof d.timestamp === 'number'
    )
}

export function useWebSocket() {
    const configStore = useConfigStore()
    const parkingStore = useParkingStore()

    const initWebSocket = () => {
        if (isInitialized) return
        isInitialized = true

        const onConnected = () => {
            isConnected.value = true
        }

        const onDisconnected = () => {
            isConnected.value = false
        }

        const onMessage = (parsed: WsMessage) => routeMessage(parsed)

        wsClient.options.onConnected = onConnected
        wsClient.options.onDisconnected = onDisconnected
        wsClient.options.onMessage = onMessage
        wsClient.connect()
    }

    const routeMessage = (parsed: WsMessage) => {
        if (!parsed || !parsed.type) return

        switch (parsed.type) {
            case 'scan_results':
                if (Array.isArray(parsed.data)) {
                    configStore.handleBeaconData(parsed.data)
                }
                break

            case 'wifi_status':
                processWifiStatus(parsed)
                break

            case 'parking_update':
                if (isParkingSlotArray(parsed.data)) {
                    parkingStore.updateAllSlot(parsed.data)
                }
                break

            case 'parking_event':
                if (isParkingEvent(parsed.data)) {
                    parkingStore.addEvent(parsed.data)
                }
                break

            default:
                console.log(`[WebSocket] ℹ️ Unhandled event type: ${parsed.type}`)
                break
        }
    }

    const processWifiStatus = (parsed: WsMessage) => {
        const statusData = (parsed.data || parsed) as ReturnType<typeof useConfigStore>['espStatus']
        configStore.handleWiFiStatus(statusData)
    }

    return {
        isConnected,
        connect: () => wsClient.connect(),
        disconnect: () => wsClient.disconnect(),
        send: (data: string | object) => wsClient.send(data),
        initWebSocket,
    }
}
