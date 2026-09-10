# AIBrofist Discord bot

A small bot with two features:

1. **Automatic news posting** — no command needed. It polls
   `https://aibrofist.online/getLogs` and, whenever a new site update
   appears, posts it to the `#updates` channel (`1543927183385428028` by
   default) as an embed titled `# <update title>` with the update text as
   the body (and the first attached image, if any).
2. **`/online`** — a slash command that shows every player currently
   online, grouped by game mode (Hide and Seek / Race) and room, in one
   embed.

## Setup

1. `python3 -m venv .venv && source .venv/bin/activate` (optional but recommended)
2. `pip install -r requirements.txt`
3. `cp .env.example .env` and fill in:
   - `DISCORD_BOT_TOKEN` — from the [Discord Developer Portal](https://discord.com/developers/applications) → your application → Bot → Reset Token.
   - `NEWS_CHANNEL_ID` — already defaults to `#updates` (`1543927183385428028`); only change it if the bot should post somewhere else (enable Developer Mode in Discord, right-click the channel, Copy Channel ID).
4. In the Developer Portal, under **Bot**, no privileged intents are required — this bot only reads public HTTP data and posts messages/handles slash commands.
5. Invite the bot to your server with the `bot` and `applications.commands` scopes and at least the **Send Messages** and **Embed Links** permissions in the news channel.
6. Run it: `python bot.py`

The bot registers its slash commands automatically on startup (may take
up to an hour to appear globally the very first time — Discord caches
command registration).

## Notes

- **First run**: the bot deliberately does *not* post the entire existing
  news archive the first time it starts — it just remembers what already
  exists (in `seen_logs.json`) and posts only updates published *after*
  that. Delete `seen_logs.json` if you ever want it to re-scan from
  scratch (careful: that also means it will post everything currently on
  the site).
- The token is read from the `DISCORD_BOT_TOKEN` environment variable
  (via `.env`, which is git-ignored) — it is never written into `bot.py`
  or any other tracked file. Treat any token that has ever been pasted
  into a chat, email, or ticket as compromised and regenerate it in the
  Developer Portal.
- `/online` reads `GET /api/online` on the game server, which only
  exposes what's already publicly visible in-game (player name, mode,
  room) — no accounts, sessions, or private data.
- Run this as a long-lived process (e.g. `systemd`, `pm2`, a small
  always-on VPS, or a background worker on your host of choice) — it
  needs to stay connected to receive events and keep polling for news.
