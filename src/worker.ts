import { createRequire } from 'node:module';
import { EventEmitter } from 'node:stream';
import { createBot } from 'mineflayer';
import { ClientOptions } from 'minecraft-protocol';
import { SwarmBot, BotSwarmData } from './types';

export class SwarmWorker extends EventEmitter {
  bot?: SwarmBot;
  options: any extends ClientOptions;
  requirePlugin = createRequire(import.meta.url);

  constructor() {
    super();
  }
  
  async initialize (options: ClientOptions) {
    // fix for microsoft auth
    if (options.auth === 'microsoft') options.authTitle = '00000000402b5328';

    // create bot and save its options
    const bot: SwarmBot = createBot(options);
    this.options = options;
    bot.swarmOptions = new BotSwarmData();
    bot.swarmOptions.botOptions = options;

    // monkey patch bot.emit
    const oldEmit = bot.emit;
    bot.emit = (event, ...args) => {
      this.emit(event, bot, ...args);
      return oldEmit(event, ...args);
    };

    // add bot to swarm
    this.bot = bot;

    // remove disconnected members
    this.on('end', bot => {
      process.exit(0);
    });
  }

  /**
   * Check for the presence or absence of a member with a given name.
   * @returns {string} The bot's username
   */
  username (): string | undefined {
    return this?.bot?.username;
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

    this.plugins.push(name);
    if (this.bot?.swarmOptions.injectAllowed) {
      plugin()
    } else {
      this.bot.on('inject_allowed', {
        bot.swarmOptions.injectAllowed = true;
        for (const name in this.plugins) {
          this.plugins.map(this.requirePlugin).forEach(pl => pl(bot, bot.swarmOptions.botOptions));
        }
      });
    }
  }
}

export default new SwarmWorker();
