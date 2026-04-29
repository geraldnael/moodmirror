export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { entry } = req.body
  if (!entry || entry.trim().length < 10) {
    return res.status(400).json({ error: 'Entry too short' })
  }

  const systemPrompt = `You are MoodMirror — an emotionally intelligent AI that reads journal entries and reflects the writer's inner emotional landscape back to them.

Analyze the entry and respond ONLY with a valid JSON object. No markdown, no preamble, no explanation. Just raw JSON.

Schema:
{
  "emotions": [{ "name": string, "intensity": number (0-1) }],
  "mood_score": number,
  "energy": number,
  "themes": [string],
  "color_palette": [string, string, string],
  "reflection": string,
  "word": string
}

Rules:
- emotions: 2-5 dominant emotions detected in the text
- mood_score: -1 (very low) to 1 (very high), float
- energy: 0 (depleted) to 1 (electric), float
- themes: 2-4 recurring life themes (e.g. "connection", "uncertainty", "growth")
- color_palette: 3 hex colors that emotionally embody the tone of the entry
- reflection: 2-3 sentences. Mirror their experience back — not advice, not analysis. Warm, perceptive, specific to their words.
- word: one evocative poetic word that captures today's essence (NOT basic words like "sad" or "happy" — use words like "adrift", "kindling", "threshold", "unraveling")`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SITE_URL || 'https://moodmirror.vercel.app',
        'X-Title': 'MoodMirror',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: entry },
        ],
      }),
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const text = data.choices?.[0]?.message?.content || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
}
