import type { GameRules, GameState, GameStatus, Vector2D } from "./types";

export class Game {
  private _clients: string[];
  private _rules: GameRules;
  private _state: GameState;
  private velocityMultiplier = 1.05;

  constructor() {
    this._clients = [];

    this._state = {
      status: "standby",
      ball: {
        position: {
          x: 50,
          y: 50,
        },
        velocity: {
          x: 1,
          y: 1,
        },
      },

      player1: {
        position: 50,
        score: 0,
      },
      player2: {
        position: 50,
        score: 0,
      },
    };

    this._rules = {
      maxScore: 5,
      paddleWidth: 2,
      paddleHeight: 20,
    };
  }

  startGame() {
    if (this._clients.length == 2) {
      this.state.status = "playing";
    } else {
      throw new Error("Player length must be 2 to start the game");
    }
  }

  updatePlayerPosition(player: 1 | 2, position: number) {
    // TODO: Should I make the frontend only send the command (up / down) and I calculate the position myself?
    this._state[`player${player}`].position = position;
  }

  updatePlayerScore(player: 1 | 2) {
    this._state[`player${player}`].score += 1;
  }

  updateBallPosition(position?: Vector2D) {
    const ball = this._state.ball;
    ball.position = position ?? {
      x: ball.position.x + ball.velocity.x,
      y: ball.position.y + ball.velocity.y,
    };
  }

  updateBallVelocity(velocity: Vector2D) {
    const ball = this._state.ball;
    ball.velocity = velocity;
  }

  addClient(clientId: string) {
    this._clients.push(clientId);
  }

  getClients(): string[] {
    return this._clients;
  }

  get state() {
    return this._state;
  }

  get rules() {
    return this._rules;
  }

  get status() {
    return this.state.status;
  }

  endGame() {
    this.state.status = "standby";
  }

  resetBall() {
    const randomVelocity = () => (Math.random() < 0.5 ? 1 : -1);

    const velocityX = randomVelocity();
    const velocityY = randomVelocity();

    this.updateBallPosition({ x: 50, y: Math.random() * 100 });
    this.updateBallVelocity({ x: velocityX, y: velocityY });
  }

  // TODO: return player name or clientId?
  getWinner(): string | null {
    const player1Score = this.state.player1.score;
    const player2Score = this.state.player2.score;
    const maxScore = this._rules.maxScore;

    return player1Score === maxScore
      ? "Player1"
      : player2Score === maxScore
        ? "Player2"
        : null;
  }

  calculateState() {
    if (this.state.status !== "playing") {
      return;
    }
    // Update ball position based on its velocity
    this.updateBallPosition();

    const ballPos = this.state.ball.position;
    const ballVelocity = this.state.ball.velocity;
    const player1Pos = this.state.player1.position;
    const player2Pos = this.state.player2.position;
    const paddleHeight = this.rules.paddleHeight;
    const paddleWidth = this.rules.paddleWidth;
    const maxScore = this._rules.maxScore;

    // Check for collisions with the top and bottom walls
    if (ballPos.y <= 0 || ballPos.y >= 100) {
      this.updateBallVelocity({ x: ballVelocity.x, y: ballVelocity.y * -1 }); // Reverse the y velocity
    }

    // Check for collisions with the paddles
    const isHitPaddle1 =
      // No clue why 99 works fine with width and 100 does not, same with paddle 2 and value 1
      ballPos.x >= 99 - paddleWidth &&
      ballPos.y >= player2Pos - paddleHeight / 2 &&
      ballPos.y <= player2Pos + paddleHeight / 2;

    const isHitPaddle2 =
      ballPos.x <= 1 + paddleWidth &&
      ballPos.y >= player1Pos - paddleHeight / 2 &&
      ballPos.y <= player1Pos + paddleHeight / 2;

    if (isHitPaddle1 || isHitPaddle2) {
      this.updateBallVelocity({
        x: ballVelocity.x * -1 * this.velocityMultiplier,
        y: ballVelocity.y * this.velocityMultiplier,
      });
    }

    // Check for scoring
    if (ballPos.x <= 0 || ballPos.x >= 100) {
      if (ballPos.x <= 0) {
        this.updatePlayerScore(2);
      } else {
        this.updatePlayerScore(1);
      }

      const player1Score = this.state.player1.score;
      const player2Score = this.state.player2.score;

      if (player1Score === maxScore || player2Score === maxScore) {
        // TODO: Make UI show who wins
        this._state.status = "ended";
      }
      this.resetBall();
    }
  }
}
