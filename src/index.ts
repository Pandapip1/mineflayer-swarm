import { createBot, Bot } from 'mineflayer';
import { ClientOptions } from 'minecraft-protocol';
import EventEmitter from 'eventemitter3';
import assert from 'assert';
import { createRequire } from 'node:module';

export * from './types/index';

if (typeof process !== 'undefined' && parseInt(process.versions.node.split('.')[0]) < 16) {
  console.error('Your node version is currently', process.versions.node);
  console.error('Please update it to a version >= 16.x.x from https://nodejs.org/');
  process.exit(1);
}

/**
 * Creates a new Swarm object. Bots are removed from the swarm on disconnect.
 * @param {ConnectionOptions} options - Connection options for the swarm.
 * @param {AuthenticationOptions[]} [auths] - A list of initial authentication options for each member of the swarm. Defaults to no members.
 * @returns {Swarm} A newly created swarm.
 */
export function createSwarm (options: ConnectionOptions, auths: AuthenticationOptions[] = []): Swarm {
  // create swarm object
  const swarm = new Swarm(options);

  // init swarm
  auths.forEach(swarm.addSwarmMember);

  return swarm;
}

/**
 * Represents a swarm of mineflayer bots. Bots are removed from the swarm on disconnect.
 * @see createSwarm to create a swarm object.
 */
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

  /**
   * Check for the presence or absence of a member with a given name.
   * @param {AuthenticationOptions} auth - The authentication information to create the swarm member with.
   */
  addSwarmMember (auth: AuthenticationOptions): void {
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

  /**
   * Check for the presence or absence of a member with a given name.
   * @param {string} username - The username to query for.
   * @returns {boolean} Returns true if the given username is contained in the swarm, otherwise returns false.
   */
  isSwarmMember (username: string): boolean {
    return this.bots.some(bot => bot.username === username);
  }

  /**
   * Load a plugin
   * @param {string} name - The plugin to add.
   * @returns {boolean} Returns true if the given plugin is loaded in the swarm, otherwise returns false.
   */
  loadPlugin (name: string): void {
    let plugin: Plugin = this.requirePlugin(name);

    if (this.hasPlugin(name)) {
      return;
    }

    this.plugins[name] = plugin;

    this.bots.forEach(bot => {
      if (bot.swarmOptions?.botOptions !== undefined && bot.swarmOptions?.injectAllowed) {
        plugin(bot, bot.swarmOptions.botOptions);
      }
    });
  }

  /**
   * Check for the presence or absence of a plugin with a given name.
   * @param {string} name - The plugin to query for.
   * @returns {boolean} Returns true if the given plugin is loaded in the swarm, otherwise returns false.
   */
  hasPlugin (name: string): boolean {
    return Object.keys(this.plugins).includes(name);
  }
}
