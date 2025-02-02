export type MessageAction =
  | "connect"
  | "create"
  | "join"
  | "start"
  | "update"
  | "end";

export type Message<T = unknown> = {
  action: MessageAction;
  clientId: string;
  data: Record<string, T>;
};

export type WebSocketData = {
  id: string;
};

export type Vector2D = { x: number; y: number };

export type GameState = {
  ball: {
    position: Vector2D;
    velocity: Vector2D;
  };
  player1: { position: number; score: number };
  player2: { position: number; score: number };
  status: GameStatus;
};

export type GameRules = {
  maxScore: number;
  paddleWidth: number;
  paddleHeight: number;
};

export type GameStatus = "playing" | "standby" | "ended";
