type ParkingTask =
    | { type: 'MOVE_PALLET'; row: number; fromCol: number; toCol: number }
    | { type: 'SET_SLOT_DATA'; palletId: number; plateNumber: string }

type TaskExecutionResult = {
    task: ParkingTask
    success: boolean
    remainingTasks: number
}
enum SlotStatus {
    NO_PALLET,
    PROCESSING,
    PENDING,
}

type ParkingLogEntry = {
    /**
     * Matches the current `palletMetadataVersion` at the time of the log entry.
     * This value only increases when `generateParkingQueue()` succeeds.
     */
    id: number
    timestamp: string
    type: 'QUEUE_CREATED' | 'TASK_EXECUTED'
    plateNumber?: string
    slotId?: string
    status?: SlotStatus
    process?: number

    details?: Record<string, unknown>
}

export class ParkingSystem {
    private static readonly EMPTY_SLOT_ID = 0
    private static palletMetadataVersion = 0

    private palletIdGrid: number[][] = []
    private palletStatus: Map<number, SlotStatus | null> = new Map()
    private palletMetadata: Map<number, string> = new Map()
    private taskQueue: ParkingTask[] = []
    private logEntries: ParkingLogEntry[] = []

    /**
     * Creates a parking grid with one empty slot per row (except the first row),
     * represented by pallet ID `0`.
     *
     * @param totalCols Number of columns in the parking grid.
     * @param totalRows Number of rows in the parking grid.
     */
    constructor(
        private _totalCols: number = 4,
        private _totalRows: number = 3,
    ) {
        let nextPalletId = 1

        for (let rowIndex = 0; rowIndex < this._totalRows; rowIndex++) {
            const rowData: number[] = []
            const emptyColIndex = Math.floor(Math.random() * this._totalCols)

            for (let colIndex = 0; colIndex < this._totalCols; colIndex++) {
                if (colIndex === emptyColIndex && rowIndex !== 0) {
                    rowData.push(ParkingSystem.EMPTY_SLOT_ID)
                    this.palletStatus.set(
                        ParkingSystem.EMPTY_SLOT_ID,
                        SlotStatus.NO_PALLET,
                    )
                } else {
                    rowData.push(nextPalletId)
                    this.palletMetadata.set(nextPalletId, '')
                    // Status is derived from plate number; track only task-related states.
                    this.palletStatus.set(nextPalletId, null)
                    nextPalletId++
                }
            }

            this.palletIdGrid.push(rowData)
        }

        this.palletMetadata.set(
            ParkingSystem.EMPTY_SLOT_ID,
            'This is an undefined slot with ID 0',
        )
        this.palletStatus.set(ParkingSystem.EMPTY_SLOT_ID, SlotStatus.NO_PALLET)
    }

    /**
     * Gets total configured number of columns.
     *
     * @returns Number of columns in the grid.
     */
    get totalCols(): number {
        return this._totalCols
    }

    /**
     * Gets total configured number of rows.
     *
     * @returns Number of rows in the grid.
     */
    get totalRows(): number {
        return this._totalRows
    }

    /**
     * Gets current global version of `palletMetadata`.
     *
     * Version increases only when a new high-level parking queue
     * is successfully generated.
     *
     * @returns Current pallet metadata version.
     */
    get palletMetadataVersion(): number {
        return ParkingSystem.palletMetadataVersion
    }

    /**
     * Checks whether a coordinate is inside the configured parking grid.
     *
     * @param col Zero-based column index.
     * @param row Zero-based row index.
     * @returns `true` when the coordinate is valid; otherwise `false`.
     */
    isValidCoordinate(col: number, row: number): boolean {
        return row >= 0 && row < this._totalRows && col >= 0 && col < this._totalCols
    }

    /**
     * Gets the pallet ID at a given coordinate.
     *
     * @param col Zero-based column index.
     * @param row Zero-based row index.
     * @returns Pallet ID at the coordinate, or `-1` if the coordinate is invalid.
     */
    getSlotPalletId(col: number, row: number): number {
        if (!this.isValidCoordinate(col, row)) return -1
        return this.palletIdGrid[row]![col]!
    }

