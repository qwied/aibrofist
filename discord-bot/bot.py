"""AIBrofist Discord bot.

Two features:
1. No command needed — polls the site's news feed (/getLogs) and posts any
   new update to a designated channel as a nicely formatted embed, with the
   title prefixed by "# " (Discord renders large headings with that prefix).
2. /online — shows who is currently playing, grouped by game mode and room,
   in a single embed.

The bot never stores or logs the token. It reads it from the
DISCORD_BOT_TOKEN environment variable (see .env.example) so the real
value never has to live in source control.
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import aiohttp
import discord
from discord.ext import commands, tasks
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("aibrofist-bot")

TOKEN = os.environ.get("DISCORD_BOT_TOKEN")
if not TOKEN:
    raise SystemExit("DISCORD_BOT_TOKEN is not set. Copy .env.example to .env and fill it in.")

NEWS_CHANNEL_ID = int(os.environ.get("NEWS_CHANNEL_ID", "0") or "0")
API_BASE = os.environ.get("API_BASE", "https://aibrofist.online").rstrip("/")
POLL_INTERVAL_SECONDS = int(os.environ.get("POLL_INTERVAL_SECONDS", "60"))
SEEN_LOG_FILE = Path(os.environ.get("SEEN_LOG_FILE", "seen_logs.json"))

EMBED_COLOR = 0xF5B301  # AIBrofist gold
MODE_LABELS = {"hideAndSeek": "Hide and Seek", "race": "Race"}
REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=15)

intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)


# ---------- persistence for "already posted" news ids ----------

def load_seen_ids() -> set[int]:
    if not SEEN_LOG_FILE.exists():
        return set()
    try:
        return set(json.loads(SEEN_LOG_FILE.read_text(encoding="utf-8")))
    except (json.JSONDecodeError, OSError) as e:
        log.warning("Could not read %s (%s); starting with an empty seen-list.", SEEN_LOG_FILE, e)
        return set()


def save_seen_ids(ids: set[int]) -> None:
    try:
        SEEN_LOG_FILE.write_text(json.dumps(sorted(ids)), encoding="utf-8")
    except OSError as e:
        log.warning("Could not save %s: %s", SEEN_LOG_FILE, e)


# ---------- talking to the game server ----------

async def fetch_json(session: aiohttp.ClientSession, path: str) -> dict[str, Any]:
    async with session.get(f"{API_BASE}{path}", timeout=REQUEST_TIMEOUT) as resp:
        resp.raise_for_status()
        return await resp.json()


def absolute_image_url(url: str) -> str:
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return f"{API_BASE}/{url.lstrip('/')}"


def build_news_embed(entry: dict[str, Any]) -> discord.Embed:
    title = str(entry.get("title") or "Update").strip()
    text = str(entry.get("text") or "").strip()
    date_ms = entry.get("date")
    timestamp = datetime.fromtimestamp(date_ms / 1000, tz=timezone.utc) if isinstance(date_ms, (int, float)) else None

    embed = discord.Embed(
        title=f"# {title}",
        description=text or None,
        color=EMBED_COLOR,
        timestamp=timestamp,
        url=f"{API_BASE}/logs.html",
    )
    images = entry.get("images") or []
    if images:
        first = images[0]
        url = first.get("u") if isinstance(first, dict) else first
        if url:
            embed.set_image(url=absolute_image_url(str(url)))
    embed.set_author(name="AIBrofist News", url=f"{API_BASE}/logs.html")
    embed.set_footer(text="aibrofist.online")
    return embed


@tasks.loop(seconds=POLL_INTERVAL_SECONDS)
async def poll_news() -> None:
    if not NEWS_CHANNEL_ID:
        return
    channel = bot.get_channel(NEWS_CHANNEL_ID)
    if channel is None:
        log.warning("News channel %s not found (bot not in that server/channel?).", NEWS_CHANNEL_ID)
        return

    try:
        async with aiohttp.ClientSession() as session:
            data = await fetch_json(session, "/getLogs")
    except (aiohttp.ClientError, asyncio.TimeoutError, ValueError) as e:
        log.warning("Failed to fetch news: %s", e)
        return

    logs = data.get("logs") or []
    seen = load_seen_ids()
    first_run = not SEEN_LOG_FILE.exists()

    new_entries = [entry for entry in logs if entry.get("id") not in seen]
    new_entries.sort(key=lambda entry: entry.get("date", 0))  # oldest first, so the channel reads chronologically

    if first_run:
        # First time the bot ever runs: don't dump the whole news archive
        # into the channel — just remember what already exists and only
        # post updates that appear from now on.
        save_seen_ids({entry["id"] for entry in logs if "id" in entry})
        log.info("First run: recorded %d existing update(s) without posting them.", len(logs))
        return

    for entry in new_entries:
        try:
            await channel.send(embed=build_news_embed(entry))
        except discord.DiscordException as e:
            log.warning("Failed to post update %s: %s", entry.get("id"), e)
            continue
        seen.add(entry["id"])
        save_seen_ids(seen)
        await asyncio.sleep(1)  # be gentle with rate limits if several posted at once


@poll_news.before_loop
async def before_poll_news() -> None:
    await bot.wait_until_ready()


# ---------- /online ----------

def build_online_embed(modes: dict[str, dict[str, list[str]]]) -> discord.Embed:
    embed = discord.Embed(title="AIBrofist — who's online", color=EMBED_COLOR, timestamp=datetime.now(timezone.utc))
    embed.set_footer(text="aibrofist.online")

    total = sum(len(names) for rooms in modes.values() for names in rooms.values())
    if not total:
        embed.description = "No one is online right now."
        return embed

    embed.description = f"**{total}** player(s) online right now."
    for mode_key in sorted(modes.keys(), key=lambda k: MODE_LABELS.get(k, k)):
        rooms = modes[mode_key]
        label = MODE_LABELS.get(mode_key, mode_key)
        for room_name, names in sorted(rooms.items()):
            value = "\n".join(f"• {name}" for name in names) if names else "_empty_"
            # Discord caps a field name at 256 chars and a value at 1024 — plenty for a room list
            embed.add_field(name=f"{label} — {room_name} ({len(names)})", value=value[:1024], inline=True)
    return embed


@bot.tree.command(name="online", description="Show who is currently playing, across every mode and room.")
async def online_command(interaction: discord.Interaction) -> None:
    await interaction.response.defer(thinking=True)
    try:
        async with aiohttp.ClientSession() as session:
            data = await fetch_json(session, "/api/online")
    except (aiohttp.ClientError, asyncio.TimeoutError, ValueError) as e:
        await interaction.followup.send(f"Couldn't reach the game server: {e}")
        return
    await interaction.followup.send(embed=build_online_embed(data.get("modes") or {}))


# ---------- lifecycle ----------

@bot.event
async def on_ready() -> None:
    log.info("Logged in as %s (id: %s)", bot.user, bot.user.id if bot.user else "?")
    try:
        synced = await bot.tree.sync()
        log.info("Synced %d slash command(s).", len(synced))
    except discord.DiscordException as e:
        log.warning("Slash command sync failed: %s", e)
    if not poll_news.is_running():
        poll_news.start()


def main() -> None:
    bot.run(TOKEN, log_handler=None)


if __name__ == "__main__":
    main()
