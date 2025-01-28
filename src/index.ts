import { randomUUID } from "crypto";
import index from "./public/index.html";
import { Game } from "./game";
import type { Message, WebSocketData } from "./types";
import { handler } from "./handler";
import type { ServerWebSocket } from "bun";

export const games = new Map<string, Game>();
export const clients = new Map<string, ServerWebSocket<WebSocketData>>();

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
      try {
        const data = JSON.parse(message.toString()) as Message;
        handler(ws.data.id, data);
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