    /**
     * Finds the grid position for a pallet ID.
     *
     * @param palletId Pallet identifier.
     * @returns Coordinate when found, otherwise `null`.
     */
    private findPalletPosition(palletId: number): { row: number; col: number } | null {
        for (let row = 0; row < this._totalRows; row++) {
            for (let col = 0; col < this._totalCols; col++) {
                if (this.palletIdGrid[row]![col] === palletId) {
                    return { row, col }
                }
            }
        }

        return null
    }

    /**
     * Checks whether a pallet can be moved from one coordinate to another.
     *
     * Rules:
     * - Both coordinates must be valid in the same row.
     * - Source and destination must be horizontally adjacent.
     * - Source must contain a pallet ID greater than `0`.
     * - Destination must be an empty slot (ID `0`).
     *
     * @param row Source and destination row index.
     * @param fromCol Source column index.
     * @param toCol Destination column index.
     * @returns `true` when move is valid; otherwise `false`.
     */
    canMovePallet(row: number, fromCol: number, toCol: number): boolean {
        if (
            !this.isValidCoordinate(fromCol, row) ||
            !this.isValidCoordinate(toCol, row)
        ) {
            return false
        }

        // Allow movement only to horizontally adjacent slots.
        if (Math.abs(fromCol - toCol) !== 1) {
            return false
        }

        const fromId = this.getSlotPalletId(fromCol, row)
        const toId = this.getSlotPalletId(toCol, row)

        return fromId > 0 && toId === ParkingSystem.EMPTY_SLOT_ID
    }

    /**
     * Moves a pallet from one coordinate to another.
     * Move is valid only when source has a pallet ID greater than `0`
     * and destination is an empty slot (ID `0`).
     *
     * @param row Source and destination row index.
     * @param fromCol Source column index.
     * @param toCol Destination column index.
     * @returns `true` when the move succeeds; otherwise `false`.
     */
    movePallet(row: number, fromCol: number, toCol: number): boolean {
        if (!this.canMovePallet(row, fromCol, toCol)) {
            return false
        }

        const fromId = this.getSlotPalletId(fromCol, row)

        this.palletIdGrid[row]![fromCol] = ParkingSystem.EMPTY_SLOT_ID
        this.palletIdGrid[row]![toCol] = fromId

        return true
    }

    /**
     * Returns slot metadata for a given pallet ID.
     *
     * @param palletId Pallet identifier.
     * @returns Slot data if found, otherwise `null`.
     */
    getSlotData(palletId: number): string | null {
        return this.palletMetadata.get(palletId) || null
    }

    /**
     * Checks whether metadata can be set for a pallet.
     *
     * Rules:
     * - Pallet ID must exist and be greater than `0`.
     * - Bottom-row pallets are always settable.
     * - For non-bottom rows, every slot below in the same column must be empty.
     *
     * @param palletId Pallet identifier.
     * @returns `true` when metadata can be set; otherwise `false`.
     */
    canSetSlotData(palletId: number): boolean {
        if (palletId <= 0 || !this.palletMetadata.has(palletId)) {
            return false
        }

        const position = this.findPalletPosition(palletId)
        if (!position) {
            return false
        }

        const isBottomRow = position.row === this._totalRows - 1
        if (isBottomRow) {
            return true
        }

        // Except for the bottom row, metadata can be set only when
        // every slot below the same column is empty.
        for (let row = position.row + 1; row < this._totalRows; row++) {
            if (this.getSlotPalletId(position.col, row) !== ParkingSystem.EMPTY_SLOT_ID) {
                return false
            }
        }

        return true
    }

