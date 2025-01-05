const {
    Engine,
    Render,
    World,
    Body,
    Bodies,
    Mouse,
    MouseConstraint,
    Constraint,
    Events,
    Collision,
} = Matter;

// engine
const engine = Engine.create();
let balls = [];
let mode = 1;
let isDragging = false;
let startDragPos;
let cueBall;
let gameStarted = false;

function setup() {
  createCanvas(1200, 600);
  tableWidth = 800;
  tableHeight = 400;
  pocketZones = tableWidth / 72 * 1.5;
  addBoundaries();
  addCushions();
  addPockets();
  addCollisionEvents();
}

function draw() {
    background(220);
    Engine.update(engine); // Update the physics engine
    engine.gravity.y = 0;
    drawTable();
    drawBalls();
    if (!gameStarted) {
        previewCueBall();
    } else if (isDragging) {
        drawCue();
    }
}



function drawTable() {
    // Draw floor
    fill("#266809");
    rect(200, 100, tableWidth, tableHeight);

    // Draw table rails
    fill("#2E1503");
    //left
    rect(185, 100, 15, tableHeight);
    //top
    rect(200, 85, tableWidth, 15);
    //right
    rect(1000, 100, 15, tableHeight);
    //bottom
    rect(200, 500, tableWidth, 15);


    // Draw pocket edges
    fill("#f1d74a");
    // Top left corner
    rect(185, 85, 25, 25, 15, 0, 0, 0);
    // Top mid
    rect(588, 85, 24, 15);
    // Top right corner
    rect(990, 85, 25, 25, 0, 15, 0, 0);
    // Bottom left corner
    rect(185, 490, 25, 25, 0, 0, 0, 15);
    // Bottom mid
    rect(588, 500, 24, 15);
    // Bottom right corner
    rect(990, 490, 25, 25, 0, 0, 15, 0);

    // Draw pockets
    fill("#000000");
    //top left
    ellipse(205, 104, pocketZones);
    //top mid
    ellipse(600, 104, pocketZones);
    //top right
    ellipse(996, 104, pocketZones);
    //bottom left
    ellipse(205, 495, pocketZones);
    //bottom mid
    ellipse(600, 495, pocketZones);
    //bottom right
    ellipse(996, 495, pocketZones);

    // Draw placement semi-circle  
    fill(255);
    stroke(0);
    line(200 + tableWidth / 5, 100 + 15, 200 + tableWidth / 5, tableHeight + 100 - 15);
    noFill();
    arc(360, 300, 125, 125, 0.5 * Math.PI, 1.5 * Math.PI);
  
    // Declate cushbions for rendering
    const cushions = [
        Bodies.trapezoid(400, 105, tableHeight - pocketZones * 2 - 13, 10, -0.05, { isStatic: true, restitution: 0.9 }), // Top left 
        Bodies.trapezoid(800, 105, tableHeight - pocketZones * 2 - 10, 10, -0.05, { isStatic: true, restitution: 0.9 }), // Top right
        Bodies.trapezoid(205, 300, tableHeight - pocketZones * 2 + 9, 10, 0.05, { isStatic: true, angle: Math.PI / 2, restitution: 0.9 }), // Left
        Bodies.trapezoid(403, 495, tableHeight - pocketZones * 2 + 9, 10, 0.05, { isStatic: true, restitution: 0.9 }), // Bottom left
        Bodies.trapezoid(797, 495, tableHeight - pocketZones * 2 + 12, 10, 0.05, { isStatic: true, restitution: 0.9 }), // Bottom right
        Bodies.trapezoid(995, 300, tableHeight - pocketZones * 2 - 12, 10, -0.05, { isStatic: true, angle: Math.PI / 2, restitution: 0.9 }) // Right
    ];

    // Render cushions
    fill("#3BA30D");
    for (let i = 0; i < cushions.length; i++) {
        let vertices = cushions[i].vertices;
        beginShape();
        for (let j = 0; j < vertices.length; j++) {
            vertex(vertices[j].x, vertices[j].y);
        }
        endShape(CLOSE);
    }
}

// Create boundaries for the table
function addBoundaries() {
    const thickness = 15;
    const boundaries = [
        Bodies.rectangle(600, 100, tableWidth + thickness * 2, thickness, { isStatic: true, friction: 0.1 }), // Top
        Bodies.rectangle(600, 500, tableWidth + thickness * 2, thickness, { isStatic: true, friction: 0.1 }), // Bottom
        Bodies.rectangle(200, 300, thickness, tableHeight + thickness * 2, { isStatic: true, friction: 0.1 }), // Left
        Bodies.rectangle(1000, 300, thickness, tableHeight + thickness * 2, { isStatic: true, friction: 0.1 }) // Right
    ];
    World.add(engine.world, boundaries);
}

