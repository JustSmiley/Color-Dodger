const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 30,
    hp: 10,
    shieldDir: 'up', // up, down, left, right
    shieldWidth: 60,
    shieldHeight: 15
};

let arrows = [];
let currentLevel = 0;
let levels = [];
let arrowsToSpawn = 0;
let spawning = false;
let levelFinished = false;

// Load levels.json
fetch('levels.json')
    .then(res => res.json())
    .then(data => {
        levels = data;
        startLevel(currentLevel);
    });

// Shield control
document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp': player.shieldDir = 'up'; break;
        case 'ArrowDown': player.shieldDir = 'down'; break;
        case 'ArrowLeft': player.shieldDir = 'left'; break;
        case 'ArrowRight': player.shieldDir = 'right'; break;
    }
});

// Spawn a single arrow
function spawnArrow() {
    if (!spawning || arrowsToSpawn <= 0) return;

    const levelDirs = levels[currentLevel];
    const dir = levelDirs[Math.floor(Math.random() * levelDirs.length)];

    let speedMultiplier = 1 + (currentLevel / 10);
    let arrow = { dir, size: 15, speed: 5 * speedMultiplier };

    switch (dir) {
        case 'up': arrow.x = player.x; arrow.y = 0; arrow.vx = 0; arrow.vy = arrow.speed; break;
        case 'down': arrow.x = player.x; arrow.y = canvas.height; arrow.vx = 0; arrow.vy = -arrow.speed; break;
        case 'left': arrow.x = 0; arrow.y = player.y; arrow.vx = arrow.speed; arrow.vy = 0; break;
        case 'right': arrow.x = canvas.width; arrow.y = player.y; arrow.vx = -arrow.speed; arrow.vy = 0; break;
    }

    arrows.push(arrow);
    arrowsToSpawn--;
    if (arrowsToSpawn <= 0) spawning = false;
}

// Update arrows
function update() {
    arrows.forEach((a, i) => {
        a.x += a.vx;
        a.y += a.vy;

        const hit = Math.abs(a.x - player.x) < player.size && Math.abs(a.y - player.y) < player.size;
        if (hit) {
            if (a.dir !== player.shieldDir) {
                player.hp -= 1;
                console.log('Hit! HP:', player.hp);
            }
            arrows.splice(i, 1);
        }

        if (a.x < 0 || a.x > canvas.width || a.y < 0 || a.y > canvas.height) arrows.splice(i, 1);
    });

    // Check if level finished
    if (!spawning && arrows.length === 0 && !levelFinished) {
        levelFinished = true;
        displayLevelFinished();
        setTimeout(() => {
            currentLevel++;
            if (currentLevel >= levels.length) {
                alert("All levels finished! Game Over");
                currentLevel = 0;
            }
            startLevel(currentLevel);
        }, 2000); // 2 seconds delay before next level
    }
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    // Shield
    ctx.fillStyle = 'yellow';
    let sx = player.x, sy = player.y;
    const offset = player.size + player.shieldHeight / 2;
    let w = player.shieldWidth, h = player.shieldHeight;

    switch (player.shieldDir) {
        case 'up': sy -= offset; w = player.shieldWidth; h = player.shieldHeight; break;
        case 'down': sy += offset; w = player.shieldWidth; h = player.shieldHeight; break;
        case 'left': sx -= offset; w = player.shieldHeight; h = player.shieldWidth; break;
        case 'right': sx += offset; w = player.shieldHeight; h = player.shieldWidth; break;
    }
    ctx.fillRect(sx - w / 2, sy - h / 2, w, h);

    // Arrows
    ctx.fillStyle = 'red';
    arrows.forEach(a => {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // HP & Level
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('HP: ' + player.hp, 20, 30);
    ctx.fillText('Level: ' + (currentLevel + 1), 20, 60);
}

// Game loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

// Start a level
function startLevel(levelIndex) {
    if (levelIndex >= levels.length) return;
    arrows = [];
    levelFinished = false;
    spawning = true;
    arrowsToSpawn = 20 + levelIndex * 5; // number of arrows per level increases
    console.log(`Starting level ${levelIndex + 1}`);
}

// Display "Level Finished" text
function displayLevelFinished() {
    ctx.fillStyle = 'white';
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Level Finished!', canvas.width / 2, canvas.height / 2);
}

// Spawn arrows at intervals
setInterval(spawnArrow, 500); // spawn every 0.5 seconds