    /**
     * Updates plate number metadata for a pallet.
     *
     * @param palletId Pallet identifier.
     * @param plateNumber New plate number value.
     * @returns `true` when update succeeds; otherwise `false`.
     */
    setSlotData(palletId: number, plateNumber: string): boolean {
        if (!this.canSetSlotData(palletId)) {
            return false
        }

        this.palletMetadata.set(palletId, plateNumber)

        // Status is derived from plate number; only keep explicit task states.
        this.palletStatus.set(palletId, null)

        return true
    }

    /**
     * Retrieves the status for a pallet.
     *
     * @param palletId Pallet identifier.
     * @returns Current slot status, or `null` when unknown.
     */
    getSlotStatus(palletId: number): SlotStatus | null {
        return this.palletStatus.get(palletId) ?? null
    }

    /**
     * Determines whether a pallet slot is empty or occupied based on its plate number.
     *
     * @param palletId Pallet identifier.
     * @returns `'EMPTY'` when no plate is assigned, `'OCCUPIED'` when a plate is present,
     *          or `'NO_PALLET'` for the placeholder empty slot.
     */
    getSlotOccupancy(palletId: number): 'NO_PALLET' | 'EMPTY' | 'OCCUPIED' {
        if (palletId === ParkingSystem.EMPTY_SLOT_ID) {
            return 'NO_PALLET'
        }
        const plateNumber = this.palletMetadata.get(palletId) ?? ''
        return plateNumber === '' ? 'EMPTY' : 'OCCUPIED'
    }

    /**
     * Adds a new log entry.
     *
     * The log entry's `id` is tied to the current `palletMetadataVersion`.
     */
    private addLogEntry(entry: Omit<ParkingLogEntry, 'id' | 'timestamp'>) {
        this.logEntries.push({
            id: ParkingSystem.palletMetadataVersion,
            timestamp: new Date().getTime().toString(),
            ...entry,
        })
    }

    /**
     * Returns all log entries.
     */
    getLogs(): ParkingLogEntry[] {
        return [...this.logEntries]
    }

    /**
     * Generates sequential tasks to clear the path and set slot metadata.
     *
     * A new queue can be generated only when there are no pending tasks.
     *
     * @param palletId Target pallet identifier.
     * @param plateNumber Plate number to assign.
     * @returns `true` when queue generation succeeds; otherwise `false`.
     */
    generateParkingQueue(palletId: number, plateNumber: string): boolean {
        if (this.taskQueue.length > 0) {
            return false
        }

        const targetPos = this.findPalletPosition(palletId)
        if (!targetPos) {
            return false
        }

        const { row: targetRow, col: targetCol } = targetPos

        for (let row = targetRow + 1; row < this._totalRows; row++) {
            let emptyCol = -1

            for (let col = 0; col < this._totalCols; col++) {
                if (this.palletIdGrid[row]![col] === ParkingSystem.EMPTY_SLOT_ID) {
                    emptyCol = col
                    break
                }
            }

            if (emptyCol === -1) {
                continue
            }

            if (emptyCol < targetCol) {
                for (let col = emptyCol; col < targetCol; col++) {
                    this.taskQueue.push({
                        type: 'MOVE_PALLET',
                        row,
                        fromCol: col + 1,
                        toCol: col,
                    })
                }
            } else if (emptyCol > targetCol) {
                for (let col = emptyCol; col > targetCol; col--) {
                    this.taskQueue.push({
                        type: 'MOVE_PALLET',
                        row,
                        fromCol: col - 1,
                        toCol: col,
                    })
                }
            }
        }

        this.taskQueue.push({ type: 'SET_SLOT_DATA', palletId, plateNumber })

        // Mark all pallets involved in the queued tasks as pending.
        for (const task of this.taskQueue) {
            if (task.type === 'MOVE_PALLET') {
                const palletIdToMove = this.getSlotPalletId(task.fromCol, task.row)
                if (palletIdToMove > 0) {
                    this.palletStatus.set(palletIdToMove, SlotStatus.PENDING)
                }
            } else {
                this.palletStatus.set(task.palletId, SlotStatus.PENDING)
            }
        }

        // Increment global version once per parking queue generation.
        ParkingSystem.palletMetadataVersion++

        this.addLogEntry({
            type: 'QUEUE_CREATED',
            plateNumber,
            slotId: String(palletId),
            status: SlotStatus.PENDING,
            process: this.taskQueue.length,
            details: {
                palletId,
                plateNumber,
                totalTasks: this.taskQueue.length,
            },
        })

        return true
    }

