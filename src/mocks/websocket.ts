import { createLogger } from '@/utils/logger'
import { WiFiMode } from '@/type'
import type {
    IWebSocketClient,
    WebSocketOptions,
    WsMessage,
    ParkingSlot,
    ParkingEvent,
    BeaconNetwork,
    ESPWiFiStatus,
    EventType,
    EventStatus,
    SlotStatus,
} from '@/type'
import { ParkingSystem } from './parkingSystem'

const log = createLogger('WebSocket')

function timeNow() {
    return Math.floor(Date.now() / 1000)
}

function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
    const item = arr[Math.floor(Math.random() * arr.length)]
    if (item === undefined) {
        throw new Error('pick() called with empty array')
    }
    return item
}

function randomHex() {
    const bytes = Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')
            .toUpperCase(),
    )

    return bytes.join(':')
}

function mockScanResults(): BeaconNetwork[] {
    const base: BeaconNetwork[] = [
        { ssid: 'ETEK_PARKING', rssi: -42, encryption: 3, channel: 6 },
        { ssid: 'VuQuan-Home', rssi: -55, encryption: 2, channel: 11 },
        { ssid: 'Cafe_Free_WiFi', rssi: -68, encryption: 0, channel: 1 },
        { ssid: 'Warehouse_AP', rssi: -72, encryption: 7, channel: 3 },
        { ssid: 'IoT-Lab', rssi: -80, encryption: 4, channel: 9 },
    ]
    return base.map((n) => ({ ...n, rssi: n.rssi + randInt(-3, 3) }))
}

function buildWiFiStatus(overrides: Partial<ESPWiFiStatus> = {}): ESPWiFiStatus {
    const uptime = Math.max(0, Math.floor(performance.now()))
    return {
        type: 'wifi_status',
        mode: WiFiMode.STA,
        connected: true,
        ssid: 'ETEK_PARKING',
        ip: '192.168.1.88',
        mac: '24:6F:28:AA:BB:CC',
        rssi: -48 + randInt(-4, 4),
        channel: 6,
        apClients: 0,
        free_heap: 178000 + randInt(-3000, 3000),
        min_free_heap: 160000,
        max_free_block: 82000,
        uptime,
        cpu_freq: 240,
        latency: randInt(3, 30),
        ...overrides,
    }
}

class MockWebSocketClient implements IWebSocketClient {
    public options: WebSocketOptions
    private connected = false
    private stopped = false
    private timers: Array<
        ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>
    > = []
    private parkingSystem = new ParkingSystem(4, 3)
    private nextEventId = 1
    private slots: ParkingSlot[] = []

    constructor(options: WebSocketOptions = {}) {
        this.options = options
    }

    public get isConnected(): boolean {
        return this.connected
    }

    private slotIdFromCoords(row: number, col: number) {
        const rowLabel = String.fromCharCode(65 + row)
        return `${rowLabel}${col + 1}`
    }

    private slotIdFromPalletId(palletId: number): string | null {
        for (let row = 0; row < this.parkingSystem.totalRows; row++) {
            for (let col = 0; col < this.parkingSystem.totalCols; col++) {
                if (this.parkingSystem.getSlotPalletId(col, row) === palletId) {
                    return this.slotIdFromCoords(row, col)
                }
            }
        }
        return null
    }

    private convertSystemToSlots(): ParkingSlot[] {
        const slots: ParkingSlot[] = []

        for (let row = 0; row < this.parkingSystem.totalRows; row++) {
            for (let col = 0; col < this.parkingSystem.totalCols; col++) {
                const palletId = this.parkingSystem.getSlotPalletId(col, row)
                const occupancy = this.parkingSystem.getSlotOccupancy(palletId)
                const status = (this.parkingSystem.getSlotStatus(palletId) ??
                    occupancy) as SlotStatus

                const rawPlate = this.parkingSystem.getSlotData(palletId) ?? ''
                const plateNumber =
                    occupancy === 'NO_PALLET' || rawPlate === '' ? undefined : rawPlate

                slots.push({
                    id: this.slotIdFromCoords(row, col),
                    status,
                    plateNumber,
                })
            }
        }

        return slots
    }

    private createParkingEvent(params: {
        type: EventType
        plateNumber: string
        slotId: string
        status: EventStatus
        process?: number
    }): ParkingEvent {
        return {
            id: this.nextEventId++,
            type: params.type,
            plateNumber: params.plateNumber,
            slotId: params.slotId,
            status: params.status,
            timestamp: timeNow(),
            process: params.process,
        }
    }

    private emitParkingUpdate() {
        this.slots = this.convertSystemToSlots()
        this.emit({ type: 'parking_update', data: this.slots })
    }

    private emitParkingEvent(event: ParkingEvent) {
        this.emit({ type: 'parking_event', data: event })
    }

