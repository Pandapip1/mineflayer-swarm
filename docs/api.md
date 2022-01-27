## API Reference

### function createSwarm(auths: Partial\<ClientOptions\>[], options: Partial\<ClientOptions\> = {})

Creates a new Swarm object. Bots are removed from the swarm on disconnect.

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

#### async execAll\<Type\>(fun: ((bot: Bot) => Type | Promise\<Type\>)): Promise\<Type[]\>

Evaluates the given function (or async function) in the context of each bot, and returns the result.

#### loadPlugin(plugin: Plugin): void

Loads a plugin in all bots in the swarm.

#### loadPlugins(plugins: Plugin[]): void

Loads multiple plugins in all bots in the swarm.

#### hasPlugin(plugin: Plugin): boolean

Returns true if the given plugin is loaded in the swarm, otherwise returns false.