    /**
     * Executes the next task in queue.
     *
     * @param onTaskExecuted Optional callback invoked after the task is executed.
     * @returns `true` when task execution succeeds; otherwise `false`.
     */
    executeNextTask(): boolean {
        const task = this.taskQueue.shift()
        if (!task) {
            return false
        }

        let success = false
        let processingPalletId: number | null = null

        if (task.type === 'MOVE_PALLET') {
            processingPalletId = this.getSlotPalletId(task.fromCol, task.row)
        } else {
            processingPalletId = task.palletId
        }

        if (processingPalletId && processingPalletId > 0) {
            this.palletStatus.set(processingPalletId, SlotStatus.PROCESSING)
        }

        if (task.type === 'MOVE_PALLET') {
            success = this.movePallet(task.row, task.fromCol, task.toCol)

            if (success && processingPalletId && processingPalletId > 0) {
                // After a successful move, slot occupancy is derived from plate metadata.
                this.palletStatus.set(processingPalletId, null)
            }
        } else {
            success = this.setSlotData(task.palletId, task.plateNumber)
        }

        if (!success && processingPalletId && processingPalletId > 0) {
            // If execution failed, revert status back to pending so it can be retried.
            this.palletStatus.set(processingPalletId, SlotStatus.PENDING)
        }

        const logSlotId = processingPalletId?.toString()
        const logStatus =
            processingPalletId != null
                ? (this.getSlotStatus(processingPalletId) ?? undefined)
                : undefined
        const logPlateNumber =
            task.type === 'SET_SLOT_DATA'
                ? task.plateNumber
                : processingPalletId != null
                  ? (this.getSlotData(processingPalletId) ?? undefined)
                  : undefined

        this.addLogEntry({
            type: 'TASK_EXECUTED',
            slotId: logSlotId,
            plateNumber: logPlateNumber,
            status: logStatus,
            process: this.taskQueue.length,
            details: {
                task,
                success,
                remainingTasks: this.taskQueue.length,
            },
        })

        return success
    }

    /**
     * Executes all pending tasks in queue.
     *
     * @param onTaskExecuted Optional callback invoked after each task execution.
     * @returns `true` when all tasks succeed; otherwise `false`.
     */
    executeAllTasks(): boolean {
        while (this.taskQueue.length > 0) {
            const success = this.executeNextTask()
            if (!success) {
                return false
            }
        }

        return true
    }

    /**
     * Returns a shallow copy of pending tasks for UI/debugging.
     *
     * @returns Pending tasks in execution order.
     */
    getPendingTasks(): ParkingTask[] {
        return [...this.taskQueue]
    }

    /**
     * Returns all slot metadata mapped by pallet ID.
     *
     * @returns A mutable map of all pallet IDs and their slot data.
     */
    getAllSlotData(): Map<number, string> {
        return this.palletMetadata
    }

    /**
     * Converts the internal grid into slot objects with ID and metadata.
     *
     * @returns A two-dimensional array describing all slots.
     */
    toSlotObjects2D(): Array<
        Array<{
            slotPalletId: number
            slotData: string | null
            slotStatus: SlotStatus | null
        }>
    > {
        return this.palletIdGrid.map((row) =>
            row.map((slotPalletId) => ({
                slotPalletId,
                slotData: this.getSlotData(slotPalletId),
                slotStatus: this.getSlotStatus(slotPalletId),
            })),
        )
    }

    /**
     * ToJson method for debugging purposes.
     *
     * @returns A JSON string representing the parking system state.
     */
    toJson(): string {
        return JSON.stringify({
            slotPalletIds: this.palletIdGrid,
            slotData: Array.from(this.palletMetadata.entries()),
        })
    }
}
