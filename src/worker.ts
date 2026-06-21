import { parentPort, workerData } from 'node:worker_threads';
import mineflayer from 'mineflayer';
import type { Bot } from 'mineflayer';
import type { MainToWorkerMessage, WorkerData, WorkerEventName, WorkerToMainMessage } from './types';

const data: WorkerData = workerData;
interface RuntimeEmitter {
  emit: (eventName: string | symbol, ...args: unknown[]) => boolean
}

let bot: Bot | undefined;
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | undefined;
let stopped = false;

post({ type: 'ready', id: data.id, username: data.account.username });

connect();

parentPort?.on('message', (message: MainToWorkerMessage) => {
  switch (message.type) {
    case 'chat':
      bot?.chat(message.message);
      break;
    case 'quit':
      stopped = true;
      clearReconnectTimer();
      bot?.quit(message.reason);
      break;
  }
});

function connect (): void {
  try {
    bot = mineflayer.createBot({
      ...data.options,
      ...data.account
    });
  } catch (error) {
    postEvent('error', [serializeArg(error)]);
    scheduleReconnect();
    return;
  }

  forwardAllEvents(bot);

  bot.on('login', () => {
    reconnectAttempts = 0;
  });
  bot.on('end', () => {
    scheduleReconnect();
  });
  bot.on('error', () => {});
}

function scheduleReconnect (): void {
  if (stopped || !data.reconnect.enabled || reconnectTimer !== undefined) return;
  if (reconnectAttempts >= data.reconnect.maxAttempts) return;

  reconnectAttempts += 1;
  postEvent('reconnect', [reconnectAttempts, data.reconnect.delay]);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    connect();
  }, data.reconnect.delay);
}

function clearReconnectTimer (): void {
  if (reconnectTimer === undefined) return;

  clearTimeout(reconnectTimer);
  reconnectTimer = undefined;
}

function postEvent (event: WorkerEventName, args: unknown[] = []): void {
  const message: WorkerToMainMessage = { type: 'event', id: data.id, event, args };
  post(message);
}

function forwardAllEvents (target: Bot): void {
  const runtimeTarget = target as unknown as RuntimeEmitter;
  const originalEmit = runtimeTarget.emit.bind(runtimeTarget);

  const forwardingEmit = (eventName: string | symbol, ...args: unknown[]): boolean => {
    if (typeof eventName === 'string') {
      postEvent(eventName, args.map(arg => serializeArg(arg)));
    }

    return originalEmit(eventName, ...args);
  };

  Object.defineProperty(target, 'emit', {
    value: forwardingEmit
  });
}

function serializeArg (arg: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (typeof arg === 'symbol') return String(arg);
  if (typeof arg === 'function') return `[Function: ${arg.name === '' ? 'anonymous' : arg.name}]`;

  if (arg instanceof Error) {
    return {
      name: arg.name,
      message: arg.message,
      stack: arg.stack
    };
  }

  if (arg === null || typeof arg !== 'object') return arg;
  if (seen.has(arg)) return '[Circular]';
  if (depth >= 3) return `[${arg.constructor.name}]`;

  seen.add(arg);

  if (Array.isArray(arg)) {
    return arg.map(value => serializeArg(value, seen, depth + 1));
  }

  const result: Record<string, unknown> = {};

  for (const key of Object.keys(arg)) {
    let value: unknown;

    try {
      value = (arg as Record<string, unknown>)[key];
    } catch (error) {
      result[key] = `[Thrown getter: ${error instanceof Error ? error.message : String(error)}]`;
      continue;
    }

    if (typeof value === 'function') continue;

    result[key] = serializeArg(value, seen, depth + 1);
  }

  return result;
}

function post (message: WorkerToMainMessage): void {
  try {
    parentPort?.postMessage(message);
  } catch (error) {
    if (message.type === 'event' && message.event === 'error') return;

    parentPort?.postMessage({
      type: 'event',
      id: data.id,
      event: 'error',
      args: [serializeArg(error)]
    });
  }
}
