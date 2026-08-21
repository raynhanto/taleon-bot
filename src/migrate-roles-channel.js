// One-time migration: upgrades #pick-your-platform to #pick-your-roles
// with sections for Platform, Book, and Notifications.

import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const NEW_MESSAGE = `📋 **Pick your roles** by reacting below!

📚 **PLATFORM** — where you read
📗 Royal Road Reader
📘 Scribble Hub Reader

📖 **BOOK** — what you're reading
🃏 Jester's Crew *(Evil Clown Evolution)*

🔔 **NOTIFICATIONS**
🔔 Notify: New Release`;

const REACTIONS = ['📗', '📘', '🃏', '🔔'];

async function main() {
  await client.login(process.env.DISCORD_BOT_TOKEN);
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  await guild.channels.fetch();
  await guild.roles.fetch();
  console.log('✅ Connected\n');

  // Create Jester's Crew role if it doesn't exist
  const existingRole = guild.roles.cache.find((r) => r.name === "Jester's Crew");
  if (existingRole) {
    console.log(`⏭️  Role "Jester's Crew" already exists`);
  } else {
    await guild.roles.create({
      name: "Jester's Crew",
      color: '#E74C3C',
      hoist: false,
      permissions: [],
      reason: 'Book reader role for Evil Clown Evolution',
    });
    console.log(`✅ Created role "Jester's Crew"`);
  }

  // Find and rename the channel
  const channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === 'pick-your-platform'
  );
  if (!channel) {
    console.error('❌ #pick-your-platform not found');
    process.exit(1);
  }

  await channel.setName('pick-your-roles');
  console.log('✅ Renamed #pick-your-platform → #pick-your-roles');

  // Delete old bot message
  const messages = await channel.messages.fetch({ limit: 20 });
  const oldMsg = messages.find((m) => m.author.id === client.user.id);
  if (oldMsg) {
    await oldMsg.delete();
    console.log('🗑️  Deleted old message');
  }

  // Post new message with reactions
  const newMsg = await channel.send(NEW_MESSAGE);
  for (const emoji of REACTIONS) {
    await newMsg.react(emoji);
    console.log(`  ✅ Added ${emoji}`);
  }

  console.log('\n🎉 Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
