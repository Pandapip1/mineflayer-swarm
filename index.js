if (typeof process !== 'undefined' && parseInt(process.versions.node.split('.')[0]) < 14) {
  console.error('Your node version is currently', process.versions.node)
  console.error('Please update it to a version >= 14.x.x from https://nodejs.org/')
  process.exit(1)
}

const mineflayer = require('mineflayer')
const { EventEmitter } = require('events')
const assert = require('assert')

async function createSwarm (auths, options = {}) {
  const swarm = new EventEmitter()
  // properties
  swarm.bots = []
  swarm.plugins = []
  // methods
  swarm.addSwarmMember = async function (auth) {
    const bot = mineflayer.createBot({ ...options, ...auth })
    bot.my_opts = { ...options, ...auth }
    bot.onAny(swarm.emit) // nice shortcut
    swarm.bots.push(bot)
  }
  swarm.isSwarmMember = function (username) {
    return swarm.bots.any(bot => bot.username === username)
  }
  swarm.execAll = async function (fun) {
    return await Promise.all(swarm.bots.map(async bot => {
      let res = fun(bot)
      if (res instanceof Promise) res = await res
      return res
    }))
  }
  swarm.loadPlugin = function (plugin) {
    assert.ok(typeof plugin === 'function', 'plugin needs to be a function')

    if (swarm.hasPlugin(plugin)) {
      return
    }
    
    swarm.plugins.push(plugin)

    swarm.bots.forEach(bot => {
      if (bot.inject_allowed) plugin(bot, bot.my_opts)
    })
  }
  swarm.loadPlugins = function (plugins) {
    assert.ok(plugins.every(plugin => typeof plugin === 'function'), 'plugins need to be an array of functions')

    plugins.forEach((plugin) => {
      swarm.loadPlugin(plugin)
    })
  }
  swarm.hasPlugin = function (plugin) {
    return swarm.plugins.indexOf(plugin) >= 0
  }
  // init swarm
  auths.forEach(swarm.addSwarmMember)
  // remove disconnected members
  swarm.on('end', bot => {
    swarm.bots = swarm.bots.filter(x => bot.username !== x.username)
  })
  // plugin injection
  swarm.on('inject_allowed', bot => {
    bot.inject_allowed = true
    swarm.plugins.forEach((plugin) => {
      plugin(bot, options)
    })
  })
  
  return swarm
}

module.exports = {
  createSwarm
}
