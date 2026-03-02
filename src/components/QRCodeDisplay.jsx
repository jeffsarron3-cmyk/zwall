// Generates a visually convincing QR code (not scannable — for demo purposes)
export default function QRCodeDisplay({ value = '', size = 200 }) {
  const cells = 25

  // Simple hash for deterministic patterns
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }

  const inFinder = (r, c) => {
    if (r < 7 && c < 7) return true          // top-left
    if (r < 7 && c >= cells - 7) return true  // top-right
    if (r >= cells - 7 && c < 7) return true  // bottom-left
    return false
  }

  const finderDark = (r, c) => {
    const check = (r1, c1) => {
      const lr = r - r1, lc = c - c1
      if (lr < 0 || lr > 6 || lc < 0 || lc > 6) return null
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true
      if (lr === 1 || lr === 5 || lc === 1 || lc === 5) return false
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true
      return false
    }
    const a = check(0, 0)
    if (a !== null) return a
    const b = check(0, cells - 7)
    if (b !== null) return b
    const c2 = check(cells - 7, 0)
    if (c2 !== null) return c2
    return false
  }

  const isTimingDark = (r, c) => (r + c) % 2 === 0

  const isDataDark = (r, c) => {
    const idx = r * cells + c
    const char = value.charCodeAt(idx % Math.max(value.length, 1)) || 0
    return ((char * 31 + idx * 17 + Math.abs(hash & 0xff)) % 3) !== 0
  }

  const rects = []
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      let dark
      if (inFinder(r, c)) {
        dark = finderDark(r, c)
      } else if (r === 6 || c === 6) {
        dark = isTimingDark(r, c)
      } else {
        dark = isDataDark(r, c)
      }
      if (dark) {
        rects.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#000" />)
      }
    }
  }

  return (
    <div style={{
      background: 'white',
      padding: 14,
      borderRadius: 12,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Zcash logo in center */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${cells} ${cells}`}
          style={{ display: 'block' }}
        >
          {rects}
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.15,
          height: size * 0.15,
          background: '#F4B728',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.09,
          fontWeight: 700,
          color: 'white',
          border: '2px solid white',
        }}>
          Ƶ
        </div>
      </div>
    </div>
  )
}
