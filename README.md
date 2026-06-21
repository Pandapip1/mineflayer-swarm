# mineflayer-swarm
[![NPM version](https://img.shields.io/npm/v/mineflayer-swarm.svg)](http://npmjs.com/package/mineflayer-swarm)
[![Build Status](https://github.com/Pandapip1/mineflayer-swarm/workflows/CI/badge.svg)](https://github.com/Pandapip1/mineflayer-swarm/actions?query=workflow%3A%22CI%22)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/Pandapip1/mineflayer-swarm)

Allows you to control an entire [`mineflayer`](https://github.com/PrismarineJS/mineflayer) bot swarm with minimal additional code. The API isn't final, so minor versions might introduce breaking changes. Here be dragons!

## Moving from a single bot to a swarm

It's easier than you'd think!

Example bot using `mineflayer-swarm`:

```ts
import { createSwarm, type Swarm } from 'mineflayer-swarm';

const swarm: Swarm = createSwarm({
  host: 'localhost',
  port: 25565
}, require('./auth.json'));

swarm.on('chat', (bot, username, message) => {
  if (swarm.isSwarmMember(username)) return;
  bot.chat(message);
});
```

Or with the default export:

```ts
import mineflayerSwarm from 'mineflayer-swarm';

const swarm = mineflayerSwarm.createSwarm({
  host: 'localhost',
  port: 25565,
  joinDelay: 5000,
  autoReconnect: true,
  reconnectDelay: 10000
}, require('./auth.json'));
```

`auth.json` can be either an array or an object with an `accounts` array:

```json
[
  { "username": "BotOne" },
  { "username": "BotTwo" }
]
```

Each account is started in its own Node.js worker thread. The main process receives swarm events and controls bots through lightweight proxies.

Bots are started with a default `joinDelay` of `5000` milliseconds between accounts. This avoids common server throttling where the second bot is kicked for joining too quickly. Set `joinDelay` in `createSwarm` options to tune it.

Auto reconnect is enabled by default. Use `autoReconnect: false` to disable it, `reconnectDelay` to change the delay, and `reconnectMaxAttempts` to limit retries.

For debugging failed joins, listen to `kicked` and `error`:

```ts
swarm.on('login', bot => { console.log(`${bot.username} login`); });
swarm.on('reconnect', (bot, attempt, delay) => { console.log(`${bot.username} reconnect #${attempt} in ${delay}ms`); });
swarm.on('kicked', (bot, reason) => { console.log(`${bot.username} kicked: ${reason}`); });
swarm.on('error', (bot, error) => { console.log(`${bot?.username ?? 'unknown'} error: ${error.message}`); });
```

All mineflayer events are forwarded automatically from the worker by wrapping `bot.emit`. You can listen to a specific mineflayer event directly, or use the catch-all `event` listener:

```ts
swarm.on('event', (eventName, bot, ...args) => {
  console.log(`[${bot.username}] ${eventName}`, args);
});
```

See `examples/all-events.ts` for a runnable all-event logger.
