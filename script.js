const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");

// --- OYUN AYARLARI ---
let lives = 3;
let level = 1;
let gameState = "PLAYING";

const paddleHeight = 15;
let paddleWidth = 150; // Başlangıç genişliği
let paddleX = (canvas.width - paddleWidth) / 2;

let balls = [];
let currentBallSpeed = 5; // Başlangıç hızı

function resetBall() {
    balls = [{
        x: canvas.width / 2,
        y: canvas.height - 50,
        dx: currentBallSpeed * 0.7,
        dy: -currentBallSpeed * 0.7,
        radius: 8,
        speed: currentBallSpeed
    }];
}

const brickRowCount = 8;
const brickColumnCount = 10;
const brickWidth = 80;
const brickHeight = 25;
const brickPadding = 15;
const brickOffsetTop = 60;
const totalBricksWidth = (brickColumnCount * brickWidth) + ((brickColumnCount - 1) * brickPadding);
const brickOffsetLeft = (canvas.width - totalBricksWidth) / 2;

const rowColors = ["#FF3E3E", "#FF853E", "#FFD93E", "#3EFF4B", "#3E9CFF", "#9B3EFF", "#FF3EB1", "#E0E0E0"];

let bricks = [];
function initBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1,
                color: rowColors[r],
                hasPowerUp: Math.random() < 0.15
            };
        }
    }
}

let powerUps = [];

// Başlangıç kurulumu
resetBall();
initBricks();

// "Sağ tık ile menü açma" özelliği devre dışı
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    paddleX = relativeX - paddleWidth / 2;
    if (paddleX < 0) paddleX = 0;
    if (paddleX > canvas.width - paddleWidth) paddleX = canvas.width - paddleWidth;
});

function spawnPowerUp(x, y) {
    powerUps.push({ x: x, y: y, radius: 12, dy: 3 });
}

function activateDoubleBall() {
    let currentCount = balls.length;
    if (currentCount >= 50) return; // Ekranda maksimum 50 top oluşur.

    for (let i = 0; i < currentCount; i++) {
        if (balls.length >= 50) break;
        let b = balls[i];
        balls.push({
            x: b.x,
            y: b.y,
            dx: -b.dx + (Math.random() - 0.5),
            dy: b.dy,
            radius: b.radius,
            speed: b.speed
        });
    }
}

function checkWin() {
    let activeBricks = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) activeBricks++;
        }
    }

    if (activeBricks === 0 && gameState === "PLAYING") {
        if (level < 11) {
            level++;

            // Paddle genişliği, her seviye artışında 10 piksel azalır.
            paddleWidth -= 10;
            if (paddleWidth < 50) paddleWidth = 50;

            // Topların hızı, her seviye sonrasında 0.5 artar.
            currentBallSpeed += 0.5;
            if (currentBallSpeed > 10) currentBallSpeed = 10;

            initBricks();
            resetBall();
            powerUps = [];
        } else {
            // 11. seviye de bittiyse, oyun kazanılır.
            gameState = "WIN";
            restartBtn.style.display = "block";
        }
    }
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                balls.forEach(ball => {
                    if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                        ball.dy = -ball.dy;
                        b.status = 0;
                        if (b.hasPowerUp) spawnPowerUp(b.x + brickWidth / 2, b.y + brickHeight);
                    }
                });
            }
        }
    }
    checkWin();
}

function update() {
    if (gameState !== "PLAYING") return;

    powerUps.forEach((p, index) => {
        p.y += p.dy;
        if (p.y + p.radius > canvas.height - paddleHeight - 10 && p.x > paddleX && p.x < paddleX + paddleWidth) {
            activateDoubleBall();
            powerUps.splice(index, 1);
        }
        if (p.y > canvas.height) powerUps.splice(index, 1);
    });

    balls.forEach((ball, index) => {
        if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy < ball.radius) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > canvas.height - ball.radius - 10) {
            if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
                let collidePoint = (ball.x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
                let angle = collidePoint * (Math.PI / 3);
                ball.dx = ball.speed * Math.sin(angle);
                ball.dy = -ball.speed * Math.cos(angle);
            } else {
                balls.splice(index, 1);
                if (balls.length === 0) {
                    lives--;
                    if (lives <= 0) {
                        gameState = "GAMEOVER";
                        restartBtn.style.display = "block";
                    } else {
                        resetBall();
                    }
                }
            }
        }
        ball.x += ball.dx;
        ball.y += ball.dy;
    });

    collisionDetection();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bricks
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let bx = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let by = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = bx;
                bricks[c][r].y = by;
                ctx.fillStyle = bricks[c][r].color;
                ctx.beginPath();
                ctx.roundRect(bx, by, brickWidth, brickHeight, 4);
                ctx.fill();
            }
        }
    }

    // Paddle
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.roundRect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight, 5);
    ctx.fill();

    // Balls
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#FFF";
        ctx.fill();
        ctx.closePath();
    });

    powerUps.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#2ecc71";
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("x2", p.x, p.y + 4);
    });

    // UI
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "left";
    ctx.fillText("LEVEL: " + level, 20, 30);
    ctx.textAlign = "right";
    ctx.fillText("CAN: " + lives, canvas.width - 20, 30);
    ctx.textAlign = "center";
    ctx.fillText("TOP: " + balls.length, canvas.width / 2, 30);

    if (gameState === "GAMEOVER") drawOverlay("KAYBETTİNİZ", "#ff4757");
    if (gameState === "WIN") drawOverlay("KAZANDINIZ", "#2ed573");

    update();
    requestAnimationFrame(draw);
}

function drawOverlay(text, color) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 70px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function restartGame() {
    lives = 3;
    level = 1;
    paddleWidth = 150;
    currentBallSpeed = 5;
    gameState = "PLAYING";
    powerUps = [];
    restartBtn.style.display = "none";
    initBricks();
    resetBall();
}

draw();