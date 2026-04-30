const { Engine, Render, Runner, World, Bodies, Composite, Events, Vertices } = Matter;

let engine, render, world, heart, goal;
let currentLevel = 1;
const hypeMessages = ["You're amazing!", "Keep going, Tanisha!", "My star!", "So smart!", "I love that smile!"];
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
        options: { width: window.innerWidth, height: window.innerHeight, wireframes: false, background: 'transparent' }
    });
    Render.run(render);
    Runner.run(Runner.create(), engine);
    loadLevel(currentLevel);
    setupDrawing();
}

function createCup(x, y) {
    const wallThick = 10;
    const lWall = Bodies.rectangle(x - 45, y, wallThick, 80, { isStatic: true, render: { fillStyle: '#8B0000' } });
    const rWall = Bodies.rectangle(x + 45, y, wallThick, 80, { isStatic: true, render: { fillStyle: '#8B0000' } });
    const bottom = Bodies.rectangle(x, y + 35, 100, wallThick, { isStatic: true, render: { fillStyle: '#8B0000' }, label: 'goal' });
    return [lWall, rWall, bottom];
}

function loadLevel(lvl) {
    World.clear(world);
    document.getElementById('level-display').innerText = `Level ${lvl}`;
    document.getElementById('hype-text').innerText = hypeMessages[Math.floor(Math.random() * hypeMessages.length)];

    // Floor
    World.add(world, Bodies.rectangle(window.innerWidth/2, window.innerHeight+20, window.innerWidth, 60, { isStatic: true }));

    // Heart (The Ball)
    heart = Bodies.circle(100, 100, 20, { 
        restitution: 0.6, 
        render: { fillStyle: '#FF69B4' },
        label: 'heart' 
    });

    // Level Designs (Scaling Difficulty)
    let goalX = window.innerWidth - 100;
    let goalY = window.innerHeight - 100;

    if (lvl > 10) { // Add obstacles
        World.add(world, Bodies.rectangle(window.innerWidth/2, window.innerHeight/2, 200, 20, { isStatic: true, angle: 0.5 }));
    }
    if (lvl > 20) { // Moving goal (Logic placeholder)
        goalX = Math.random() * (window.innerWidth - 200) + 100;
    }

    goal = createCup(goalX, goalY);
    World.add(world, [heart, ...goal]);
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
        if (points.length === 0) return;
        const pos = getPos(e);
        points.push(pos);
    };

    const endDraw = () => {
        if (points.length < 2) return;
        
        // This creates the shape from the lines drawn
        const color = drawColors[Math.floor(Math.random() * drawColors.length)];
        const path = Vertices.fromPath(points.map(p => `${p.x} ${p.y}`).join(' '));
        const shape = Bodies.fromVertices(Matter.Vertices.centre(points).x, Matter.Vertices.centre(points).y, [path], {
            render: { fillStyle: color }
        }, true);

        if (shape) World.add(world, shape);
        points = [];
    };

    // Mobile & Desktop Listeners
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', moveDraw);
    canvas.addEventListener('touchend', endDraw);
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    canvas.addEventListener('mouseup', endDraw);
}

function getPos(e) {
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
}

// Win Detection
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        if (pair.bodyA.label === 'goal' && pair.bodyB.label === 'heart' || 
            pair.bodyB.label === 'goal' && pair.bodyA.label === 'heart') {
            if (currentLevel < 50) {
                currentLevel++;
                setTimeout(() => loadLevel(currentLevel), 500);
            } else {
                document.getElementById('game-ui').style.display = 'none';
                document.getElementById('love-letter').style.display = 'flex';
            }
        }
    });
});

function resetLevel() { loadLevel(currentLevel); }
