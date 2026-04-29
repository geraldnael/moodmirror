export default function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="iris" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="50%" stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#4c1d95"/>
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Outer glow */}
      <ellipse cx="18" cy="18" rx="16" ry="10" fill="url(#glow)"/>
      {/* Eye outline */}
      <path
        d="M2 18 Q10 6 18 6 Q26 6 34 18 Q26 30 18 30 Q10 30 2 18Z"
        stroke="rgba(167,139,250,0.6)"
        strokeWidth="0.8"
        fill="rgba(167,139,250,0.05)"
      />
      {/* Iris */}
      <circle cx="18" cy="18" r="7" fill="url(#iris)" opacity="0.9"/>
      {/* Pupil */}
      <circle cx="18" cy="18" r="3.5" fill="#080a0f"/>
      {/* Iris ring */}
      <circle cx="18" cy="18" r="7" stroke="rgba(167,139,250,0.4)" strokeWidth="0.5" fill="none"/>
      {/* Highlight */}
      <circle cx="20" cy="16" r="1.5" fill="rgba(255,255,255,0.4)"/>
      {/* Lash lines (top) */}
      <path d="M10 10 Q12 8 14 9" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6" strokeLinecap="round" fill="none"/>
      <path d="M18 7 Q18 5 19 6" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6" strokeLinecap="round" fill="none"/>
      <path d="M24 10 Q26 8 27 10" stroke="rgba(167,139,250,0.4)" strokeWidth="0.6" strokeLinecap="round" fill="none"/>
    </svg>
  )
}
