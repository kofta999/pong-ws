import type { ServerWebSocket } from "bun"
import { randomUUID } from "crypto"

type Game = {
  clients: string[]
}
type MessageAction = "create" | "join"

type Message = {
  action: MessageAction,
  clientId: string,
  data: Record<string, unknown>
}

type WebSocketData = {
  id: string
};

const games = new Map<string, Game>()
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
    return new Response("Hello")
  },
  websocket: {
    message(ws, message) {
      // Validate
      const data = JSON.parse(message.toString()) as Message
      try {
        const res = messageHandler(ws.data.id, data)
        if (res != null) ws.send(JSON.stringify(res))
      } catch (error) {
        ws.send((error as Error).message)
      }
    },
    open(ws) {
      clients.set(ws.data.id, ws)
      ws.send(JSON.stringify({ clientId: ws.data.id, method: "connect" }))
    },
  }
});

const messageHandler = (clientId: string, data: Message): Message | null => {
  switch (data.action) {
    case "create": {
      const gameId = randomUUID()
      const game: Game = { clients: [] }
      games.set(gameId, game)

      return { action: "create", clientId, data: { game: { ...game, id: gameId } } }
    }

    case "join": {
      const gameId = data.data.gameId as string
      const game = games.get(gameId);
      const newClients = [...game!.clients, clientId]
      games.set(gameId, { clients: newClients })

      newClients.forEach(clientId => {
        const ws = clients.get(clientId)!;
        const message: Message =
        {
          action: "join",
          clientId: clientId,
          data: { game: { id: gameId, clients: newClients } }
        }

        ws.send(JSON.stringify(message))
      })

      return null
    }

    default: {
      throw new Error("Wrong method")
    }
  }
}
