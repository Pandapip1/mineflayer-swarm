/*
 * mineflayer-swarm supports loading mineflayer plugins into the entire
 * swarm at once.
 *
 * For example, here is a complicated bot using mineflayer-pathfinder,
 * mineflayer-bloodhound, and minecraftHawkEye to create a swarm
 * that attacks as a group when attacked.
 */

const mineflayerSwarm = require('mineflayer-swarm')
const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals: { GoalFollow, GoalCompositeAny, GoalCompositeAll, GoalInvert } } = require('mineflayer-pathfinder')
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

  const nearGoals = []
  const distanceGoals = []

  Object.keys(bot.players).forEach(username => {
    if (username === bot.username || !swarm.isSwarmMember(username) || !bot.players[username].entity) return
    nearGoals.push(new GoalFollow(bot.players[username].entity, RANGE_GOAL))
    distanceGoals.push(new GoalInvert(new GoalFollow(bot.players[username].entity, RANGE_GOAL - 1)))
  })

  bot.pathfinder.setGoal(new GoalCompositeAll([new GoalCompositeAny(nearGoals), ...distanceGoals]))
})

// attack threats
swarm.on('onCorrelateAttack', function (bot, attacker, victim, weapon) {
  if (!swarm.isSwarmMember(victim.username) || swarm.isSwarmMember(attacker.username)) return
  bot.hawkEye.autoAttack(attacker, 'crossbow')

  const distanceGoals = []

  Object.keys(bot.players).forEach(username => {
    if (username !== bot.username && swarm.isSwarmMember(username) && bot.players[username].entity) return
    distanceGoals.push(new GoalInvert(new GoalFollow(bot.players[username].entity, RANGE_GOAL - 1)))
  })

  bot.pathfinder.setGoal(new GoalCompositeAll([new GoalFollow(attacker, RANGE_GOAL), ...distanceGoals]))
})
