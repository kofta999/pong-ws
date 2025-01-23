import { randomUUID } from "crypto";
import { Game } from "./game";
import type { Message, MessageAction, WebSocketData } from "./types";
import { games, clients } from ".";
import type { ServerWebSocket } from "bun";

export function handler(clientId: string, data: Message) {
  const ws = clients.get(clientId);

  if (!ws) {
    throw new Error("Client not found");
  }

  switch (data.action) {
    case "create": {
      const gameId = randomUUID();
      const game = new Game();
      // Game creator will also join the game
      game.addClient(clientId);

      games.set(gameId, game);

      send(ws, {
        action: "create",
        clientId,
        data: { game: { ...game, id: gameId } },
      });
      break;
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
      break;
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

      break;
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

      break;
    }

    default: {
      throw new Error("Wrong method");
    }
  }
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
    send(ws, message);
  });
}

function send(ws: ServerWebSocket<WebSocketData>, message: Message) {
  ws.send(JSON.stringify(message));
}
