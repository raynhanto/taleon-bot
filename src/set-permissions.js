// One-time script: sets channel permissions across the server.
// Read-only channels deny SendMessages for @everyone.
// Staff roles (Admin, Moderator) always retain full access.

import { Client, GatewayIntentBits, ChannelType, PermissionsBitField } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const STAFF_ROLES = ['Admin', 'Moderator'];

// Channels that members can only read — not post in
const READ_ONLY_CHANNELS = [
  '👋・welcome',
  '📜・rules',
  '📢・announcements',
  '📖・chapter-drops',
  '👤・wiki-characters',
  '🌍・wiki-world',
  '📣・author-updates',
];

async function main() {
  await client.login(process.env.DISCORD_BOT_TOKEN);
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  await guild.channels.fetch();
  await guild.roles.fetch();
  console.log('✅ Connected\n');

  const everyoneId = guild.roles.everyone.id;
  const staffRoles = STAFF_ROLES.map((name) =>
    guild.roles.cache.find((r) => r.name === name)
  ).filter(Boolean);

  for (const channel of guild.channels.cache.values()) {
    if (channel.type !== ChannelType.GuildText) continue;
    if (!READ_ONLY_CHANNELS.includes(channel.name)) continue;

    const overwrites = [
      {
        id: everyoneId,
        deny: [PermissionsBitField.Flags.SendMessages],
      },
      ...staffRoles.map((role) => ({
        id: role.id,
        allow: [
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ManageMessages,
        ],
      })),
    ];

    await channel.permissionOverwrites.set(overwrites);
    console.log(`🔒 #${channel.name} — read-only for members`);
  }

  console.log('\n🎉 Permissions set!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
