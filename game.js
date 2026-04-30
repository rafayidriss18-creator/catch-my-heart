const { Engine, Render, Runner, World, Bodies, Body, Constraint, Events, Vector } = Matter;

let engine, render, runner, world, heart, goal;
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
    runner = Runner.create();
    Runner.run(runner, engine);
    
    loadLevel(currentLevel);
    setupDrawing();
    setupWinDetection();
}

function loadLevel(lvl) {
    World.clear(world);
    gameStarted = false;
    document.getElementById('level-display').innerText = `Level ${lvl}`;
    document.getElementById('hype-text').innerText = "Catch my heart, Tanisha!";

    // Solid Ground
    World.add(world, Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 20, window.innerWidth, 60, { isStatic: true }));

    // Heart
    heart = Bodies.circle(150, 150, 22, { 
        isStatic: true, restitution: 0.4, 
        render: { fillStyle: '#FF69B4' }, label: 'heart' 
    });

    // Goal
    let goalX = window.innerWidth - 150;
    if (lvl > 5) goalX = window.innerWidth / 2;
    goal = Bodies.rectangle(goalX, window.innerHeight - 40, 140, 40, { isStatic: true, render: { fillStyle: '#8B0000' }, label: 'goal' });

    World.add(world, [heart, goal]);
}

function setupDrawing() {
    let points = [];
    const canvas = document.querySelector('canvas');

    const startDraw = (e) => { points = [getPos(e)]; };

    const moveDraw = (e) => {
        const pos = getPos(e);
        const last = points[points.length - 1];
        if (Vector.magnitude(Vector.sub(pos, last)) > 12) { points.push(pos); }
    };

    const endDraw = () => {
        if (points.length < 2) return;

        if (!gameStarted) {
            gameStarted = true;
            if (heart) Body.setStatic(heart, false);
        }

        const color = drawColors[Math.floor(Math.random() * drawColors.length)];
        let lastSegment = null;

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const dist = Vector.magnitude(Vector.sub(p2, p1));
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            const segment = Bodies.rectangle(
                (p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 
                dist + 10, 15, {
                    angle: angle,
                    render: { fillStyle: color },
                    friction: 0.5,
                    density: 0.005 // Giving it some weight
                }
            );

            World.add(world, segment);

            // BOLT the segments together
            if (lastSegment) {
                const bolt = Constraint.create({
                    bodyA: lastSegment,
                    bodyB: segment,
                    pointA: { x: (dist / 2) * Math.cos(angle), y: (dist / 2) * Math.sin(angle) },
                    pointB: { x: -(dist / 2) * Math.cos(angle), y: -(dist / 2) * Math.sin(angle) },
                    stiffness: 1, // Max stiffness so it doesn't wobble
                    length: 0,
                    render: { visible: false }
                });
                World.add(world, bolt);
            }
            lastSegment = segment;
        }
        points = [];
    };

    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, {passive: false});
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); moveDraw(e); }, {passive: false});
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

function setupWinDetection() {
    Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach(pair => {
            const labels = [pair.bodyA.label, pair.bodyB.label];
            if (labels.includes('heart') && labels.includes('goal')) {
                if (!heart) return;
                World.remove(world, heart);
                heart = null;
                document.getElementById('hype-text').innerText = "YES! I love you!! ❤️";
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
    });
}

function resetLevel() { loadLevel(currentLevel); }
