// One-time script: rename Patron tier placeholders to real names,
// and delete the old contributor-named roles that those names replace.

import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function main() {
  await client.login(process.env.DISCORD_BOT_TOKEN);
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  console.log(`✅ Connected to "${guild.name}"`);

  const roles = await guild.roles.fetch();

  // Delete old contributor roles (being repurposed as Patreon role names)
  for (const name of ['Early Reader', 'Advanced Reader']) {
    const role = roles.find((r) => r.name === name);
    if (role) {
      await role.delete('Replaced by Patreon tier roles');
      console.log(`🗑️  Deleted old "${name}" role`);
    }
  }

  // Rename Patron placeholders to the real tier names
  const tier2 = roles.find((r) => r.name === 'Patron — TIER_2_NAME');
  if (tier2) {
    await tier2.edit({ name: 'Advanced Reader' });
    console.log('✅ Renamed "Patron — TIER_2_NAME" → "Advanced Reader"');
  }

  const tier1 = roles.find((r) => r.name === 'Patron — TIER_1_NAME');
  if (tier1) {
    await tier1.edit({ name: 'Early Reader' });
    console.log('✅ Renamed "Patron — TIER_1_NAME" → "Early Reader"');
  }

  console.log('\n🎉 Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
