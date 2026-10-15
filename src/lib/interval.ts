import { INTERVALS, type IntervalRow, type Sex, type Specimen } from '../data/referenceIntervals'

export type AgeUnit = 'y' | 'mo' | 'wk' | 'd'

const DAYS: Record<string, number> = { d: 1, wk: 7, mo: 365.25 / 12, y: 365.25 }

/** '18y' | '1wk' | '6mo' | '0' → 일(day) */
export function ageToDays(age: string): number {
  if (age === '0') return 0
  const m = age.match(/^(\d+(?:\.\d+)?)(y|mo|wk|d)$/)
  if (!m) throw new Error(`나이 표기 오류: ${age}`)
  return Number(m[1]) * DAYS[m[2]]
}

export function patientAgeDays(value: number, unit: AgeUnit): number {
  return value * DAYS[unit]
}

export function formatBand(r: Pick<IntervalRow, 'ageFrom' | 'ageTo'>): string {
  const k = (s: string) => (s === '0' ? '0' : s.replace('wk', '주').replace('mo', '개월').replace('y', '세').replace('d', '일'))
  return r.ageTo ? `${k(r.ageFrom)} 이상 ~ ${k(r.ageTo)} 미만` : `${k(r.ageFrom)} 이상`
}

export type Lookup =
  | { found: true; row: IntervalRow }
  | { found: false; reason: string; available: IntervalRow[] }

const specimenKo = { serum: '혈청', plasma: '혈장', both: '혈청/혈장' } as const
const sexKo = { M: '남성', F: '여성', any: '성별 무관' } as const

/** 공표된 구간만 반환한다. 없는 나이/성별/검체는 외삽하지 않고 사유를 돌려준다. */
export function lookupInterval(analyte: string, ageDays: number, sex: Exclude<Sex, 'any'>, specimen: Exclude<Specimen, 'both'>): Lookup {
  const forAnalyte = INTERVALS.filter((r) => r.analyte === analyte)
  if (forAnalyte.length === 0) {
    return { found: false, reason: '이 분석물은 RCPA Harmonised Reference Intervals(Table 5/6)에 수록되어 있지 않습니다.', available: [] }
  }
  const specOk = forAnalyte.filter((r) => r.specimen === 'both' || r.specimen === specimen)
  if (specOk.length === 0) {
    return { found: false, reason: `${specimenKo[specimen]} 검체의 구간은 수록되어 있지 않습니다.`, available: forAnalyte }
  }
  const sexOk = specOk.filter((r) => r.sex === 'any' || r.sex === sex)
  const hit = sexOk.find((r) => ageDays >= ageToDays(r.ageFrom) && (r.ageTo === null || ageDays < ageToDays(r.ageTo)))
  if (hit) return { found: true, row: hit }
  return {
    found: false,
    reason: `${specimenKo[specimen]}·${sexKo[sex]}에 대해 해당 나이의 공표된 구간이 없습니다. 인접 구간으로 외삽하지 않습니다.`,
    available: sexOk,
  }
}

export type Flag = 'low' | 'normal' | 'high'

/** 경계값(하한·상한 자체)은 normal */
export function judge(value: number, row: Pick<IntervalRow, 'low' | 'high'>): Flag {
  if (value < row.low) return 'low'
  if (value > row.high) return 'high'
  return 'normal'
}
