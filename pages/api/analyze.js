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

Respond with exactly this structure:
{
  "emotions": [{ "name": "exhaustion", "intensity": 0.8 }, { "name": "gratitude", "intensity": 0.5 }],
  "mood_score": 0.2,
  "energy": 0.3,
  "themes": ["connection", "resilience"],
  "color_palette": ["#a78bfa", "#5eead4", "#f9a8d4"],
  "reflection": "There is a quiet heaviness in your words today, yet something small kept you tethered. The stranger's smile arrived exactly when it needed to.",
  "word": "threshold"
}

Rules:
- emotions: 2-5 items, intensity is a float between 0 and 1
- mood_score: float from -1 to 1
- energy: float from 0 to 1  
- themes: 2-4 short string labels
- color_palette: exactly 3 valid hex color strings
- reflection: 2-3 warm sentences mirroring their experience, specific to their words, no generic advice
- word: one poetic word (avoid "sad", "happy", "tired" — use "adrift", "kindling", "unraveling", "threshold", etc)`

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
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: entry },
        ],
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error('OpenRouter error:', JSON.stringify(data.error))
      return res.status(500).json({ error: `AI error: ${data.error.message}` })
    }

    const text = data.choices?.[0]?.message?.content || ''
    if (!text) {
      console.error('Empty response:', JSON.stringify(data))
      return res.status(500).json({ error: 'Empty response from AI' })
    }

    // Extract JSON even if there's extra text around it
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response:', text)
      return res.status(500).json({ error: 'Could not parse AI response' })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return res.status(200).json(parsed)

  } catch (err) {
    console.error('API error:', err.message)
    return res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' })
  }
}
