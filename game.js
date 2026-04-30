const { Engine, Render, Runner, World, Bodies, Composite, Body, Events, Vector } = Matter;

let engine, render, world, heart, goal;
let currentLevel = 1;
let gameStarted = false;
const drawColors = ["#FFB6C1", "#FFD700", "#FF69B4", "#8B0000"];

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    init();
}

function init() {
    engine = Engine.create();
    world = engine.world;
    render = Render.create({
        element: document.getElementById('canvas-container'),
        engine: engine,
        options: { 
            width: window.innerWidth, height: window.innerHeight, 
            wireframes: false, background: 'transparent' 
        }
    });
    Render.run(render);
    Runner.run(Runner.create(), engine);
    loadLevel(currentLevel);
    setupDrawing();
}

function loadLevel(lvl) {
    World.clear(world);
    gameStarted = false;
    document.getElementById('level-display').innerText = `Level ${lvl}`;

    // 1. The Ground
    const ground = Bodies.rectangle(window.innerWidth/2, window.innerHeight - 10, window.innerWidth, 20, { 
        isStatic: true, render: { fillStyle: '#555' } 
    });

    // 2. The Heart (Target) - Floating
    heart = Bodies.circle(150, 200, 22, { 
        isStatic: true, restitution: 0.5, friction: 0.1, 
        render: { fillStyle: '#FF69B4' }, label: 'heart' 
    });

    // 3. The Goal (Physical Rectangle)
    let goalX = window.innerWidth - 150;
    let goalWidth = 120;
    
    // Scale Difficulty
    if (lvl > 5) goalWidth = 80;
    if (lvl > 10) goalX = window.innerWidth / 2;

    goal = Bodies.rectangle(goalX, window.innerHeight - 25, goalWidth, 30, { 
        isStatic: true, 
        render: { fillStyle: '#8B0000' }, 
        label: 'goal' 
    });

    // 4. Harder Levels - Add Barriers
    if (lvl > 2) {
        const wall = Bodies.rectangle(window.innerWidth/2, window.innerHeight - 150, 20, 200, { 
            isStatic: true, render: { fillStyle: '#FFD700' } 
        });
        World.add(world, wall);
    }

    World.add(world, [ground, heart, goal]);
}

function setupDrawing() {
    let points = [];
    const canvas = document.querySelector('canvas');

    const startDraw = (e) => { points = [getPos(e)]; };

    const moveDraw = (e) => {
        const pos = getPos(e);
        const last = points[points.length-1];
        if (Vector.magnitude(Vector.sub(pos, last)) > 10) points.push(pos);
    };

    const endDraw = () => {
        if (points.length < 2) return;

        if (!gameStarted) {
            gameStarted = true;
            Body.setStatic(heart, false);
        }

        const color = drawColors[Math.floor(Math.random() * drawColors.length)];
        
        // Create solid segments that are physically connected
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            const dist = Vector.magnitude(Vector.sub(p2, p1));
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            
            const segment = Bodies.rectangle(
                (p1.x + p2.x) / 2, 
                (p1.y + p2.y) / 2, 
                dist + 5, 12, {
                angle: angle,
                render: { fillStyle: color },
                friction: 0.5,
                restitution: 0.1
            });
            World.add(world, segment);
        }
        points = [];
    };

    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); moveDraw(e); });
    canvas.addEventListener('touchend', endDraw);
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
}

function getPos(e) {
    const t = e.touches ? e.touches[0] : e;
    const rect = document.querySelector('canvas').getBoundingClientRect();
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

// COLLISION DETECTION (The Win Logic)
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (labels.includes('heart') && labels.includes('goal')) {
            // Success! 
            document.getElementById('hype-text').innerText = "YES! I love you!! ❤️";
            
            // Short delay to let her see the heart land
            setTimeout(() => {
                if (currentLevel < 50) {
                    currentLevel++;
                    loadLevel(currentLevel);
                    document.getElementById('hype-text').innerText = "Catch my heart, Tanisha!";
                } else {
                    document.getElementById('game-ui').style.display = 'none';
                    document.getElementById('love-letter').style.display = 'flex';
                }
            }, 800);
        }
    });
});

function resetLevel() { loadLevel(currentLevel); }
