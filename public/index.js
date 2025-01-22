const ws = new WebSocket("ws://localhost:3000/game");

let clientId = null;
let currentGameId = null;

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

document.getElementById("player1-pos").addEventListener("input", (event) => {
  updatePlayerPosition(event.target.value);
});

document.getElementById("player2-pos").addEventListener("input", (event) => {
  updatePlayerPosition(event.target.value);
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
      break;
    case "join":
      currentGameId = message.data.game.id;
      document.getElementById("current-game-id").textContent = currentGameId;
      document.getElementById("controls").style.display = "none";
      document.getElementById("game-container").style.display = "flex";
      break;
    case "start":
      // Game started, you can add additional logic here if needed
      break;
    case "update":
      updateGameState(message.data);
      break;
    default:
      console.error("Unknown action:", message.action);
  }
}

function updateGameState(state) {
  document.getElementById("player1-pos").value = state.player1Pos;
  document.getElementById("player2-pos").value = state.player2Pos;
}

function updatePlayerPosition(pos) {
  if (currentGameId) {
    sendMessage("update", { gameId: currentGameId, pos: Number(pos) });
  }
}
