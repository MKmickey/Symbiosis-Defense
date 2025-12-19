// Main App Controller
class App {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.game = null;

        // UI Elements
        this.screens = {
            menu: document.getElementById('main-menu'),
            stage: document.getElementById('stage-select'),
            deck: document.getElementById('deck-builder'),
            tech: document.getElementById('tech-tree-screen'),
            gacha: document.getElementById('gacha-screen'),
            game: document.getElementById('game-ui')
        };

        this.init();
    }

    init() {
        console.log("Initializing App...");
        // Navigation bindings
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showScreen(e.target.dataset.target || 'main-menu'));
        });

        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.renderStageList();
            this.showScreen('stage');
        });



        document.getElementById('btn-gacha').addEventListener('click', () => {
            this.updateGachaUI();
            this.showScreen('gacha');
        });

        // Gacha logic
        document.getElementById('btn-pull-1').addEventListener('click', () => this.handleGacha(1));
        document.getElementById('btn-pull-10').addEventListener('click', () => this.handleGacha(10));
        document.getElementById('gacha-results').addEventListener('click', () => {
            if (!this.gachaAnimating) {
                document.getElementById('gacha-results').classList.add('hidden');
                this.updateGachaUI(); // refresh gem count
            }
        });

        document.getElementById('btn-deck-builder').addEventListener('click', () => {
            this.renderDeckBuilder();
            this.showScreen('deck');
        });

        // Close handled by back-btn class on the screen logic


        // Tech Tree
        if (document.getElementById('btn-tech-tree')) {
            document.getElementById('btn-tech-tree').addEventListener('click', () => {
                this.renderTechTree();
                this.showScreen('tech');
            });
        }

        // In-Game logic
        document.getElementById('next-wave-btn').addEventListener('click', () => {
            document.getElementById('next-wave-btn').style.display = 'none';
            this.game.startNextWave();
        });

        document.getElementById('btn-shovel').addEventListener('click', () => {
            this.game.setSelectedPlant('shovel');
            document.querySelectorAll('.game-plant-btn').forEach(b => b.classList.remove('selected'));
            document.getElementById('btn-shovel').classList.add('selected');
        });

        document.getElementById('btn-return-menu').addEventListener('click', () => {
            this.stopGame();
            this.showScreen('main-menu');
        });

        this.showScreen('main-menu');
    }

    showScreen(name) {
        // Hide all
        Object.values(this.screens).forEach(el => el.classList.add('hidden'));
        if (name === 'main-menu') {
            this.screens.menu.classList.remove('hidden');
        } else if (name === 'stage') {
            this.screens.stage.classList.remove('hidden');
        } else if (name === 'deck') {
            this.screens.deck.classList.remove('hidden');
        } else if (name === 'tech') {
            this.screens.tech.classList.remove('hidden');
        } else if (name === 'gacha') {
            this.screens.gacha.classList.remove('hidden');
        } else if (name === 'game') {
            this.screens.game.classList.remove('hidden');
        }
    }

    // --- Gameplay ---
    startGame(levelId) {
        const levelConfig = window.LEVEL_DATA.find(l => l.id === levelId);
        if (!levelConfig) return;

        this.showScreen('game');
        document.getElementById('game-over-modal').classList.add('hidden');

        // Cleanup old game if exists
        if (this.game) {
            this.game.stop();
        }

        // Initialize Game
        // Filter out nulls from deck
        const activeDeck = window.playerState.deck.filter(id => id !== null);
        this.game = new window.Game(this.canvas, levelConfig, activeDeck);

        this.game.onWaveComplete = (waveNum) => {
            this.updateGameUI();
        };

        this.game.onTimeUpdate = () => {
            this.updateGameUI();
        };

        this.game.onGameOver = (isVictory) => {
            const modal = document.getElementById('game-over-modal');
            const title = document.getElementById('game-over-title');

            modal.classList.remove('hidden');
            if (isVictory) {
                title.textContent = "勝利！";
                title.style.color = "#76c7c0";
                window.playerState.unlockStage(levelConfig.id + 1);
                window.playerState.addGems(levelConfig.reward);
            } else {
                title.textContent = "敗北...";
                title.style.color = "#ff6b6b";
            }
        };

        this.renderGamePlantButtons(activeDeck);

        // Start loop
        // Start loop
        this.game.start();
        this.updateGameUI();
    }

    stopGame() {
        if (this.game) {
            this.game.stop();
            this.game = null;
        }
        this.ctx = this.canvas.getContext('2d');
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateGameUI() {
        const btn = document.getElementById('next-wave-btn');
        if (this.game && !this.game.waveInProgress && this.game.currentWaveIndex < this.game.waves.length) {
            btn.style.display = 'block';
            btn.textContent = `ウェーブ ${this.game.currentWaveIndex + 1} を開始`;
        } else {
            btn.style.display = 'none';
        }

        // Update Mana
        if (this.game) {
            const manaDisplay = document.getElementById('mana-display');
            if (manaDisplay) manaDisplay.textContent = Math.floor(this.game.mana);

            // Plant Count
            let currentPlants = 0;
            if (this.game.grid) {
                for (let r = 0; r < this.game.grid.rows; r++) {
                    for (let c = 0; c < this.game.grid.cols; c++) {
                        if (this.game.grid.tiles[r][c].plant) currentPlants++;
                    }
                }
            }
            const plantDisplay = document.getElementById('plant-count');
            if (plantDisplay) plantDisplay.textContent = `${currentPlants}/${this.game.maxPlants}`;

            // Update Cooldowns on buttons
            const plantButtons = document.querySelectorAll('.game-plant-btn');
            plantButtons.forEach(btn => {
                const id = btn.dataset.plantId;
                const cd = this.game.plantCooldowns[id] || 0;

                // Get or create overlay
                let overlay = btn.querySelector('.cooldown-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.className = 'cooldown-overlay';
                    overlay.style.display = 'none';
                    btn.appendChild(overlay);
                }

                if (cd > 0) {
                    overlay.style.display = 'flex';
                    overlay.textContent = (cd / 1000).toFixed(1);
                    btn.classList.add('cooldown-active');
                } else {
                    overlay.style.display = 'none';
                    btn.classList.remove('cooldown-active');
                }

                // Selection Highlight
                if (this.game.selectedPlantType === id) {
                    btn.classList.add('selected');
                    btn.style.borderColor = "#FFD700";
                    btn.style.transform = "scale(1.1)";
                } else {
                    btn.classList.remove('selected');
                    btn.style.borderColor = "#555";
                    btn.style.transform = "scale(1)";
                }
            });
        }
    }

    renderGamePlantButtons(deckIds) {
        const container = document.getElementById('plant-bar');
        container.innerHTML = '';

        deckIds.forEach(id => {
            const plant = window.PLANT_DATA[id];
            const btn = document.createElement('div');
            btn.className = 'game-plant-btn';
            btn.dataset.plantId = id;
            btn.innerHTML = `
                <div class="icon" style="background:${plant.color}; width:20px; height:20px; border-radius:50%; margin-bottom:5px;"></div>
                <span>${plant.name.split(' ')[0]}</span>
                <span style="color:var(--accent-color)">${plant.cost}</span>
            `;
            btn.onclick = () => {
                document.querySelectorAll('.game-plant-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.game.setSelectedPlant(id);
                document.getElementById('btn-shovel').classList.remove('selected');
            };
            container.appendChild(btn);
        });
        // Select first by default
        if (container.firstChild) container.firstChild.click();
    }


    // --- Stage Select ---
    renderStageList() {
        const list = document.getElementById('stage-list');
        list.innerHTML = '';

        window.LEVEL_DATA.forEach(level => {
            const el = document.createElement('div');
            el.className = 'stage-card';

            // Dynamic accent style based on level background or default
            // Use level.background for a subtle border or glow
            el.style.borderLeft = `5px solid ${level.background || '#444'}`;

            const isLocked = level.id > window.playerState.maxStage;
            if (isLocked) el.classList.add('locked');

            el.innerHTML = `
                <div class="stage-number">${level.id}</div>
                <div class="stage-info">
                    <div class="stage-header">
                        <h3>${level.name}</h3>
                        <span class="stage-reward">💎 ${level.reward}</span>
                    </div>
                    <div class="stage-details">
                        <span>🌊 Waves: ${level.waves.length}</span>
                        <span>💀 Enemies: ${this.getEnemyTypes(level)}</span>
                    </div>
                </div>
                <div class="stage-action">
                    <button class="menu-btn play-btn" ${isLocked ? 'disabled' : ''}>
                        ${isLocked ? '🔒 Locked' : '▶ Play'}
                    </button>
                </div>
            `;

            if (!isLocked) {
                el.querySelector('.play-btn').onclick = () => {
                    this.startGame(level.id);
                };
                el.onclick = (e) => {
                    // Also trigger if card clicked, but not if button was clicked (avoid double trigger if bubbling? actually replacing button click logic is safer)
                    if (e.target.tagName !== 'BUTTON') this.startGame(level.id);
                };
            }

            list.appendChild(el);
        });
    }

    getEnemyTypes(level) {
        const types = new Set();
        level.waves.forEach(w => {
            if (w.type === 'mix') { types.add('Mix'); }
            else types.add(w.type.charAt(0).toUpperCase() + w.type.slice(1));
        });
        return Array.from(types).join(', ');
    }

    // --- Deck Builder ---
    renderDeckBuilder() {
        const deckContainer = document.getElementById('current-deck');
        const inventoryContainer = document.getElementById('inventory-list');

        deckContainer.innerHTML = '';
        inventoryContainer.innerHTML = '';

        // Render Deck Slots
        window.playerState.deck.forEach((plantId, index) => {
            const slot = document.createElement('div');
            slot.className = 'plant-card';
            if (!plantId) {
                slot.textContent = '空き';
                slot.style.border = '1px dashed #555';
            } else {
                const plant = window.PLANT_DATA[plantId];
                const level = window.playerState.getPlantLevel(plantId);

                slot.innerHTML = `
                    <div class="icon" style="background: ${plant.color}"></div>
                    <div class="name">${plant.name} <span style="font-size:0.8em; color:yellow;">Lv.${level}</span></div>
                    <div class="stats">
                        ⚔️ ${Math.floor(plant.damage * (1 + (level - 1) * 0.2))} | 🏹 ${plant.range} | ⚡ ${plant.cooldown}
                    </div>
                `;
                slot.onclick = () => {
                    // Remove from deck
                    window.playerState.setDeck(index, null);
                    this.renderDeckBuilder();
                };
            }
            deckContainer.appendChild(slot);
        });

        // Render Inventory
        const deckSet = new Set(window.playerState.deck.filter(x => x));

        Object.keys(window.playerState.inventory).sort().forEach(plantId => {
            if (deckSet.has(plantId)) return; // Don't show if equipped

            const plant = window.PLANT_DATA[plantId];
            const level = window.playerState.getPlantLevel(plantId);
            const card = document.createElement('div');
            card.className = 'plant-card';

            card.innerHTML = `
                <div class="icon" style="background: ${plant.color}"></div>
                <div class="name">${plant.name} <span style="font-size:0.8em; color:yellow;">Lv.${level}</span></div>
                <div class="stats">
                    ⚔️ ${Math.floor(plant.damage * (1 + (level - 1) * 0.2))} | 🏹 ${plant.range} | ⚡ ${plant.cooldown}
                </div>
            `;

            card.onclick = () => {
                // Add to first empty slot
                const emptyIndex = window.playerState.deck.indexOf(null);
                if (emptyIndex !== -1) {
                    window.playerState.setDeck(emptyIndex, plantId);
                    this.renderDeckBuilder();
                } else {
                    alert("デッキがいっぱいです！先にカードを外してください。");
                }
            };

            inventoryContainer.appendChild(card);
        });
    }

    // --- Tech Tree ---
    renderTechTree() {
        const container = document.getElementById('tech-list');
        container.innerHTML = '';

        const gemDisplay = document.getElementById('tech-gems');
        if (gemDisplay) gemDisplay.textContent = window.playerState.gems;

        // --- Global Technologies ---
        const globalTechs = ['board_expansion', 'global_speed', 'max_plants'];

        const globalHeader = document.createElement('h3');
        globalHeader.textContent = "🌍 全体アップグレード";
        globalHeader.style.color = "#76c7c0";
        globalHeader.style.marginTop = "0";
        container.appendChild(globalHeader);

        globalTechs.forEach(techId => {
            const level = window.playerState.technologies[techId] || 0;
            const data = window.playerState.getTechData(techId);
            const cost = window.playerState.getTechCost(techId);
            const canAfford = window.playerState.gems >= cost && level < data.maxLevel;
            const isMax = level >= data.maxLevel;

            const el = document.createElement('div');
            el.className = 'tech-card';
            el.style.display = 'flex';
            el.style.justifyContent = 'space-between';
            el.style.alignItems = 'center';
            el.style.padding = '10px';
            el.style.marginBottom = '8px';
            el.style.backgroundColor = '#2c3e50';
            el.style.border = '1px solid #76c7c0';
            el.style.borderRadius = '5px';

            el.innerHTML = `
                <div>
                    <div style="font-weight:bold;">${data.name} <span style="color:#f1c40f;">Lv.${level}</span></div>
                    <div style="font-size:0.8rem; color:#aaa;">${data.desc}</div>
                </div>
                <button class="menu-btn upgrade-btn" style="padding:5px 10px; font-size:0.8rem; background:${canAfford ? '#27ae60' : (isMax ? '#34495e' : '#7f8c8d')};" ${canAfford ? '' : 'disabled'}>
                    ${isMax ? 'MAX' : `強化 (${cost}💎)`}
                </button>
            `;

            if (canAfford && !isMax) {
                el.querySelector('.upgrade-btn').onclick = () => {
                    const success = window.playerState.upgradeTech(techId);
                    if (success) {
                        this.renderTechTree();
                    }
                };
            }
            container.appendChild(el);
        });

        // --- Plant Upgrades ---
        const plantHeader = document.createElement('h3');
        plantHeader.textContent = "🌱 植物強化";
        plantHeader.style.color = "#76c7c0";
        container.appendChild(plantHeader);

        Object.keys(window.playerState.inventory).sort().forEach(plantId => {
            const plant = window.PLANT_DATA[plantId];
            if (!plant) return;
            const level = window.playerState.getPlantLevel(plantId);
            const cost = window.playerState.getUpgradeCost(plantId);
            const canAfford = window.playerState.gems >= cost;

            const el = document.createElement('div');
            el.className = 'tech-card';
            el.style.display = 'flex';
            el.style.justifyContent = 'space-between';
            el.style.alignItems = 'center';
            el.style.padding = '10px';
            el.style.marginBottom = '8px';
            el.style.backgroundColor = '#2c3e50';
            el.style.border = '1px solid #455a64';
            el.style.borderRadius = '5px';

            el.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <div style="width:30px; height:30px; background:${plant.color}; border-radius:50%; margin-right:10px;"></div>
                    <div>
                        <div style="font-weight:bold;">${plant.name} <span style="color:#f1c40f;">Lv.${level}</span></div>
                        <div style="font-size:0.8rem; color:#aaa;">Next: Lv.${level + 1} (Attack+20%, CD-5%)</div>
                    </div>
                </div>
                <button class="menu-btn upgrade-btn" style="padding:5px 10px; font-size:0.8rem; background:${canAfford ? '#27ae60' : '#7f8c8d'};" ${canAfford ? '' : 'disabled'}>
                    強化 (${cost}💎)
                </button>
            `;

            if (canAfford) {
                el.querySelector('.upgrade-btn').onclick = () => {
                    const success = window.playerState.upgradePlant(plantId);
                    if (success) {
                        this.renderTechTree();
                    }
                };
            }

            container.appendChild(el);
        });
    }

    // --- Gacha ---
    updateGachaUI() {
        document.getElementById('gem-count').textContent = window.playerState.gems;
    }

    handleGacha(count) {
        if (this.gachaAnimating) return;

        const result = count === 1 ? window.gachaSystem.pullSingle() : window.gachaSystem.pullMulti();

        if (!result.success) {
            alert(result.reason);
            return;
        }

        // Animation Start
        this.gachaAnimating = true;
        const pot = document.querySelector('.gacha-pot');
        pot.classList.add('shaking');

        // Disable buttons
        document.querySelectorAll('.gacha-btn').forEach(b => b.disabled = true);

        // Wait for shake
        setTimeout(() => {
            pot.classList.remove('shaking');
            this.showGachaResults(result);
            this.updateGachaUI();
            this.gachaAnimating = false;
            document.querySelectorAll('.gacha-btn').forEach(b => b.disabled = false);
        }, 1500);
    }

    showGachaResults(result) {
        const container = document.getElementById('gacha-results');
        container.innerHTML = '';
        container.classList.remove('hidden');

        // Close hint overlay
        const closeHint = document.createElement('div');
        closeHint.textContent = "Click anywhere to close";
        closeHint.style.position = 'absolute';
        closeHint.style.bottom = '20px';
        closeHint.style.width = '100%';
        closeHint.style.textAlign = 'center';
        closeHint.style.color = 'white';
        closeHint.style.opacity = '0.7';
        container.appendChild(closeHint);

        result.results.forEach((plant, i) => {
            const el = document.createElement('div');
            el.className = 'gacha-item-reveal';
            if (result.isNew[i]) el.classList.add('new');

            el.innerHTML = `
                <div style="width:50px; height:50px; border-radius:50%; background:${plant.color}; margin-bottom:10px; box-shadow:0 0 10px ${plant.color};"></div>
                <div style="font-weight:bold; font-size:0.9rem; text-align:center;">${plant.name}</div>
                <div style="font-size:0.8rem; color:#aaa; margin-top:5px;">${plant.rarity}</div>
                <div style="font-size:0.8rem; color:yellow;">Lv.${result.levels[i]}</div>
            `;

            // Stagger animation
            el.style.animationDelay = `${i * 0.2}s`;
            container.appendChild(el);
        });
    }
}

// Start App when scripts loaded
window.onload = () => {
    new App();
};
