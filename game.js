const { Engine, Render, Runner, World, Bodies, Composite, Vertices, Body, Events } = Matter;

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
    const display = document.getElementById('level-display');
    display.innerText = `Level ${lvl}`;

    // 1. The Ground (Static)
    World.add(world, Bodies.rectangle(window.innerWidth/2, window.innerHeight+10, window.innerWidth, 40, { isStatic: true }));

    // 2. The Floating Heart (Pink Target)
    heart = Bodies.circle(150, 200, 24, { 
        isStatic: true, restitution: 0.6, friction: 0.1, 
        render: { fillStyle: '#FF69B4' }, label: 'heart' 
    });

    // 3. The Goal (A Rectangle on the ground)
    let goalX = window.innerWidth - 120;
    let goalWidth = 150;
    
    // Making it harder as levels progress
    if (lvl > 10) goalWidth = 80; // Smaller target
    if (lvl > 20) goalX = window.innerWidth / 2; // Center target

    goal = Bodies.rectangle(goalX, window.innerHeight - 30, goalWidth, 20, { 
        isStatic: true, 
        isSensor: true, // Let the heart pass "into" it to trigger the win
        render: { fillStyle: '#8B0000' }, // Dark Red
        label: 'goal' 
    });

    // 4. Obstacles for Difficulty
    if (lvl > 1) {
        const barrier = Bodies.rectangle(window.innerWidth/2, window.innerHeight/2 + 100, 200, 20, { 
            isStatic: true, angle: 0.3, render: { fillStyle: '#FFD700' } 
        });
        World.add(world, barrier);
    }

    World.add(world, [heart, goal]);
}

function setupDrawing() {
    let points = [];
    const canvas = document.querySelector('canvas');

    const startDraw = (e) => { points = [getPos(e)]; };

    const moveDraw = (e) => {
        const pos = getPos(e);
        const last = points[points.length-1];
        if (Math.hypot(pos.x - last.x, pos.y - last.y) > 10) points.push(pos);
    };

    const endDraw = () => {
        if (points.length < 3) return;

        if (!gameStarted) {
            gameStarted = true;
            Body.setStatic(heart, false); // Drop the heart!
        }

        const color = drawColors[Math.floor(Math.random() * drawColors.length)];
        const center = Vertices.centre(points);
        
        // Solid Shape Physics
        const shape = Bodies.fromVertices(center.x, center.y, [points], {
            render: { fillStyle: color },
            friction: 0.5,
            restitution: 0.2
        }, true);

        if (shape) World.add(world, shape);
        points = [];
    };

    // iPad & Mobile Touch Support
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

// WIN DETECTION
Events.on(engine, 'afterUpdate', () => {
    if (!heart || !goal) return;

    // Check if heart center is overlapping the goal rectangle
    const bounds = goal.bounds;
    if (heart.position.x > bounds.min.x && heart.position.x < bounds.max.x &&
        heart.position.y > (bounds.min.y - 20)) { // Give it a little "touch" buffer
        
        World.remove(world, heart);
        heart = null;
        document.getElementById('hype-text').innerText = "YES! Caught it! ❤️";
        
        setTimeout(() => {
            if (currentLevel < 50) {
                currentLevel++;
                loadLevel(currentLevel);
                document.getElementById('hype-text').innerText = "You're doing great, Tanisha!";
            } else {
                document.getElementById('game-ui').style.display = 'none';
                document.getElementById('love-letter').style.display = 'flex';
            }
        }, 1000);
    }
});

function resetLevel() { loadLevel(currentLevel); }
