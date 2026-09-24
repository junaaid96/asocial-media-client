# aSocial

**A calm corner of the internet, made for introverts.** Write slowly, react gently, and send letters that take
their time.

**Live:** https://asocial-media-codejborg.vercel.app · API: https://github.com/junaaid96/asocial-media-server

## Features

- **Letters**: pen-pal messages that arrive after ~15 minutes, ~3 hours or ~12 hours. No typing bubbles, no
  read receipts, and a lined-paper reading view.
- **Social battery**: show whether you're fully charged, half charged, low or recharging. Recharging hushes
  every notification badge.
- **Gentle reactions, quiet counts**: *Felt this* 🤍, *Sending a hug* 🫂, *Insightful* 💡 and *Relate* 🌱
  instead of likes. Only the author sees the totals, unless they choose otherwise.
- **Daily prompt**: one soft question a day, with its own feed of answers.
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
cp .env.example .env   # VITE_API_URL=http://localhost:5000
npm run dev            # http://localhost:5173
npm run build
```

## Deployment

Deployed on Vercel as a static Vite app (`vercel.json` adds the SPA fallback and long-term caching for hashed
assets). Set `VITE_API_URL` to the API's URL in the Vercel project's Production environment.
