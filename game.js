const { Engine, Render, Runner, World, Bodies, Body, Composite, Events, Vector } = Matter;

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
            wireframes: false, background: 'transparent',
            pixelRatio: window.devicePixelRatio 
        }
    });

    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);
    
    loadLevel(currentLevel);
    setupDrawing();
}

function loadLevel(lvl) {
    World.clear(world);
    gameStarted = false;
    document.getElementById('level-display').innerText = `Level ${lvl}`;

    // 1. Solid Ground
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 10, window.innerWidth, 60, { 
        isStatic: true, render: { fillStyle: '#444' } 
    });

    // 2. Floating Heart (Pink Target)
    heart = Bodies.circle(150, 150, 22, { 
        isStatic: true, 
        restitution: 0.4, 
        friction: 0.2,
        render: { fillStyle: '#FF69B4' }, 
        label: 'heart' 
    });

    // 3. The Goal Rectangle
    let goalX = window.innerWidth - 150;
    if (lvl > 5) goalX = window.innerWidth / 2;

    goal = Bodies.rectangle(goalX, window.innerHeight - 30, 140, 40, { 
        isStatic: true, 
        render: { fillStyle: '#8B0000' }, 
        label: 'goal' 
    });

    // Level Obstacles
    if (lvl > 2) {
        World.add(world, Bodies.rectangle(window.innerWidth/2, window.innerHeight/2, 200, 20, { 
            isStatic: true, angle: Math.PI/6, render: { fillStyle: '#FFD700' } 
        }));
    }

    World.add(world, [ground, heart, goal]);
}

function setupDrawing() {
    let points = [];
    const canvas = document.querySelector('canvas');

    const startDraw = (e) => { 
        points = [getPos(e)]; 
    };

    const moveDraw = (e) => {
        const pos = getPos(e);
        const last = points[points.length - 1];
        if (Vector.magnitude(Vector.sub(pos, last)) > 10) {
            points.push(pos);
        }
    };

    const endDraw = () => {
        if (points.length < 2) return;

        if (!gameStarted) {
            gameStarted = true;
            Body.setStatic(heart, false); // Heart falls on first draw
        }

        const color = drawColors[Math.floor(Math.random() * drawColors.length)];
        let segments = [];

        // Create the stroke as a "Compound Body" - This makes it UNBREAKABLE
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const dist = Vector.magnitude(Vector.sub(p2, p1));
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            const segment = Bodies.rectangle(
                (p1.x + p2.x) / 2, 
                (p1.y + p2.y) / 2, 
                dist + 4, 12, {
                    angle: angle,
                    render: { fillStyle: color }
                }
            );
            segments.push(segment);
        }

        // Merge all segments into one single physical object
        const compoundBody = Body.create({
            parts: segments,
            friction: 0.5,
            restitution: 0.1
        });

        World.add(world, compoundBody);
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
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (labels.includes('heart') && labels.includes('goal')) {
            // Check if level has already changed to avoid double-triggering
            if (!heart) return; 

            World.remove(world, heart);
            heart = null;
            
            document.getElementById('hype-text').innerText = "Perfect Catch! ❤️";
            
            setTimeout(() => {
                if (currentLevel < 50) {
                    currentLevel++;
                    loadLevel(currentLevel);
                    document.getElementById('hype-text').innerText = "I love you, Tanisha!";
                } else {
                    document.getElementById('game-ui').style.display = 'none';
                    document.getElementById('love-letter').style.display = 'flex';
                }
            }, 800);
        }
    });
});
