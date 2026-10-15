import { SRC, type Analyte, type Source } from '../data/analytes'
import { molarMass, molarMassBreakdown } from './molecular'
import { fmt } from './format'
import { ucumConvert, ucumKind, type UcumFailure } from './ucum'

export interface Basis {
  method: string
  /** 사용한 수식(사람이 읽는 형태) */
  formulas: string[]
  /** 입력 1단위당 결과(=계수). 선형 변환일 때만 */
  factor?: number
  molarMass?: { value: number; label: string; breakdown?: string }
  valence?: number
  assumptions: string[]
  sources: Source[]
}

export type ConvertResult = { ok: true; value: number; basis: Basis } | { ok: false; reason: string }

type Method = 'scale' | 'molar' | 'equivalent'

/** 사용자가 쓰기 쉬운 표기를 UCUM 코드로 정리: µ/μ→u, mEq→meq, 공백 제거 */
export function normalizeUnit(raw: string): { ucum: string; annotation?: string; shown: string } {
  const shown = raw.trim()
  const ann = shown.match(/\{([^}]*)\}/)?.[1]
  let u = shown.replace(/\{[^}]*\}/g, '').replace(/[µμ]/g, 'u').replace(/\s+/g, '')
  u = u.replace(/(^|[/.])([kmunp]?)Eq(?![a-zA-Z])/g, (_m, p, pre) => `${p}${pre}eq`)
  return { ucum: u, annotation: ann, shown }
}

interface MassBasis {
  mw?: number
  label: string
  breakdown?: string
  note?: string
}

function massBasisFor(a: Analyte, annotation?: string): MassBasis | { error: string } {
  if (annotation && a.altMassBasis?.[annotation]) {
    const alt = a.altMassBasis[annotation]
    return { mw: molarMass(alt.formula), label: `${alt.formula}`, breakdown: molarMassBreakdown(alt.formula), note: alt.note }
  }
  if (annotation) return { error: `주석 {${annotation}}는 ${a.ko}에서 정의되지 않았습니다.` }
  if (a.formula) return { mw: molarMass(a.formula), label: a.formula, breakdown: molarMassBreakdown(a.formula), note: a.mwNote }
  return { label: '', note: undefined }
}

const KIND_KO: Record<string, string> = {
  mass: '질량',
  'amount of substance': '물질량(몰)',
  'catalytic activity': '촉매 활성(효소 활성)',
  fraction: '비율',
  volume: '부피',
}

function incommensurableReason(a: Analyte, from: string, to: string): string {
  const kf = ucumKind(from).property
  const kt = ucumKind(to).property
  const isCat = (k?: string) => k === 'catalytic activity'
  if (isCat(kf) !== isCat(kt) && (isCat(kf) || isCat(kt))) {
    return `효소 활성(U/L, 촉매 활성: 단위시간당 반응한 기질의 양)과 질량·몰 농도는 서로 다른 물리량이라 변환할 수 없습니다. 효소 1 U에 해당하는 질량은 효소 제제의 비활성(specific activity)과 검사 조건에 따라 달라 보편적인 변환 계수가 존재하지 않습니다. (${from} → ${to})`
  }
  const fk = KIND_KO[kf ?? ''] ?? kf ?? '알 수 없음'
  const tk = KIND_KO[kt ?? ''] ?? kt ?? '알 수 없음'
  return `${from}(${fk})와 ${to}(${tk})는 UCUM 차원이 달라 변환할 수 없습니다. ${a.ko}에 대해 두 단위를 연결하는 근거(분자량·이온가·공식)가 없습니다.`
}

function mapFailure(a: Analyte, code: UcumFailure, from: string, to: string, msg: string): string {
  switch (code) {
    case 'missing-molecular-weight':
      return a.noMwReason ?? `${a.ko}은(는) 질량↔몰 변환에 필요한 분자량 근거가 없어 거부합니다.`
    case 'missing-charge':
      return a.noEqReason ?? `${a.ko}은(는) 이온(전하)이 아니므로 당량(eq) 단위로 변환할 근거가 없습니다.`
    case 'incommensurable':
      return incommensurableReason(a, from, to)
    case 'invalid': {
      const bad = [from, to].filter((u) => !ucumKind(u).valid)
      return `UCUM이 인식하지 못하는 단위입니다: ${bad.join(', ') || `${from}, ${to}`}. (예: mEq → meq, µmol → umol)`
    }
    default:
      return msg || '변환할 수 없습니다.'
  }
}

