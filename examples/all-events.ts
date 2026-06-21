import mineflayerSwarm from '../src';

const swarm = mineflayerSwarm.createSwarm({
  host: 'localhost',
  port: 25565,
  joinDelay: 8000,
  autoReconnect: true,
  reconnectDelay: 10000
}, [
  { username: 'BotOne' },
  { username: 'BotTwo' }
]);

swarm.on('error', (bot, error) => {
  console.error(`[${bot?.username ?? 'unknown'}] error`, error.message);
});

swarm.on('chat', (bot, username, message) => {
  if (swarm.isSwarmMember(username)) return;

  bot.chat(message);
});
