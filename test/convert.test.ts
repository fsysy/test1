import { describe, expect, it } from 'vitest'
import { getAnalyte } from '../src/data/analytes'
import { convert } from '../src/lib/convert'

const c = (id: string, v: number, f: string, t: string) => convert(getAnalyte(id), v, f, t)
const val = (id: string, v: number, f: string, t: string) => {
  const r = c(id, v, f, t)
  if (!r.ok) throw new Error(r.reason)
  return r.value
}

describe('분자량·UCUM 변환', () => {
  it('포도당 100 mg/dL ≈ 5.551 mmol/L (MW 180.156 계산값)', () => {
    expect(val('glucose', 100, 'mg/dL', 'mmol/L')).toBeCloseTo(5.5507, 3)
  })
  it('왕복 변환이 원래 값으로 돌아온다', () => {
    const mmol = val('creatinine', 1.0, 'mg/dL', 'umol/L')
    expect(val('creatinine', mmol, 'umol/L', 'mg/dL')).toBeCloseTo(1.0, 6)
  })
  it('크레아티닌 1 mg/dL ≈ 88.4 µmol/L', () => {
    expect(val('creatinine', 1, 'mg/dL', 'umol/L')).toBeCloseTo(88.4, 1)
  })
  it('µ 기호·대소문자 표기 정규화', () => {
    expect(val('creatinine', 1, 'mg/dL', 'µmol/L')).toBeCloseTo(88.4, 1)
  })
  it('칼슘 mg/dL ↔ mEq/L는 이온가 2를 적용', () => {
    expect(val('calcium', 10, 'mg/dL', 'mmol/L')).toBeCloseTo(2.495, 2)
    expect(val('calcium', 10, 'mg/dL', 'mEq/L')).toBeCloseTo(4.99, 2)
  })
  it('나트륨 mEq/L = mmol/L (z=1)', () => {
    expect(val('sodium', 140, 'mEq/L', 'mmol/L')).toBeCloseTo(140, 6)
  })
  it('마그네슘 mmol/L → mEq/L ×2', () => {
    expect(val('magnesium', 0.85, 'mmol/L', 'meq/L')).toBeCloseTo(1.7, 6)
  })
  it('BUN ↔ 요소: BUN 14 mg/dL ≈ 5.0 mmol/L 요소', () => {
    expect(val('urea', 14, 'mg/dL{BUN}', 'mmol/L')).toBeCloseTo(4.997, 2)
    expect(val('urea', 14, 'mg/dL{BUN}', 'mg/dL')).toBeCloseTo(14 * (60.055 / 28.014), 1)
  })
  it('효소 U/L ↔ µkat/L는 UCUM 스케일(÷60)', () => {
    expect(val('alp', 60, 'U/L', 'ukat/L')).toBeCloseTo(1, 9)
  })
  it('g/dL ↔ g/L 스케일', () => {
    expect(val('albumin', 4, 'g/dL', 'g/L')).toBeCloseTo(40, 9)
  })
})

describe('특수 변환', () => {
  it('HbA1c: NGSP = 0.09148×IFCC + 2.152', () => {
    expect(val('hba1c', 53, 'mmol/mol', '%')).toBeCloseTo(0.09148 * 53 + 2.152, 9)
    expect(val('hba1c', 7, '%', 'mmol/mol')).toBeCloseTo((7 - 2.152) / 0.09148, 9)
  })
  it('HbA1c 7.0% ≈ 53 mmol/mol (임상 관례 대응)', () => {
    expect(Math.round(val('hba1c', 7, '%', 'mmol/mol'))).toBe(53)
  })
  it('uACR 30 mg/g ≈ 3.39 mg/mmol (정확 환산), 300 mg/g ≈ 33.9', () => {
    expect(val('uacr', 30, 'mg/g', 'mg/mmol')).toBeCloseTo(3.394, 2)
    expect(val('upcr', 150, 'mg/g', 'mg/mmol')).toBeCloseTo(16.97, 1)
  })
  it('uACR mg/mmol → mg/g 왕복', () => {
    expect(val('uacr', 3, 'mg/mmol', 'mg/g')).toBeCloseTo(3 / 0.11312, 1)
  })
})

describe('근거 없는 변환은 이유와 함께 거부', () => {
  it('mg/dL → U/L (효소)', () => {
    const r = c('alp', 10, 'mg/dL', 'U/L')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('촉매 활성')
  })
  it('U/L → mg/dL', () => {
    expect(c('alp', 10, 'U/L', 'mg/dL').ok).toBe(false)
  })
  it('알부민 g/dL → mmol/L: 분자량 근거 없음', () => {
    const r = c('albumin', 4, 'g/dL', 'mmol/L')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('분자량')
  })
  it('헤모글로빈 mmol/L는 단량체/사량체 모호성으로 거부', () => {
    const r = c('hemoglobin', 14, 'g/dL', 'mmol/L')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('단량체')
  })
  it('인산염 mEq/L 거부(이온가 pH 의존)', () => {
    const r = c('phosphate', 3.5, 'mg/dL', 'mEq/L')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('pH')
  })
  it('포도당 mEq/L 거부(비이온성)', () => {
    expect(c('glucose', 90, 'mg/dL', 'mEq/L').ok).toBe(false)
  })
  it('UCUM에 없는 단위 거부', () => {
    const r = c('glucose', 90, 'mg/dL', 'foo/bar')
    expect(r.ok).toBe(false)
  })
  it('HbA1c를 mg/dL로 변환 거부', () => {
    expect(c('hba1c', 7, '%', 'mg/dL').ok).toBe(false)
  })
  it('음수 농도 거부', () => {
    expect(c('glucose', -1, 'mg/dL', 'mmol/L').ok).toBe(false)
  })
})
