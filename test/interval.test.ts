import { describe, expect, it } from 'vitest'
import { INTERVALS } from '../src/data/referenceIntervals'
import { ageToDays, judge, lookupInterval, patientAgeDays } from '../src/lib/interval'

const adult = patientAgeDays(30, 'y')

describe('참고구간 조회 (공표된 구간만)', () => {
  it('성인 나트륨 135–145', () => {
    const r = lookupInterval('sodium', adult, 'M', 'serum')
    expect(r.found && [r.row.low, r.row.high]).toEqual([135, 145])
  })
  it('성별 구분: 크레아티닌 30세 남 60–110 / 여 45–90', () => {
    const m = lookupInterval('creatinine', adult, 'M', 'serum')
    const f = lookupInterval('creatinine', adult, 'F', 'serum')
    expect(m.found && [m.row.low, m.row.high]).toEqual([60, 110])
    expect(f.found && [f.row.low, f.row.high]).toEqual([45, 90])
  })
  it('크레아티닌 60세 이상은 공표 구간 없음 → 외삽 금지', () => {
    const r = lookupInterval('creatinine', patientAgeDays(60, 'y'), 'M', 'serum')
    expect(r.found).toBe(false)
    const r2 = lookupInterval('creatinine', patientAgeDays(75, 'y'), 'F', 'serum')
    expect(r2.found).toBe(false)
  })
  it('나이 경계: 하한 포함·상한 미포함', () => {
    const a = lookupInterval('sodium', patientAgeDays(6, 'd'), 'M', 'serum')
    const b = lookupInterval('sodium', patientAgeDays(1, 'wk'), 'M', 'serum')
    expect(a.found && a.row.low).toBe(132)
    expect(b.found && b.row.low).toBe(133)
  })
  it('혈장 칼륨 성인은 미수록, 혈청은 있음', () => {
    expect(lookupInterval('potassium', adult, 'M', 'plasma').found).toBe(false)
    const s = lookupInterval('potassium', adult, 'M', 'serum')
    expect(s.found && [s.row.low, s.row.high]).toEqual([3.5, 5.2])
  })
  it('수록되지 않은 분석물은 데이터 없음', () => {
    const r = lookupInterval('glucose', adult, 'M', 'serum')
    expect(r.found).toBe(false)
  })
  it('ALP 14세 남/여 구간이 서로 다름', () => {
    const m = lookupInterval('alp', patientAgeDays(14, 'y'), 'M', 'serum')
    const f = lookupInterval('alp', patientAgeDays(14, 'y'), 'F', 'serum')
    expect(m.found && m.row.low).toBe(105)
    expect(f.found && f.row.low).toBe(50)
  })
  it('각 분석물·성별·검체 조합에서 구간이 겹치지 않는다', () => {
    const keys = [...new Set(INTERVALS.map((r) => r.analyte))]
    for (const k of keys)
      for (const sex of ['M', 'F'] as const)
        for (const sp of ['serum', 'plasma'] as const) {
          const rs = INTERVALS.filter((r) => r.analyte === k && (r.sex === 'any' || r.sex === sex) && (r.specimen === 'both' || r.specimen === sp))
            .sort((x, y) => ageToDays(x.ageFrom) - ageToDays(y.ageFrom))
          for (let i = 1; i < rs.length; i++) {
            const prevTo = rs[i - 1].ageTo
            expect(prevTo, `${k}/${sex}/${sp}`).not.toBeNull()
            expect(ageToDays(prevTo!)).toBeLessThanOrEqual(ageToDays(rs[i].ageFrom))
          }
        }
  })
})

describe('low/normal/high 판정', () => {
  const row = { low: 135, high: 145 }
  it('경계 및 범위 밖', () => {
    expect(judge(134.9, row)).toBe('low')
    expect(judge(135, row)).toBe('normal')
    expect(judge(145, row)).toBe('normal')
    expect(judge(145.1, row)).toBe('high')
  })
})
