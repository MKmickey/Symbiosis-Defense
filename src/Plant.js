class Plant {
    constructor(col, row, type, level = 1) {
        this.col = col;
        this.row = row;
        this.type = type;
        this.level = level;
        this.age = 0;

        // Load stats from Data
        const data = window.PLANT_DATA[type];
        if (!data) {
            console.error(`Plant type ${type} not found!`);
            // Fallback
            this.range = 3.5;
            this.damage = 10;
            this.attackCooldown = 1000;
            this.color = '#ccc';
            this.effect = null;
        } else {
            this.range = data.range;
            // Apply level scaling
            this.damage = Math.floor(data.damage * (1 + (level - 1) * 0.2));

            // Global Tech Speed
            const speedTechLevel = window.playerState ? (window.playerState.technologies['global_speed'] || 0) : 0;
            const speedMultiplier = 1 - (speedTechLevel * 0.05); // 5% reduction per level

            this.attackCooldown = Math.floor(data.cooldown * (1 - (level - 1) * 0.05) * speedMultiplier);
            this.color = data.color;
            this.effect = data.effect;
        }

        this.maxHealth = 100 + (level - 1) * 50;
        this.health = this.maxHealth;

        this.lastAttackTime = 0;

        // Growth settings - Keep simplified for now
        this.growthThresholds = {
            seed: 2000,
            sprout: 5000
        };

        if (type === 'seed') {
            this.currentStage = 'seed';
        } else {
            this.currentStage = 'mature';
            this.active = true;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            return 'dead';
        }
        return 'alive';
    }

    update(deltaTime, enemies, time, game) {
        if (time - this.lastAttackTime >= this.attackCooldown) {
            const target = this.findTarget(enemies, game.grid.tileSize);
            if (target) {
                this.attack(target, time, game);
                this.lastAttackTime = time;
            }
        }
    }

    findTarget(enemies, tileSize) {
        let bestTarget = null;
        let minDist = Infinity;

        const myX = this.col * tileSize + tileSize / 2;
        const myY = this.row * tileSize + tileSize / 2;

        // Simple closest target
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x * tileSize + tileSize / 2 - myX, enemy.y * tileSize + tileSize / 2 - myY);
            // Note: enemy.x/y might be in tile coords or pixel coords? Enemy.js uses tile coords * tileSize for drawing.
            // Enemy.speed is in "tiles per sec".
            // Enemy.x/y seems to be in TILE coordinates (float).

            // Let's use distance in TILES to be consistent with Range (which is likely in tiles? Data says 3.5 etc)
            const diffX = enemy.x - this.col;
            const diffY = enemy.y - this.row;
            const distTiles = Math.hypot(diffX, diffY);

            if (distTiles <= this.range && distTiles < minDist) {
                minDist = distTiles;
                bestTarget = enemy;
            }
        }
        return bestTarget;
    }


    attack(target, time, game) {
        // Spawn Projectile
        const startX = this.col * game.grid.tileSize + game.grid.tileSize / 2;
        const startY = this.row * game.grid.tileSize + game.grid.tileSize / 2;

        game.spawnProjectile(startX, startY, target, this.damage, this.effect, this.color);

        // Visuals (keep for future use or remove if projectile is enough)
        this.isAttacking = { time: time, x: target.x, y: target.y };
    }

    draw(ctx, x, y, size) {
        const cx = x + size / 2;
        const cy = y + size / 2;

        // Attack visual
        if (this.isAttacking && Date.now() - this.isAttacking.time < 100) {
            const targetX = this.isAttacking.x * size + size / 2;
            const targetY = this.isAttacking.y * size + size / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);

            if (this.effect === 'splash' || this.effect === 'nuke') {
                // Draw explosion circle at target
                ctx.arc(targetX, targetY, size * (this.effect === 'nuke' ? 2 : 1), 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
                ctx.fill();
            } else {
                ctx.lineTo(targetX, targetY);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        ctx.beginPath();
        if (this.currentStage === 'seed') {
            ctx.fillStyle = '#b8e0d2';
            ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.currentStage === 'sprout') {
            ctx.fillStyle = '#95d5b2';
            ctx.moveTo(cx, cy + size * 0.3);
            ctx.lineTo(cx, cy - size * 0.2);
            ctx.strokeStyle = '#95d5b2';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx - 5, cy - size * 0.1, 5, 0, Math.PI * 2);
            ctx.arc(cx + 5, cy - size * 0.1, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.currentStage === 'mature') {
            ctx.fillStyle = this.color;
            ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
            ctx.fill();

            // Level Indicator
            if (this.level > 1) {
                ctx.fillStyle = '#FFD700'; // Gold
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('★' + this.level, cx + size / 2 - 2, cy - size / 2 + 10);
            }

            // Simple Rarity/Type indicator layer
            // ctx.fillStyle = 'white';
            // ctx.font = '10px Arial';
            // ctx.textAlign = 'center';
            // ctx.fillText(this.type[0].toUpperCase(), cx, cy + 4);

            // HP Bar
            if (this.health < this.maxHealth) {
                const barW = size * 0.8;
                const barH = 4;
                const barX = cx - barW / 2;
                const barY = cy - size * 0.4;

                ctx.fillStyle = '#cc0000';
                ctx.fillRect(barX, barY, barW, barH);

                const pct = this.health / this.maxHealth;
                ctx.fillStyle = '#00cc00';
                ctx.fillRect(barX, barY, barW * pct, barH);
            }
        }
    }
}
window.Plant = Plant;
