export class Item {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.active = true;
        this.lifetime = 5000; // 5 seconds
        this.age = 0;
        this.radius = 10;

        // Floating animation
        this.floatOffset = 0;
    }

    update(deltaTime) {
        this.age += deltaTime;
        if (this.age > this.lifetime) {
            this.active = false;
        }

        // Float
        this.floatOffset = Math.sin(this.age / 200) * 5;
    }

    draw(ctx, tileSize) {
        if (!this.active) return;

        // Draw coin
        const drawX = this.x * tileSize + tileSize / 2;
        const drawY = this.y * tileSize + tileSize / 2 + this.floatOffset;

        ctx.fillStyle = '#ffd700'; // Gold
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
