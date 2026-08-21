// Adds emoji reactions to the #pick-your-platform message so members
// can click to assign roles (Carl-bot maps the reactions to roles).

import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const REACTIONS = ['📗', '📘', '🔔'];

async function main() {
  await client.login(process.env.DISCORD_BOT_TOKEN);
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  await guild.channels.fetch();

  const channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === 'pick-your-platform'
  );
  if (!channel) throw new Error('#pick-your-platform channel not found');

  const messages = await channel.messages.fetch({ limit: 10 });
  const botMessage = messages.find((m) => m.author.id === client.user.id);
  if (!botMessage) throw new Error('Could not find the bot message in #pick-your-platform');

  console.log(`✅ Found message, adding reactions...`);
  for (const emoji of REACTIONS) {
    await botMessage.react(emoji);
    console.log(`  ✅ Added ${emoji}`);
  }

  console.log('\n🎉 Done! Members can now click the reactions to self-assign roles.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
