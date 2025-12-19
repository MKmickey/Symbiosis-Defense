class Game {
    constructor(canvas, levelConfig, playerDeck) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width = 800;
        this.height = canvas.height = 600;

        this.lastTime = 0;
        this.startMana = 100;
        this.mana = this.startMana;
        this.maxMana = 1000; // Mana Cap
        this.maxHealth = 100;
        this.health = 100;

        // Max Plants Cap
        const maxPlantsTech = window.playerState ? (window.playerState.technologies['max_plants'] || 0) : 0;
        this.maxPlants = 10 + (maxPlantsTech * 2);

        // Use global Grid
        this.grid = new window.Grid(this.width, this.height);
        this.enemies = [];
        this.projectiles = [];

        // Level & Wave Management
        this.levelConfig = levelConfig;
        this.waves = levelConfig.waves;
        this.currentWaveIndex = 0;
        this.waveInProgress = false;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2000;

        // Player Deck
        this.deck = playerDeck || ['seed']; // Array of IDs
        this.selectedPlantType = this.deck[0];

        // Define Base and Spawn points
        this.spawnPoint = { x: 0, y: Math.floor(this.grid.rows / 2) };
        this.basePoint = { x: this.grid.cols - 1, y: Math.floor(this.grid.rows / 2) };

        // Input handling
        // Note: Canvas input is handled here for board interaction
        this.canvas.addEventListener('click', (e) => this.handleInput(e));

        // Logic Flags
        this.isRunning = false;
        this.onWaveComplete = null;
        this.onGameOver = null;

        this.plantCooldowns = {}; // Stores current cooldown ms for each plant type
        this.deck.forEach(id => { if (id) this.plantCooldowns[id] = 0; });

        // Bind loop
        this.loop = this.loop.bind(this);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
        this.updateUI(); // Initial UI
    }

    stop() {
        this.isRunning = false;
    }

    loop(timestamp) {
        if (!this.isRunning) return;
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        try {
            this.update(deltaTime);
            this.draw();
            this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
        } catch (e) {
            console.error("Game Loop Error:", e);
            alert("Game Error: " + e.message);
            this.stop();
        }
    }

    update(deltaTime) {
        this.grid.update(deltaTime, this.enemies, this);

        // Update Cooldowns
        // Update Cooldowns
        if (this.waveInProgress) {
            for (const id in this.plantCooldowns) {
                if (this.plantCooldowns[id] > 0) {
                    this.plantCooldowns[id] -= deltaTime;
                    if (this.plantCooldowns[id] < 0) this.plantCooldowns[id] = 0;
                }
            }
        }

        // Notify UI of cooldown updates (every frame might be heavy, but fine for now)
        this.updateUI();

        // Spawn Logic
        if (this.waveInProgress && this.enemiesToSpawn.length > 0) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer > this.spawnInterval) {
                this.spawnTimer = 0;
                const type = this.enemiesToSpawn.shift();
                this.spawnEnemy(type);
            }
        } else if (this.waveInProgress && this.enemiesToSpawn.length === 0 && this.enemies.length === 0) {
            // Wave Complete
            this.waveInProgress = false;
            console.log('Wave Complete!');

            if (this.currentWaveIndex >= this.waves.length) {
                // All waves finished
                if (this.onGameOver) this.onGameOver(true);
            } else {
                if (this.onWaveComplete) this.onWaveComplete(this.currentWaveIndex + 1);
            }
        }

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const result = enemy.update(deltaTime, this.grid);

            if (result === 'reached_base') {
                this.health -= 20; // Player Damage
                this.enemies.splice(i, 1);
                if (this.health <= 0) {
                    this.health = 0;
                    this.stop(); // Stop game loop
                    if (this.onGameOver) this.onGameOver(false);
                }
            } else if (!enemy.active) {
                // Enemy died
                this.mana += enemy.reward;
                if (this.mana > this.maxMana) this.mana = this.maxMana; // Cap mana
                this.enemies.splice(i, 1);
            }
        }

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(deltaTime, this.grid.tileSize);
            if (!p.active) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    spawnEnemy(type = null) {
        if (type === 'mix') {
            const types = ['normal', 'fast', 'tank'];
            type = types[Math.floor(Math.random() * types.length)];
        }

        const path = this.grid.findPath(this.spawnPoint.x, this.spawnPoint.y, this.basePoint.x, this.basePoint.y);

        if (path.length > 0) {
            this.enemies.push(new window.Enemy(path, type));
        } else {
            console.error("No path found for enemy!");
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.grid.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx, this.grid.tileSize));

        // Draw Projectiles
        this.projectiles.forEach(p => p.draw(this.ctx));
    }

    spawnProjectile(x, y, target, damage, effect, color) {
        // x, y in pixels
        this.projectiles.push(new window.Projectile(x, y, target, damage, effect, 5, color));
    }

    // Defined in constructor, need to add if not present

    handleInput(e) {
        if (!this.selectedPlantType) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const gridX = (x * scaleX);
        const gridY = (y * scaleY);

        // Check Shovel
        if (this.selectedPlantType === 'shovel') {
            const tile = this.grid.getTileAt(gridX, gridY);
            if (tile && tile.plant) {
                tile.plant = null;
            }
            return; // Always return if shovel is active
        }

        // Check Cooldown
        if (this.waveInProgress && this.plantCooldowns[this.selectedPlantType] > 0) {
            console.log("Cooldown active!");
            return;
        }

        // Check Max Plants Cap
        let currentPlantCount = 0;
        for (let r = 0; r < this.grid.rows; r++) {
            for (let c = 0; c < this.grid.cols; c++) {
                if (this.grid.tiles[r][c].plant) currentPlantCount++;
            }
        }
        if (currentPlantCount >= this.maxPlants) {
            console.log("Max plants reached!");
            // Optional: Visual feedback
            return;
        }

        // Check cost
        const plantInfo = window.PLANT_DATA[this.selectedPlantType];
        if (this.mana >= plantInfo.cost) {
            // Get level
            const level = window.playerState.getPlantLevel(this.selectedPlantType);
            const success = this.grid.onInteract(gridX, gridY, this, this.selectedPlantType, level);
            if (success) {
                this.mana -= plantInfo.cost;
                // Only set cooldown during wave
                if (this.waveInProgress) {
                    this.plantCooldowns[this.selectedPlantType] = plantInfo.cooldown;
                }
                this.updateUI(); // Update mana display
            }
        }
    }

    startNextWave() {
        if (this.currentWaveIndex >= this.waves.length) {
            console.log('All waves complete!');
            if (this.onGameOver) this.onGameOver(true); // Victory
            return;
        }

        const waveConfig = this.waves[this.currentWaveIndex];
        this.enemiesToSpawn = [];
        this.spawnInterval = waveConfig.interval;

        for (let i = 0; i < waveConfig.count; i++) {
            if (waveConfig.type === 'mix') {
                const rand = Math.random();
                if (rand < 0.4) this.enemiesToSpawn.push('normal');
                else if (rand < 0.6) this.enemiesToSpawn.push('fast');
                else if (rand < 0.8) this.enemiesToSpawn.push('tank');
                else this.enemiesToSpawn.push('tiny'); // 20% tiny
            } else if (waveConfig.type === 'boss') {
            } else if (waveConfig.type === 'boss') {
                this.enemiesToSpawn.push('boss');
                for (let j = 0; j < 5; j++) this.enemiesToSpawn.push('tank');
            } else {
                this.enemiesToSpawn.push(waveConfig.type);
            }
        }

        this.waveInProgress = true;
        this.currentWaveIndex++;
    }

    updateUI() {
        // Dispatch event or callback to update React/HTML UI
        const manaDisplay = document.getElementById('mana-display');
        if (manaDisplay) manaDisplay.textContent = Math.floor(this.mana);

        const healthDisplay = document.getElementById('health-display');
        if (healthDisplay) healthDisplay.textContent = Math.floor(this.health);

        const enemyCountDisplay = document.getElementById('enemy-count');
        if (enemyCountDisplay) {
            const total = this.enemies.length + this.enemiesToSpawn.length;
            enemyCountDisplay.textContent = total;
        }

        if (this.onTimeUpdate) this.onTimeUpdate();
    }

    setSelectedPlant(type) {
        this.selectedPlantType = type;
    }
}
window.Game = Game;
