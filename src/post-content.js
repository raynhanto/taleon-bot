// One-time script: creates platform roles, adds #pick-your-platform
// channel, and posts content to #welcome, #rules, #pick-your-platform.

import { Client, GatewayIntentBits, ChannelType, PermissionsBitField } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const PLATFORM_ROLES = [
  { name: 'Royal Road Reader',    color: '#F5A623' },
  { name: 'Scribble Hub Reader',  color: '#7B68EE' },
];

const WELCOME_MESSAGE = `Welcome to the Frost Taleon community! 👋

This is the official Discord for Evil Clown Evolution and future Frost Taleon novels. Glad you're here.

📌 Start here:
→ Read #rules
→ Pick your reading platform in #pick-your-platform
→ Grab a notification role in #pick-your-platform
→ Say hi in #general-chat

📖 Read Evil Clown Evolution:
→ Royal Road: https://www.royalroad.com/fiction/187602/evil-clown-evolution-a-vrmmorpg-adventure
→ Scribble Hub: https://www.scribblehub.com/series/2511751/evil-clown-evolution-a-vrmmorpg-adventure/

💜 Read ahead on Patreon:
https://patreon.com/FrostTaleon`;

const RULES_MESSAGE = `A few rules to keep this a good place for everyone.

1. Be respectful — no harassment, hate speech, or personal attacks.
2. Keep spoilers in #spoilers — don't spoil Patreon-ahead chapters in general channels.
3. No spam or self-promotion without asking first.
4. Keep topics in the right channels — novel discussion in the ECE channels, off-topic in #off-topic.
5. No piracy — don't share or request illegal copies of any novel.

Repeated violations = mute or ban. Use common sense and we'll all get along fine.`;

const PLATFORM_MESSAGE = `Pick the platform(s) you read on and we'll tag you for platform-specific news.

📗 Royal Road Reader
📘 Scribble Hub Reader

🔔 Notify: New Release — get pinged for every new chapter drop across any novel

React below to assign your roles.
(Reactions powered by Carl-bot — set up reaction roles in Carl-bot once it's invited.)`;

async function ensureRole(guild, roleDef) {
  const existing = guild.roles.cache.find((r) => r.name === roleDef.name);
  if (existing) {
    console.log(`⏭️  Role "${roleDef.name}" already exists`);
    return existing;
  }
  const role = await guild.roles.create({
    name: roleDef.name,
    color: roleDef.color,
    hoist: false,
    permissions: [],
    reason: 'Platform role for self-assign channel',
  });
  console.log(`✅ Created role "${roleDef.name}"`);
  return role;
}

async function ensureChannel(guild, name, categoryName) {
  const category = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === categoryName
  );
  if (!category) throw new Error(`Category "${categoryName}" not found`);

  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === name && c.parentId === category.id
  );
  if (existing) {
    console.log(`⏭️  Channel "#${name}" already exists`);
    return existing;
  }
  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: category.id,
    reason: 'Automated server setup',
  });
  console.log(`✅ Created channel "#${name}"`);
  return channel;
}

async function postToChannel(guild, channelName, message) {
  const channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === channelName
  );
  if (!channel) {
    console.log(`⚠️  Channel "#${channelName}" not found — skipping`);
    return;
  }
  await channel.send(message);
  console.log(`✅ Posted to #${channelName}`);
}

async function main() {
  await client.login(process.env.DISCORD_BOT_TOKEN);
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  console.log(`✅ Connected to server\n`);

  console.log('🎭 Creating platform roles...');
  for (const roleDef of PLATFORM_ROLES) {
    await ensureRole(guild, roleDef);
  }

  console.log('\n📺 Creating #pick-your-platform channel...');
  await ensureChannel(guild, 'pick-your-platform', 'GENERAL');

  // Refresh cache so newly created channel is visible
  await guild.channels.fetch();

  console.log('\n📝 Posting channel content...');
  await postToChannel(guild, 'welcome', WELCOME_MESSAGE);
  await postToChannel(guild, 'rules', RULES_MESSAGE);
  await postToChannel(guild, 'pick-your-platform', PLATFORM_MESSAGE);

  console.log('\n🎉 Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
