import { Bot, createBot } from 'mineflayer';
import { ClientOptions } from 'minecraft-protocol';
import { workerData } from 'worker_threads';
import { createRequire } from 'module';

export type ModifiedBot = Bot & { loadPluginByName: (name: string) => void, getProperty: (name: keyof Bot) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

const options: ClientOptions = workerData;

// fix for microsoft auth
if (options.auth === 'microsoft') options.authTitle = '00000000402b5328';

// create bot and save its options
const bot = createBot(options) as ModifiedBot;

// Add module name-based plugin loading
const requirePlugin = createRequire(import.meta.url);
let injectAllowed = false;
bot.on('inject_allowed', () => {
  injectAllowed = true;
});
bot.loadPluginByName = (name: string) => {
  if (!injectAllowed) {
    bot.on('inject_allowed', () => {
      injectAllowed = true;
      bot.loadPluginByName(name);
    });
  } else {
    const plugin = requirePlugin(name);
    plugin(bot, options);
  }
};
bot.getProperty = (name: keyof Bot) => {
  return bot[name];
};

// remove disconnected members
bot.on('end', _ => {
  process.exit(0);
});

// Return the bot as the worker
export default bot;
