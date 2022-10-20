import { ClientOptions } from 'minecraft-protocol';

/**
 * @typedef {Object} BotSwarmData - Data about bots stored by the swarm.
 * @property {ClientOptions} [botOptions] - The bot's ClientOptions.
 * @property {boolean} injectAllowed - Whether the bot is ready for plugin injection.
 */
export class BotSwarmData {
  botOptions?: ClientOptions;
  injectAllowed = false;
}
