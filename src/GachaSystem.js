class GachaSystem {
    constructor() {
        this.costSingle = 100;
        this.costMulti = 1000;
    }

    pullSingle() {
        if (playerState.gems < this.costSingle) return { success: false, reason: 'ジェムが足りません' };

        playerState.addGems(-this.costSingle);
        const plant = this.roll();
        const isNew = playerState.addToInventory(plant.id);
        const level = playerState.getPlantLevel(plant.id);

        return { success: true, results: [plant], isNew: [isNew], levels: [level] };
    }

    pullMulti() {
        if (playerState.gems < this.costMulti) return { success: false, reason: 'ジェムが足りません' };

        playerState.addGems(-this.costMulti);
        const results = [];
        const isNewList = [];
        const levels = [];

        for (let i = 0; i < 10; i++) {
            const plant = this.roll();
            results.push(plant);
            isNewList.push(playerState.addToInventory(plant.id));
            levels.push(playerState.getPlantLevel(plant.id));
        }

        return { success: true, results: results, isNew: isNewList, levels: levels };
    }

    roll() {
        // Rarity Roll
        const totalWeight = Object.values(window.PLANT_RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        let selectedRarity = 'common';
        for (const [rarity, weight] of Object.entries(window.PLANT_RARITY_WEIGHTS)) {
            random -= weight;
            if (random <= 0) {
                selectedRarity = rarity;
                break;
            }
        }

        // Filter plants by rarity
        const pool = Object.values(window.PLANT_DATA).filter(p => p.rarity === selectedRarity);

        // Pick random plant from pool
        const plant = pool[Math.floor(Math.random() * pool.length)];
        return plant;
    }
}

window.gachaSystem = new GachaSystem();
