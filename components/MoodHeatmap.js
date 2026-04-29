import { useMemo } from 'react'
import { format, subDays, startOfDay } from 'date-fns'

const moodToColor = (score) => {
  if (score === null || score === undefined) return 'rgba(255,255,255,0.05)'
  if (score > 0.5) return 'rgba(94,234,212,0.75)'
  if (score > 0.15) return 'rgba(167,139,250,0.6)'
  if (score > -0.15) return 'rgba(212,168,75,0.55)'
  if (score > -0.5) return 'rgba(249,168,212,0.5)'
  return 'rgba(239,68,68,0.5)'
}

export default function MoodHeatmap({ entries }) {
  const days = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      const key = format(new Date(e.date), 'yyyy-MM-dd')
      map[key] = e.mood_score
    })
    const result = []
    for (let i = 62; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const key = format(d, 'yyyy-MM-dd')
      result.push({ key, date: d, score: map[key] ?? null })
    }
    return result
  }, [entries])

  const weeks = useMemo(() => {
    const w = []
    for (let i = 0; i < days.length; i += 7) w.push(days.slice(i, i + 7))
    return w
  }, [days])

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)' }}>
      <div style={{ display: 'flex', gap: '2px', marginBottom: '6px', paddingLeft: '20px' }}>
        {weeks.map((_, i) => (
          <div key={i} style={{ width: '14px', textAlign: 'center', fontSize: '9px', color: 'var(--text3)' }}>
            {i % 3 === 0 ? format(weeks[i][0].date, 'MMM')[0] : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '2px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
          {dayLabels.map((l, i) => (
            <div key={i} style={{ width: '12px', height: '14px', lineHeight: '14px', fontSize: '9px', textAlign: 'right', color: 'var(--text3)' }}>{i % 2 === 1 ? l : ''}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {week.map((day, di) => (
              <div
                key={di}
                title={day.key + (day.score !== null ? ` · ${day.score > 0 ? '+' : ''}${(day.score * 100).toFixed(0)}` : '')}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  background: moodToColor(day.score),
                  transition: 'opacity 0.2s',
                  cursor: day.score !== null ? 'pointer' : 'default',
                  border: day.score !== null ? '0.5px solid rgba(255,255,255,0.1)' : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: 'var(--text3)' }}>Low</span>
        {['rgba(239,68,68,0.5)', 'rgba(249,168,212,0.5)', 'rgba(212,168,75,0.55)', 'rgba(167,139,250,0.6)', 'rgba(94,234,212,0.75)'].map((c, i) => (
          <div key={i} style={{ width: '12px', height: '12px', borderRadius: '3px', background: c, border: '0.5px solid rgba(255,255,255,0.1)' }} />
        ))}
        <span style={{ fontSize: '9px', color: 'var(--text3)' }}>High</span>
      </div>
    </div>
  )
}
