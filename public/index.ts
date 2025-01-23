import type { GameRules, GameState } from "../types";

const ws = new WebSocket("ws://localhost:3000/game");

let clientId: string | null = null;
let currentGameId: string | null = null;
let gameState: GameState | null = null;
let gameRules: GameRules | null = null; // To store game rules
let playerIndex: number | null = null; // To track if the client is player 1 or player 2

const canvas = document.getElementById(
  "game-canvas",
) as HTMLCanvasElement | null;
const ctx = canvas?.getContext("2d");

const paddleSpeed = 3; // Speed at which the paddle moves

let player1Y = 50; // Initial position in percentage
let player2Y = 50; // Initial position in percentage

let keys: { [key: string]: boolean } = {}; // To track the state of keys

ws.onopen = () => {
  console.log("Connected to server");
};

ws.onmessage = (event: MessageEvent) => {
  const message = JSON.parse(event.data);
  handleServerMessage(message);
};

setEventListeners();

function sendMessage(action: string, data: any) {
  const message = {
    action,
    clientId,
    data,
  };
  ws.send(JSON.stringify(message));
}

function handleServerMessage(message: any) {
  switch (message.action) {
    case "connect":
      clientId = message.clientId;
      break;
    case "create":
      currentGameId = message.data.game.id;
      gameRules = message.data.game.rules; // Store game rules
      document.getElementById("current-game-id")!.textContent = currentGameId;
      document.getElementById("controls")!.style.display = "none";
      document.getElementById("game-container")!.style.display = "flex";
      // Game creator is always player 1
      playerIndex = 0;
      break;
    case "join":
      currentGameId = message.data.game.id;
      gameRules = message.data.game.rules; // Store game rules
      document.getElementById("current-game-id")!.textContent = currentGameId;
      document.getElementById("controls")!.style.display = "none";
      document.getElementById("game-container")!.style.display = "flex";
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
  if (!gameState || !canvas || !ctx || !gameRules) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Convert percentage positions to pixel positions
  const ballX = (gameState.ball.position.x / 100) * canvas.width;
  const ballY = (gameState.ball.position.y / 100) * canvas.height;
  player1Y = (gameState.player1.position / 100) * canvas.height;
  player2Y = (gameState.player2.position / 100) * canvas.height;

  // Calculate paddle dimensions based on canvas size and game rules
  const paddleHeight = (gameRules.paddleHeight / 100) * canvas.height;
  const paddleWidth = (gameRules.paddleWidth / 100) * canvas.width;

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
    canvas.width - 10 - paddleWidth,
    player2Y - paddleHeight / 2,
    paddleWidth,
    paddleHeight,
  );
}

function updatePlayerPosition(pos: number) {
  if (currentGameId) {
    sendMessage("update", { gameId: currentGameId, pos: Number(pos) });
  }
}

function gameLoop() {
  if (keys["ArrowUp"]) {
    if (playerIndex === 0) {
      player1Y = Math.max(0, player1Y - paddleSpeed);
      updatePlayerPosition((player1Y / canvas!.height) * 100);
    } else if (playerIndex === 1) {
      player2Y = Math.max(0, player2Y - paddleSpeed);
      updatePlayerPosition((player2Y / canvas!.height) * 100);
    }
  }
  if (keys["ArrowDown"]) {
    if (playerIndex === 0) {
      player1Y = Math.min(canvas!.height, player1Y + paddleSpeed);
      updatePlayerPosition((player1Y / canvas!.height) * 100);
    } else if (playerIndex === 1) {
      player2Y = Math.min(canvas!.height, player2Y + paddleSpeed);
      updatePlayerPosition((player2Y / canvas!.height) * 100);
    }
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

function setEventListeners() {
  document.getElementById("create-game")?.addEventListener("click", () => {
    sendMessage("create", {});
  });

  document.getElementById("join-game")?.addEventListener("click", () => {
    const gameId = (document.getElementById("game-id") as HTMLInputElement)
      ?.value;
    if (gameId) {
      sendMessage("join", { gameId });
    }
  });

  document.getElementById("start-game")?.addEventListener("click", () => {
    if (currentGameId) {
      sendMessage("start", { gameId: currentGameId });
    }
  });

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault(); // Prevent default behavior of arrow keys
      keys[event.key] = true;
    }
  });

  document.addEventListener("keyup", (event: KeyboardEvent) => {
    keys[event.key] = false;
  });
}
