const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");

// --- OYUN AYARLARI ---
let lives = 3;
let level = 1;
let gameState = "PLAYING";
let isPaused = false;
let notificationTimer = 0;
let notificationText = "";

const paddleHeight = 15;
let paddleWidth = 150;
let paddleX = (canvas.width - paddleWidth) / 2;

let balls = [];
let currentBallSpeed = 5;

// Rastgele renk üreten yardımcı fonksiyon
function getRandomColor() {
    return `hsl(${Math.random() * 360}, 70%, 60%)`;
}

function resetBall() {
    // Top, paddle'ın tam ortasından fırlatılır.
    const angle = (Math.random() * (Math.PI / 1.5)) - (Math.PI / 3);
    balls = [{
        x: paddleX + paddleWidth / 2,
        y: canvas.height - paddleHeight - 25,
        dx: currentBallSpeed * Math.sin(angle),
        dy: -currentBallSpeed * Math.cos(angle),
        radius: 8,
        speed: currentBallSpeed,
        color: getRandomColor()
    }];
}

const brickRowCount = 8;
const brickColumnCount = 9;
const brickWidth = 80;
const brickHeight = 25;
const brickPaddingX = 30;
const brickPaddingY = 15;
const brickOffsetTop = 60;
const totalBricksWidth = (brickColumnCount * brickWidth) + ((brickColumnCount - 1) * brickPaddingX);
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
notificationText = "Level " + level;
notificationTimer = 180;

// "Sağ tık ile menü açma" özelliği devre dışı
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Klavye kontrolleri
window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "p") {
        if (gameState === "PLAYING" || gameState === "BALL_LOST") {
            isPaused = !isPaused;
        }
    }
});

// Mouse Kontrolü
window.addEventListener("mousemove", (e) => {
    if (isPaused) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    paddleX = mouseX - paddleWidth / 2;

    if (paddleX < 0) {
        paddleX = 0;
    } else if (paddleX + paddleWidth > canvas.width) {
        paddleX = canvas.width - paddleWidth;
    }
});

function spawnPowerUp(x, y) {
    powerUps.push({ x: x, y: y, radius: 12, dy: currentBallSpeed / 2 });
}

function activateDoubleBall() {
    let currentCount = balls.length;
    const maxBalls = 256;

    for (let i = 0; i < currentCount; i++) {
        if (balls.length >= maxBalls) break;

        let b = balls[i];
        const angle = (Math.random() * (Math.PI / 1.5)) - (Math.PI / 3);

        balls.push({
            x: b.x,
            y: b.y,
            dx: b.speed * Math.sin(angle),
            dy: -b.speed * Math.cos(angle),
            radius: b.radius,
            speed: b.speed,
            color: getRandomColor()
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
        if (level < 51) {
            level++;
            notificationText = "Level " + level;
            notificationTimer = 180;

            if (level % 5 === 0) {
                lives++;
            }

            paddleWidth -= 1;
            if (paddleWidth < 100) paddleWidth = 100;

            currentBallSpeed += 0.1;
            if (currentBallSpeed > 10) currentBallSpeed = 10;

            initBricks();
            resetBall();
            powerUps = [];
        } else {
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
    if (isPaused) return;

    // Sayaçları güncelle
    document.getElementById("level-display").innerText = "LEVEL: " + level;
    document.getElementById("ball-display").innerText = "TOP: " + balls.length;
    document.getElementById("lives-display").innerText = "CAN: " + lives;

    if (gameState === "BALL_LOST") {
        notificationTimer--;
        if (notificationTimer <= 0) {
            gameState = "PLAYING";
            resetBall();
        }
        return;
    }

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
                        gameState = "BALL_LOST";
                        notificationText = "Top Kaybı";
                        notificationTimer = 180;
                        powerUps = [];
                    }
                }
            }
        }
        ball.x += ball.dx;
        ball.y += ball.dy;
    });

    collisionDetection();
    if (notificationTimer > 0 && gameState === "PLAYING") notificationTimer--;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let bx = (c * (brickWidth + brickPaddingX)) + brickOffsetLeft;
                let by = (r * (brickHeight + brickPaddingY)) + brickOffsetTop;
                bricks[c][r].x = bx;
                bricks[c][r].y = by;
                ctx.fillStyle = bricks[c][r].color;
                ctx.beginPath();
                ctx.roundRect(bx, by, brickWidth, brickHeight, 4);
                ctx.fill();
            }
        }
    }

    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.roundRect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight, 5);
    ctx.fill();

    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
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

    if (notificationTimer > 0) {
        ctx.fillStyle = "#FFD700";
        ctx.textAlign = "center";
        ctx.font = "bold 60px Arial";
        ctx.fillText(notificationText, canvas.width / 2, 450);
        if (gameState === "PLAYING" && level % 5 === 0 && level > 1) {
            ctx.font = "25px Arial";
            ctx.fillText("1 can hakkı kazandınız.", canvas.width / 2, 495);
        }
    }

    if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "bold 70px Arial";
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.fillText("DURAKLATILDI", canvas.width / 2, canvas.height / 2);
    }

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
    paddleX = (canvas.width - paddleWidth) / 2;
    currentBallSpeed = 5;
    gameState = "PLAYING";
    isPaused = false;
    powerUps = [];
    notificationTimer = 180;
    notificationText = "Level " + level;
    restartBtn.style.display = "none";
    initBricks();
    resetBall();
}

draw();