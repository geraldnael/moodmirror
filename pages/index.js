import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import Logo from '../components/Logo'
import MoodHeatmap from '../components/MoodHeatmap'

const MoodCanvas = dynamic(() => import('../components/MoodCanvas'), { ssr: false })

const SAMPLE_PROMPTS = [
  "Today felt like wading through fog — everything took twice the effort...",
  "Something shifted today. I caught myself smiling without a reason.",
  "The meeting drained me completely. I haven't felt this invisible in months.",
  "Started slow, ended grateful. Small things kept catching my attention.",
]

const emotionEmoji = {
  joy: '✦', sadness: '◇', anxiety: '◈', calm: '◉', anger: '◆',
  hope: '◎', loneliness: '○', gratitude: '◉', frustration: '◇',
  wonder: '✦', exhaustion: '◇', love: '◉', fear: '◈', pride: '✦',
}

export default function Home() {
  const [entry, setEntry] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [entries, setEntries] = useState([])
  const [view, setView] = useState('journal') // 'journal' | 'history'
  const [loadingMsg, setLoadingMsg] = useState('')
  const textareaRef = useRef(null)

  const loadingMessages = [
    'Reading between the lines…',
    'Listening to your words…',
    'Finding the shape of your day…',
    'Weaving your emotional portrait…',
  ]

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('moodmirror_entries') || '[]')
      setEntries(saved)
    } catch {}
  }, [])

  useEffect(() => {
    if (!loading) return
    let i = 0
    setLoadingMsg(loadingMessages[0])
    const iv = setInterval(() => {
      i = (i + 1) % loadingMessages.length
      setLoadingMsg(loadingMessages[i])
    }, 1800)
    return () => clearInterval(iv)
  }, [loading])

  const analyze = async () => {
    if (entry.trim().length < 10) return
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalysis(data)

      // Save to entries
      const newEntry = { date: new Date().toISOString(), text: entry, ...data }
      const updated = [newEntry, ...entries].slice(0, 90)
      setEntries(updated)
      localStorage.setItem('moodmirror_entries', JSON.stringify(updated))
    } catch (e) {
      setError(e.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setEntry('')
    setAnalysis(null)
    setError(null)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const downloadCanvas = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `moodmirror-${new Date().toISOString().split('T')[0]}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const moodLabel = (score) => {
    if (score > 0.6) return 'Radiant'
    if (score > 0.2) return 'Light'
    if (score > -0.2) return 'Neutral'
    if (score > -0.6) return 'Heavy'
    return 'Low'
  }

  return (
    <>
      <Head>
        <title>MoodMirror — Your emotional fingerprint</title>
        <meta name="description" content="AI-powered emotional reflection. Journal your day, see your soul." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'><text y='28' font-size='28'>◉</text></svg>" />
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 32px', borderBottom: '0.5px solid var(--border)',
          position: 'sticky', top: 0, background: 'rgba(8,10,15,0.85)',
          backdropFilter: 'blur(12px)', zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo size={28} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 300, letterSpacing: '0.02em', color: 'var(--text)' }}>
              MoodMirror
            </span>
          </div>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {['journal', 'history'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? 'rgba(167,139,250,0.12)' : 'transparent',
                border: '0.5px solid ' + (view === v ? 'rgba(167,139,250,0.3)' : 'transparent'),
                color: view === v ? 'var(--accent)' : 'var(--text3)',
                padding: '6px 16px', borderRadius: '20px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 300,
                transition: 'all 0.2s',
              }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </nav>
        </header>

        <main style={{ flex: 1, maxWidth: '760px', margin: '0 auto', width: '100%', padding: '0 24px' }}>

          {/* ─── JOURNAL VIEW ─── */}
          {view === 'journal' && (
            <>
              {/* Hero */}
              {!analysis && !loading && (
                <div style={{ textAlign: 'center', padding: '64px 0 48px' }} className="fade-up">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(167,139,250,0.08)', border: '0.5px solid rgba(167,139,250,0.2)', padding: '4px 14px', borderRadius: '20px', marginBottom: '32px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'breathe 3s ease-in-out infinite' }}></span>
                    <span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>AI-POWERED REFLECTION</span>
                  </div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 300, lineHeight: 1.15, color: 'var(--text)', marginBottom: '16px' }}>
                    How did today<br/><em style={{ color: 'var(--accent)' }}>really</em> feel?
                  </h1>
                  <p style={{ fontSize: '15px', color: 'var(--text2)', fontWeight: 300, maxWidth: '420px', margin: '0 auto', lineHeight: 1.7 }}>
                    Write freely about your day. MoodMirror reads the emotional texture of your words and reflects it back as a living portrait.
                  </p>
                </div>
              )}

              {/* Journal input area */}
              {!analysis && (
                <div className="fade-up-2">
                  <div style={{
                    background: 'var(--surface)', border: '0.5px solid var(--border2)',
                    borderRadius: '16px', padding: '4px', marginBottom: '16px',
                    transition: 'border-color 0.3s',
                  }}>
                    <textarea
                      ref={textareaRef}
                      value={entry}
                      onChange={e => setEntry(e.target.value)}
                      placeholder={SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)]}
                      disabled={loading}
                      style={{
                        width: '100%', minHeight: '180px', background: 'transparent',
                        border: 'none', outline: 'none', resize: 'vertical',
                        color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '16px',
                        fontWeight: 300, lineHeight: 1.8, padding: '20px 24px',
                        caretColor: 'var(--accent)',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '0.5px solid var(--border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                        {entry.length > 0 ? `${entry.split(/\s+/).filter(Boolean).length} words` : 'write anything'}
                      </span>
                      <button
                        onClick={analyze}
                        disabled={loading || entry.trim().length < 10}
                        style={{
                          background: entry.trim().length >= 10 ? 'var(--accent)' : 'rgba(167,139,250,0.15)',
                          color: entry.trim().length >= 10 ? '#fff' : 'var(--text3)',
                          border: 'none', borderRadius: '10px', padding: '10px 24px',
                          fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 400,
                          cursor: entry.trim().length >= 10 ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s', letterSpacing: '0.02em',
                        }}
                      >
                        Reflect →
                      </button>
                    </div>
                  </div>
                  {error && (
                    <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '8px' }}>{error}</p>
                  )}
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '80px 0' }} className="fade-up">
                  <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 32px' }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '50%',
                      border: '1px solid rgba(167,139,250,0.3)',
                      position: 'absolute', animation: 'spin-slow 3s linear infinite',
                    }}/>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '50%',
                      border: '1px solid transparent',
                      borderTop: '1px solid var(--accent)',
                      position: 'absolute', animation: 'spin-slow 1.5s linear infinite',
                    }}/>
                    <Logo size={30} style={{ position: 'absolute', top: '25px', left: '25px' }} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 300, color: 'var(--text)', fontStyle: 'italic', marginBottom: '8px' }}>
                    {loadingMsg}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>AI is reading your emotional landscape</p>
                </div>
              )}

              {/* Analysis result */}
              {analysis && !loading && (
                <div style={{ padding: '40px 0 80px' }}>
                  {/* Top: canvas + word */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '48px' }} className="fade-up">
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                      <div style={{
                        position: 'absolute', inset: '-20px', borderRadius: '50%',
                        background: `radial-gradient(circle, ${analysis.color_palette?.[0] || '#a78bfa'}22 0%, transparent 70%)`,
                        animation: 'breathe 4s ease-in-out infinite',
                      }}/>
                      <MoodCanvas analysis={analysis} size={280} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 300, color: 'var(--text)', letterSpacing: '0.04em', fontStyle: 'italic', marginBottom: '4px' }}>
                        {analysis.word}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.1em' }}>
                        TODAY'S ESSENCE
                      </div>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }} className="fade-up-2">
                    {[
                      { label: 'Mood', value: moodLabel(analysis.mood_score), sub: `${analysis.mood_score > 0 ? '+' : ''}${(analysis.mood_score * 100).toFixed(0)}` },
                      { label: 'Energy', value: analysis.energy > 0.65 ? 'High' : analysis.energy > 0.35 ? 'Moderate' : 'Low', sub: `${(analysis.energy * 100).toFixed(0)}%` },
                      { label: 'Themes', value: analysis.themes?.[0] || '—', sub: analysis.themes?.[1] || '' },
                    ].map((m, i) => (
                      <div key={i} style={{
                        background: 'var(--surface)', border: '0.5px solid var(--border)',
                        borderRadius: '12px', padding: '16px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: '8px' }}>{m.label.toUpperCase()}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)', fontWeight: 300 }}>{m.value}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Emotions */}
                  <div style={{ marginBottom: '32px' }} className="fade-up-3">
                    <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: '14px' }}>EMOTIONS DETECTED</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {analysis.emotions?.map((em, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          background: 'var(--surface)', border: '0.5px solid var(--border2)',
                          borderRadius: '8px', padding: '8px 14px',
                        }}>
                          <span style={{ fontSize: '10px', color: analysis.color_palette?.[i % 3] || 'var(--accent)' }}>
                            {emotionEmoji[em.name.toLowerCase()] || '◈'}
                          </span>
                          <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 300, textTransform: 'capitalize' }}>{em.name}</span>
                          <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: 'var(--border)' }}>
                            <div style={{
                              height: '100%', borderRadius: '2px',
                              background: analysis.color_palette?.[i % 3] || 'var(--accent)',
                              width: `${em.intensity * 100}%`,
                              transition: 'width 1s ease',
                            }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Reflection */}
                  <div style={{
                    background: 'var(--surface)', border: '0.5px solid var(--border2)',
                    borderLeft: `2px solid ${analysis.color_palette?.[0] || 'var(--accent)'}`,
                    borderRadius: '0 12px 12px 0', padding: '24px 28px', marginBottom: '32px',
                  }} className="fade-up-4">
                    <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: '14px' }}>REFLECTION</div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 300, lineHeight: 1.8, color: 'var(--text)', fontStyle: 'italic' }}>
                      "{analysis.reflection}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} className="fade-up-4">
                    <button onClick={reset} style={{
                      background: 'transparent', border: '0.5px solid var(--border2)',
                      color: 'var(--text2)', borderRadius: '10px', padding: '10px 24px',
                      fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      New entry
                    </button>
                    <button onClick={downloadCanvas} style={{
                      background: 'rgba(167,139,250,0.1)', border: '0.5px solid rgba(167,139,250,0.3)',
                      color: 'var(--accent)', borderRadius: '10px', padding: '10px 24px',
                      fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      Save portrait ↓
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── HISTORY VIEW ─── */}
          {view === 'history' && (
            <div style={{ padding: '48px 0 80px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, marginBottom: '8px' }} className="fade-up">
                Your emotional landscape
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '40px' }} className="fade-up-2">
                {entries.length} entries · last 9 weeks
              </p>

              {entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }} className="fade-up">
                  <p style={{ fontSize: '14px' }}>No entries yet. Write your first reflection to begin.</p>
                </div>
              ) : (
                <>
                  {/* Heatmap */}
                  <div style={{
                    background: 'var(--surface)', border: '0.5px solid var(--border)',
                    borderRadius: '16px', padding: '28px', marginBottom: '32px',
                    overflowX: 'auto',
                  }} className="fade-up-2">
                    <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: '20px' }}>MOOD HEATMAP</div>
                    <MoodHeatmap entries={entries} />
                  </div>

                  {/* Recent entries list */}
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: '16px' }} className="fade-up-3">
                    RECENT ENTRIES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="fade-up-3">
                    {entries.slice(0, 12).map((e, i) => (
                      <div key={i} style={{
                        background: 'var(--surface)', border: '0.5px solid var(--border)',
                        borderRadius: '12px', padding: '16px 20px',
                        display: 'flex', alignItems: 'center', gap: '16px',
                      }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: `radial-gradient(circle, ${e.color_palette?.[0] || '#a78bfa'}88, ${e.color_palette?.[1] || '#5eead4'}44)`,
                          flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)',
                        }}>
                          {e.word?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontStyle: 'italic', color: 'var(--text)' }}>{e.word}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                              {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.5 }}>
                            {e.text?.slice(0, 90)}…
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{ borderTop: '0.5px solid var(--border)', padding: '20px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            MoodMirror · Powered by Claude AI · Your data stays on your device
          </p>
        </footer>
      </div>
    </>
  )
}
