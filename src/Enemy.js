class Enemy {
    constructor(path, type = 'normal') {
        this.path = path;
        this.type = type; // normal, fast, tank
        this.pathIndex = 0;

        // Initial pos
        this.x = path[0].x;
        this.y = path[0].y;

        // Stats
        this.speed = 2.0; // tiles per sec
        this.maxHealth = 100;
        this.health = 100;
        this.active = true;
        this.reward = 10;
        this.color = '#e76f51';

        // Modifiers
        this.status = {};

        if (type === 'fast') {
            this.speed = 4.0;
            this.maxHealth = 60;
            this.health = 60;
            this.color = '#e9c46a';
            this.reward = 15;
            this.attackDamage = 5;
        } else if (type === 'tank') {
            this.speed = 1.0;
            this.maxHealth = 300;
            this.health = 300;
            this.color = '#2a9d8f';
            this.reward = 25;
            this.attackDamage = 20;
        } else if (type === 'boss') {
            this.speed = 0.8;
            this.maxHealth = 2000;
            this.health = 2000;
            this.color = '#000'; // Boss color
            this.reward = 500;
            this.attackDamage = 50;
        } else if (type === 'tiny') {
            this.speed = 3.0;
            this.maxHealth = 20;
            this.health = 20;
            this.color = '#8e44ad'; // Purple
            this.reward = 2; // Low reward
            this.attackDamage = 2;
        } else {
            // Normal
            this.attackDamage = 10;
        }

        this.isAttacking = false;
    }

    update(deltaTime, grid) {
        if (!this.active) return null;

        // Apply Status Effects
        let currentSpeed = this.speed;

        if (this.status.slow > 0) {
            currentSpeed *= 0.5;
            this.status.slow -= deltaTime;
        }

        // Check if next tile in path is blocked by a plant
        if (this.pathIndex < this.path.length - 1) {
            const currentTileX = Math.round(this.x);
            const currentTileY = Math.round(this.y);
            const currentTile = grid.tiles[currentTileY][currentTileX];

            const target = this.path[this.pathIndex + 1];
            // Ensure target is valid integer coordinates
            const targetTile = grid.tiles[target.y][target.x];

            // Attack Logic
            let attackTarget = null;
            if (targetTile && targetTile.plant) attackTarget = targetTile.plant;
            else if (currentTile && currentTile.plant) attackTarget = currentTile.plant;

            if (attackTarget) {
                this.isAttacking = true;
                // Simple attack timer
                if (!this.attackTimer) this.attackTimer = 0;
                this.attackTimer += deltaTime;
                if (this.attackTimer > 500) { // Attack every 0.5s
                    this.attackTimer = 0;

                    // Simple "animation" offset
                    this.x += (Math.random() - 0.5) * 0.1;
                    this.y += (Math.random() - 0.5) * 0.1;

                    const result = attackTarget.takeDamage(this.attackDamage);
                    if (result === 'dead') {
                        if (targetTile && targetTile.plant === attackTarget) targetTile.plant = null;
                        if (currentTile && currentTile.plant === attackTarget) currentTile.plant = null;
                        this.isAttacking = false;
                    }
                }
                return null; // Stop moving
            } else {
                this.isAttacking = false;
            }
        }

        // Move along path
        if (this.pathIndex < this.path.length - 1) {
            const target = this.path[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const moveDist = currentSpeed * (deltaTime / 1000);

            if (moveDist >= dist) {
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;
            } else {
                this.x += (dx / dist) * moveDist;
                this.y += (dy / dist) * moveDist;
            }
        } else {
            return 'reached_base';
        }

        return null; // OK
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.active = false;
        }
    }

    applyStatus(type, duration, value = 0) {
        if (type === 'slow') {
            this.status.slow = duration;
        }
    }

    draw(ctx, tileSize) {
        if (!this.active) return;
        const cx = this.x * tileSize + tileSize / 2;
        const cy = this.y * tileSize + tileSize / 2;

        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;

        if (this.type === 'fast') {
            // Triangle
            const size = 10;
            ctx.beginPath();
            ctx.moveTo(cx + size, cy);
            ctx.lineTo(cx - size, cy - size / 1.5);
            ctx.lineTo(cx - size, cy + size / 1.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'tank') {
            // Square/Shield
            const size = 12;
            ctx.beginPath();
            ctx.rect(cx - size, cy - size, size * 2, size * 2);
            ctx.fill();
            ctx.stroke();
            // Inner detail
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(cx - 5, cy - 5, 10, 10);
        } else if (this.type === 'boss') {
            // Spiky Star
            const spikes = 8;
            const outerRadius = 18;
            const innerRadius = 10;
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'tiny') {
            // Small Diamonds
            const size = 6;
            ctx.beginPath();
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size, cy);
            ctx.lineTo(cx, cy + size);
            ctx.lineTo(cx - size, cy);
            ctx.closePath();
            ctx.fill();
        } else {
            // Normal Circle
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // HP Bar (For all enemies now)
        if (this.health < this.maxHealth) {
            const hpPct = this.health / this.maxHealth;
            const barW = tileSize * 0.8;
            const barH = 5;
            const barX = cx - barW / 2;
            const barY = cy - 25; // Adjusted height

            ctx.fillStyle = '#cc0000'; // bg
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = '#00cc00'; // fg
            ctx.fillRect(barX, barY, barW * hpPct, barH);
        }
    }
}
window.Enemy = Enemy;
