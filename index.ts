import { createBot, Bot } from 'mineflayer'
import { ClientOptions } from 'minecraft-protocol'
import EventEmitter from 'eventemitter3'
import assert from 'assert'

if (typeof process !== 'undefined' && parseInt(process.versions.node.split('.')[0]) < 14) {
  console.error('Your node version is currently', process.versions.node)
  console.error('Please update it to a version >= 14.x.x from https://nodejs.org/')
  process.exit(1)
}

type Plugin = (((bot: Bot) => any) | ((bot: Bot, opts: ClientOptions) => any))

class BotSwarmData {
  botOptions?: ClientOptions
  injectAllowed: boolean = false
}

interface SwarmBot extends Bot {
  swarmOptions?: BotSwarmData
}

export class Swarm extends EventEmitter {
  bots: SwarmBot[]
  plugins: Plugin[]
  options: Partial<ClientOptions>

  constructor (options: Partial<ClientOptions>) {
    super()
    this.bots = []
    this.plugins = []
    this.options = options

    this.on('error', (bot, ...errors) => console.error(...errors))

    // remove disconnected members
    this.on('end', bot => {
      this.bots = this.bots.filter(x => bot.username !== x.username)
    })

    // plugin injection
    this.on('inject_allowed', bot => {
      bot.swarmOptions.injectAllowed = true
      this.plugins.forEach((plugin) => {
        plugin(bot, bot.swarmOptions.botOptions)
      })
    })
  }

  addSwarmMember (auth: Partial<ClientOptions>): void {
    // fix for microsoft auth
    if (auth.auth === 'microsoft') auth.authTitle = '00000000402b5328'
    // create bot and save its options
    const botOptions: Partial<ClientOptions> = { ...this.options, ...auth }
    const bot: SwarmBot = createBot(botOptions as ClientOptions)
    bot.swarmOptions = new BotSwarmData()
    bot.swarmOptions.botOptions = botOptions as ClientOptions
    // monkey patch bot.emit
    const oldEmit = bot.emit
    bot.emit = (event, ...args) => {
      this.emit(event, this, ...args)
      return oldEmit(event, ...args)
    }
    // add bot to swarm
    this.bots.push(bot)
  }

  isSwarmMember (username: string): boolean {
    return this.bots.some(bot => bot.username === username)
  }

  async execAll<Type>(fun: ((bot: Bot) => Type | Promise<Type>)): Promise<Type[]> {
    return await Promise.all(this.bots.map(async bot => {
      let res = fun(bot)
      if (res instanceof Promise) res = await res
      return res
    }))
  }

  loadPlugin (plugin: Plugin): void {
    assert.ok(typeof plugin === 'function', 'plugin needs to be a function')

    if (this.hasPlugin(plugin)) {
      return
    }

    this.plugins.push(plugin)

    this.bots.forEach(bot => {
      if (bot.swarmOptions?.botOptions !== undefined && bot.swarmOptions?.injectAllowed) {
        plugin(bot, bot.swarmOptions.botOptions)
      }
    })
  }

  loadPlugins (plugins: Plugin[]): void {
    plugins.forEach(this.loadPlugin)
  }

  hasPlugin (plugin: Plugin): boolean {
    return this.plugins.includes(plugin)
  }
}

export function createSwarm (auths: Array<Partial<ClientOptions>>, options: Partial<ClientOptions> = {}): Swarm {
  // create swarm object
  const swarm = new Swarm(options)

  // init swarm
  auths.forEach(swarm.addSwarmMember)

  return swarm
}