// Make cushion boundaries
function addCushions() {
    const cushions = [
        Bodies.trapezoid(400, 105, tableHeight - pocketZones * 2 - 13, 10, -0.05, { isStatic: true, restitution: 0.9, friction: 0.1 }), // Top left 
        Bodies.trapezoid(800, 105, tableHeight - pocketZones * 2 - 10, 10, -0.05, { isStatic: true, restitution: 0.9, friction: 0.1 }), // Top right
        Bodies.trapezoid(205, 300, tableHeight - pocketZones * 2 + 9, 10, 0.05, { isStatic: true, angle: Math.PI / 2, restitution: 0.9, friction: 0.1 }), // Left
        Bodies.trapezoid(403, 495, tableHeight - pocketZones * 2 + 9, 10, 0.05, { isStatic: true, restitution: 0.9, friction: 0.1 }), // Bottom left
        Bodies.trapezoid(797, 495, tableHeight - pocketZones * 2 + 12, 10, 0.05, { isStatic: true, restitution: 0.9, friction: 0.1 }), // Bottom right
        Bodies.trapezoid(995, 300, tableHeight - pocketZones * 2 - 12, 10, -0.05, { isStatic: true, angle: Math.PI / 2, restitution: 0.9, friction: 0.1 }) // Right
    ];

    // Add cushions to the world
    for (let i = 0; i < cushions.length; i++) {
        World.add(engine.world, cushions[i]);
    }
}

// Create table pockets
function addPockets() {
    pockets = [
        Bodies.circle(205, 104, pocketZones / 2, { isStatic: true, isSensor: true }), // Top left
        Bodies.circle(600, 104, pocketZones / 2, { isStatic: true, isSensor: true }), // Top mid
        Bodies.circle(996, 104, pocketZones / 2, { isStatic: true, isSensor: true }), // Top right
        Bodies.circle(205, 495, pocketZones / 2, { isStatic: true, isSensor: true }), // Bottom left
        Bodies.circle(600, 495, pocketZones / 2, { isStatic: true, isSensor: true }), // Bottom mid
        Bodies.circle(995, 495, pocketZones / 2, { isStatic: true, isSensor: true })  // Bottom right
    ];
    World.add(engine.world, pockets);
}



// Function to draw balls on the table
function drawBalls() {
    for (let ball of balls) {
        fill(ball.render.fillStyle || 'white');
        ellipse(ball.position.x, ball.position.y, 800 / 72, 800 / 72); // Example size, adjust as needed
    }
}

// Function to draw the cue line
function drawCue() {
    stroke(255, 0, 0);
    strokeWeight(2);
    line(startDragPos.x, startDragPos.y, mouseX, mouseY);
    noStroke();
}

// Function to make a preview of the ball before placing it down
function previewCueBall() {
    fill("#FFFFFF"); // white for preview
    ellipse(mouseX, mouseY, 800 / 72, 800 / 72);
}

// Mouse click function
function mousePressed() {
    if (!gameStarted && balls.length > 0) {
        // Check if the mouse position to only allow placing cue ball inside the semi-circle
        let distanceFromCenter = dist(mouseX, mouseY, 360, 300);
        if (mouseX <= 360 && distanceFromCenter <= 62.5) { // 62.5 is half of the semi-circle's diameter (125 / 2)
            // Initialize and place the cue ball at the mouse position
            cueBall = Bodies.circle(mouseX, mouseY, 800 / 72 / 2, { restitution: 0.9, friction: 0.1, render: { fillStyle: '#FFFFFF' } });
            World.add(engine.world, cueBall);
            balls.push(cueBall);
            gameStarted = true;

        } 
    } else if (cueBall && dist(mouseX, mouseY, cueBall.position.x, cueBall.position.y) < 800 / 72) {
        // Checking if cue ball is still moving
        if (cueBall.speed < 0.1) { 
            isDragging = true;
            startDragPos = createVector(mouseX, mouseY);
        }
    }
}

// Release ball when mouse is released
function mouseReleased() {
    if (isDragging) {
        isDragging = false;
        let endDragPos = createVector(mouseX, mouseY);
        let force = p5.Vector.sub(startDragPos, endDragPos);
        Body.applyForce(cueBall, cueBall.position, { x: force.x * 0.00002, y: force.y * 0.00002 }); // Reduced force
    }
}

