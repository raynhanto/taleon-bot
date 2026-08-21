# CLAUDE.md — Evil Clown Evolution Discord Bot Setup

## Project Context

This is a one-time (later: persistent) Discord bot for the **"Evil Clown Evolution"** novel community, published under the pen name **Frost Taleon** (jester/circus-genre progression fantasy).

The author already runs a similar Discord/community bot setup for their other project, PGG (Penulis Go Global) — a WhatsApp bot with member registry, AI-parsed intros, anti-spam, and admin dashboard. This bot should follow the same philosophy: automate server admin work, keep it maintainable, and be easy to extend later (leaderboard sync, role-by-tier assignment, chapter-drop webhooks, etc.) — but for now, **scope is intentionally narrow**: set up the server skeleton (categories, channels, roles) via script.

**Do not scope-creep into leaderboard/webhook/AI-intro features in this pass.** Those come in a later phase once server content and structure are finalized with the author.

## Goal of This Session

Build a **Node.js + discord.js v14** setup script that, when run once against a freshly created Discord server (with the bot already invited using Administrator permission), will:

1. Create a set of categories
2. Create text channels inside each category
3. Create roles with appropriate colors
4. Be idempotent — safe to re-run without duplicating categories/channels/roles that already exist (check by name before creating)
5. Log everything it does to the console clearly

## Finalized Server Structure

This server hosts Frost Taleon's novels — starting with **Evil Clown
Evolution**, with more novels planned to join later. Naming is
intentionally **brand-agnostic** (no clown/circus theme) so the
server scales cleanly to future books. Config lives in the
`SERVER_STRUCTURE` object at the top of `src/setup.js` — duplicate
the per-novel category block for each new novel.

```
START HERE
  - welcome
  - rules
  - announcements

GENERAL
  - general-chat
  - introductions
  - off-topic

EVIL CLOWN EVOLUTION (per-novel category — duplicate this block per future novel)
  - chapter-drops
  - focus-discussion
  - spoilers          (kept separate from focus-discussion so RR/free
                        readers don't get spoiled by Patreon-ahead readers)
  - wiki-characters
  - wiki-world
  - fan-art

AUTHOR'S DESK
  - author-updates
  - feedback-and-typos
  - suggestions

STAFF (private/mod-only category)
  - mod-chat
  - bot-logs
```

Finalized roles (see `ROLES` in `src/setup.js`):
- `Admin` — full admin
- `Moderator`
- `Patron — [Tier 2 name]` / `Patron — [Tier 1 name]` — **placeholder
  names, must be replaced with the author's real Patreon tier names**
  before running, since Discord's native Patreon integration matches
  Discord roles to Patreon tiers **by exact name**
- `Advanced Reader` / `Early Reader` — contribution/activity level
  roles, simple Bronze/Silver-style naming (no circus theme), 2 tiers
  only for now
- `Ahead Reader` — self-assign, marks a reader as caught up on
  Patreon-ahead chapters (spoiler courtesy signal)
- `Notify: New Release` — self-assign, pingable role for new chapter
  announcements across any novel on the server

## Bot Ecosystem Plan (decided with author, phased)

Not everything gets built as a custom bot. Decisions:

1. **Patreon → role sync**: NOT a custom bot. Use Discord's native
   Patreon integration (Server Settings → Integrations → Patreon).
   Role names in `ROLES` must match the Patreon-side tier names
   exactly for this to work.
2. **Moderation** (anti-spam, raid protection): NOT built here.
   Author is adding an off-the-shelf bot (leaning Carl-bot) separately.
   Don't build moderation features into this bot.
3. **Leveling (Early Reader → Advanced Reader) and chapter-drop /
   website webhooks**: THESE belong in a custom bot extension, planned
   as a later phase, because they need to know about the author's own
   content/website data — no off-the-shelf bot covers that. Not part
   of this initial setup script; will be a persistent bot service
   added later (likely deployed to the Oracle Cloud VPS mentioned in
   the author's general tooling notes).

## Technical Requirements

- **Language/runtime:** Node.js (v18+), CommonJS or ESM — use ESM (`"type": "module"` in package.json) for cleaner `discord.js` v14 usage
- **Library:** `discord.js` v14.x
- **Config:** bot token read from `.env` via `dotenv` — NEVER hardcode the token, NEVER commit `.env` (must be in `.gitignore`)
- **Entry point:** `src/setup.js` — run via `npm run setup`
- **Idempotency:** before creating any category/channel/role, check `guild.channels.cache` / `guild.roles.cache` for an existing entry with the same name and skip if found (log `⏭️  Skipping "X" — already exists`)
- **Permissions:** the STAFF category should be locked to `@everyone` deny `ViewChannel`, with an explicit allow for the `Ringmaster` and `Jester Council` roles
- **Error handling:** wrap the whole run in try/catch; on missing permissions or invalid token, print a clear human-readable error (not a raw stack trace) telling the author what to check

## File Structure to Produce

```
evil-clown-discord-bot/
├── CLAUDE.md              (this file)
├── package.json
├── .env.example           (template — real .env is gitignored)
├── .gitignore
├── README.md              (quick human-readable run instructions)
└── src/
    └── setup.js           (the main script)
```

## Environment Variables (.env)

```
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
```

The author needs to right-click their server icon in Discord (with Developer Mode enabled in Discord settings) → "Copy Server ID" to get `DISCORD_GUILD_ID`.

## Commands the Author Will Run

```bash
npm install
cp .env.example .env
# (author fills in .env with real token + guild ID)
npm run setup
```

## Style Notes

- Console output should be friendly and readable — emoji prefixes are fine (✅ ⏭️ ❌ 🎪) since this matches the author's existing playful brand aesthetic (Sea Creature badge tiers, doodle-style slide decks, etc.)
- Keep the script to a single file for now (`src/setup.js`) — don't over-engineer into multiple modules until there's an actual second script (e.g. a persistent bot) that needs shared code
- Comment the `SERVER_STRUCTURE` config block heavily since the author will be editing category/channel/role names directly and iterating on this himself

## Out of Scope (do not build yet)

- Persistent bot / slash commands
- Leveling/XP system for Early Reader → Advanced Reader
- Chapter-drop or website webhooks
- Moderation features (handled by a separate off-the-shelf bot, not this project)
- OAuth "Login with Discord" for the PGG site

Server content and role structure ARE finalized (see above) — what's
still pending is the phase-2 persistent bot for leveling + webhooks,
which will be a separate build once this setup script has been run
successfully.
