import { EventEmitter } from 'node:events';
import { Worker } from 'node:worker_threads';
import path from 'node:path';
import type {
  MainToWorkerMessage,
  SwarmAccount,
  SwarmAuth,
  SwarmBot,
  SwarmOptions,
  SwarmReconnectOptions,
  SwarmWorkerOptions,
  WorkerToMainMessage
} from './types';

export interface SwarmEvents {
  ready: [bot: SwarmBot]
  event: [eventName: string, bot: SwarmBot, ...args: unknown[]]
  login: [bot: SwarmBot]
  spawn: [bot: SwarmBot]
  chat: [bot: SwarmBot, username: string, message: string]
  kicked: [bot: SwarmBot, reason: string, loggedIn: boolean]
  end: [bot: SwarmBot]
  death: [bot: SwarmBot]
  reconnect: [bot: SwarmBot, attempt: number, delay: number]
  error: [bot: SwarmBot | undefined, error: Error]
}

type SwarmEventName = keyof SwarmEvents;

class SwarmBotProxy implements SwarmBot {
  constructor (
    public readonly id: number,
    public readonly username: string,
    private readonly worker: Worker
  ) {}

  chat (message: string): void {
    this.send({ type: 'chat', message });
  }

  quit (reason?: string): void {
    this.send({ type: 'quit', reason });
  }

  private send (message: MainToWorkerMessage): void {
    this.worker.postMessage(message);
  }
}

export class Swarm extends EventEmitter {
  private readonly bots = new Map<number, SwarmBotProxy>();
  private readonly workers = new Map<number, Worker>();
  private readonly startTimers = new Map<number, NodeJS.Timeout>();
  private readonly memberNames = new Set<string>();

  constructor (
    private readonly options: SwarmOptions,
    auth: SwarmAuth
  ) {
    super();

    this.start(normalizeAuth(auth));
  }

  override on<EventName extends SwarmEventName> (
    eventName: EventName,
    listener: (...args: SwarmEvents[EventName]) => void
  ): this;
  override on (
    eventName: string | symbol,
    listener: (...args: unknown[]) => void
  ): this {
    return super.on(eventName, listener);
  }

  override once<EventName extends SwarmEventName> (
    eventName: EventName,
    listener: (...args: SwarmEvents[EventName]) => void
  ): this;
  override once (
    eventName: string | symbol,
    listener: (...args: unknown[]) => void
  ): this {
    return super.once(eventName, listener);
  }

  override emit<EventName extends SwarmEventName> (
    eventName: EventName,
    ...args: SwarmEvents[EventName]
  ): boolean;
  override emit (
    eventName: string | symbol,
    ...args: unknown[]
  ): boolean {
    return super.emit(eventName, ...args);
  }

  isSwarmMember (username: string): boolean {
    return this.memberNames.has(username.toLowerCase());
  }

  getBots (): SwarmBot[] {
    return [...this.bots.values()];
  }

  getBot (username: string): SwarmBot | undefined {
    const normalized = username.toLowerCase();
    return this.getBots().find(bot => bot.username.toLowerCase() === normalized);
  }

  chatAll (message: string): void {
    for (const bot of this.bots.values()) {
      bot.chat(message);
    }
  }

  quitAll (reason?: string): void {
    for (const timer of this.startTimers.values()) {
      clearTimeout(timer);
    }

    this.startTimers.clear();

    for (const bot of this.bots.values()) {
      bot.quit(reason);
    }
  }

  private start (accounts: SwarmAccount[]): void {
    const {
      joinDelay = 5000,
      autoReconnect = true,
      reconnectDelay = 10000,
      reconnectMaxAttempts = Number.POSITIVE_INFINITY,
      ...botOptions
    } = this.options;
    const reconnect: SwarmReconnectOptions = {
      enabled: autoReconnect,
      delay: reconnectDelay,
      maxAttempts: reconnectMaxAttempts
    };

    accounts.forEach((account, index) => {
      this.memberNames.add(account.username.toLowerCase());

      const startBot = (): void => {
        this.startTimers.delete(index);
        this.startWorker(index, account, botOptions, reconnect);
      };

      if (index === 0) {
        startBot();
        return;
      }

      const timer = setTimeout(startBot, index * joinDelay);
      this.startTimers.set(index, timer);
    });
  }

  private startWorker (
    index: number,
    account: SwarmAccount,
    options: SwarmWorkerOptions,
    reconnect: SwarmReconnectOptions
  ): void {
    const worker = new Worker(path.join(__dirname, 'worker.js'), {
      workerData: {
        id: index,
        options,
        account,
        reconnect
      }
    });

    this.workers.set(index, worker);
    worker.on('message', message => { this.handleWorkerMessage(worker, message as WorkerToMainMessage); });
    worker.on('error', error => { this.emitError(this.bots.get(index), error); });
    worker.on('exit', () => {
      this.workers.delete(index);
      this.bots.delete(index);
    });
  }

  private handleWorkerMessage (worker: Worker, message: WorkerToMainMessage): void {
    if (message.type === 'ready') {
      const bot = new SwarmBotProxy(message.id, message.username, worker);
      this.bots.set(message.id, bot);
      this.emit('ready', bot);
      return;
    }

    const bot = this.bots.get(message.id);

    if (message.event === 'error') {
      if (bot !== undefined) {
        super.emit('event', message.event, bot, ...message.args);
      }

      this.emitError(bot, createError(message.args[0]));
      return;
    }

    if (bot === undefined) return;

    super.emit('event', message.event, bot, ...message.args);
    super.emit(message.event, bot, ...message.args);
  }

  private emitError (bot: SwarmBot | undefined, error: Error): void {
    if (bot !== undefined) {
      super.emit('event', 'error', bot, error);
    }

    if (this.listenerCount('error') > 0) {
      super.emit('error', bot, error);
    }
  }
}

function createError (value: unknown): Error {
  if (value instanceof Error) return value;

  if (typeof value === 'object' && value !== null && 'message' in value) {
    return new Error(String(value.message));
  }

  return new Error(String(value));
}

function normalizeAuth (auth: SwarmAuth): SwarmAccount[] {
  const accounts = Array.isArray(auth) ? auth : auth.accounts;

  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error('Swarm auth must contain at least one account.');
  }

  for (const account of accounts) {
    if (typeof account.username !== 'string' || account.username.trim() === '') {
      throw new Error('Every swarm account needs a username.');
    }
  }

  return accounts;
}