// Function to create and place balls for mode 1
function initializeBalls() {
    // Remove all existing balls from the world
    for (let ball of balls) {
        World.remove(engine.world, ball);
    }
    balls = [];
    const ballRadius = 800 / 72 / 2;
    const startX = 725;
    const startY = 300;
    let gap = 6;
    // Add reds in a pyramid shape facing the right
    for (var i = 0; i < 6; i++) {
      let ypos = startY - i * ballRadius;
      for (var j = 0; j < i; j++) {
        balls.push(Bodies.circle(startX + i * (ballRadius + gap), ypos + 2.5 * j * ballRadius, 800 / 72 / 2, { restitution: 0.9, friction: 0.1,render: { fillStyle: 'red' } }));
      }
    }
    // Add colored balls
    balls.push(Bodies.circle(360, 238, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'yellow' } }));
    balls.push(Bodies.circle(360, 362, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'green' } }));
    balls.push(Bodies.circle(360, 300, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'brown' } }));
    balls.push(Bodies.circle(610, 300, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'blue' } }));
    balls.push(Bodies.circle(715, 300, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'pink' } }));
    balls.push(Bodies.circle(900, 300, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'black' } }));

    for (let ball of balls) {
        World.add(engine.world, ball);
    }
}

// Function for selecting 3 modes
function keyPressed() {
    if (key === '1') {
        mode = 1;
        gameStarted = false;
        initializeBalls();
    } else if (key === '2') {
        mode = 2;
        gameStarted = false;
        randomizeBalls(false);
    } else if (key === '3') {
        mode = 3;
        gameStarted = false;
        randomizeBalls(true);
    }
}

// Placing balls randomly for mode 2 & 3
function randomizeBalls(includeColored) {
    // Remove all existing balls from the world before making new ones
    for (let ball of balls) {
        World.remove(engine.world, ball);
    }
    balls = [];
    const ballRadius = 800 / 72 / 2;
    const minDistance = ballRadius * 2; // Minimum distance between balls

    // Checking to see if spot is available
    function isPositionValid(x, y) {
        for (let ball of balls) {
            let distance = dist(x, y, ball.position.x, ball.position.y);
            if (distance < minDistance) {
                return false;
            }
        }
        return true;
    }

    // Random spot selector
    function getRandomPosition() {
        let x, y;
        do {
            x = random(225, 975);
            y = random(125, 475);
        } while (!isPositionValid(x, y));
        return { x, y };
    }

    // Add reds in random positions
    for (let i = 0; i < 10; i++) {
        let pos = getRandomPosition();
        balls.push(Bodies.circle(pos.x, pos.y, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'red' } }));
    }
    // Add colored balls in random positions for mode 3
    if (includeColored) {        
        const colors = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'];
        for (let color of colors) {
            let pos = getRandomPosition();
            balls.push(Bodies.circle(pos.x, pos.y, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: color } }));
        }
    } else {
        // Add colored balls in fixed positions for mode 2
        balls.push(Bodies.circle(360, 238, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'yellow' } }));
        balls.push(Bodies.circle(360, 362, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'green' } }));
        balls.push(Bodies.circle(360, 300, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'brown' } }));
        balls.push(Bodies.circle(610, 300, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'blue' } }));
        balls.push(Bodies.circle(700, 300, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'pink' } }));
        balls.push(Bodies.circle(900, 300, ballRadius, { restitution: 0.9, friction: 0.1, render: { fillStyle: 'black' } }));
    }

    // Add balls to the world
    for (let ball of balls) {
        World.add(engine.world, ball);
    }
}

function addCollisionEvents() {
    // Declare boolean for if a redBall has been potted
    let redBallPotted = false;
    // Storing positions of colored balls incase they need to be put back
      originalPositions = {
        'yellow': { x: 360, y: 238 },
        'green': { x: 360, y: 362 },
        'brown': { x: 360, y: 300 },
        'blue': { x: 610, y: 300 },
        'pink': { x: 700, y: 300 },
        'black': { x: 900, y: 300 }
    };
    Events.on(engine, 'collisionStart', function(event) {
        const pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            for (let pocket of pockets) {
                if (pair.bodyA === pocket || pair.bodyB === pocket) {
                    const ball = pair.bodyA === pocket ? pair.bodyB : pair.bodyA;
                    if (balls.includes(ball)) {
                        if (ball.render.fillStyle === 'red') {
                            // set redBallPotted to true to allow a colored ball to be potted
                            redBallPotted = true;
                            // Remove the red ball from table
                            World.remove(engine.world, ball);
                            balls = balls.filter(b => b !== ball);
                        } else if (ball !== cueBall && !redBallPotted) {
                            // Place the colored ball back to its original position
                            let color = ball.render.fillStyle;
                            let originalPosition = originalPositions[color];
                            Body.setPosition(ball, originalPosition);
                            Body.setVelocity(ball, { x: 0, y: 0 });
                            // Give player error message
                            console.log("Coloured Ball was potted before potting a red ball")
                        } else {
                            World.remove(engine.world, ball);
                            balls = balls.filter(b => b !== ball);
                            if (ball === cueBall) {
                                gameStarted = false; // Allow placing the cue ball again
                            }
                            if (ball.render.fillStyle !== 'red') {
                                // Reset cycle of red -> colored
                                redBallPotted = false;
                            }
                        }
                    }
                }
            }
        }
    });
}
