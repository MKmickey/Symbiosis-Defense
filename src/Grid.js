class Grid {
    constructor(screenWidth, screenHeight) {
        this.tileSize = 40;
        this.cols = Math.floor(screenWidth / this.tileSize);
        this.rows = Math.floor(screenHeight / this.tileSize);

        // Active Area (Restricted Board)
        // Base: 5-15. Tech expands this.
        const expansionLevel = window.playerState ? (window.playerState.technologies['board_expansion'] || 0) : 0;

        this.activeArea = {
            minCol: Math.max(0, 5 - expansionLevel),
            maxCol: Math.min(this.cols - 1, 15 + expansionLevel),
            minRow: 0,
            maxRow: this.rows
        };

        this.tiles = [];
        this.initGrid();
    }

    initGrid() {
        this.tiles = [];
        for (let y = 0; y < this.rows; y++) {
            const row = [];
            for (let x = 0; x < this.cols; x++) {
                let type = 'empty';
                // Lock area outside active zone
                if (x < this.activeArea.minCol || x > this.activeArea.maxCol) {
                    type = 'locked';
                }

                row.push({
                    x: x,
                    y: y,
                    type: type, // empty, plant, path, rock, pollution, locked
                    plant: null,
                    color: (x + y) % 2 === 0 ? '#34554a' : '#2d4a3e' // Checkerboard
                });
            }
            this.tiles.push(row);
        }

        // Simple path generation (Horizontal center)
        const pathRow = Math.floor(this.rows / 2);
        for (let x = 0; x < this.cols; x++) {
            this.tiles[pathRow][x].type = 'path';
            this.tiles[pathRow][x].color = '#1f332a';
        }
    }

    findPath(startX, startY, endX, endY) {
        const queue = [{ x: startX, y: startY, path: [] }];
        const visited = new Set();
        const startKey = `${startX},${startY}`;
        visited.add(startKey);

        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.x === endX && current.y === endY) {
                return [...current.path, { x: endX, y: endY }];
            }

            for (const dir of directions) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                const key = `${nx},${ny}`;

                if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && !visited.has(key)) {
                    visited.add(key);
                    const newPath = [...current.path, { x: current.x, y: current.y }];
                    queue.push({ x: nx, y: ny, path: newPath });
                }
            }
        }
        return [];
    }

    update(deltaTime, enemies, game) {
        const now = Date.now();
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const tile = this.tiles[y][x];
                if (tile.plant) {
                    tile.plant.update(deltaTime, enemies, now, game);
                }
            }
        }
    }

    draw(ctx) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const tile = this.tiles[y][x];

                ctx.fillStyle = tile.color;
                if (tile.type === 'locked') {
                    ctx.fillStyle = '#111'; // Fog
                }
                ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

                if (tile.plant) {
                    tile.plant.draw(ctx, x * this.tileSize, y * this.tileSize, this.tileSize);
                }
            }
        }
    }

    getPlantCount() {
        let count = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.tiles[y][x].plant) count++;
            }
        }
        return count;
    }

    onInteract(x, y, game, plantType, plantLevel = 1) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const tile = this.tiles[row][col];

            // Check if locked or path
            if (tile.type === 'locked' || tile.type === 'path') return false;

            // Check if plant exists
            if (tile.plant) return false;

            // Check Max Plants
            if (this.getPlantCount() >= 10) {
                console.log("Max plants reached!");
                // Optionally trigger UI alert via game
                return false;
            }

            // Place plant
            tile.plant = new window.Plant(col, row, plantType, plantLevel);
            return true;
        }
        return false;
    }

    getTileAt(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            return this.tiles[row][col];
        }
        return null;
    }

    expandBoard() {
        this.activeArea.minCol = Math.max(0, this.activeArea.minCol - 3);
        this.activeArea.maxCol = Math.min(this.cols - 1, this.activeArea.maxCol + 3);
        this.updateLockedState();
    }

    updateLockedState() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const tile = this.tiles[y][x];
                if (tile.type === 'path') continue;

                if (x < this.activeArea.minCol || x > this.activeArea.maxCol) {
                    tile.type = 'locked';
                } else if (tile.type === 'locked') {
                    tile.type = 'empty';
                }
            }
        }
    }

    spawnPlant(col, row, type) {
        const tile = this.tiles[row][col];
        if (window.Plant) {
            tile.plant = new window.Plant(type, col, row);
        } else {
            console.error("Plant class not loaded");
        }
    }
}
window.Grid = Grid;
