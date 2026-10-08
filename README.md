# aSocial

**A calm corner of the internet, made for introverts.** Write slowly, react gently, and send letters that take
their time.

**Live:** https://asocial-media-codejborg.vercel.app · API: https://github.com/junaaid96/asocial-media-server

## Features

- **Letters**: pen-pal messages that arrive after ~15 minutes, ~3 hours or ~12 hours. No typing bubbles, no
  read receipts, and a lined-paper reading view.
- **Messages**: real-time 1:1 chat over WebSockets with a conversation list, unread counts, typing and online
  indicators, read receipts, persisted history with "load earlier", optimistic sends that retry safely, and
  automatic reconnect with backoff. When the socket can't connect (e.g. a serverless API), it falls back to
  polling. Who can message you follows the same setting as letters.
- **Post privacy**: Public, Followers or Only me, chosen when writing or editing and enforced by the API.
- **Rich text**: bold, italic, lists, links and code in posts, replies and messages (toolbar plus Ctrl/⌘+B, I, K,
  E), with `@mention` autocomplete and clickable `#hashtags`. Text is stored as sanitised Markdown and rendered
  into React elements, never as HTML.
- **Reactions on replies** and a per-reaction breakdown behind every total.
- **Reports and moderation**: report a person, post or message with a reason. Moderators get a dashboard
  (`/admin`) with stats, a report queue, and tools to suspend accounts and hide posts.
- **Time well spent**: active time today and this session, a seven-day chart, and an optional daily limit
  with one gentle reminder. Daily totals are saved to your account.
- **Social battery**: show whether you're fully charged, half charged, low or recharging. Recharging hushes
  every notification badge.
- **Gentle reactions, quiet counts**: *Felt this* 🤍, *Sending a hug* 🫂, *Insightful* 💡 and *Relate* 🌱
  instead of likes. Only the author sees the totals, unless they choose otherwise.
- **Daily prompt**: one soft question a day. Answers show the question, which links to every answer
  (`/prompt/:date`).
- **Moods & mood garden**: tag posts with how you feel, filter the feed by mood, and see a private five-week
  garden of your moods.
- **Anonymous posts & content notes**: share heavy thoughts without your name, and blur sensitive posts behind
  a note.
- **A feed with an ending**: no infinite scroll. A deliberate "Show a few more", a gentle break reminder every
  20 posts, and "You're all caught up".
- **Breathe**: a one-minute box-breathing exercise, always one tap away.
- **Kindred spirits**: follow suggestions based on shared moods. Follower counts are private.
- Search (people + full-text posts), saved posts, replies, notifications, profile photos, light/dark themes,
  a mobile layout with bottom navigation, and accessible dialogs and focus states.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · TanStack Query · React Router · lucide-react · sonner

Images are resized and re-encoded in the browser (WebP/JPEG, EXIF stripped) before upload, then stored in
private Neon Object Storage through the API.

## Development

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000 (VITE_WS_URL is optional)
npm run dev            # http://localhost:5173
npm run build
```

## Deployment

Deployed on Vercel as a static Vite app (`vercel.json` adds the SPA fallback and long-term caching for hashed
assets). Set `VITE_API_URL` to the API's URL in the Vercel project's Production environment.

Real-time chat connects to `VITE_WS_URL`, or to `VITE_API_URL` with `ws(s)://` and `/ws` when it isn't set.
WebSockets need the API on a long-running host (`npm start` on the server). On a serverless deployment chat
still works through polling (every 5 seconds in an open conversation), just without live typing and presence:

- `VITE_WS_URL=` (empty) turns the socket off: polling only.
- An API on `*.vercel.app` is detected automatically and never gets a socket attempt.
- If the socket can't connect after 3 tries (or 8 after a working connection drops), the app stops retrying for
  that page load and keeps polling quietly.

Features that need a newer API than the one deployed fail soft: time tracking hides itself if `/api/me/usage`
is missing, and unknown values (visibility, reactions, stats) fall back to safe defaults instead of crashing.
