import { ClientOptions } from 'minecraft-protocol';
import { createThreadPool } from 'thread-puddle';
import { createRequire } from 'module';
import { ConnectionOptions, AuthenticationOptions, Puddle } from './types';
import { ModifiedBot } from './worker';
import { EventEmitter } from 'eventemitter3';

/**
 * Creates a new Swarm object. Bots are removed from the swarm on disconnect.
 * @param {ConnectionOptions} options - Connection options for the swarm.
 * @param {AuthenticationOptions[]} [auths] - A list of initial authentication options for each member of the swarm. Defaults to no members.
 * @returns {Swarm} A newly created swarm.
 */
export async function createSwarm (options: ConnectionOptions, auths: AuthenticationOptions[] = []): Promise<Swarm> {
  // create swarm object
  const swarm = new Swarm(options);

  // init swarm
  await Promise.all(auths.map(swarm.addSwarmMember));

  return swarm;
}

/**
 * Represents a swarm of mineflayer bots. Bots are removed from the swarm on disconnect.
 * @see createSwarm to create a swarm object.
 */
export class Swarm extends EventEmitter {
  options: Partial<ClientOptions>;
  bots: Array<Puddle<ModifiedBot>> = [];
  plugins: string[] = [];
  requirePlugin = createRequire(import.meta.url);

  constructor (options: Partial<ClientOptions>) {
    super();
    this.options = options;
  }

  /**
   * Check for the presence or absence of a member with a given name.
   * @param {AuthenticationOptions} auth - The authentication information to create the swarm member with.
   */
  async addSwarmMember (auth: AuthenticationOptions): Promise<void> {
    // create bot and save its options
    const botOptions = { ...this.options, ...auth } as ClientOptions; // eslint-disable-line @typescript-eslint/consistent-type-assertions
    const bot = await createThreadPool<ModifiedBot>('./worker', {
      size: 1,
      workerOptions: {
        workerData: botOptions
      }
    });

    // Load plugins
    await Promise.all(this.plugins.map(async plugin => await bot.loadPluginByName(plugin)));

    // add bot to swarm
    this.bots.push(bot);
  }

  /**
   * Check for the presence or absence of a member with a given name.
   * @param {string} username - The username to query for.
   * @returns {boolean} Returns true if the given username is contained in the swarm, otherwise returns false.
   */
  async isSwarmMember (username: string): Promise<boolean> {
    return (await Promise.all(this.bots.map(async bot => bot.getProperty('username')))).some(name => name === username);
  }

  /**
   * Load a plugin
   * @param {string} plugin - The plugin to add.
   * @returns {boolean} Returns true if the given plugin is loaded in the swarm, otherwise returns false.
   */
  async loadPlugin (plugin: string): Promise<void> { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (await this.hasPlugin(plugin)) {
      return;
    }

    this.plugins.push(plugin);

    await Promise.all(this.bots.map(async bot => await bot.loadPluginByName(plugin)));
  }

  /**
   * Check for the presence or absence of a plugin with a given name.
   * @param {string} name - The plugin to query for.
   * @returns {boolean} Returns true if the given plugin is loaded in the swarm, otherwise returns false.
   */
  async hasPlugin (name: string): Promise<boolean> {
    return Object.keys(this.plugins).includes(name);
  }
}
