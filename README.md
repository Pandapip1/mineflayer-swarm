# mineflayer-swarm
[![NPM version](https://img.shields.io/npm/v/mineflayer-swarm.svg)](http://npmjs.com/package/mineflayer-swarm)
[![Build Status](https://github.com/Pandapip1/mineflayer-swarm/workflows/CI/badge.svg)](https://github.com/Pandapip1/mineflayer-swarm/actions?query=workflow%3A%22CI%22)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/Pandapip1/mineflayer-swarm)

## I'm not working on this much anymore. If anyone wants to help maintain this, please make an issue.

Allows you to control an entire [mineflayer](https://github.com/PrismarineJS/mineflayer) bot swarm with minimal additional code. The API isn't final, so minor versions might introduce breaking changes. Here be dragons!

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
