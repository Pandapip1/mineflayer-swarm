## API Reference

### function createSwarm(auths: Partial\<ClientOptions\>[], options: Partial\<ClientOptions\> = {})

## Description

Creates a new Swarm object. Bots are removed from the swarm on disconnect.

## Example

```js
import { createSwarm, Swarm } from 'mineflayer';

const swarm: Swarm = mineflayerSwarm.createSwarm(require('auth.json'), {
  host: 'localhost',
  port: 25565
});
```

### type Plugin

Represents a mineflyer plugin. It's a function that either takes the bot as an argument or the bot and its options.

### interface BotSwarm

Represents a mineflayer Bot that is a part of a Swarm.

### class Swarm extends EventEmitter

#### constructor(options: Partial\<ClientOptions\>)

Creates a swarm of bots. Use createSwarm instead.

#### async addSwarmMember(auth: Partial\<ClientOptions\>): void

Adds a member to a swarm.

#### isSwarmMember(username: string): boolean

Returns whether a bot in the swarm has the given username.

#### loadPlugin(plugin: String): void

Loads a plugin with the given package in all bots in the swarm.

```js
swarm.loadPlugin('');
```

#### hasPlugin(plugin: String): boolean

Returns true if the given plugin is loaded in the swarm, otherwise returns false.
