const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

let colors = ['#e74c3c', '#2ecc71', '#3498db'];
let colorNames = ['R', 'G', 'B'];
let player = { x: canvas.width / 4, y: canvas.height / 2, size: 40, colorIndex: 0, speed: 4 };
let obstacles = [];
let spawnTimer = 0;
let speed = 3;
let secret = 0;
let gameOver = false;
let paused = false;
let rows = colors.length;
let lastTime = performance.now();
let keys = {};
let topBottomTimer = 0;
const CAMP_LIMIT = 5000;

let lastColorSwitch = 0;
const COLOR_COOLDOWN = 250;
let deathTime = 0;
const DEATH_COOLDOWN = 2000;

const uiDiv = document.getElementById('colorUI');
const overlay = document.getElementById('overlay');
const cooldownFill = document.getElementById('cooldownFill');
const bgMusic = document.getElementById('bgMusic');
const lostSE = document.getElementById('lostSE');
bgMusic.volume = 0.5;

// Helper: get the transformed score (used in game and death overlay)
function getDisplayScore() {
    return Math.floor(secret * 1.13 + Math.sin(secret / 7) * 2);
}

function spawnObstacle() {
    const isHigh = Math.random() < 0.15;
    const width = 50;
    const height = isHigh ? canvas.height * 0.5 : 50;
    const x = canvas.width + width;
    const maxY = canvas.height - height - 100;
    const y = Math.random() * maxY;
    const colorIndex = Math.floor(Math.random() * rows);
    obstacles.push({ x, y, width, height, colorIndex, speedMult: 1, text: '' });
}

function spawnBossObstacle(text) {
    const height = 40;
    const y = Math.max(0, Math.min(canvas.height - 100 - height, player.y));
    obstacles.push({ x: canvas.width, y, width: canvas.width, height, color: '#9b59b6', speedMult: 1.5, text });
}

function resetGame() {
    obstacles = [];
    player.colorIndex = 0;
    player.y = canvas.height / 2;
    spawnTimer = 0;
    speed = 3;
    rows = 3;
    colors = ['#e74c3c', '#2ecc71', '#3498db'];
    colorNames = ['R', 'G', 'B'];
    secret = 0;
    gameOver = false;
    paused = false;
    overlay.style.display = 'none';
    lastTime = performance.now();
    topBottomTimer = 0;
    lastColorSwitch = 0;
    bgMusic.play().catch(() => {});
    updateUI();
}

function update(delta) {
    if (gameOver || paused) return;

    // Movement
    if (keys['W'] || keys['ArrowUp']) player.y -= player.speed;
    if (keys['S'] || keys['ArrowDown']) player.y += player.speed;
    player.y = Math.max(0, Math.min(canvas.height - 100 - player.size, player.y));

    // Color switching with A/D
    const now = performance.now();
    if ((keys['A'] || keys['ArrowLeft']) && now - lastColorSwitch > COLOR_COOLDOWN) {
        player.colorIndex = (player.colorIndex - 1 + rows) % rows;
        lastColorSwitch = now;
    }
    if ((keys['D'] || keys['ArrowRight']) && now - lastColorSwitch > COLOR_COOLDOWN) {
        player.colorIndex = (player.colorIndex + 1) % rows;
        lastColorSwitch = now;
    }

    // Anti-camping detection
    if (player.y <= 0 || player.y >= canvas.height - 100 - player.size) {
        topBottomTimer += delta;
        if (topBottomTimer > CAMP_LIMIT) {
            spawnBossObstacle("nice try noob");
            topBottomTimer = 0;
        }
    } else topBottomTimer = 0;

    // Obstacle spawn rate
    spawnTimer++;
    const spawnInterval = Math.max(15, 35 - Math.floor(secret / 20));
    if (spawnTimer > spawnInterval) {
        spawnObstacle();
        spawnTimer = 0;
    }

    // Score growth curve
    const growthBase = 1.6;
    const growthCap = 6;
    const growthRate = growthBase * (1 + Math.min(secret / 200, growthCap - 1));
    secret += (delta / 1000) * growthRate;

    // Obstacle updates
    obstacles = obstacles.filter(obs => {
        obs.x += (obs.speedMult || 1) * -speed;

        // Collision detection
        if (
            player.x < obs.x + obs.width &&
            player.x + player.size > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.size > obs.y
        ) {
            if (player.colorIndex !== obs.colorIndex) {
                gameOver = true;
                paused = false;
                deathTime = performance.now();
                overlay.innerText = `You died!\nYour score was ${getDisplayScore()}!\nPress any key to play again.`;
                overlay.style.display = 'flex';
                bgMusic.pause();
                lostSE.play();
            }
        }

        return obs.x + obs.width > 0;
    });

    // Unlock 4th color at 50
    if (secret >= 50 && rows === 3) {
        colors.push('#f1c40f');
        colorNames.push('Y');
        rows = 4;
    }

    // Unlock 5th color at 150
    if (secret >= 150 && rows === 4) {
        colors.push('#8e44ad');
        colorNames.push('P');
        rows = 5;
    }
}

