import { ref } from 'vue'
import { wsClient } from '@/services/websocket'
import { useConfigStore } from '@/stores/config'
import { useParkingStore } from '@/stores/parking'

import type { ParkingEvent, ParkingSlot, SlotStatus, WsMessage } from '@/type'

const isConnected = ref(false)
let isInitialized = false

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

function slotIdFromCoords(row: number, col: number) {
    const rowLabel = String.fromCharCode(65 + row)
    return `${rowLabel}${col + 1}`
}

function isRawSlotGrid(data: unknown): data is {
    cols: number
    rows: number
    slots: Array<
        Array<{
            slotPalletId: number
            slotData: string | null
            slotStatus: SlotStatus | null
        }>
    >
} {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    if (typeof d.cols !== 'number' || typeof d.rows !== 'number') return false
    if (!Array.isArray(d.slots)) return false
    if (d.slots.length !== d.rows) return false

    return d.slots.every(
        (row) =>
            Array.isArray(row) &&
            row.length === d.cols &&
            row.every(
                (slot) =>
                    slot &&
                    typeof slot === 'object' &&
                    typeof (slot as Record<string, unknown>).slotPalletId === 'number',
            ),
    )
}

function convertRawSlotGridToParkingSlots(
    rows: number,
    cols: number,
    slots: Array<
        Array<{
            slotPalletId: number
            slotData: string | null
            slotStatus: SlotStatus | null
        }>
    >,
): ParkingSlot[] {
    const result: ParkingSlot[] = []

    for (let row = 0; row < rows; row++) {
        const rowSlots = slots[row] || []
        for (let col = 0; col < cols; col++) {
            const raw = rowSlots[col]!
            const occupancy: SlotStatus =
                raw.slotPalletId === 0
                    ? 'NO_PALLET'
                    : raw.slotData && raw.slotData !== ''
                      ? 'OCCUPIED'
                      : 'EMPTY'

            const status = (raw.slotStatus ?? occupancy) as SlotStatus
            const plateNumber =
                occupancy === 'NO_PALLET' || !raw.slotData ? undefined : raw.slotData

            result.push({
                id: slotIdFromCoords(row, col),
                status,
                plateNumber,
            })
        }
    }

    return result
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
                if (isRawSlotGrid(message.data)) {
                    const { cols, rows, slots } = message.data
                    parkingStore.updateAllSlot(
                        convertRawSlotGridToParkingSlots(rows, cols, slots),
                    )
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
