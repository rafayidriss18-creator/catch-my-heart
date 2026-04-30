const { Engine, Render, Runner, World, Bodies, Composite, Events, MouseConstraint, Mouse, Vector } = Matter;

let engine, render, runner, world;
let currentLevel = 1;
let currentDrawing = [];
let heart, goal;

function initGame() {
    engine = Engine.create();
    world = engine.world;

    render = Render.create({
        element: document.getElementById('canvas-container'),
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: 'transparent'
        }
    });

    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);

    setupLevel(currentLevel);
    setupInteractions();
}

function setupLevel(lvl) {
    World.clear(world);
    
    // Walls
    const ground = Bodies.rectangle(window.innerWidth/2, window.innerHeight + 10, window.innerWidth, 60, { isStatic: true });
    World.add(world, ground);

    if (lvl === 1) {
        document.getElementById('level-title').innerText = "Level 1: Gravity";
        heart = Bodies.circle(200, 100, 20, { 
            render: { fillStyle: '#ff0000' }, 
            label: 'heart',
            restitution: 0.5 
        });
        goal = Bodies.rectangle(window.innerWidth - 200, window.innerHeight - 50, 100, 20, { 
            isStatic: true, render: { fillStyle: '#f0ad4e' }, label: 'goal' 
        });
    } 
    
    else if (lvl === 2) {
        document.getElementById('level-title').innerText = "Level 2: The Barrier";
        // A wall in the middle makes it "Hard"
        const barrier = Bodies.rectangle(window.innerWidth/2, window.innerHeight - 150, 20, 300, { isStatic: true });
        heart = Bodies.circle(100, 100, 20, { render: { fillStyle: '#ff0000' }, label: 'heart' });
        goal = Bodies.rectangle(window.innerWidth - 100, window.innerHeight - 50, 100, 20, { isStatic: true, label: 'goal' });
        World.add(world, barrier);
    }

    World.add(world, [heart, goal]);
}

function setupInteractions() {
    let isDrawing = false;
    let points = [];

    window.addEventListener('mousedown', (e) => { isDrawing = true; points = []; });
    window.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        points.push({ x: e.clientX, y: e.clientY });
    });

    window.addEventListener('mouseup', () => {
        if (!isDrawing || points.length < 2) return;
        isDrawing = false;

        // Convert drawing points into a physical body
        const center = Matter.Vertices.centre(points);
        const newShape = Bodies.fromVertices(center.x, center.y, [points], {
            render: { fillStyle: '#333', strokeStyle: '#000', lineWidth: 1 }
        });

        if (newShape) World.add(world, newShape);
    });

    // Win Logic Check
    Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach(pair => {
            if ((pair.bodyA.label === 'heart' && pair.bodyB.label === 'goal') ||
                (pair.bodyB.label === 'heart' && pair.bodyA.label === 'goal')) {
                alert("Heart Caught! Moving to next level...");
                currentLevel++;
                setupLevel(currentLevel);
            }
        });
    });
}

function resetLevel() { setupLevel(currentLevel); }

initGame();