function drawPlayer() {
    ctx.fillStyle = colors[player.colorIndex];
    ctx.beginPath();
    ctx.moveTo(player.x + player.size, player.y + player.size / 2);
    ctx.lineTo(player.x, player.y);
    ctx.lineTo(player.x, player.y + player.size);
    ctx.closePath();
    ctx.fill();
}

function drawBorders() {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.moveTo(0, canvas.height - 100);
    ctx.lineTo(canvas.width, canvas.height - 100);
    ctx.stroke();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBorders();
    drawPlayer();
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color || colors[obs.colorIndex];
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        if (obs.text) {
            ctx.fillStyle = '#fff';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(obs.text, obs.x + obs.width / 2, obs.y + obs.height / 1.5);
        }
    });
}

function gameLoop(now) {
    const delta = now - lastTime;
    lastTime = now;
    update(delta);
    draw();

    // Display transformed score
    document.getElementById('score').innerText = getDisplayScore() + (paused ? ' - Paused' : '');

    updateUI();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    keys[e.code.replace('Key', '')] = true;
    const now = performance.now();

    if (gameOver) {
        if (now - deathTime > DEATH_COOLDOWN) resetGame();
        return;
    }

    // Pause toggle
    if (e.code === 'Escape') {
        paused = !paused;
        if (paused) {
            overlay.innerText = "Game Paused\nPress any key to continue.";
            overlay.style.display = 'flex';
            bgMusic.pause();
        } else {
            overlay.style.display = 'none';
            bgMusic.play().catch(() => {});
        }
        return;
    } else if (paused) {
        paused = false;
        overlay.style.display = 'none';
        bgMusic.play().catch(() => {});
    }

    // Number keys for color selection with cooldown
    if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.replace('Digit', ''), 10);
        if (num >= 1 && num <= rows && now - lastColorSwitch > COLOR_COOLDOWN) {
            player.colorIndex = num - 1;
            lastColorSwitch = now;
        }
    }
});

document.addEventListener('keyup', e => {
    keys[e.code.replace('Key', '')] = false;
});

function updateUI() {
    uiDiv.innerHTML = '';
    colors.forEach((c, i) => {
        const block = document.createElement('div');
        block.className = 'colorBlock' + (i === player.colorIndex ? ' active' : '');
        block.style.backgroundColor = c;
        block.innerText = colorNames[i];
        uiDiv.appendChild(block);
    });

    const now = performance.now();
    const cd = Math.min((now - lastColorSwitch) / COLOR_COOLDOWN, 1);
    cooldownFill.style.width = (cd * 100) + '%';
}

window.addEventListener('resize', resizeCanvas);
setTimeout(() => { bgMusic.play().catch(() => {}); }, 200);
gameLoop(performance.now());
