import { useMemo, useState } from 'react'
import AnalytePicker from './AnalytePicker'
import { getAnalyte, type Analyte } from '../data/analytes'
import { INTERVALS, REF_SOURCE } from '../data/referenceIntervals'
import { convert } from '../lib/convert'
import { fmt } from '../lib/format'
import { formatBand, judge, lookupInterval, patientAgeDays, type AgeUnit } from '../lib/interval'

const FLAG_KO = { low: '낮음 (low)', normal: '정상 (normal)', high: '높음 (high)' } as const

export default function IntervalTab() {
  const [analyte, setAnalyte] = useState<Analyte>(getAnalyte('sodium'))
  const [ageStr, setAgeStr] = useState('30')
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('y')
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const [specimen, setSpecimen] = useState<'serum' | 'plasma'>('serum')
  const [valStr, setValStr] = useState('')
  const [valUnit, setValUnit] = useState<string | null>(null)

  const age = ageStr.trim() === '' ? NaN : Number(ageStr)
  const ageOk = Number.isFinite(age) && age >= 0
  const lookup = useMemo(
    () => (ageOk ? lookupInterval(analyte.refKey ?? analyte.id, patientAgeDays(age, ageUnit), sex, specimen) : null),
    [analyte, age, ageUnit, ageOk, sex, specimen],
  )

  const unit = valUnit ?? (lookup?.found ? lookup.row.unit : analyte.defaultFrom)
  const val = valStr.trim() === '' ? NaN : Number(valStr)

  const judged = useMemo(() => {
    if (!lookup?.found || !Number.isFinite(val)) return null
    const conv = convert(analyte, val, unit, lookup.row.unit)
    if (!conv.ok) return { ok: false as const, error: conv.reason }
    return { ok: true as const, value: conv.value, flag: judge(conv.value, lookup.row), converted: unit !== lookup.row.unit }
  }, [lookup, analyte, val, unit])

  const bandsForAnalyte = INTERVALS.filter((r) => r.analyte === (analyte.refKey ?? analyte.id))
  const isChild = ageOk && patientAgeDays(age, ageUnit) < 18 * 365.25

  return (
    <section aria-labelledby="t-interval">
      <h2 id="t-interval" className="sr-only">참고구간</h2>
      <AnalytePicker
        id="interval-analyte"
        value={analyte}
        onChange={(a) => {
          setAnalyte(a)
          setValUnit(null)
        }}
        badge={(a) => (a.refKey ? null : '구간 미수록')}
      />

      <div className="row">
        <div className="field">
          <label htmlFor="age">나이</label>
          <div className="inline">
            <input id="age" inputMode="decimal" value={ageStr} onChange={(e) => setAgeStr(e.target.value)} />
            <select aria-label="나이 단위" value={ageUnit} onChange={(e) => setAgeUnit(e.target.value as AgeUnit)}>
              <option value="y">세</option>
              <option value="mo">개월</option>
              <option value="wk">주</option>
              <option value="d">일</option>
            </select>
          </div>
        </div>
        <fieldset className="field">
          <legend>성별</legend>
          <label className="radio"><input type="radio" name="sex" checked={sex === 'M'} onChange={() => setSex('M')} /> 남</label>
          <label className="radio"><input type="radio" name="sex" checked={sex === 'F'} onChange={() => setSex('F')} /> 여</label>
        </fieldset>
        <div className="field">
          <label htmlFor="spec">검체</label>
          <select id="spec" value={specimen} onChange={(e) => setSpecimen(e.target.value as 'serum' | 'plasma')}>
            <option value="serum">혈청 (serum)</option>
            <option value="plasma">혈장 (plasma)</option>
          </select>
        </div>
      </div>

      {!ageOk && <div className="refuse" role="alert">나이를 0 이상의 숫자로 입력하세요.</div>}

      {lookup && !lookup.found && (
        <div className="refuse" role="alert">
          <strong>공표된 참고구간이 없습니다.</strong>
          <p>{lookup.reason}</p>
          {lookup.available.length > 0 && (
            <p className="small">수록된 구간은 아래 표를 참고하세요. 수록되지 않은 나이는 보간/외삽하지 않습니다.</p>
          )}
        </div>
      )}

      {lookup?.found && (
        <div className="result">
          <div className="big">
            <span className="num">{fmt(lookup.row.low, 4)} – {fmt(lookup.row.high, 4)}</span> <span className="unit">{lookup.row.unit}</span>
          </div>
          <dl className="meta">
            <dt>검체</dt><dd>{lookup.row.specimen === 'both' ? '혈청 또는 혈장' : lookup.row.specimen === 'serum' ? '혈청' : '혈장'}</dd>
            <dt>나이 구간</dt><dd>{formatBand(lookup.row)}</dd>
            <dt>성별</dt><dd>{lookup.row.sex === 'any' ? '남녀 공통' : lookup.row.sex === 'M' ? '남' : '여'}</dd>
            <dt>출처</dt>
            <dd>
              <a href={REF_SOURCE.url} target="_blank" rel="noreferrer noopener">{REF_SOURCE.label}</a> — {lookup.row.table}
            </dd>
            {lookup.row.note && (<><dt>참고</dt><dd>{lookup.row.note}</dd></>)}
          </dl>
        </div>
      )}

      {lookup?.found && (
        <div className="judge">
          <h3>결과 판정</h3>
          <div className="row">
            <div className="field grow">
              <label htmlFor="rv">결과 값</label>
              <input id="rv" inputMode="decimal" value={valStr} onChange={(e) => setValStr(e.target.value)} />
            </div>
            <div className="field grow">
              <label htmlFor="ru">단위</label>
              <input id="ru" list="ref-units" value={unit} onChange={(e) => setValUnit(e.target.value)} autoCapitalize="off" spellCheck={false} />
              <datalist id="ref-units">
                {analyte.units.map((u) => <option key={u} value={u} />)}
              </datalist>
            </div>
          </div>
          {judged && !judged.ok && <div className="refuse" role="alert">{judged.error}</div>}
          {judged && judged.ok && (
            <div className={`flag ${judged.flag}`} aria-live="polite">
              {FLAG_KO[judged.flag]}
              {judged.converted && (
                <span className="small"> — 구간 단위로 환산: {fmt(judged.value, 4)} {lookup.row.unit}</span>
              )}
            </div>
          )}
        </div>
      )}

      {isChild && (
        <p className="note">
          소아(18세 미만)는 검사법·기기별 차이가 커서 연령별 세분 구간이 필요할 수 있습니다. 소아 참고구간은{' '}
          <a href={REF_SOURCE.caliper.url} target="_blank" rel="noreferrer noopener">CALIPER</a>를 함께 확인하세요.
        </p>
      )}

      {bandsForAnalyte.length > 0 && (
        <details className="bands">
          <summary>{analyte.ko}에 수록된 모든 구간 보기 ({bandsForAnalyte.length}개)</summary>
          <div className="tablewrap">
            <table>
              <thead><tr><th>검체</th><th>성별</th><th>나이</th><th>구간</th></tr></thead>
              <tbody>
                {bandsForAnalyte.map((r, i) => (
                  <tr key={i} className={lookup?.found && lookup.row === r ? 'hit' : ''}>
                    <td>{r.specimen === 'both' ? '혈청/혈장' : r.specimen === 'serum' ? '혈청' : '혈장'}</td>
                    <td>{r.sex === 'any' ? '공통' : r.sex === 'M' ? '남' : '여'}</td>
                    <td>{formatBand(r)}</td>
                    <td>{fmt(r.low, 4)} – {fmt(r.high, 4)} {r.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  )
}
