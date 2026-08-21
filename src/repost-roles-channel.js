// One-time script: replaces the single pick-your-roles message with
// separate messages per category, each with their own reactions.

import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CATEGORIES = [
  {
    message: `📚 **PLATFORM** — Where do you read?\n📗 Royal Road Reader\n📘 Scribble Hub Reader`,
    reactions: ['📗', '📘'],
  },
  {
    message: `📖 **NOVEL** — Which book are you reading?\n🃏 Jester's Crew *(Evil Clown Evolution)*`,
    reactions: ['🃏'],
  },
  {
    message: `🔔 **NOTIFICATIONS** — Get pinged for new chapters\n🔔 Notify: New Release`,
    reactions: ['🔔'],
  },
];

async function main() {
  await client.login(process.env.DISCORD_BOT_TOKEN);
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  await guild.channels.fetch();

  const channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === 'pick-your-roles'
  );
  if (!channel) {
    console.error('❌ #pick-your-roles not found');
    process.exit(1);
  }

  // Delete all existing bot messages
  const messages = await channel.messages.fetch({ limit: 20 });
  const botMessages = messages.filter((m) => m.author.id === client.user.id);
  for (const msg of botMessages.values()) {
    await msg.delete();
  }
  console.log(`🗑️  Cleared ${botMessages.size} old message(s)\n`);

  // Post each category as its own message, with a spacer in between
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (i > 0) await channel.send('ㅤ'); // invisible spacer breaks Discord's message grouping

    const cat = CATEGORIES[i];
    const msg = await channel.send(cat.message);
    for (const emoji of cat.reactions) {
      await msg.react(emoji);
      console.log(`  ✅ Added ${emoji}`);
    }
    console.log(`✅ Posted: ${cat.message.split('\n')[0]}\n`);
  }

  console.log('🎉 Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
