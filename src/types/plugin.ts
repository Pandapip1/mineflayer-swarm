import { Bot } from 'mineflayer';
import { ClientOptions } from 'minecraft-protocol';

/**
 * @callback Plugin A plugin that can be loaded into a bot.
 * @param {Bot} The bot to load the plugin into.
 * @param {ClientOptions} [opts] The bot's ClientOptions.
 */
export type Plugin = (((bot: Bot) => null) | ((bot: Bot, opts: ClientOptions) => null));

