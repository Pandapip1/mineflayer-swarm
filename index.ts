import { createBot, Bot } from 'mineflayer';
import { ClientOptions } from 'minecraft-protocol';
import EventEmitter from 'eventemitter3';
import assert from 'assert';
import { createRequire } from 'node:module';

if (typeof process !== 'undefined' && parseInt(process.versions.node.split('.')[0]) < 16) {
  console.error('Your node version is currently', process.versions.node);
  console.error('Please update it to a version >= 16.x.x from https://nodejs.org/');
  process.exit(1);
}

export type Plugin = (((bot: Bot) => null) | ((bot: Bot, opts: ClientOptions) => null));

export class BotSwarmData {
  botOptions?: ClientOptions;
  injectAllowed = false;
}

export interface ISwarm {
  say: () => string
}

interface SwarmBot extends Bot {
  swarmOptions?: BotSwarmData
}

export class Swarm extends EventEmitter {
  bots: SwarmBot[];
  plugins: { [key: string]: Plugin };
  options: Partial<ClientOptions>;
  requirePlugin = createRequire(import.meta.url);

  constructor (options: Partial<ClientOptions>) {
    super();
    this.bots = [];
    this.plugins = {};
    this.options = options;

    this.on('error', (bot, ...errors) => console.error(...errors));

    // remove disconnected members
    this.on('end', bot => {
      this.bots = this.bots.filter(x => bot.username !== x.username);
    });

    // plugin injection
    this.on('inject_allowed', bot => {
      bot.swarmOptions.injectAllowed = true;
      for (const name in this.plugins) {
        this.plugins[name](bot, bot.swarmOptions.botOptions);
      }
    });
  }

  addSwarmMember (auth: Partial<ClientOptions>): void {
    // fix for microsoft auth
    if (auth.auth === 'microsoft') auth.authTitle = '00000000402b5328';
    // create bot and save its options
    const botOptions: Partial<ClientOptions> = { ...this.options, ...auth };
    const bot: SwarmBot = createBot(botOptions as ClientOptions);
    bot.swarmOptions = new BotSwarmData();
    bot.swarmOptions.botOptions = botOptions as ClientOptions;
    // monkey patch bot.emit
    const oldEmit = bot.emit;
    bot.emit = (event, ...args) => {
      this.emit(event, this, ...args);
      return oldEmit(event, ...args);
    };
    // add bot to swarm
    this.bots.push(bot);
  }

  isSwarmMember (username: string): boolean {
    return this.bots.some(bot => bot.username === username);
  }

  loadPlugin (name: string, plugin?: Plugin | undefined): void {
    let resolvedPlugin: Plugin = plugin as Plugin; // Ugly: fixme
    if (typeof plugin === 'undefined') {
      resolvedPlugin = this.requirePlugin(name) as Plugin;
    }

    assert.ok(typeof plugin === 'function', 'plugin needs to be a function');

    if (this.hasPlugin(name)) {
      return;
    }

    this.plugins[name] = plugin;

    this.bots.forEach(bot => {
      if (bot.swarmOptions?.botOptions !== undefined && bot.swarmOptions?.injectAllowed) {
        resolvedPlugin(bot, bot.swarmOptions.botOptions);
      }
    });
  }

  hasPlugin (name: string): boolean {
    return Object.keys(this.plugins).includes(name);
  }
}

export function createSwarm (auths: Array<Partial<ClientOptions>>, options: Partial<ClientOptions> = {}): Swarm {
  // create swarm object
  const swarm = new Swarm(options);

  // init swarm
  auths.forEach(swarm.addSwarmMember);

  return swarm;
}
