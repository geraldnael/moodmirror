# MoodMirror 🌀

**Your emotional fingerprint — AI-powered daily reflection.**

MoodMirror is a web app where you journal your day in free text, and Claude AI reads the emotional texture of your words — returning a generative visual portrait, a one-word essence, and a personal reflection. Not a chatbot. Not a tracker. A mirror.

---

## Features

- **AI Emotion Analysis** — Claude detects emotions, mood score, energy level, and recurring life themes
- **Generative Visual Portrait** — unique canvas art generated from your emotional data (downloadable as PNG)
- **Personal AI Reflection** — 2-3 sentences that mirror your experience back, specific to your words
- **Mood Heatmap** — 9-week calendar view of your emotional patterns
- **100% private** — all history stored locally in your browser, never sent to a server

## Tech Stack

- **Frontend**: Next.js 14, React 18
- **AI**: Claude API (`claude-sonnet-4-20250514`) via Anthropic
- **Styling**: Pure CSS with CSS variables (no UI library)
- **Storage**: localStorage (client-side only)
- **Deploy**: Vercel

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/moodmirror
cd moodmirror

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Anthropic API key

# 4. Run locally
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variable in Vercel dashboard:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
4. Deploy ✓

---

## How AI is Integrated

The AI is **central** to every interaction — without it, the app produces nothing.

When a user submits a journal entry:
1. The entry is sent to `/api/analyze` (Next.js API route)
2. Claude analyzes it with a structured prompt and returns a JSON object containing:
   - Detected emotions + intensities
   - Mood score (-1 to 1) and energy level
   - Life themes
   - 3 hex colors that emotionally represent the entry
   - A poetic one-word essence
   - A personalized 2-3 sentence reflection
3. The JSON is used to:
   - Drive a generative canvas painting (colors, blobs, energy lines, particles)
   - Render emotion bars, metric cards, and theme tags
   - Display the AI reflection

---

## Branding

**Name**: MoodMirror  
**Tagline**: Your emotional fingerprint  
**Logo**: Stylized eye with a purple iris — the act of being seen and seeing yourself clearly  
**Color palette**: Deep midnight black (#080a0f), soft violet (#a78bfa), teal (#5eead4), warm gold (#d4a84b)  
**Fonts**: Cormorant Garamond (display), Outfit (body), DM Mono (labels)  
**Aesthetic**: Dark luxury — introspective, premium, calm

---

*Built for WealthyPeople.id Stage 2 Developer Recruitment*
