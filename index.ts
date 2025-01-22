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

      const game = games.get(gameId);

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

      // TODO: Make this update ball pos
      calculateState();

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
        x: 0,
        y: 0,
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
      broadCastToClients(game.clients, "update", game.state);
    }
  });

  // TODO: Update to an appropriate time
  setTimeout(updateState, 500);
}

function calculateState() {}
