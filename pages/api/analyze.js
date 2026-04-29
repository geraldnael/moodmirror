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

Analyze the entry and respond ONLY with a valid JSON object. No markdown, no preamble, no explanation outside the JSON. Just raw JSON.

Respond with exactly this structure:
{
  "emotions": [{ "name": "string", "intensity": 0.8 }],
  "mood_score": 0.2,
  "energy": 0.4,
  "themes": ["connection", "exhaustion"],
  "color_palette": ["#a78bfa", "#5eead4", "#f9a8d4"],
  "reflection": "2-3 sentences mirroring their experience warmly.",
  "word": "threshold"
}

Rules:
- emotions: 2-5 items, intensity is a float 0-1
- mood_score: float -1 to 1
- energy: float 0 to 1
- themes: 2-4 strings
- color_palette: exactly 3 hex color strings
- reflection: warm, specific to their words, not generic advice
- word: one poetic word (not "sad", "happy", "tired" — use "adrift", "kindling", "unraveling", etc)`

  // Try multiple free models in order until one works
  const models = [
    'meta-llama/llama-3.2-3b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'qwen/qwen-2-7b-instruct:free',
  ]

  let lastError = null

  for (const model of models) {
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
          model,
          max_tokens: 1000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: entry },
          ],
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error(`Model ${model} error:`, data.error.message)
        lastError = data.error.message
        continue // try next model
      }

      const text = data.choices?.[0]?.message?.content || ''
      if (!text) {
        lastError = 'Empty response'
        continue
      }

      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      console.log(`Success with model: ${model}`)
      return res.status(200).json(parsed)

    } catch (err) {
      console.error(`Model ${model} threw:`, err.message)
      lastError = err.message
      continue
    }
  }

  return res.status(500).json({ error: `All models failed. Last error: ${lastError}` })
}
