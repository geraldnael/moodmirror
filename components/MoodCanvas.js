import { useEffect, useRef } from 'react'

export default function MoodCanvas({ analysis, size = 320 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!analysis || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const colors = analysis.color_palette || ['#a78bfa', '#5eead4', '#f9a8d4']
    const mood = analysis.mood_score ?? 0
    const energy = analysis.energy ?? 0.5
    const emotions = analysis.emotions || []

    // Seeded pseudo-random from entry word
    const seed = (analysis.word || 'calm').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    let s = seed
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }

    // Background
    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8)
    bg.addColorStop(0, '#0d1018')
    bg.addColorStop(1, '#080a0f')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Draw organic blobs per emotion
    emotions.forEach((em, i) => {
      const col = colors[i % colors.length]
      const intensity = em.intensity || 0.5
      const cx = W * (0.25 + rand() * 0.5)
      const cy = H * (0.2 + rand() * 0.6)
      const radius = W * 0.12 + intensity * W * 0.18

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      grad.addColorStop(0, col + 'cc')
      grad.addColorStop(0.5, col + '44')
      grad.addColorStop(1, col + '00')
      ctx.fillStyle = grad

      // Organic blob via bezier
      ctx.beginPath()
      const pts = 6
      for (let p = 0; p < pts; p++) {
        const angle = (p / pts) * Math.PI * 2
        const wobble = 1 + (rand() - 0.5) * 0.4
        const x = cx + Math.cos(angle) * radius * wobble
        const y = cy + Math.sin(angle) * radius * wobble
        p === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.filter = `blur(${12 + rand() * 8}px)`
      ctx.fill()
      ctx.filter = 'none'
    })

    // Energy lines (more lines = higher energy)
    const lineCount = Math.floor(4 + energy * 14)
    for (let i = 0; i < lineCount; i++) {
      const x1 = rand() * W
      const y1 = rand() * H
      const x2 = rand() * W
      const y2 = rand() * H
      const col = colors[i % colors.length]
      ctx.strokeStyle = col + Math.floor(20 + energy * 60).toString(16).padStart(2, '0')
      ctx.lineWidth = 0.3 + rand() * 0.8
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      const cpx = rand() * W
      const cpy = rand() * H
      ctx.quadraticCurveTo(cpx, cpy, x2, y2)
      ctx.stroke()
    }

    // Central symbol: mood ring
    const cx = W / 2, cy = H / 2
    const ringR = W * 0.08
    ctx.beginPath()
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
    ctx.strokeStyle = colors[0] + 'aa'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Inner dot
    const dotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringR * 0.5)
    dotGrad.addColorStop(0, colors[0])
    dotGrad.addColorStop(1, colors[0] + '00')
    ctx.fillStyle = dotGrad
    ctx.beginPath()
    ctx.arc(cx, cy, ringR * 0.5, 0, Math.PI * 2)
    ctx.fill()

    // Mood arc (shows +/- mood score)
    const startAngle = -Math.PI / 2
    const sweep = mood * Math.PI
    ctx.beginPath()
    ctx.arc(cx, cy, ringR * 1.4, startAngle, startAngle + sweep, mood < 0)
    ctx.strokeStyle = mood >= 0 ? colors[1] + 'dd' : '#ef4444bb'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()

    // Particle dust
    const particleCount = Math.floor(30 + energy * 60)
    for (let p = 0; p < particleCount; p++) {
      const px = rand() * W
      const py = rand() * H
      const pr = 0.5 + rand() * 2
      const col = colors[Math.floor(rand() * colors.length)]
      ctx.fillStyle = col + Math.floor(30 + rand() * 80).toString(16).padStart(2, '0')
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.fill()
    }

    // Word watermark at bottom
    ctx.font = `300 ${W * 0.045}px 'Cormorant Garamond', serif`
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.textAlign = 'center'
    ctx.fillText(analysis.word?.toUpperCase() || '', cx, H - W * 0.06)

  }, [analysis])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: '50%', display: 'block' }}
    />
  )
}
