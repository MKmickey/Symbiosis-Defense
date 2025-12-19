class Projectile {
    constructor(x, y, target, damage, effect = null, speed = 10, color = 'yellow') {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.effect = effect;
        this.speed = speed; // tile per sec NOT pixel? or pixel? Let's use pixel speed if X/Y are pixels
        // Wait, Plants use tile coords? 
        // We should standardise. Let's use PIXEL coords for projectiles for smoothness.

        this.color = color;
        this.active = true;
    }

    update(deltaTime, tileSize) {
        if (!this.active) return;
        if (!this.target.active) {
            this.active = false; // Target dead
            return;
        }

        // Target pixel position
        const tx = this.target.x * tileSize + tileSize / 2;
        const ty = this.target.y * tileSize + tileSize / 2;

        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);

        const moveDist = this.speed * (deltaTime / 1000) * tileSize; // Scale by tile size for speed relative to grid

        if (dist <= moveDist) {
            // Hit
            this.x = tx;
            this.y = ty;
            this.active = false;

            // Deal damage
            this.target.takeDamage(this.damage);
            if (this.effect === 'ice') {
                this.target.applyStatus('slow', 3000);
            }
        } else {
            this.x += (dx / dist) * moveDist;
            this.y += (dy / dist) * moveDist;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); // Small ball
        ctx.fill();
    }
}

window.Projectile = Projectile;
