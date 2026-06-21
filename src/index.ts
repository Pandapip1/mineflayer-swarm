import { Swarm } from './Swarm';
import type { SwarmAuth, SwarmOptions } from './types';

export { Swarm } from './Swarm';
export type { SwarmBot, SwarmOptions, SwarmAccount, SwarmAuth } from './types';

export function createSwarm (options: SwarmOptions, auth: SwarmAuth): Swarm {
  return new Swarm(options, auth);
}

export default {
  createSwarm,
  Swarm
};
