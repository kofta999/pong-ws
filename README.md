# pong-ws

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.0 [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## TODO:

- [x] Allow clients to connect
- [x] Create game
- [x] Join game
- [x] Start game (leader only for ex)
- [x] Send game actions
- [x] Sync state between clients (Server Authoritative model)
- [x] Add ball
- [x] Calculate ball state
- [ ] Add validations
- [ ] Improve error handling
- [ ] Improve frontend
- [ ] Improve backend code structure
- [ ] Improve ball physics (increase speed on hit, touching at the edge shouldn't make it a x:y 1:1 speed)
- [ ] Add scoring
