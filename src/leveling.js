// src/leveling.js — XP and leveling system.
//
// All tunable values are in XP_CONFIG below.
// Roles are defined in LEVEL_ROLES — add/remove tiers here.

import { getUser, upsertUser } from './db.js';

// ─────────────────────────────────────────────────────────────
// CONFIG — adjust these to tune the leveling speed
// ─────────────────────────────────────────────────────────────

export const XP_CONFIG = {
  XP_PER_MESSAGE: 15,           // base XP awarded per qualifying message
  XP_COOLDOWN_MS: 60_000,       // cooldown between XP gains (ms) — prevents spam farming
  XP_FORMULA_MULTIPLIER: 1.0,   // scale all level-up thresholds up (>1) or down (<1)
                                 // e.g. 2.0 = twice as hard, 0.5 = twice as easy
};

// Role assigned per level range. Name must exactly match the Discord role name.
export const LEVEL_ROLES = [
  { minLevel: 1,  maxLevel: 10, name: 'Novice',         color: '#95A5A6', hoist: false },
  { minLevel: 11, maxLevel: 20, name: 'R1 Apprentice',  color: '#2ECC71', hoist: false },
  { minLevel: 21, maxLevel: 30, name: 'R2 Guardian',    color: '#3498DB', hoist: false },
  { minLevel: 31, maxLevel: 40, name: 'R3 Master',      color: '#9B59B6', hoist: true  },
  { minLevel: 41, maxLevel: 50, name: 'R4 Champion',    color: '#E67E22', hoist: true  },
  { minLevel: 51, maxLevel: 60, name: 'R5 Grandmaster', color: '#E74C3C', hoist: true  },
  { minLevel: 61, maxLevel: 70, name: 'R6 Archon',      color: '#F1C40F', hoist: true  },
  { minLevel: 71, maxLevel: 80, name: 'R7 Paragon',     color: '#E91E63', hoist: true  },
  { minLevel: 81, maxLevel: 90, name: 'R8 Sage',        color: '#00BCD4', hoist: true  },
  { minLevel: 91, maxLevel: 99, name: 'R9 Ascendant',   color: '#ECF0F1', hoist: true  },
];

const MAX_LEVEL = 99;

// ─────────────────────────────────────────────────────────────
// Formulas — change XP_FORMULA_MULTIPLIER above, not these
// ─────────────────────────────────────────────────────────────

// XP needed to go from level n → n+1 (MEE6-style curve)
function xpForNextLevel(n) {
  return Math.floor((5 * n * n + 50 * n + 100) * XP_CONFIG.XP_FORMULA_MULTIPLIER);
}

// Total XP needed to reach level n from scratch
function totalXpForLevel(n) {
  let total = 0;
  for (let i = 1; i < n; i++) total += xpForNextLevel(i);
  return total;
}

// Calculate level from total XP
function levelFromXp(xp) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= totalXpForLevel(level + 1)) level++;
  return level;
}

// Get the role tier for a given level
function tierForLevel(level) {
  return LEVEL_ROLES.find((r) => level >= r.minLevel && level <= r.maxLevel) ?? LEVEL_ROLES[0];
}

// ─────────────────────────────────────────────────────────────
// Main handler — call this from bot.js on messageCreate
// ─────────────────────────────────────────────────────────────

export async function handleXp(message) {
  if (message.author.bot) return;
  if (!message.guild) return;

  const userId  = message.author.id;
  const guildId = message.guild.id;
  const now     = new Date();

  // Fetch or create user record
  let user = await getUser(userId, guildId);
  if (!user) user = { user_id: userId, guild_id: guildId, xp: 0, level: 1, last_xp_at: null };

  // Enforce cooldown
  if (user.last_xp_at && now - new Date(user.last_xp_at) < XP_CONFIG.XP_COOLDOWN_MS) return;

  const oldLevel = user.level;
  const newXp    = user.xp + XP_CONFIG.XP_PER_MESSAGE;
  const newLevel = Math.min(levelFromXp(newXp), MAX_LEVEL);

  await upsertUser(userId, guildId, { xp: newXp, level: newLevel, lastXpAt: now });

  // Handle level-up
  if (newLevel > oldLevel) {
    const oldTier = tierForLevel(oldLevel);
    const newTier = tierForLevel(newLevel);

    // Update Discord role if tier changed
    if (oldTier.name !== newTier.name) {
      try {
        const member = await message.guild.members.fetch(userId);

        const oldRole = message.guild.roles.cache.find((r) => r.name === oldTier.name);
        const newRole = message.guild.roles.cache.find((r) => r.name === newTier.name);

        if (oldRole) await member.roles.remove(oldRole);
        if (newRole) await member.roles.add(newRole);
      } catch (err) {
        console.error(`❌ Failed to update level role for ${message.author.tag}:`, err.message);
      }
    }

    // Announce level-up in the same channel
    await message.channel.send(
      `🎉 <@${userId}> reached **Level ${newLevel}** — ${newTier.name}!`
    );

    console.log(`✅ ${message.author.tag} leveled up: ${oldLevel} → ${newLevel} (${newTier.name})`);
  }
}
