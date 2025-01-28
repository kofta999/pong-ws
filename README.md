# Pong Over WebSockets

This project demonstrates how to use WebSockets to create a real-time multiplayer game. The game is a simple implementation of Pong, where two players can connect, create or join a game, and play against each other. The server is authoritative, meaning it controls the game state and synchronizes it between clients.

## Tech Stack

- **Bun**: The server is built using [Bun](https://bun.sh) v1.2.0, a fast JavaScript runtime. No additional dependencies are used, allowing for a deeper understanding of lower-level WebSocket handling and game state management.

## Features

- **WebSocket Connection**: Clients can connect to the server via WebSockets.
- **Game Creation**: A client can create a new game.
- **Game Joining**: Another client can join an existing game using a game ID.
- **Game Start**: The game can be started by the game creator.
- **Real-time Game Actions**: Players can move paddles, and the game state is synchronized in real-time.
- **Ball Physics**: The ball moves and bounces off paddles and walls, with increasing speed upon hitting paddles.
- **Scoring**: Scores are tracked and displayed, and the game ends when a player reaches the maximum score.
- **Server Authoritative Model**: The server controls the game state, ensuring consistency and fairness.

## Project Structure

- **public/**: Contains the frontend code (HTML, TypeScript).
  - `index.html`: The main HTML file for the game interface.
  - `index.ts`: The TypeScript file handling the client-side logic and WebSocket communication.
- **src/**: Contains the backend code (TypeScript).
  - `game.ts`: Defines the `Game` class, which manages the game state and logic.
  - `handler.ts`: Handles WebSocket messages and game actions.
  - `index.ts`: The entry point for the Bun server, setting up WebSocket routes and handling connections.
  - `types.ts`: Type definitions for the project.

## How It Works

### Frontend (public/index.ts)

- **WebSocket Connection**: Establishes a WebSocket connection to the server.
- **Event Listeners**: Sets up event listeners for creating, joining, and starting games, as well as handling keyboard input for paddle movement.
- **Game Loop**: Continuously updates the game state and renders it on the canvas.
- **Drawing**: Draws the game elements (ball, paddles, scores) on the canvas based on the game state received from the server.

### Backend (src/game.ts)

- **Game Class**: Manages the game state, including player positions, ball position and velocity, and scores.
- **Game Logic**: Handles game actions such as starting the game, updating player positions, and calculating the new game state (ball movement, collisions, scoring).

### Backend (src/handler.ts)

- **Message Handling**: Processes WebSocket messages from clients, such as creating or joining a game, starting the game, and updating player positions.
- **State Updates**: Periodically updates the game state and broadcasts it to all connected clients.

### Backend (src/index.ts)

- **Server Setup**: Sets up the Bun server, handles WebSocket connections, and routes messages to the appropriate handlers.

## TODO

- [x] Allow clients to connect
- [x] Create game
- [x] Join game
- [x] Start game (leader only for example)
- [x] Send game actions
- [x] Sync state between clients (Server Authoritative model)
- [x] Add ball
- [x] Calculate ball state
- [x] Increase ball speed on hit
- [x] Add scoring for frontend
- [x] Improve error handling
- [x] Improve backend code structure
- [ ] Add validations
- [ ] Improve frontend
- [ ] Improve ball physics (touching at the edge shouldn't make it a x:y 1:1 speed)
- [ ] Deal with disconnected users
- [ ] Make Paddle velocity a backend thing

## Running the Project

1. **Install Bun**: Follow the instructions on the [Bun website](https://bun.sh) to install Bun.
2. **Start the Server**: Run `bun run src/index.ts` to start the server.
3. **Open the Game**: Open `public/index.html` in a web browser to start playing.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the project.
