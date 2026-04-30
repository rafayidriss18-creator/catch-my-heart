const { Engine, Render, Runner, World, Bodies, Composite, Events, Vertices, Body } = Matter;

let engine, render, world, heart, goalSensor;
let currentLevel = 1;
let gameStarted = false; // Controls gravity
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
            width: window.innerWidth, 
            height: window.innerHeight, 
            wireframes: false, 
            background: 'transparent',
            pixelRatio: window.devicePixelRatio // Better resolution for iPad
        }
    });

    Render.run(render);
    Runner.run(Runner.create(), engine);
    loadLevel(currentLevel);
    setupDrawing();
}

function createCup(x, y) {
    const wallThick = 10;
    const color = '#8B0000';
    
    // The physical walls of the cup
    const lWall = Bodies.rectangle(x - 45, y, wallThick, 80, { isStatic: true, render: { fillStyle: color }, friction: 0.5 });
    const rWall = Bodies.rectangle(x + 45, y, wallThick, 80, { isStatic: true, render: { fillStyle: color }, friction: 0.5 });
    const bottom = Bodies.rectangle(x, y + 35, 100, wallThick, { isStatic: true, render: { fillStyle: color }, friction: 0.5 });
    
    // The "Sensor" - an invisible box inside the cup that detects the heart
    goalSensor = Bodies.rectangle(x, y, 70, 50, { 
        isStatic: true, 
        isSensor: true, // Important: objects pass through it but trigger events
        render: { visible: false },
        label: 'goal' 
    });

    return [lWall, rWall, bottom, goalSensor];
}

function loadLevel(lvl) {
    World.clear(world);
    gameStarted = false; // Reset gravity for new level
    document.getElementById('level-display').innerText = `Level ${lvl}`;
    
    // Floor
    World.add(world, Bodies.rectangle(window.innerWidth/2, window.innerHeight+20, window.innerWidth, 60, { isStatic: true }));

    // Heart (The Ball) - Starts STATIC (floating)
    heart = Bodies.circle(150, 150, 22, { 
        restitution: 0.5, 
        friction: 0.1,
        isStatic: true, 
        render: { fillStyle: '#FF69B4' },
        label: 'heart' 
    });

    // Level Designs
    let goalPos = { x: window.innerWidth - 120, y: window.innerHeight - 150 };
    
    if(lvl > 1) { // Example obstacle for harder levels
        const obstacle = Bodies.rectangle(window.innerWidth/2, window.innerHeight - 100, 30, 200, { isStatic: true, render: {fillStyle: '#555'}});
        World.add(world, obstacle);
    }

    const cupParts = createCup(goalPos.x, goalPos.y);
    World.add(world, [heart, ...cupParts]);
}

function setupDrawing() {
    let points = [];
    const canvas = document.querySelector('canvas');

    const startDraw = (e) => {
        points = [];
        const pos = getPos(e);
        points.push(pos);
    };

    const moveDraw = (e) => {
        const pos = getPos(e);
        // Only add point if it's far enough from the last one (creates smoother curves)
        if (points.length > 0) {
            const lastPoint = points[points.length - 1];
            const dist = Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y);
            if (dist < 5) return; 
        }
        points.push(pos);
    };

    const endDraw = () => {
        if (points.length < 5) return; // Ignore tiny taps

        // 1. Release the heart once she draws her first object
        if (!gameStarted) {
            gameStarted = true;
            Body.setStatic(heart, false);
        }

        const color = drawColors[Math.floor(Math.random() * drawColors.length)];
        
        // 2. Physics for Curved Lines
        // We create a series of small rectangles along the path to simulate a curve
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            const segment = Bodies.rectangle(mid.x, mid.y, dist + 2, 8, {
                angle: angle,
                render: { fillStyle: color, strokeStyle: color, lineWidth: 1 },
                friction: 0.5,
                restitution: 0.2
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
    const rect = document.querySelector('canvas').getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

// WIN DETECTION: Check if heart is inside the sensor
Events.on(engine, 'afterUpdate', () => {
    if (!heart || !goalSensor) return;

    // Standard AABB check to see if the heart is overlapping the sensor inside the cup
    const bounds = goalSensor.bounds;
    if (heart.position.x > bounds.min.x && heart.position.x < bounds.max.x &&
        heart.position.y > bounds.min.y && heart.position.y < bounds.max.y) {
        
        // Wait 1 second to ensure it STAYS in the cup before winning
        setTimeout(() => {
            if (currentLevel < 50) {
                currentLevel++;
                loadLevel(currentLevel);
            } else {
                document.getElementById('game-ui').style.display = 'none';
                document.getElementById('love-letter').style.display = 'flex';
            }
        }, 800);
    }
});

function resetLevel() { loadLevel(currentLevel); }
