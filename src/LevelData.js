window.LEVEL_DATA = [
    {
        id: 1,
        name: "ステージ1: 始まり",
        background: "#2d4a3e",
        waves: [
            { count: 10, type: 'normal', interval: 1500 }, // Increased from 5
            { count: 5, type: 'fast', interval: 1200 }
        ],
        reward: 100
    },
    {
        id: 2,
        name: "ステージ2: 突撃",
        background: "#2b4538",
        waves: [
            { count: 15, type: 'fast', interval: 800 },
            { count: 10, type: 'normal', interval: 1000 }
        ],
        reward: 150
    },
    {
        id: 3,
        name: "ステージ3: 重戦車",
        background: "#283f33",
        waves: [
            { count: 8, type: 'tank', interval: 2500 },
            { count: 15, type: 'normal', interval: 1000 }
        ],
        reward: 200
    },
    {
        id: 4,
        name: "ステージ4: 混合部隊",
        background: "#263a2e",
        waves: [
            { count: 20, type: 'mix', interval: 1000 },
            { count: 10, type: 'tank', interval: 2000 }
        ],
        reward: 250
    },
    {
        id: 5,
        name: "ステージ5: ボス出現",
        background: "#233429",
        waves: [
            { count: 20, type: 'fast', interval: 600 },
            { count: 1, type: 'boss', interval: 5000 } // Boss spawn
        ],
        reward: 500
    },
    {
        id: 6,
        name: "ステージ6: 大群",
        background: "#2d4a3e",
        waves: [
            { count: 50, type: 'normal', interval: 400 } // Zerg rush harder
        ],
        reward: 300
    },
    {
        id: 7,
        name: "ステージ7: 機甲師団",
        background: "#2b4538",
        waves: [
            { count: 20, type: 'tank', interval: 1500 },
            { count: 3, type: 'boss', interval: 8000 }
        ],
        reward: 350
    },
    {
        id: 8,
        name: "ステージ8: 混沌",
        background: "#283f33",
        waves: [
            { count: 30, type: 'mix', interval: 700 },
            { count: 40, type: 'mix', interval: 500 }
        ],
        reward: 400
    },
    {
        id: 9,
        name: "ステージ9: 日没",
        background: "#1a2f23",
        waves: [
            { count: 20, type: 'fast', interval: 300 },
            { count: 15, type: 'tank', interval: 1500 },
            { count: 30, type: 'fast', interval: 300 }
        ],
        reward: 450
    },
    {
        id: 10,
        name: "ステージ10: 最終決戦",
        background: "#0f1c15",
        waves: [
            { count: 3, type: 'boss', interval: 6000 },
            { count: 50, type: 'mix', interval: 500 }
        ],
        reward: 1000
    },
    {
        id: 11,
        name: "ステージ11: 新たな脅威",
        background: "#2d4a3e",
        waves: [
            { count: 100, type: 'tiny', interval: 200 }, // TINY SWARM
            { count: 20, type: 'mix', interval: 800 }
        ],
        reward: 600
    },
    {
        id: 12,
        name: "ステージ12: 鉄壁の行進",
        background: "#2b4538",
        waves: [
            { count: 30, type: 'tank', interval: 1500 },
            { count: 50, type: 'tiny', interval: 300 } // Support swarm
        ],
        reward: 700
    },
    {
        id: 13,
        name: "ステージ13: 包囲網",
        background: "#283f33",
        waves: [
            { count: 100, type: 'tiny', interval: 150 },
            { count: 50, type: 'mix', interval: 400 },
            { count: 2, type: 'boss', interval: 8000 }
        ],
        reward: 800
    },
    {
        id: 14,
        name: "ステージ14: 百鬼夜行",
        background: "#1a2f23",
        waves: [
            { count: 5, type: 'boss', interval: 5000 },
            { count: 50, type: 'fast', interval: 300 }
        ],
        reward: 900
    },
    {
        id: 15,
        name: "ステージ15: 深淵",
        background: "#05100e",
        waves: [
            { count: 1, type: 'boss', interval: 1000 },
            { count: 200, type: 'tiny', interval: 100 }, // MASSIVE SWARM
            { count: 100, type: 'mix', interval: 250 },
            { count: 5, type: 'boss', interval: 4000 }
        ],
        reward: 2000
    }
];
