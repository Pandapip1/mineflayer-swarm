/*
 * mineflayer-swarm supports loading mineflayer plugins into the entire
 * swarm at once.
 *
 * For example, here is a complicated bot using mineflayer-pathfinder,
 * mineflayer-bloodhound, and minecraftHawkEye to create a swarm
 * that attacks as a group when 
 */

const mineflayerSwarm = require('mineflayer-swarm')
const mineflayer = require('mineflayer')
const vec3 = require('vec3')
const { pathfinder, Movements, goals: { GoalFollow, GoalCompositeAny } } = require('mineflayer-pathfinder')
const bloodhound = require('mineflayer-bloodhound')(mineflayer)
const hawkeye = require('minecrafthawkeye')

const swarm = mineflayerSwarm.createSwarm(require('./auth.json'), {
  host: 'localhost',
  port: 25565
})

const RANGE_GOAL = 5

swarm.loadPlugins([pathfinder, bloodhound, hawkeye])

// move as a swarm
swarm.on('spawn', bot => {
  const mcData = require('minecraft-data')(bot.version)
  const defaultMove = new Movements(bot, mcData)
  bot.pathfinder.setMovements(defaultMove)
  
  swarm.bots.forEach(bot1 => {
    var goals = [];

    Object.keys(bot1.players)
      .filter(swarm.isSwarmMember)
      .filter(username => bot1.players[username] && bot1.players[username].entity)
      .forEach(username => goals.push(new GoalFollow(bot1.players[username].entity, RANGE_GOAL)))

    bot1.pathfinder.setGoal(new GoalCompositeAny(goals))
  })
})

// attack threats
swarm.on('onCorrelateAttack', function (bot, attacker, victim, weapon) {
  if (!swarm.isSwarmMember(victim.username) || swarm.isSwarmMember(attacker.username))
    return
  // TODO
})
