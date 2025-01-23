import type { ServerWebSocket } from "bun";
import { randomUUID } from "crypto";
import index from "./public/index.html";
import { Game } from "./game";
import type { Message, MessageAction, WebSocketData } from "./types";

const games = new Map<string, Game>();
const clients = new Map<string, ServerWebSocket<WebSocketData>>();

Bun.serve<WebSocketData>({
  static: {
    "/": index,
  },
  development: true,

  fetch(req, server) {
    // Upgrade the request to a WebSocket
    const url = new URL(req.url);
    if (url.pathname === "/game") {
      if (!server.upgrade(req, { data: { id: randomUUID() } })) {
        return new Response("Upgrade failed", { status: 400 });
      }
    }
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
      const game = new Game();
      // Game creator will also join the game
      game.addClient(clientId);

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

      if (game.getClients().length > 2) {
        throw new Error("Max players is 2");
      }

      game.addClient(clientId);
      // Do I need to do that?
      games.set(gameId, game);

      broadCastToClients(game.getClients(), "join", {
        game: { id: gameId, clients: game.getClients(), rules: game.rules },
      });
      return null;
    }

    case "start": {
      const gameId = data.data.gameId as string;
      const game = games.get(gameId);

      if (!game) {
        throw new Error("Game not found");
      }

      if (!game.getClients().includes(clientId)) {
        throw new Error("No permission to start the game");
      }

      game.startGame();

      games.set(gameId, game);

      updateState();

      broadCastToClients(game.getClients(), "start", { gameId });

      return null;
    }

    case "update": {
      const gameId = data.data.gameId as string;
      const playerPos = data.data.pos as number;

      let game = games.get(gameId);

      if (!game) {
        throw new Error("Game not found");
      }

      if (game.getClients()[0] === clientId) {
        game.updatePlayerPosition(1, playerPos);
        games.set(gameId, game);
      } else if (game.getClients()[1] === clientId) {
        game.updatePlayerPosition(2, playerPos);
        games.set(gameId, game);
      }

      return null;
    }

    default: {
      throw new Error("Wrong method");
    }
  }
};

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
      game.calculateState();
      broadCastToClients(game.getClients(), "update", game.state);
    }
  });

  // TODO: Update to an appropriate time
  setTimeout(updateState, 1000 / 30);
}
