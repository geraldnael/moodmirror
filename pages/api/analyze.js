export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { entry } = req.body
  if (!entry || entry.trim().length < 10) {
    return res.status(400).json({ error: 'Entry too short' })
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const systemPrompt = `You are MoodMirror — an emotionally intelligent AI that reads journal entries and reflects the writer's inner emotional landscape back to them.

Analyze the entry and respond ONLY with a valid JSON object. No markdown, no preamble, no explanation. Just raw JSON.

Schema:
{
  "emotions": [{ "name": string, "intensity": number }],
  "mood_score": number,
  "energy": number,
  "themes": [string],
  "color_palette": [string, string, string],
  "reflection": string,
  "word": string
}

Rules:
- emotions: 2-5 dominant emotions, intensity between 0 and 1
- mood_score: float from -1 (very low) to 1 (very high)
- energy: float from 0 (depleted) to 1 (electric)
- themes: 2-4 recurring life themes e.g. "connection", "uncertainty", "growth"
- color_palette: exactly 3 hex color strings e.g. ["#a78bfa", "#5eead4", "#f9a8d4"]
- reflection: 2-3 sentences mirroring their experience back warmly, specific to their words
- word: one poetic evocative word capturing today's essence, not basic emotions`

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
        model: 'google/gemma-3-4b-it:free',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: entry },
        ],
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error('OpenRouter error:', data.error)
      return res.status(500).json({ error: `AI error: ${data.error.message}` })
    }

    const text = data.choices?.[0]?.message?.content || ''
    if (!text) {
      console.error('Empty response from OpenRouter:', data)
      return res.status(500).json({ error: 'Empty response from AI' })
    }

    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('API error:', err.message)
    return res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' })
  }
}
