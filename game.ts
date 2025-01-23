import type { GameRules, GameState, Vector2D } from "./types";

export class Game {
  private _clients: string[];
  isStarted: boolean;
  private _rules: GameRules;
  private _state: GameState;

  constructor() {
    this._clients = [];
    this.isStarted = false;

    this._state = {
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
    this.isStarted = true;
  }

  updatePlayerPosition(player: 1 | 2, position: number) {
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

  resetBall() {
    // TODO: Make velocity a bit random
    this.updateBallPosition({ x: 50, y: 50 });
    this.updateBallVelocity({ x: 1, y: 1 });
  }

  calculateState() {
    // Update ball position based on its velocity
    this.updateBallPosition();

    const ballPos = this.state.ball.position;
    const ballVelocity = this.state.ball.velocity;
    const player1Pos = this.state.player1.position;
    const player2Pos = this.state.player2.position;
    const paddleHeight = this.rules.paddleHeight;
    const paddleWidth = this.rules.paddleWidth;

    // Check for collisions with the top and bottom walls
    if (ballPos.y <= 0 || ballPos.y >= 100) {
      this.updateBallVelocity({ x: ballVelocity.x, y: ballVelocity.y * -1 }); // Reverse the y velocity
    }

    // Check for collisions with the paddles
    const isHitPaddle1 =
      // No clue why 99 works fine with width and 100 does not, same with paddle 2 and value 1
      ballPos.x >= 99 - this.rules.paddleWidth &&
      ballPos.y >= player2Pos - paddleHeight / 2 &&
      ballPos.y <= player2Pos + paddleHeight / 2;

    const isHitPaddle2 =
      ballPos.x <= 1 + this.rules.paddleWidth &&
      ballPos.y >= player1Pos - paddleHeight / 2 &&
      ballPos.y <= player1Pos + paddleHeight / 2;

    console.log(ballPos.x, isHitPaddle2);

    if (isHitPaddle1 || isHitPaddle2) {
      // TODO: Increase speed on hit
      this.updateBallVelocity({ x: ballVelocity.x * -1, y: ballVelocity.y }); // Reverse the x velocity
    }

    // Check for scoring
    if (ballPos.x <= 0 || ballPos.x >= 100) {
      if (ballPos.x <= 0) {
        this.updatePlayerScore(2);
      } else {
        this.updatePlayerScore(1);
      }

      this.resetBall();
    }
  }
}
