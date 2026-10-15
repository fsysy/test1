import { useState } from 'react'
import ConvertTab from './components/ConvertTab'
import IntervalTab from './components/IntervalTab'

type Tab = 'convert' | 'interval'

export default function App() {
  const [tab, setTab] = useState<Tab>('convert')
  return (
    <div className="app">
      <header>
        <h1>임상검사 단위 변환 · 참고구간</h1>
        <p className="muted small">
          교육·참고용입니다. 진단·치료 결정에 단독으로 사용하지 마세요. 검사실이 보고한 참고구간이 우선합니다.
        </p>
      </header>

      <div role="tablist" aria-label="기능" className="tabs">
        <button role="tab" id="tab-convert" aria-selected={tab === 'convert'} aria-controls="panel-convert" onClick={() => setTab('convert')}>
          변환
        </button>
        <button role="tab" id="tab-interval" aria-selected={tab === 'interval'} aria-controls="panel-interval" onClick={() => setTab('interval')}>
          참고구간
        </button>
      </div>

      <main>
        <div role="tabpanel" id="panel-convert" aria-labelledby="tab-convert" hidden={tab !== 'convert'}>
          <ConvertTab />
        </div>
        <div role="tabpanel" id="panel-interval" aria-labelledby="tab-interval" hidden={tab !== 'interval'}>
          <IntervalTab />
        </div>
      </main>

      <footer className="muted small">
        변환: UCUM(@lhncbc/ucum-lhc) + IUPAC 원자량 계산, HbA1c는 NGSP 공식. 참고구간: AACB/RCPA Harmonised Reference Intervals(Table 5·6).
        표에 없는 항목은 비워 두었습니다.
      </footer>
    </div>
  )
}
