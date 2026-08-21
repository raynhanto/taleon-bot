// src/bot.js — persistent bot for the Frost Taleon Discord server.
//
// Current features:
//   - Reaction roles in #pick-your-platform
//     📗 → Royal Road Reader
//     📘 → Scribble Hub Reader
//     🔔 → Notify: New Release
//
// Add more features below as the server grows.

import {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
} from 'discord.js';
import dotenv from 'dotenv';
import Parser from 'rss-parser';

dotenv.config();

// ─────────────────────────────────────────────────────────────
// CONFIG — edit this to change reaction → role mappings
// ─────────────────────────────────────────────────────────────

const REACTION_ROLES = {
  '📗': 'Royal Road Reader',
  '📘': 'Scribble Hub Reader',
  '🃏': "Jester's Crew",
  '🔔': 'Notify: New Release',
};

const PLATFORM_CHANNEL = 'pick-your-roles';

// Chapter drop config
const CHAPTER_DROP_CHANNEL = 'chapter-drops';
const NOTIFY_ROLE = 'Notify: New Release';
const RSS_FEEDS = [
  {
    name: 'Evil Clown Evolution',
    url: 'https://www.royalroad.com/fiction/187602/rss.xml',
  },
  // Add more novels here as they join the server:
  // { name: 'Novel Title', url: 'https://www.royalroad.com/fiction/XXXXX/rss.xml' },
];
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// ─────────────────────────────────────────────────────────────

const rssParser = new Parser();

// Tracks the latest chapter link per feed so we don't re-announce on restart.
const lastSeenLink = {};

async function checkChapterDrops(guild) {
  const channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === CHAPTER_DROP_CHANNEL
  );
  if (!channel) return;

  const notifyRole = guild.roles.cache.find((r) => r.name === NOTIFY_ROLE);
  const ping = notifyRole ? `<@&${notifyRole.id}>` : '';

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await rssParser.parseURL(feed.url);
      const latest = parsed.items[0];
      if (!latest) continue;

      // On first check, just store the latest — don't announce old chapters.
      if (!lastSeenLink[feed.url]) {
        lastSeenLink[feed.url] = latest.link;
        console.log(`📖 [${feed.name}] Baseline set: "${latest.title}"`);
        continue;
      }

      if (latest.link !== lastSeenLink[feed.url]) {
        lastSeenLink[feed.url] = latest.link;
        await channel.send(
          `${ping} 📖 **New chapter dropped!**\n**${feed.name}** — ${latest.title}\n${latest.link}`
        );
        console.log(`✅ [${feed.name}] Announced: "${latest.title}"`);
      }
    } catch (err) {
      console.error(`❌ RSS check failed for ${feed.name}:`, err.message);
    }
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  // Partials are required to receive reactions on messages that
  // were posted before the bot started.
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Cache the platform message ID on startup so we only act on that one message.
let platformMessageId = null;

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    await guild.channels.fetch();

    const channel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === PLATFORM_CHANNEL
    );
    if (!channel) {
      console.warn(`⚠️  #${PLATFORM_CHANNEL} not found — reaction roles won't work`);
      return;
    }

    const messages = await channel.messages.fetch({ limit: 20 });
    const botMessage = messages.find((m) => m.author.id === client.user.id);
    if (!botMessage) {
      console.warn(`⚠️  No bot message found in #${PLATFORM_CHANNEL} — reaction roles won't work`);
      return;
    }

    platformMessageId = botMessage.id;
    console.log(`✅ Platform message found (${platformMessageId}) — reaction roles active`);

    // Start RSS polling
    await checkChapterDrops(guild);
    setInterval(() => checkChapterDrops(guild), CHECK_INTERVAL_MS);
    console.log(`✅ Chapter drop polling active (every ${CHECK_INTERVAL_MS / 60000} min)`);
  } catch (err) {
    console.error('❌ Error during startup:', err.message);
  }
});

async function handleReaction(reaction, user, action) {
  if (user.bot) return;
  if (!platformMessageId || reaction.message.id !== platformMessageId) return;

  const roleName = REACTION_ROLES[reaction.emoji.name];
  if (!roleName) return;

  try {
    // Fetch partial objects if needed
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.find((r) => r.name === roleName);

    if (!role) {
      console.warn(`⚠️  Role "${roleName}" not found`);
      return;
    }

    if (action === 'add') {
      await member.roles.add(role);
      console.log(`✅ Gave "${roleName}" to ${user.tag}`);
    } else {
      await member.roles.remove(role);
      console.log(`✅ Removed "${roleName}" from ${user.tag}`);
    }
  } catch (err) {
    console.error(`❌ Failed to ${action} role "${roleName}":`, err.message);
  }
}

client.on('messageReactionAdd', (reaction, user) => handleReaction(reaction, user, 'add'));
client.on('messageReactionRemove', (reaction, user) => handleReaction(reaction, user, 'remove'));

client.on('guildMemberAdd', async (member) => {
  const guild = member.guild;
  await guild.channels.fetch();
  const channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === 'welcome'
  );
  if (!channel) return;
  await channel.send(
    `Welcome <@${member.id}>! Read #rules and grab your roles in #pick-your-platform. 👋`
  );
});

client.login(process.env.DISCORD_BOT_TOKEN);