interface Pipeline {
  method: Method
  run: (v: number) => number
  mwFrom?: MassBasis
  mwTo?: MassBasis
}

type RunResult = { ok: true; value: number } | { ok: false; code: UcumFailure; message: string }

function tryLevel(
  level: Method,
  a: Analyte,
  from: ReturnType<typeof normalizeUnit>,
  to: ReturnType<typeof normalizeUnit>,
  bf: MassBasis,
  bt: MassBasis,
  v: number,
): RunResult {
  const opts = (b: MassBasis) => {
    const o: { molecularWeight?: number; charge?: number } = {}
    if (level !== 'scale' && b.mw) o.molecularWeight = b.mw
    if (level === 'equivalent' && a.valence) o.charge = a.valence
    return o
  }
  const differentBasis = bf.mw !== bt.mw
  if (!differentBasis) return ucumConvert(from.ucum, v, to.ucum, opts(bf))
  if (level === 'scale') return { ok: false, code: 'missing-molecular-weight', message: '' }
  // 질량 기준이 서로 다른 경우(BUN ↔ 요소): mol/L를 경유한다.
  const mid = ucumConvert(from.ucum, v, 'mol/L', opts(bf))
  if (!mid.ok) return mid
  return ucumConvert('mol/L', mid.value, to.ucum, opts(bt))
}

function runPipeline(
  a: Analyte,
  from: ReturnType<typeof normalizeUnit>,
  to: ReturnType<typeof normalizeUnit>,
  bf: MassBasis,
  bt: MassBasis,
): { ok: true; p: Pipeline } | { ok: false; code: UcumFailure; message: string } {
  const levels: Method[] = ['scale', 'molar', 'equivalent']
  let last: RunResult = { ok: false, code: 'other', message: '' }
  for (const level of levels) {
    const probe = tryLevel(level, a, from, to, bf, bt, 1)
    if (probe.ok) {
      // 당량 단계는 이온가가 실제로 결과를 바꿀 때만 equivalent로 표기
      const molarProbe = level === 'equivalent' ? tryLevel('molar', a, from, to, bf, bt, 1) : probe
      const method: Method = level === 'equivalent' && molarProbe.ok && molarProbe.value === probe.value ? 'molar' : level
      return {
        ok: true,
        p: {
          method,
          mwFrom: bf,
          mwTo: bt,
          run: (v) => {
            const r = tryLevel(level, a, from, to, bf, bt, v)
            return r.ok ? r.value : NaN
          },
        },
      }
    }
    last = probe
    // 단위 자체가 잘못되었으면 더 시도하지 않는다.
    if (probe.code === 'invalid') break
  }
  return { ok: false, code: (last as { code: UcumFailure }).code, message: (last as { message: string }).message }
}

function hba1c(a: Analyte, value: number, from: string, to: string): ConvertResult {
  const norm = (u: string) => u.trim().toLowerCase().replace(/\s+/g, '')
  const f = norm(from)
  const t = norm(to)
  const known = ['%', 'mmol/mol']
  if (!known.includes(f) || !known.includes(t)) {
    return { ok: false, reason: `HbA1c는 %(NGSP)와 mmol/mol(IFCC) 사이에서만 변환합니다. (입력: ${from} → ${to})` }
  }
  const basis = (formulas: string[]): Basis => ({
    method: 'NGSP–IFCC master equation (공식 변환)',
    formulas,
    assumptions: a.assumptions ?? [],
    sources: a.sources ?? [SRC.ngsp],
  })
  const M = 'NGSP(%) = 0.09148 × IFCC(mmol/mol) + 2.152'
  if (f === t) return { ok: true, value, basis: { ...basis(['동일 단위: 변환 없음']), factor: 1 } }
  if (f === 'mmol/mol') return { ok: true, value: 0.09148 * value + 2.152, basis: basis([M, '결과(%) = 0.09148 × 입력(mmol/mol) + 2.152']) }
  return { ok: true, value: (value - 2.152) / 0.09148, basis: basis([M, '결과(mmol/mol) = (입력(%) − 2.152) ÷ 0.09148']) }
}

