// 교차 검증 전용: Labcorp SI Unit Conversion Table(test/fixtures/labcorp-si.json)과 대조한다.
// 앱 코드는 이 표를 사용하지 않는다. Labcorp 계수는 반올림되어 있으므로,
// 표기된 마지막 자리의 ±0.5 범위 안에 계산값이 들어오는지로 판정한다.
// 관찰: Labcorp의 역방향 열은 정확값이 아니라 '반올림된 정방향 계수의 역수'로 보인다
// (예: 콜레스테롤 1/0.0259 = 38.61, 정확값 38.67). 그래서 역방향은 정방향 반올림 오차까지
// 합산한 상대 허용오차로 판정한다.
import { describe, expect, it } from 'vitest'
import fixture from './fixtures/labcorp-si.json'
import { getAnalyte } from '../src/data/analytes'
import { convert } from '../src/lib/convert'

function halfUlp(s: string): number {
  const dec = s.includes('.') ? s.split('.')[1].length : 0
  return 0.5 * Math.pow(10, -dec)
}

describe('Labcorp SI 변환표와 교차 검증', () => {
  for (const row of fixture.rows) {
    it(`${row.labcorpName}: ${row.from}→${row.to} ×${row.convToSI}, 역방향 ×${row.siToConv}`, () => {
      const a = getAnalyte(row.analyteId)
      const fwd = convert(a, 1, row.from, row.to)
      const back = convert(a, 1, row.to, row.from)
      expect(fwd.ok && back.ok).toBe(true)
      if (!fwd.ok || !back.ok) return
      expect(Math.abs(fwd.value - Number(row.convToSI))).toBeLessThanOrEqual(halfUlp(row.convToSI) + 1e-12)
      const relTol = halfUlp(row.convToSI) / Number(row.convToSI) + halfUlp(row.siToConv) / Number(row.siToConv)
      expect(Math.abs(back.value - Number(row.siToConv)) / Number(row.siToConv)).toBeLessThanOrEqual(relTol)
    })
  }
})
