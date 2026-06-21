import type { BotOptions } from 'mineflayer';

export interface SwarmAccount extends Partial<BotOptions> {
  username: string
}

export type SwarmAuth = SwarmAccount[] | {
  accounts: SwarmAccount[]
};

export type SwarmOptions = Omit<Partial<BotOptions>, 'username'> & {
  host: string
  port?: number
  joinDelay?: number
  autoReconnect?: boolean
  reconnectDelay?: number
  reconnectMaxAttempts?: number
};

export interface SwarmReconnectOptions {
  enabled: boolean
  delay: number
  maxAttempts: number
}

export type SwarmWorkerOptions = Omit<SwarmOptions, 'joinDelay' | 'autoReconnect' | 'reconnectDelay' | 'reconnectMaxAttempts'>;

export interface SwarmBot {
  readonly id: number
  readonly username: string
  chat: (message: string) => void
  quit: (reason?: string) => void
}

export interface WorkerData {
  id: number
  options: SwarmWorkerOptions
  account: SwarmAccount
  reconnect: SwarmReconnectOptions
}

export type WorkerEventName = string;

export type WorkerToMainMessage =
  | { type: 'ready', id: number, username: string }
  | { type: 'event', id: number, event: WorkerEventName, args: unknown[] };

export type MainToWorkerMessage =
  | { type: 'chat', message: string }
  | { type: 'quit', reason?: string };
