import { createBot, Bot } from 'mineflayer';
import { ClientOptions } from 'minecraft-protocol';
import assert from 'assert';
import { expose } from 'threads/worker';
import { Subject } from 'observable-fns';

type Plugin = (((bot: Bot) => null) | ((bot: Bot, opts: ClientOptions) => null));

let hasInitialized : boolean = false;
let bot : Bot;

let hasPluginAbility : boolean = false;
let allPlugins : Plugin[] = [];

let doRelog = true;
let exponentialBackoff : number = 1;
let backoffTimeout : NodeJS.Timeout;
let relogTimeout : NodeJS.Timeout;

const swarmBot = {
    initialize(options : ClientOptions) : Subject<boolean> {
        assert(!hasInitialized, 'Bot already initialized.');

        const subject = new Subject<boolean>();

        bot = createBot(options);
        hasInitialized = true;

        let ogEnd : (reason?: string | undefined) => void = bot.end;
        bot.end = (reason?: string | undefined) => {
            doRelog = false;
            ogEnd(reason);
        };

        bot.on('inject_allowed', () => {
            hasPluginAbility = true;
            allPlugins.forEach(bot.loadPlugin);
        });

        bot.once('end', () => {
            if (doRelog) {
                if (backoffTimeout){
                    clearTimeout(backoffTimeout);
                }

                hasInitialized = false;
                hasPluginAbility = false;

                relogTimeout = setTimeout(() => {
                    swarmBot.initialize(options);

                    backoffTimeout = setTimeout(() => {
                        exponentialBackoff = 1;
                    }, 5000);
                }, exponentialBackoff * 1000);

                exponentialBackoff *= 2;
            } else {
                subject.next(false);
                subject.complete();
            }
        });

        return subject;
    },
    loadPlugin(plugin: string) {
        let loadedPlugin : Plugin = require(plugin);
        allPlugins.push(loadedPlugin);

        if (hasPluginAbility) {
            bot.loadPlugin(loadedPlugin);
        }
    }
}

export type BotWorker = typeof swarmBot;

expose(swarmBot);
