import { ATOMIC_WEIGHTS } from '../data/atomicWeights'

export type Composition = Record<string, number>

/** "C6H12O6" → { C: 6, H: 12, O: 6 } (괄호 없는 단순 분자식만 지원) */
export function parseFormula(formula: string): Composition {
  const out: Composition = {}
  const re = /([A-Z][a-z]?)(\d*)/g
  let consumed = 0
  for (const m of formula.matchAll(re)) {
    const [whole, el, n] = m
    if (!(el in ATOMIC_WEIGHTS)) throw new Error(`원자량 표에 없는 원소: ${el}`)
    out[el] = (out[el] ?? 0) + (n ? Number(n) : 1)
    consumed += whole.length
  }
  if (consumed !== formula.length) throw new Error(`해석할 수 없는 분자식: ${formula}`)
  return out
}

/** 분자량(g/mol) = Σ 원자수 × IUPAC 원자량 */
export function molarMass(formula: string): number {
  return Object.entries(parseFormula(formula)).reduce((s, [el, n]) => s + n * ATOMIC_WEIGHTS[el], 0)
}

/** 계산 근거 표시용: "6×12.011 + 12×1.008 + 6×15.999" */
export function molarMassBreakdown(formula: string): string {
  return Object.entries(parseFormula(formula))
    .map(([el, n]) => `${n}×${ATOMIC_WEIGHTS[el]}(${el})`)
    .join(' + ')
}
