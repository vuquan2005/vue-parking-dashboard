import { ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import { wsClient, type WsMessage } from '@/services/websocket'

const isConnected = ref(false)
let isInitialized = false

export function useWebSocket() {
    const configStore = useConfigStore()

    const initWebSocket = () => {
        if (isInitialized) return
        isInitialized = true

        wsClient.options.onConnected = () => {
            isConnected.value = true
        }

        wsClient.options.onDisconnected = () => {
            isConnected.value = false
        }

        wsClient.options.onMessage = (parsed: WsMessage) => {
            routeMessage(parsed)
        }

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
                if (parsed.data) {
                    // const parkingStore = useParkingStore()
                    // parkingStore.updateAllSlot(parsed.data)
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