export function convert(a: Analyte, value: number, fromRaw: string, toRaw: string): ConvertResult {
  if (!Number.isFinite(value)) return { ok: false, reason: '숫자 값을 입력하세요.' }
  if (!fromRaw.trim() || !toRaw.trim()) return { ok: false, reason: '원본 단위와 대상 단위를 모두 입력하세요.' }
  if (a.special === 'hba1c') return hba1c(a, value, fromRaw, toRaw)
  if (value < 0) return { ok: false, reason: '검사 농도는 음수일 수 없습니다.' }

  const from = normalizeUnit(fromRaw)
  const to = normalizeUnit(toRaw)
  const bf = massBasisFor(a, from.annotation)
  const bt = massBasisFor(a, to.annotation)
  if ('error' in bf) return { ok: false, reason: bf.error }
  if ('error' in bt) return { ok: false, reason: bt.error }

  const r = runPipeline(a, from, to, bf, bt)
  if (!r.ok) return { ok: false, reason: mapFailure(a, r.code, from.ucum, to.ucum, r.message) }

  const { p } = r
  const out = p.run(value)
  const factor = p.run(1)
  const basis = describe(a, p, from, to, factor)
  return { ok: true, value: out, basis }
}

function describe(a: Analyte, p: Pipeline, from: ReturnType<typeof normalizeUnit>, to: ReturnType<typeof normalizeUnit>, factor: number): Basis {
  const assumptions = [...(a.assumptions ?? [])]
  const sources: Source[] = [...(a.sources ?? []), SRC.ucum]
  const formulas: string[] = []
  const shownFrom = from.shown
  const shownTo = to.shown
  let method = 'UCUM 차원 검사 + 스케일 변환'
  let mass: Basis['molarMass']
  let valence: number | undefined

  if (p.method === 'scale') {
    formulas.push(`결과(${shownTo}) = 입력(${shownFrom}) × ${fmt(factor, 8)}`)
    formulas.push('계수는 두 단위를 SI 기본 단위의 곱으로 정의한 UCUM 정의에서 계산한 비율입니다(표 복사 아님).')
  } else {
    sources.push(SRC.iupac)
    method = p.method === 'equivalent' ? 'UCUM + 분자량(IUPAC 원자량) + 이온 전하' : 'UCUM + 분자량(IUPAC 원자량)'
    const bf = p.mwFrom!
    const bt = p.mwTo!
    const used = bf.mw ? bf : bt
    if (used.mw) {
      mass = { value: used.mw, label: used.label, breakdown: used.breakdown }
      formulas.push('물질량 n(mol) = 질량 m(g) ÷ MW(g/mol), 질량 m = n × MW')
      formulas.push(`MW(${used.label}) = ${used.breakdown} = ${fmt(used.mw, 6)} g/mol`)
      if (used.note) assumptions.push(used.note)
    }
    if (bf.mw !== bt.mw && bt.mw) {
      formulas.push(`대상 단위 쪽 MW(${bt.label}) = ${bt.breakdown} = ${fmt(bt.mw, 6)} g/mol`)
      if (bt.note) assumptions.push(bt.note)
    }
    if (p.method === 'equivalent' && a.valence) {
      valence = a.valence
      formulas.push(`당량 mEq = 물질량 mmol × 이온가 z  (z = ${a.valence}, ${a.ko}${a.valence === 1 ? '' : ` ${a.valence}가 이온`})`)
    }
    formulas.push(`결과(${shownTo}) = 입력(${shownFrom}) × ${fmt(factor, 8)}`)
  }
  return { method, formulas, factor, molarMass: mass, valence, assumptions, sources }
}
