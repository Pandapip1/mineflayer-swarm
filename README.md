# mineflayer-swarm
[![NPM version](https://img.shields.io/npm/v/mineflayer-swarm.svg)](http://npmjs.com/package/mineflayer-swarm)
[![Build Status](https://github.com/Pandapip1/mineflayer-swarm/workflows/CI/badge.svg)](https://github.com/Pandapip1/mineflayer-swarm/actions?query=workflow%3A%22CI%22)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/Pandapip1/mineflayer-swarm)

Allows you to control an entire [mineflayer](https://github.com/PrismarineJS/mineflayer) bot swarm with minimal additional code

## Moving from a single bot to a swarm

It's easier than you'd think!

```diff
const mineflayer = require('mineflayer')
+ const { createSwarm } = require('mineflayer-swarm')

- const bot = mineflayer.createBot({
-   username: 'email0@example.com',
-   password: 'P@ssword0!',
-   host: 'localhost',
-   port: 25565
- })
+ const swarm = createSwarm([
+   {
+     username: 'email1@example.com',
+     password: 'P@ssword1!'
+     auth: 'mojang'
+   }, {
+     username: 'email2@example.com',
+     password: 'P@ssword2!'
+     auth: 'microsoft'
+   }
+ ], {
+   host: 'localhost',
+   port: 25565
+ })

- bot.on('chat', (username, message) => {
-   if (username === bot.username) return
-   bot.chat(message)
- })
+ swarm.on('chat', (bot, username, message) => {
+   if (swarm.isSwarmMember(username)) return
+   bot.chat(message)
+ })

```
## API

### async createSwarm(auths, options = {})

Creates a new swarm object. Bots are removed from the swarm on disconnect.

### async swarm.addSwarmMember(auth)

Adds a member to a swarm dynamically.

### swarm.isSwarmMember(username)

Returns true if the given username is part of the swarm, otherwise returns false.

### async swarm.execAll(function)

Evaluates the given function (or async function) in the context of each bot, and returns the result.

### swarm.loadPlugin(plugin)

Loads a plugin in all bots in the swarm.

### swarm.loadPlugins(plugins)

Loads multiple plugins in all bots in the swarm.

### swarm.hasPlugin(plugin)

Returns true if the given plugin is loaded in the swarm, otherwise returns false.
