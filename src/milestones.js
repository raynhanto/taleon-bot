// src/milestones.js — Royal Road follower milestone announcements.
//
// Checks follower count every 30 minutes. When a milestone is crossed,
// posts a celebration message in #announcements.

import { ChannelType } from 'discord.js';
import { getSetting, setSetting } from './db.js';

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const FICTION_URL = 'https://www.royalroad.com/fiction/187602/evil-clown-evolution-a-vrmmorpg-adventure';
const ANNOUNCE_CHANNEL = '📢・announcements';
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Add or remove milestones here — numbers are follower counts
const MILESTONES = [10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000];

// ─────────────────────────────────────────────────────────────

async function fetchFollowerCount() {
  const html = await fetch(FICTION_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TaleonBot/1.0)' },
  }).then((r) => r.text());

  const match = html.match(/Followers\s*:<\/li>\s*<li[^>]*>([\d,]+)<\/li>/);
  if (!match) return null;
  return parseInt(match[1].replace(/,/g, ''), 10);
}

export async function checkMilestones(guild) {
  try {
    const followers = await fetchFollowerCount();
    if (followers === null) {
      console.warn('⚠️  Could not parse follower count from Royal Road');
      return;
    }

    console.log(`📊 Royal Road followers: ${followers}`);

    const lastStr = await getSetting('last_milestone');
    const lastMilestone = lastStr ? parseInt(lastStr, 10) : 0;

    // Find the highest milestone we've now crossed that we haven't announced yet
    const newMilestone = [...MILESTONES]
      .reverse()
      .find((m) => followers >= m && m > lastMilestone);

    if (!newMilestone) return;

    await setSetting('last_milestone', newMilestone);

    const channel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === ANNOUNCE_CHANNEL
    );
    if (!channel) {
      console.warn(`⚠️  #${ANNOUNCE_CHANNEL} not found — can't announce milestone`);
      return;
    }

    await channel.send(
      `🎉 **${newMilestone.toLocaleString()} Followers on Royal Road!**\n` +
      `Thank you all for the support — Jester's journey continues! 🃏\n` +
      `${FICTION_URL}`
    );

    console.log(`✅ Milestone announced: ${newMilestone} followers`);
  } catch (err) {
    console.error('❌ Milestone check failed:', err.message);
  }
}

export function startMilestonePolling(guild) {
  checkMilestones(guild);
  setInterval(() => checkMilestones(guild), CHECK_INTERVAL_MS);
  console.log(`✅ Milestone polling active (every ${CHECK_INTERVAL_MS / 60000} min)`);
}
