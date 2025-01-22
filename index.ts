import type { ServerWebSocket } from "bun";
import { randomUUID } from "crypto";

type Game = {
  clients: string[];
  isStarted: boolean;
  state: {
    ballPos: {
      x: number;
      y: number;
    };
    ballVelocity: {
      x: number;
      y: number;
    };
    player1Pos: number;
    player2Pos: number;
  };
};

type MessageAction = "connect" | "create" | "join" | "start" | "update";

type Message = {
  action: MessageAction;
  clientId: string;
  data: Record<string, unknown>;
};

type WebSocketData = {
  id: string;
};

const games = new Map<string, Game>();
const clients = new Map<string, ServerWebSocket<WebSocketData>>();

Bun.serve<WebSocketData>({
  fetch(req, server) {
    // Upgrade the request to a WebSocket
    const url = new URL(req.url);
    if (url.pathname === "/game") {
      if (!server.upgrade(req, { data: { id: randomUUID() } })) {
        return new Response("Upgrade failed", { status: 400 });
      }
    }

    const filePath = new URL(req.url).pathname;
    return new Response(
      Bun.file(`public/${filePath === "/" ? "index.html" : filePath}`),
    );
  },
  websocket: {
    message(ws, message) {
      // Validate
      const data = JSON.parse(message.toString()) as Message;
      try {
        const res = messageHandler(ws.data.id, data);
        if (res != null) ws.send(JSON.stringify(res));
      } catch (error) {
        ws.send((error as Error).message);
      }
    },
    open(ws) {
      clients.set(ws.data.id, ws);
      ws.send(JSON.stringify({ clientId: ws.data.id, method: "connect" }));
    },
  },
});

const messageHandler = (clientId: string, data: Message): Message | null => {
  switch (data.action) {
    case "create": {
      const gameId = randomUUID();
      const game = createGame();
      // Game creator will also join the game
      game.clients.push(clientId);

      games.set(gameId, game);

      return {
        action: "create",
        clientId,
        data: { game: { ...game, id: gameId } },
      };
    }

    case "join": {
      const gameId = data.data.gameId as string;
      const game = games.get(gameId);

      if (!game) {
        throw new Error("Game not found");
      }

      if (game.isStarted) {
        throw new Error("Game has already started, you cannot join");
      }

      if (game.clients.length > 2) {
        throw new Error("Max players is 2");
      }

      const newClients = [...game.clients, clientId];
      games.set(gameId, { ...game, clients: newClients });

      broadCastToClients(newClients, "join", {
        game: { id: gameId, clients: newClients },
      });
      return null;
    }

    case "start": {
      const gameId = data.data.gameId as string;
      const game = games.get(gameId);

      if (!game) {
        throw new Error("Game not found");
      }

      if (!game.clients.includes(clientId)) {
        throw new Error("No permission to start the game");
      }

      games.set(gameId, { ...game, isStarted: true });

      updateState();

      broadCastToClients(game.clients, "start", { gameId });

      return null;
    }

    case "update": {
      const gameId = data.data.gameId as string;
      const playerPos = data.data.pos as number;

      let game = games.get(gameId);

      if (!game) {
        throw new Error("Game not found");
      }

      if (game.clients[0] === clientId) {
        games.set(gameId, {
          ...game,
          state: { ...game.state, player1Pos: playerPos },
        });
      } else if (game.clients[1] === clientId) {
        games.set(gameId, {
          ...game,
          state: { ...game.state, player2Pos: playerPos },
        });
      }

      return null;
    }

    default: {
      throw new Error("Wrong method");
    }
  }
};

function createGame(): Game {
  return {
    clients: [],
    isStarted: false,
    state: {
      // TODO: change this
      ballPos: {
        x: 50,
        y: 50,
      },
      ballVelocity: {
        x: 1,
        y: 1,
      },

      // Considering it's the Y axis, both players will start at midpoint
      player1Pos: 50,
      player2Pos: 50,
    },
  };
}

function broadCastToClients(
  clientIds: string[],
  action: MessageAction,
  data: Record<string, unknown>,
) {
  clientIds.forEach((clientId) => {
    const ws = clients.get(clientId)!;
    const message: Message = {
      action,
      clientId,
      data,
    };
    ws.send(JSON.stringify(message));
  });
}

function updateState() {
  games.forEach((game) => {
    if (game.isStarted) {
      calculateState(game);
      broadCastToClients(game.clients, "update", game.state);
    }
  });

  // TODO: Update to an appropriate time
  setTimeout(updateState, 200);
}

function calculateState(game: Game): Game {
  if (game.isStarted) {
    // Update ball position based on its velocity
    game.state.ballPos.x += game.state.ballVelocity.x;
    game.state.ballPos.y += game.state.ballVelocity.y;

    // Check for collisions with the top and bottom walls
    if (game.state.ballPos.y <= 0 || game.state.ballPos.y >= 100) {
      game.state.ballVelocity.y *= -1; // Reverse the y velocity
    }

    //console.log(game.state.ballPos, game.state.player2Pos);
    // Check for collisions with the paddles
    // Assuming the paddles are at x = 0 and x = 100
    const paddleHeight = 20; // 20% of the game height

    // Check for collisions with the paddles
    // Assuming the paddles are at x = 0 and x = 100
    if (
      (game.state.ballPos.x <= 1 && // Adjusted for paddle width
        game.state.ballPos.y >= game.state.player1Pos - paddleHeight / 2 &&
        game.state.ballPos.y <= game.state.player1Pos + paddleHeight / 2) ||
      (game.state.ballPos.x >= 99 && // Adjusted for paddle width
        game.state.ballPos.y >= game.state.player2Pos - paddleHeight / 2 &&
        game.state.ballPos.y <= game.state.player2Pos + paddleHeight / 2)
    ) {
      console.log("here");
      game.state.ballVelocity.x *= -1; // Reverse the x velocity
    }

    // Check for scoring
    if (game.state.ballPos.x <= 0 || game.state.ballPos.x >= 100) {
      // Reset ball position and velocity
      game.state.ballPos = { x: 50, y: 50 };
      game.state.ballVelocity = { x: 1, y: 1 };
    }
  }

  return game;
}
