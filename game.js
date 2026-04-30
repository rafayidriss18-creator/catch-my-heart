const { Engine, Render, Runner, World, Bodies, Composite, Constraint, Events, Body } = Matter;

let engine, render, world, heart, goalSensor;
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

function createCup(x, y) {
    const wallThick = 12;
    const color = '#8B0000';
    // Left, Right, and Bottom of the cup
    const lWall = Bodies.rectangle(x - 45, y, wallThick, 80, { isStatic: true, render: { fillStyle: color }, friction: 0.5 });
    const rWall = Bodies.rectangle(x + 45, y, wallThick, 80, { isStatic: true, render: { fillStyle: color }, friction: 0.5 });
    const bottom = Bodies.rectangle(x, y + 35, 100, wallThick, { isStatic: true, render: { fillStyle: color }, friction: 0.5 });
    
    goalSensor = Bodies.rectangle(x, y, 60, 40, { 
        isStatic: true, isSensor: true, render: { visible: false }, label: 'goal' 
    });

    return [lWall, rWall, bottom, goalSensor];
}

function loadLevel(lvl) {
    World.clear(world);
    gameStarted = false; 
    document.getElementById('level-display').innerText = `Level ${lvl}`;
    
    // Safety Net (Bottom of screen)
    World.add(world, Bodies.rectangle(window.innerWidth/2, window.innerHeight+30, window.innerWidth, 60, { isStatic: true }));

    // Floating Heart (Tanisha's Target)
    heart = Bodies.circle(100, 150, 22, { 
        isStatic: true, restitution: 0.4, friction: 0.2,
        render: { fillStyle: '#FF69B4' }, label: 'heart' 
    });

    // Level Designs - Dynamic Scaling
    let goalX = window.innerWidth - 100;
    let goalY = window.innerHeight - 150;

    // Harder Levels Logic
    if (lvl > 5) { // Add an obstacle in the middle
        const barrier = Bodies.rectangle(window.innerWidth/2, window.innerHeight - 150, 20, 250, { 
            isStatic: true, render: { fillStyle: '#555' } 
        });
        World.add(world, barrier);
    }
    if (lvl > 15) { // Narrow the cup for Level 15+
        goalX = window.innerWidth / 2;
    }

    const cupParts = createCup(goalX, goalY);
    World.add(world, [heart, ...cupParts]);
}

function setupDrawing() {
    let points = [];
    const canvas = document.querySelector('canvas');

    const startDraw = (e) => { points = []; points.push(getPos(e)); };

    const moveDraw = (e) => {
        const pos = getPos(e);
        if (points.length > 0) {
            const last = points[points.length - 1];
            if (Math.hypot(pos.x - last.x, pos.y - last.y) < 8) return; 
        }
        points.push(pos);
    };

    const endDraw = () => {
        if (points.length < 3) return;

        if (!gameStarted) {
            gameStarted = true;
            Body.setStatic(heart, false); // Gravity starts now!
        }

        const color = drawColors[Math.floor(Math.random() * drawColors.length)];
        let lastSegment = null;

        // CREATE "WELDED" CURVE
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            const segment = Bodies.rectangle(mid.x, mid.y, dist + 2, 10, {
                angle: angle,
                render: { fillStyle: color },
                friction: 0.6,
                density: 0.01 // Make it heavy enough to move the heart
            });

            World.add(world, segment);

            // Weld this segment to the previous one so they don't collapse
            if (lastSegment) {
                const glue = Constraint.create({
                    bodyA: lastSegment,
                    bodyB: segment,
                    pointA: { x: (dist/2) * Math.cos(angle), y: (dist/2) * Math.sin(angle) },
                    pointB: { x: -(dist/2) * Math.cos(angle), y: -(dist/2) * Math.sin(angle) },
                    stiffness: 1,
                    length: 0,
                    render: { visible: false }
                });
                World.add(world, glue);
            }
            lastSegment = segment;
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
    return { x: t.clientX, y: t.clientY };
}

// WIN LOGIC: Improved detection
Events.on(engine, 'afterUpdate', () => {
    if (!heart || !goalSensor) return;
    const bounds = goalSensor.bounds;
    if (heart.position.x > bounds.min.x && heart.position.x < bounds.max.x &&
        heart.position.y > bounds.min.y && heart.position.y < bounds.max.y) {
        
        // Remove heart briefly so it doesn't trigger win 100 times
        World.remove(world, heart);
        heart = null;

        setTimeout(() => {
            if (currentLevel < 50) {
                currentLevel++;
                loadLevel(currentLevel);
            } else {
                document.getElementById('game-ui').style.display = 'none';
                document.getElementById('love-letter').style.display = 'flex';
            }
        }, 500);
    }
});

function resetLevel() { loadLevel(currentLevel); }
