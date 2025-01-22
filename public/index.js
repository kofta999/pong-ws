const ws = new WebSocket("ws://localhost:3000/game");

let clientId = null;
let currentGameId = null;
let gameState = null;
let playerIndex = null; // To track if the client is player 1 or player 2

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const paddleSpeed = 3; // Speed at which the paddle moves

let player1Y = 50; // Initial position in percentage
let player2Y = 50; // Initial position in percentage

let keys = {}; // To track the state of keys

ws.onopen = () => {
  console.log("Connected to server");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleServerMessage(message);
};

document.getElementById("create-game").addEventListener("click", () => {
  sendMessage("create", {});
});

document.getElementById("join-game").addEventListener("click", () => {
  const gameId = document.getElementById("game-id").value;
  if (gameId) {
    sendMessage("join", { gameId });
  }
});

document.getElementById("start-game").addEventListener("click", () => {
  if (currentGameId) {
    sendMessage("start", { gameId: currentGameId });
  }
});

document.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown"].includes(event.key)) {
    event.preventDefault(); // Prevent default behavior of arrow keys
    keys[event.key] = true;
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

function sendMessage(action, data) {
  const message = {
    action,
    clientId,
    data,
  };
  ws.send(JSON.stringify(message));
}

function handleServerMessage(message) {
  switch (message.action) {
    case "connect":
      clientId = message.clientId;
      break;
    case "create":
      currentGameId = message.data.game.id;
      document.getElementById("current-game-id").textContent = currentGameId;
      document.getElementById("controls").style.display = "none";
      document.getElementById("game-container").style.display = "flex";
      // Game creator is always player 1
      playerIndex = 0;
      break;
    case "join":
      currentGameId = message.data.game.id;
      document.getElementById("current-game-id").textContent = currentGameId;
      document.getElementById("controls").style.display = "none";
      document.getElementById("game-container").style.display = "flex";
      // playerIndex = message.data.game.clients.indexOf(clientId);
      playerIndex = playerIndex ?? 1;
      break;
    case "start":
      // Game started, you can add additional logic here if needed
      break;
    case "update":
      gameState = message.data;
      drawGame();
      break;
    default:
      console.error("Unknown action:", message.action);
  }
}

function drawGame() {
  if (!gameState) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Convert percentage positions to pixel positions
  const ballX = (gameState.ballPos.x / 100) * canvas.width;
  const ballY = (gameState.ballPos.y / 100) * canvas.height;
  player1Y = (gameState.player1Pos / 100) * canvas.height;
  player2Y = (gameState.player2Pos / 100) * canvas.height;

  // Calculate paddle dimensions based on canvas size
  const paddleHeight = canvas.height * 0.2; // 10% of canvas height
  const paddleWidth = canvas.width * 0.01; // 1% of canvas width

  // Draw ball
  ctx.beginPath();
  ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();

  // Draw paddles
  ctx.fillStyle = "#0095DD";
  ctx.fillRect(10, player1Y - paddleHeight / 2, paddleWidth, paddleHeight);
  ctx.fillRect(
    canvas.width - 20 - paddleWidth,
    player2Y - paddleHeight / 2,
    paddleWidth,
    paddleHeight,
  );
}

function updatePlayerPosition(pos) {
  if (currentGameId) {
    sendMessage("update", { gameId: currentGameId, pos: Number(pos) });
  }
}

function gameLoop() {
  if (keys["ArrowUp"]) {
    if (playerIndex === 0) {
      player1Y = Math.max(0, player1Y - paddleSpeed);
      updatePlayerPosition((player1Y / canvas.height) * 100);
    } else if (playerIndex === 1) {
      player2Y = Math.max(0, player2Y - paddleSpeed);
      updatePlayerPosition((player2Y / canvas.height) * 100);
    }
  }
  if (keys["ArrowDown"]) {
    if (playerIndex === 0) {
      player1Y = Math.min(canvas.height, player1Y + paddleSpeed);
      updatePlayerPosition((player1Y / canvas.height) * 100);
    } else if (playerIndex === 1) {
      player2Y = Math.min(canvas.height, player2Y + paddleSpeed);
      updatePlayerPosition((player2Y / canvas.height) * 100);
    }
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