    private enqueueRandomTask(): ParkingEvent | null {
        const candidates: number[] = []
        for (let row = 0; row < this.parkingSystem.totalRows; row++) {
            for (let col = 0; col < this.parkingSystem.totalCols; col++) {
                const palletId = this.parkingSystem.getSlotPalletId(col, row)
                if (palletId > 0 && this.parkingSystem.canSetSlotData(palletId)) {
                    candidates.push(palletId)
                }
            }
        }

        if (candidates.length === 0) {
            return null
        }

        const palletId = pick(candidates)
        const currentPlate = this.parkingSystem.getSlotData(palletId) ?? ''
        const isOccupied = currentPlate !== ''
        const plateNumber = isOccupied ? '' : randomHex()
        const type: EventType = isOccupied ? 'OUT' : 'IN'

        const queued = this.parkingSystem.generateParkingQueue(palletId, plateNumber)
        if (!queued) return null

        const slotId = this.slotIdFromPalletId(palletId) ?? ''
        const process = this.parkingSystem.getPendingTasks().length

        return this.createParkingEvent({
            type,
            plateNumber: isOccupied ? currentPlate : plateNumber,
            slotId,
            status: 'Processing',
            process,
        })
    }

    private tickSimulation() {
        if (this.stopped) return

        const pendingTasks = this.parkingSystem.getPendingTasks().length

        if (pendingTasks > 0) {
            const success = this.parkingSystem.executeNextTask()
            this.emitParkingUpdate()

            const logs = this.parkingSystem.getLogs()
            const lastLog = logs[logs.length - 1]
            const task = lastLog?.details?.task as
                | { type: string; palletId?: number; plateNumber?: string }
                | undefined

            if (
                lastLog?.type === 'TASK_EXECUTED' &&
                task?.type === 'SET_SLOT_DATA' &&
                task.palletId != null
            ) {
                const slotId = this.slotIdFromPalletId(task.palletId) ?? ''
                const plateNumber = lastLog.plateNumber ?? task.plateNumber ?? ''
                const type: EventType = plateNumber ? 'IN' : 'OUT'
                const status: EventStatus = success ? 'Success' : 'Processing'
                const process =
                    lastLog.process ?? this.parkingSystem.getPendingTasks().length

                this.emitParkingEvent(
                    this.createParkingEvent({
                        type,
                        plateNumber,
                        slotId,
                        status,
                        process,
                    }),
                )
            }

            return
        }

        if (Math.random() < 0.6) {
            const event = this.enqueueRandomTask()
            if (event) {
                this.emitParkingUpdate()
                this.emitParkingEvent(event)
            }
        }
    }

    public connect() {
        if (this.connected) return
        this.stopped = false
        log.i('Mock WebSocket connected')

        this.timers.push(
            setTimeout(() => {
                if (this.stopped) return
                this.connected = true
                this.options.onConnected?.()
                this.emit({
                    type: 'wifi_status',
                    data: buildWiFiStatus({ connected: true }),
                })
                this.emitParkingUpdate()
            }, 1500),
        )

        this.timers.push(
            setInterval(() => {
                this.emit({ type: 'wifi_status', data: buildWiFiStatus() })
            }, 5000),
        )

        this.timers.push(
            setInterval(() => {
                this.tickSimulation()
            }, 2000),
        )
    }

    public disconnect() {
        if (!this.connected && this.timers.length === 0) return
        this.stopTimers()
        this.connected = false
        log.i('Mock WebSocket disconnected')
        this.options.onDisconnected?.(1000, 'Mock disconnected')
    }

    public send(data: string | object) {
        if (this.stopped) return

        let parsed: WsMessage | null = null
        if (typeof data === 'string') {
            try {
                parsed = JSON.parse(data) as WsMessage
            } catch {
                parsed = null
            }
        } else {
            parsed = data as WsMessage
        }
        if (!parsed?.type) return

        if (parsed.type === 'wifi_scan') {
            this.timers.push(
                setTimeout(() => {
                    this.emit({ type: 'scan_results', data: mockScanResults() })
                }, 500),
            )
            return
        }

        if (parsed.type === 'wifi_connect') {
            const requestedSsid =
                parsed.data && typeof parsed.data === 'object'
                    ? String(
                          (parsed.data as Record<string, unknown>).ssid || 'ETEK_PARKING',
                      )
                    : 'ETEK_PARKING'
            this.timers.push(
                setTimeout(() => {
                    this.connected = true
                    this.emit({
                        type: 'wifi_status',
                        data: buildWiFiStatus({ connected: true, ssid: requestedSsid }),
                    })
                }, 800),
            )
            return
        }

        if (parsed.type === 'wifi_disconnect') {
            this.timers.push(
                setTimeout(() => {
                    this.connected = false
                    this.options.onDisconnected?.(1000, 'Mock disconnect')
                    this.emit({
                        type: 'wifi_status',
                        data: buildWiFiStatus({ connected: false, ssid: '', ip: '' }),
                    })
                }, 600),
            )
        }
    }

    private emit(message: WsMessage) {
        if (this.stopped) return
        this.options.onMessage?.(message)
    }

    private stopTimers() {
        this.stopped = true
        for (const t of this.timers) {
            clearInterval(t as ReturnType<typeof setInterval>)
            clearTimeout(t as ReturnType<typeof setTimeout>)
        }
        this.timers = []
    }
}

let client: IWebSocketClient

if (import.meta.hot) {
    if (!import.meta.hot.data.mwsClient) {
        import.meta.hot.data.mwsClient = new MockWebSocketClient()
    }

    client = import.meta.hot.data.mwsClient

    import.meta.hot.dispose(() => {
        client.disconnect()
    })
} else {
    client = new MockWebSocketClient()
}

export const mwsClient = client
