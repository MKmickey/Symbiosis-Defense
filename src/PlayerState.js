class PlayerState {
    constructor() {
        this.mana = 0; // In-game mana (not persistent between levels usually, but maybe for shop?)
        // Actually, currency for Gacha should be persistent. Let's call it 'gems'.
        this.gems = 1000;

        this.inventory = { 'seed': 1, 'peashooter': 1, 'slow': 1 }; // Initial plants with levels
        this.deck = ['seed', 'peashooter', 'slow', null, null]; // Max 5 slots
        this.maxStage = 1;
        this.technologies = {
            'board_expansion': 0, // Level 0
            'global_speed': 0,
            'max_plants': 0
        };

        this.load();
    }

    // Technology Definitions
    getTechData(techId) {
        const data = {
            'board_expansion': { name: '畑の拡張', maxLevel: 5, baseCost: 500, costMult: 2, desc: '配置可能な列を増やします' },
            'global_speed': { name: '品種改良', maxLevel: 10, baseCost: 300, costMult: 1.5, desc: '全植物の攻撃速度アップ (+5%)' },
            'max_plants': { name: '栽培管理', maxLevel: 10, baseCost: 400, costMult: 1.5, desc: '同時配置可能数を増やします (+2)' }
        };
        return data[techId];
    }

    getTechCost(techId) {
        const level = this.technologies[techId] || 0;
        const data = this.getTechData(techId);
        if (!data || level >= data.maxLevel) return 999999;
        return Math.floor(data.baseCost * Math.pow(data.costMult, level));
    }

    upgradeTech(techId) {
        const cost = this.getTechCost(techId);
        if (this.gems >= cost) {
            this.gems -= cost;
            if (!this.technologies[techId]) this.technologies[techId] = 0;
            this.technologies[techId]++;
            this.save();
            return true;
        }
        return false;
    }

    save() {
        const data = {
            gems: this.gems,
            inventory: this.inventory,
            deck: this.deck,
            maxStage: this.maxStage,
            technologies: this.technologies
        };
        localStorage.setItem('symbiosis_save', JSON.stringify(data));
        console.log('Game Saved', data);
    }

    load() {
        const dataStr = localStorage.getItem('symbiosis_save');
        if (dataStr) {
            try {
                const data = JSON.parse(dataStr);
                this.gems = data.gems !== undefined ? data.gems : 1000;

                // Migration logic for old inventory (array)
                if (Array.isArray(data.inventory)) {
                    this.inventory = {};
                    data.inventory.forEach(id => {
                        this.inventory[id] = 1;
                    });
                } else {
                    this.inventory = data.inventory || { 'seed': 1, 'peashooter': 1, 'slow': 1 };
                }

                this.deck = data.deck || ['seed', 'peashooter', 'slow', null, null];
                this.maxStage = data.maxStage || 1;
                this.technologies = data.technologies || { 'board_expansion': 0, 'global_speed': 0, 'max_plants': 0 };
            } catch (e) {
                console.error('Failed to load save', e);
            }
        }
    }

    addToInventory(plantId) {
        if (this.inventory[plantId]) {
            // Already owned, level up
            this.inventory[plantId]++;
            this.save();
            return false; // Is not new (duplicate)
        } else {
            // New item
            this.inventory[plantId] = 1;
            this.save();
            return true; // Is new
        }
    }

    getPlantLevel(plantId) {
        return this.inventory[plantId] || 1;
    }

    getUpgradeCost(plantId) {
        const level = this.getPlantLevel(plantId);
        return level * 100;
    }

    upgradePlant(plantId) {
        const cost = this.getUpgradeCost(plantId);
        if (this.gems >= cost) {
            this.gems -= cost;
            if (!this.inventory[plantId]) this.inventory[plantId] = 1;
            this.inventory[plantId]++;
            this.save();
            return true;
        }
        return false;
    }

    setDeck(index, plantId) {
        if (index >= 0 && index < 5) {
            this.deck[index] = plantId;
            this.save();
        }
    }

    unlockStage(stageNum) {
        if (stageNum > this.maxStage) {
            this.maxStage = stageNum;
            this.save();
        }
    }

    addGems(amount) {
        this.gems += amount;
        this.save();
    }
}

window.playerState = new PlayerState(); // Singleton
