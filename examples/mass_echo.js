/*
 * This is echo.js but with mineflayer-swarm.
 *
 * Instead of one bot echoing everyone else,
 * every bot in the swarm echoes other players.
 */
const mineflayerSwarm = require('mineflayer-swarm')

const swarm = mineflayerSwarm.createSwarm(require('./auth.json'), {
  host: 'localhost',
  port: 25565
})

swarm.on('chat', (bot, username, message) => {
  if (swarm.isSwarmMember(username)) return
  bot.chat(message)
})
