// src/setup.js
//
// One-time (idempotent) setup script for the Frost Taleon Discord
// server (first novel: Evil Clown Evolution; more novels planned to
// join this same server later under their own per-novel category).
//
// What it does:
//   1. Logs in as the bot
//   2. Creates roles (skips ones that already exist by name)
//   3. Creates categories (skips ones that already exist by name)
//   4. Creates text channels inside each category (skips existing)
//   5. Locks the STAFF category to Admin + Moderator only
//
// Safe to re-run — it will not duplicate anything.

import { Client, GatewayIntentBits, ChannelType, PermissionsBitField } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || TOKEN === 'your_bot_token_here') {
  console.error('❌ Missing DISCORD_BOT_TOKEN in .env — copy .env.example to .env and fill it in.');
  process.exit(1);
}
if (!GUILD_ID || GUILD_ID === 'your_server_id_here') {
  console.error('❌ Missing DISCORD_GUILD_ID in .env — copy .env.example to .env and fill it in.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// EDIT THIS BLOCK to change the server structure.
// Nothing below this config needs to change for basic edits.
// ─────────────────────────────────────────────────────────────

// NOTE: role names are intentionally brand-agnostic (not clown/circus
// themed) since this server will host multiple Frost Taleon novels
// over time, not just Evil Clown Evolution.
//
// TODO: replace the two "Patron — TIER_X_NAME" placeholders below with
// your real Patreon tier names before running. These two roles will
// later be left alone by Discord's native Patreon integration (Server
// Settings > Integrations > Patreon) — the integration matches roles
// by name, so the names here must exactly match what you configure
// there.
const ROLES = [
  { name: 'Admin', color: '#D4AF37', hoist: true, permissions: [PermissionsBitField.Flags.Administrator] },
  { name: 'Moderator', color: '#8B5CF6', hoist: true, permissions: [] },
  { name: 'Patron — TIER_2_NAME', color: '#F5A623', hoist: true, permissions: [] }, // higher Patreon tier
  { name: 'Patron — TIER_1_NAME', color: '#F7C873', hoist: true, permissions: [] }, // lower Patreon tier
  { name: 'Advanced Reader', color: '#C0C0C0', hoist: true, permissions: [] }, // higher contribution level
  { name: 'Early Reader', color: '#CD7F32', hoist: false, permissions: [] }, // starter/default contribution level
  { name: 'Ahead Reader', color: '#5865F2', hoist: false, permissions: [] }, // self-assign: caught up on paid-ahead chapters
  { name: 'Notify: New Release', color: '#43B581', hoist: false, permissions: [] }, // self-assign: pingable for new chapters
];

const SERVER_STRUCTURE = [
  {
    category: 'START HERE',
    channels: ['welcome', 'rules', 'announcements'],
  },
  {
    category: 'GENERAL',
    channels: ['general-chat', 'introductions', 'off-topic'],
  },
  {
    // Per-novel category. Duplicate this block (with a new category
    // name and channel names) for each future Frost Taleon novel.
    category: 'EVIL CLOWN EVOLUTION',
    channels: ['chapter-drops', 'focus-discussion', 'spoilers', 'wiki-characters', 'wiki-world', 'fan-art'],
  },
  {
    category: "AUTHOR'S DESK",
    channels: ['author-updates', 'feedback-and-typos', 'suggestions'],
  },
  {
    // This category gets special private permissions — see lockStaffCategory() below.
    category: 'STAFF',
    channels: ['mod-chat', 'bot-logs'],
    private: true,
  },
];

const STAFF_ROLE_NAMES = ['Admin', 'Moderator'];

// ─────────────────────────────────────────────────────────────
// Script logic — shouldn't need to touch below here for edits.
// ─────────────────────────────────────────────────────────────

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

async function ensureRoles(guild) {
  console.log('\n🎭 Creating roles...');
  const createdRoles = {};

  for (const roleDef of ROLES) {
    const existing = guild.roles.cache.find((r) => r.name === roleDef.name);
    if (existing) {
      console.log(`⏭️  Skipping role "${roleDef.name}" — already exists`);
      createdRoles[roleDef.name] = existing;
      continue;
    }

    const role = await guild.roles.create({
      name: roleDef.name,
      color: roleDef.color,
      hoist: roleDef.hoist,
      permissions: roleDef.permissions,
      reason: 'Automated server setup (Evil Clown Evolution)',
    });
    console.log(`✅ Created role "${roleDef.name}"`);
    createdRoles[roleDef.name] = role;
  }

  return createdRoles;
}

async function ensureCategoriesAndChannels(guild, rolesByName) {
  console.log('\n🎪 Creating categories and channels...');

  for (const section of SERVER_STRUCTURE) {
    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === section.category
    );

    if (category) {
      console.log(`⏭️  Skipping category "${section.category}" — already exists`);
    } else {
      category = await guild.channels.create({
        name: section.category,
        type: ChannelType.GuildCategory,
        reason: 'Automated server setup (Evil Clown Evolution)',
      });
      console.log(`✅ Created category "${section.category}"`);
    }

    if (section.private) {
      await lockCategoryToStaff(guild, category, rolesByName);
    }

    for (const channelName of section.channels) {
      const existingChannel = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildText && c.name === channelName && c.parentId === category.id
      );

      if (existingChannel) {
        console.log(`   ⏭️  Skipping channel "#${channelName}" — already exists`);
        continue;
      }

      await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        reason: 'Automated server setup (Evil Clown Evolution)',
      });
      console.log(`   ✅ Created channel "#${channelName}" in "${section.category}"`);
    }
  }
}

async function lockCategoryToStaff(guild, category, rolesByName) {
  console.log(`🔒 Locking "${category.name}" to staff roles...`);

  const everyoneId = guild.roles.everyone.id;

  const overwrites = [
    {
      id: everyoneId,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
  ];

  for (const roleName of STAFF_ROLE_NAMES) {
    const role = rolesByName[roleName];
    if (role) {
      overwrites.push({
        id: role.id,
        allow: [PermissionsBitField.Flags.ViewChannel],
      });
    }
  }

  await category.permissionOverwrites.set(overwrites);
}

async function main() {
  try {
    console.log('🤡 Logging in...');
    await client.login(TOKEN);

    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`✅ Connected to server: "${guild.name}"`);

    const rolesByName = await ensureRoles(guild);
    await ensureCategoriesAndChannels(guild, rolesByName);

    console.log('\n🎉 Setup complete! Server structure is ready.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Setup failed.');
    if (err.code === 50001 || err.code === 50013) {
      console.error(
        'Looks like a permissions issue — make sure the bot was invited with the "Administrator" permission ' +
          '(re-invite it via the OAuth2 URL Generator in the Discord Developer Portal if needed).'
      );
    } else if (err.message?.includes('TOKEN_INVALID') || err.code === 'TokenInvalid') {
      console.error('Your DISCORD_BOT_TOKEN looks invalid — double check it in .env against the Developer Portal.');
    } else if (err.message?.includes('Unknown Guild')) {
      console.error('DISCORD_GUILD_ID looks wrong, or the bot has not been invited to that server yet.');
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  }
}

main();
