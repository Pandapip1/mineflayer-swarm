import { Bot } from 'mineflayer';
import { ClientOptions } from 'minecraft-protocol';
import { BotSwarmData } from './botSwarmData.ts';

/**
 * @typedef {Object} SwarmBot - A bot in a swarm.
 * @property {BotSwarmData} [swarmOptions] - The bot's BotSwarmData.
 */
export interface SwarmBot extends Bot {
  swarmOptions?: BotSwarmData
}
