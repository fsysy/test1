import { useMemo, useState } from 'react'
import AnalytePicker from './AnalytePicker'
import { getAnalyte, type Analyte } from '../data/analytes'
import { convert } from '../lib/convert'
import { fmt } from '../lib/format'

export default function ConvertTab() {
  const [analyte, setAnalyte] = useState<Analyte>(getAnalyte('glucose'))
  const [valueStr, setValueStr] = useState('100')
  const [from, setFrom] = useState(analyte.defaultFrom)
  const [to, setTo] = useState(analyte.defaultTo)
  const [copied, setCopied] = useState(false)

  const pick = (a: Analyte) => {
    setAnalyte(a)
    setFrom(a.defaultFrom)
    setTo(a.defaultTo)
  }

  const value = valueStr.trim() === '' ? NaN : Number(valueStr)
  const result = useMemo(() => convert(analyte, value, from, to), [analyte, value, from, to])

  const swap = () => {
    if (result.ok) setValueStr(fmt(result.value, 6))
    setFrom(to)
    setTo(from)
  }

  const copy = async () => {
    if (!result.ok) return
    try {
      await navigator.clipboard.writeText(`${fmt(result.value, 4)} ${to}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section aria-labelledby="t-convert">
      <h2 id="t-convert" className="sr-only">단위 변환</h2>
      <AnalytePicker id="convert-analyte" value={analyte} onChange={pick} />

      <div className="row">
        <div className="field grow">
          <label htmlFor="val">값</label>
          <input id="val" inputMode="decimal" value={valueStr} onChange={(e) => setValueStr(e.target.value)} />
        </div>
        <div className="field grow">
          <label htmlFor="from">원본 단위</label>
          <input id="from" list="units-list" value={from} onChange={(e) => setFrom(e.target.value)} autoCapitalize="off" spellCheck={false} />
        </div>
        <button type="button" className="swap" onClick={swap} aria-label="원본·대상 단위 맞바꾸기" title="원본·대상 단위 맞바꾸기">⇄</button>
        <div className="field grow">
          <label htmlFor="to">대상 단위</label>
          <input id="to" list="units-list" value={to} onChange={(e) => setTo(e.target.value)} autoCapitalize="off" spellCheck={false} />
        </div>
      </div>
      <datalist id="units-list">
        {[...analyte.units, 'mg/dL', 'U/L'].filter((u, i, arr) => arr.indexOf(u) === i).map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <p className="muted small">
        단위는 UCUM 표기로 입력합니다 (예: umol/L, meq/L, mg/dL). 목록에 없는 단위도 입력하면 변환 가능 여부를 판정합니다.
      </p>

      {result.ok ? (
        <div className="result" aria-live="polite">
          <div className="big">
            <span className="num">{fmt(result.value, 4)}</span> <span className="unit">{to}</span>
          </div>
          <button type="button" onClick={copy}>{copied ? '복사됨 ✓' : '결과 복사'}</button>
        </div>
      ) : (
        <div className="refuse" role="alert">
          <strong>변환할 수 없습니다.</strong>
          <p>{result.reason}</p>
        </div>
      )}

      {result.ok && (
        <article className="basis" aria-label="계산 근거">
          <h3>계산 근거</h3>
          <dl>
            <dt>방법</dt>
            <dd>{result.basis.method}</dd>
            <dt>계수</dt>
            <dd>
              {result.basis.factor !== undefined
                ? `1 ${from} = ${fmt(result.basis.factor, 8)} ${to}`
                : '선형 계수 아님(식 참조)'}
            </dd>
            <dt>수식</dt>
            <dd>
              {result.basis.formulas.map((f) => (
                <div key={f} className="formula">{f}</div>
              ))}
            </dd>
            {result.basis.molarMass && (
              <>
                <dt>분자량</dt>
                <dd>{fmt(result.basis.molarMass.value, 6)} g/mol ({result.basis.molarMass.label})</dd>
              </>
            )}
            {result.basis.valence !== undefined && (
              <>
                <dt>이온가</dt>
                <dd>z = {result.basis.valence}</dd>
              </>
            )}
            <dt>가정</dt>
            <dd>
              {result.basis.assumptions.length === 0 ? (
                <span className="muted">특별한 가정 없음 (단위 정의에 따른 환산)</span>
              ) : (
                <ul>{result.basis.assumptions.map((s) => <li key={s}>{s}</li>)}</ul>
              )}
            </dd>
            <dt>출처</dt>
            <dd>
              <ul>
                {result.basis.sources.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer noopener">{s.label}</a></li>
                ))}
              </ul>
            </dd>
          </dl>
        </article>
      )}
    </section>
  )
}
