const { Engine, Render, Runner, World, Bodies, Composite, Vertices, Body, Events } = Matter;

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
    const wallThick = 15;
    const color = '#8B0000';
    // Deep Cup logic
    const lWall = Bodies.rectangle(x - 50, y, wallThick, 100, { isStatic: true, render: { fillStyle: color } });
    const rWall = Bodies.rectangle(x + 50, y, wallThick, 100, { isStatic: true, render: { fillStyle: color } });
    const bottom = Bodies.rectangle(x, y + 45, 115, wallThick, { isStatic: true, render: { fillStyle: color } });
    
    goalSensor = Bodies.rectangle(x, y + 10, 80, 50, { 
        isStatic: true, isSensor: true, render: { visible: false }, label: 'goal' 
    });
    return [lWall, rWall, bottom, goalSensor];
}

function loadLevel(lvl) {
    World.clear(world);
    gameStarted = false;
    const display = document.getElementById('level-display');
    display.innerText = `Level ${lvl}`;
    display.style.transform = "scale(1.2)"; // Simple animation
    setTimeout(() => display.style.transform = "scale(1)", 200);

    // Static Floor
    World.add(world, Bodies.rectangle(window.innerWidth/2, window.innerHeight+10, window.innerWidth, 40, { isStatic: true }));

    // Floating Heart
    heart = Bodies.circle(150, 200, 24, { 
        isStatic: true, restitution: 0.5, friction: 0.1, 
        render: { fillStyle: '#FF69B4' }, label: 'heart' 
    });

    // Level Difficulty Logic
    let goalX = window.innerWidth - 100;
    let goalY = window.innerHeight - 150;

    if (lvl > 2) World.add(world, Bodies.rectangle(window.innerWidth/2, 400, 200, 20, { isStatic: true, angle: 0.2 }));
    if (lvl > 5) goalX = window.innerWidth / 2;

    const cup = createCup(goalX, goalY);
    World.add(world, [heart, ...cup]);
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
            Body.setStatic(heart, false);
        }

        // CREATE ONE SOLID BODY INSTEAD OF PIECES
        const color = drawColors[Math.floor(Math.random() * drawColors.length)];
        
        // This is the magic part: it creates a solid "path" body
        const center = Vertices.centre(points);
        const shape = Bodies.fromVertices(center.x, center.y, [points], {
            render: { fillStyle: color, strokeStyle: '#000', lineWidth: 1 },
            friction: 0.5
        }, true);

        if (shape) {
            World.add(world, shape);
        } else {
            // Fallback for simple lines if complex shape fails
            const simpleLine = Bodies.rectangle(center.x, center.y, 100, 10, { render: { fillStyle: color }});
            World.add(world, simpleLine);
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

// WIN DETECTION
Events.on(engine, 'afterUpdate', () => {
    if (!heart || !goalSensor) return;
    const distance = Math.hypot(heart.position.x - goalSensor.position.x, heart.position.y - goalSensor.position.y);
    
    if (distance < 40) { // Heart is inside the cup!
        World.remove(world, heart);
        heart = null;
        document.getElementById('hype-text').innerText = "YES! I love you!! ❤️";
        
        setTimeout(() => {
            if (currentLevel < 50) {
                currentLevel++;
                loadLevel(currentLevel);
                document.getElementById('hype-text').innerText = "Catch my heart, Tanisha!";
            } else {
                document.getElementById('game-ui').style.display = 'none';
                document.getElementById('love-letter').style.display = 'flex';
            }
        }, 1000);
    }
});
