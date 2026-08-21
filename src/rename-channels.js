// One-time script: adds emoji prefixes to all categories and channels.

import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CATEGORY_RENAMES = {
  'START HERE':          '📌 START HERE',
  'GENERAL':             '💬 GENERAL',
  'EVIL CLOWN EVOLUTION':'🃏 EVIL CLOWN EVOLUTION',
  "AUTHOR'S DESK":       "✍️ AUTHOR'S DESK",
  'STAFF':               '🔒 STAFF',
};

const CHANNEL_RENAMES = {
  'welcome':            '👋・welcome',
  'rules':              '📜・rules',
  'announcements':      '📢・announcements',
  'general-chat':       '💭・general-chat',
  'introductions':      '🙋・introductions',
  'off-topic':          '🎲・off-topic',
  'pick-your-roles':    '🎭・pick-your-roles',
  'chapter-drops':      '📖・chapter-drops',
  'focus-discussion':   '💬・focus-discussion',
  'spoilers':           '⚠️・spoilers',
  'wiki-characters':    '👤・wiki-characters',
  'wiki-world':         '🌍・wiki-world',
  'fan-art':            '🎨・fan-art',
  'author-updates':     '📣・author-updates',
  'feedback-and-typos': '🐛・feedback-and-typos',
  'suggestions':        '💡・suggestions',
  'mod-chat':           '🛡️・mod-chat',
  'bot-logs':           '🤖・bot-logs',
};

async function main() {
  await client.login(process.env.DISCORD_BOT_TOKEN);
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  await guild.channels.fetch();
  console.log('✅ Connected\n');

  for (const channel of guild.channels.cache.values()) {
    if (channel.type === ChannelType.GuildCategory) {
      const newName = CATEGORY_RENAMES[channel.name];
      if (newName) {
        await channel.setName(newName);
        console.log(`✅ Category: "${channel.name}" → "${newName}"`);
      }
    } else if (channel.type === ChannelType.GuildText) {
      const newName = CHANNEL_RENAMES[channel.name];
      if (newName) {
        await channel.setName(newName);
        console.log(`  ✅ Channel: #${channel.name} → #${newName}`);
      }
    }
  }

  console.log('\n🎉 Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
