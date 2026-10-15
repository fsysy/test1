/** 유효숫자 n자리로 반올림하고 불필요한 0 제거 (과학 표기 회피) */
export function fmt(x: number, sig = 4): string {
  if (!Number.isFinite(x)) return String(x)
  if (x === 0) return '0'
  const abs = Math.abs(x)
  if (abs >= 1e7 || abs < 1e-6) return x.toExponential(sig - 1)
  const s = Number(x.toPrecision(sig))
  return s.toLocaleString('en-US', { maximumFractionDigits: 12, useGrouping: false })
}
