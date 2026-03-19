import { ref } from 'vue'
import { wsClient } from '@/services/websocket'
import { useConfigStore } from '@/stores/config'
import { useParkingStore } from '@/stores/parking'

import type { ParkingEvent, ParkingSlot, WsMessage } from '@/type'

const isConnected = ref(false)
let isInitialized = false

function isParkingSlotArray(data: unknown): data is ParkingSlot[] {
    if (!Array.isArray(data)) return false
    return data.every(
        (s) =>
            s &&
            typeof s === 'object' &&
            typeof (s as Record<string, unknown>).id === 'string' &&
            typeof (s as Record<string, unknown>).status === 'string',
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

        const onMessage = (message: WsMessage) => routeMessage(message)

        wsClient.options.onConnected = onConnected
        wsClient.options.onDisconnected = onDisconnected
        wsClient.options.onMessage = onMessage
        wsClient.connect()
    }

    const routeMessage = (message: WsMessage) => {
        if (!message || !message.type) return

        switch (message.type) {
            case 'scan_results':
                if (Array.isArray(message.data)) {
                    configStore.handleBeaconData(message.data)
                }
                break

            case 'wifi_status':
                processWifiStatus(message)
                break

            case 'parking_update':
                if (isParkingSlotArray(message.data)) {
                    parkingStore.updateAllSlot(message.data)
                }
                break

            case 'parking_event':
                if (isParkingEvent(message.data)) {
                    parkingStore.addEvent(message.data)
                }
                break

            default:
                console.log(`[WebSocket] ℹ️ Unhandled event type: ${message.type}`)
                break
        }
    }

    const processWifiStatus = (message: WsMessage) => {
        const statusData = (message.data || message) as ReturnType<
            typeof useConfigStore
        >['espStatus']
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
