import { ClientOptions } from 'minecraft-protocol';
import { spawn, Thread, Worker, ModuleThread } from 'threads';
import { BotWorker } from './worker';

if (typeof process !== 'undefined' && parseInt(process.versions.node.split('.')[0]) < 16) {
  console.error('Your node version is currently', process.versions.node);
  console.error('Please update it to a version >= 16.x.x from https://nodejs.org/');
  process.exit(1);
}

export default class Swarm {
  workers: ModuleThread<BotWorker>[];
  plugins: string[];
  options: Partial<ClientOptions>;

  constructor (options: Partial<ClientOptions>) {
    this.workers = [];
    this.plugins = [];
    this.options = options;
  }

  async addSwarmMember (auth: Partial<ClientOptions>) {
    // Fix for MS Auth
    if (auth.auth === 'microsoft') auth.authTitle = '00000000402b5328';

    // Create Bot
    const worker = await spawn<BotWorker>(new Worker("./worker"));
    const endObservable = worker.initialize({ ...this.options, ...auth } as ClientOptions);
    this.workers.push(worker);
    
    // Load Plugins
    await Promise.all(this.plugins.map(worker.loadPlugin));

    // Remove on DC
    endObservable.subscribe(() => {
      Thread.terminate(worker);
    });
  }

  async loadPlugin (plugin: string) {
    this.plugins.push(plugin);
  }
}
