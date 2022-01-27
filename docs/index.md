## Welcome to mineflayer-swarm

mineflayer-swarm allows you to control an entire mineflayer bot swarm with minimal additional code.

The API isn't final, so even minor versions might introduce breaking changes. Here be dragons!

Links:
- [API Reference](api.md)

## Moving from a single bot to a swarm

It's easier than you'd think!

Example bot using mineflayer:

```ts
import { createBot, Bot } from 'mineflayer'

const bot: Bot = createBot({
  username: 'email0@example.com',
  password: 'P@ssword0!',
  host: 'localhost',
  port: 25565
})

bot.on('chat', (username, message) => {
  if (username === bot.username) return
  bot.chat(message)
})
```

Example bot using mineflayer-swarm:

```ts
import { createSwarm, Swarm } from 'mineflayer'

const swarm: Swarm = mineflayerSwarm.createSwarm(require('auth.json'), {
  host: 'localhost',
  port: 25565
})

swarm.on('chat', (bot, username, message) => {
  if (swarm.isSwarmMember(username)) return
  bot.chat(message)
})
```
