class ParkingSystemStore {
    private static readonly EMPTY_SLOT_ID = 0

    private palletIdGrid: number[][] = []
    private palletMetadata: Map<number, string> = new Map()

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
                    rowData.push(ParkingSystemStore.EMPTY_SLOT_ID)
                } else {
                    rowData.push(nextPalletId)
                    this.palletMetadata.set(nextPalletId, '')
                    nextPalletId++
                }
            }

            this.palletIdGrid.push(rowData)
        }

        this.palletMetadata.set(
            ParkingSystemStore.EMPTY_SLOT_ID,
            'This is an undefined slot with ID 0',
        )
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
        if (!this.isValidCoordinate(fromCol, row) || !this.isValidCoordinate(toCol, row)) {
            return false
        }

        const fromId = this.getSlotPalletId(fromCol, row)
        const toId = this.getSlotPalletId(toCol, row)

        // Move only when source has a pallet and destination is empty.
        if (fromId <= 0 || toId !== ParkingSystemStore.EMPTY_SLOT_ID) return false

        this.palletIdGrid[row]![fromCol] = ParkingSystemStore.EMPTY_SLOT_ID
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
     * Updates plate number metadata for a pallet.
     *
     * @param palletId Pallet identifier.
     * @param plateNumber New plate number value.
     * @returns `true` when update succeeds, `false` if pallet ID does not exist.
     */
    updateSlotData(palletId: number, plateNumber: string): boolean {
        if (palletId <= 0 || !this.palletMetadata.has(palletId)) {
            return false
        }

        const position = this.findPalletPosition(palletId)
        if (!position) {
            return false
        }

        const isBottomRow = position.row === this._totalRows - 1
        let canUpdate = isBottomRow

        // Except for the bottom row, metadata can be updated only when
        // every slot below the same column is empty.
        if (!isBottomRow) {
            canUpdate = true
            for (let row = position.row + 1; row < this._totalRows; row++) {
                if (this.getSlotPalletId(position.col, row) !== ParkingSystemStore.EMPTY_SLOT_ID) {
                    canUpdate = false
                    break
                }
            }
        }

        if (!canUpdate) {
            return false
        }

        this.palletMetadata.set(palletId, plateNumber)
        return true
    }

    /**
     * Sets metadata for a pallet ID.
     *
     * This is a semantic alias of {@link updateSlotData} to provide
     * a clearer setter-style API.
     *
     * @param palletId Pallet identifier.
     * @param plateNumber New plate number value.
     * @returns `true` when update succeeds; otherwise `false`.
     */
    setSlotData(palletId: number, plateNumber: string): boolean {
        return this.updateSlotData(palletId, plateNumber)
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
    toSlotObjects2D(): Array<Array<{ slotPalletId: number; slotData: string | null }>> {
        return this.palletIdGrid.map((row) =>
            row.map((slotPalletId) => ({
                slotPalletId,
                slotData: this.getSlotData(slotPalletId),
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
