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

Analyze the journal entry and respond ONLY with a valid JSON object. No markdown, no explanation, no extra text. Start with { and end with }.

Use EXACTLY this format:
{
  "emotions": [{"name": "exhaustion", "intensity": 0.8}, {"name": "gratitude", "intensity": 0.5}],
  "mood_score": 0.2,
  "energy": 0.3,
  "themes": ["connection", "resilience"],
  "color_palette": ["#a78bfa", "#5eead4", "#f9a8d4"],
  "reflection": "Two or three warm sentences mirroring their experience back to them, specific to their words.",
  "word": "threshold"
}

STRICT RULES:
- emotions: array of 2 to 4 objects only, each with "name" (string) and "intensity" (number 0-1)
- mood_score: single number from -1 to 1
- energy: single number from 0 to 1
- themes: array of 2 to 3 short strings
- color_palette: array of exactly 3 hex color strings like "#a78bfa"
- reflection: single string, 2-3 sentences, warm and specific to the entry
- word: single evocative word, not "sad" or "happy", use words like "adrift", "kindling", "unraveling"
- Do NOT add any text before or after the JSON
- Do NOT use trailing commas`

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
        model: 'openrouter/free',
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: entry },
        ],
      }),
    })

    const data = await response.json()

    if (data.error) {
      return res.status(500).json({ error: `AI error: ${data.error.message}` })
    }

    const text = data.choices?.[0]?.message?.content || ''
    if (!text) {
      return res.status(500).json({ error: 'Empty response from AI' })
    }

    // Try multiple JSON extraction strategies
    let parsed = null

    // Strategy 1: find the outermost { }
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch (e1) {
        // Strategy 2: fix common issues — trailing commas, unescaped chars
        try {
          const fixed = jsonMatch[0]
            .replace(/,\s*([}\]])/g, '$1')   // remove trailing commas
            .replace(/[\u0000-\u001F\u007F]/g, ' ') // remove control chars
          parsed = JSON.parse(fixed)
        } catch (e2) {
          return res.status(500).json({ error: 'Could not parse AI response. Please try again.' })
        }
      }
    } else {
      return res.status(500).json({ error: 'No valid response from AI. Please try again.' })
    }

    // Ensure required fields exist with fallbacks
    const safe = {
      emotions: parsed.emotions?.slice(0, 4) || [{ name: 'reflective', intensity: 0.6 }],
      mood_score: typeof parsed.mood_score === 'number' ? parsed.mood_score : 0,
      energy: typeof parsed.energy === 'number' ? parsed.energy : 0.5,
      themes: parsed.themes?.slice(0, 3) || ['reflection'],
      color_palette: parsed.color_palette?.slice(0, 3) || ['#a78bfa', '#5eead4', '#f9a8d4'],
      reflection: parsed.reflection || 'Your words carry a quiet depth worth sitting with.',
      word: parsed.word || 'present',
    }

    return res.status(200).json(safe)

  } catch (err) {
    console.error('API error:', err.message)
    return res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
}
