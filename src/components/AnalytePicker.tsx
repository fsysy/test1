import { useState } from 'react'
import { ANALYTES, searchAnalytes, type Analyte } from '../data/analytes'

interface Props {
  id: string
  value: Analyte
  onChange: (a: Analyte) => void
  badge?: (a: Analyte) => string | null
}

/** 영문·한글·동의어로 검색하는 분석물 선택기 */
export default function AnalytePicker({ id, value, onChange, badge }: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const list = searchAnalytes(q, ANALYTES)

  return (
    <div className="picker">
      <label htmlFor={id}>분석물 검색 (영문·한글·동의어)</label>
      <input
        id={id}
        type="search"
        autoComplete="off"
        placeholder="예: glucose, 혈당, BUN, A1c, 칼륨"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      <div className="picked">
        선택됨: <strong>{value.ko}</strong> <span className="muted">{value.en}</span>
      </div>
      {open && (
        <ul className="results" role="listbox" aria-label="분석물 검색 결과">
          {list.length === 0 && <li className="muted empty">검색 결과 없음</li>}
          {list.map((a) => {
            const b = badge?.(a)
            return (
              <li key={a.id} role="option" aria-selected={a.id === value.id}>
                <button
                  type="button"
                  className={a.id === value.id ? 'on' : ''}
                  onClick={() => {
                    onChange(a)
                    setQ('')
                    setOpen(false)
                  }}
                >
                  <span>{a.ko}</span>
                  <span className="muted"> {a.en}</span>
                  {b && <span className="tag">{b}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
