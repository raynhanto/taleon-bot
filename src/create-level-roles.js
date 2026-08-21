// One-time script: creates all 10 level roles in Discord.

import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { LEVEL_ROLES } from './leveling.js';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function main() {
  await client.login(process.env.DISCORD_BOT_TOKEN);
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  await guild.roles.fetch();
  console.log('✅ Connected\n');

  for (const tier of LEVEL_ROLES) {
    const existing = guild.roles.cache.find((r) => r.name === tier.name);
    if (existing) {
      console.log(`⏭️  Role "${tier.name}" already exists`);
      continue;
    }
    await guild.roles.create({
      name: tier.name,
      color: tier.color,
      hoist: tier.hoist,
      permissions: [],
      reason: 'Level role created by setup script',
    });
    console.log(`✅ Created role "${tier.name}"`);
  }

  console.log('\n🎉 All level roles created!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
