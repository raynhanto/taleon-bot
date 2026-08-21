# Evil Clown Evolution — Discord Setup Bot

One-time setup script that creates roles, categories, and channels for the
**Evil Clown Evolution** (Frost Taleon) Discord server. Safe to re-run —
it skips anything that already exists.

## Prerequisites

1. A Discord server already created
2. A bot application registered at https://discord.com/developers/applications
   with a bot token, **Server Members Intent** enabled, and invited to your
   server with **Administrator** permission
3. Discord **Developer Mode** enabled (Settings → Advanced) so you can
   right-click your server icon → "Copy Server ID"
4. Node.js v18 or newer

## Run it

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in:

```
DISCORD_BOT_TOKEN=your_real_token
DISCORD_GUILD_ID=your_real_server_id
```

Then:

```bash
npm run setup
```

You should see console output like:

```
🤡 Logging in...
✅ Connected to server: "Evil Clown Evolution"

🎭 Creating roles...
✅ Created role "Ringmaster"
✅ Created role "Jester Council"
✅ Created role "Big Top Regular"
✅ Created role "Fresh to the Circus"

🎪 Creating categories and channels...
✅ Created category "📋 START HERE"
   ✅ Created channel "#welcome" in "📋 START HERE"
   ...
🔒 Locking "🔧 STAFF" to staff roles...

🎉 Setup complete! Server structure is ready.
```

## Editing the structure

Everything you'd want to change lives in the `ROLES` and `SERVER_STRUCTURE`
config objects at the top of `src/setup.js` — role names/colors, category
names, and which channels live in each category. Edit those, save, and
run `npm run setup` again; it'll only create what's new.

## Out of scope (for now)

This script only builds the server skeleton. It does not add: slash
commands, auto role-assignment on join, leaderboard sync, or website
webhooks — those come in a later phase.
