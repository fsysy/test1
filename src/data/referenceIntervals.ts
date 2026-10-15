// 참고구간: AACB/RCPA 승인 Harmonised Reference Intervals (Final Performance Report, 2014)
//   Table 6 (연령별, 소아~성인) 및 Table 5 (성인 전용) 에서 옮긴 값만 포함한다.
// 이 표에 없는 분석물·연령·검체는 '데이터 없음'으로 두며 절대 외삽/보간하지 않는다.
//
// 나이 표기: '0' | '1wk' | '1mo' | '6mo' | '2y' ... (하한은 포함, 상한은 미포함, null=상한 없음)

export type Sex = 'M' | 'F' | 'any'
export type Specimen = 'serum' | 'plasma' | 'both'

export interface IntervalRow {
  analyte: string
  specimen: Specimen
  sex: Sex
  ageFrom: string
  ageTo: string | null
  low: number
  high: number
  unit: string
  table: 'Table 5' | 'Table 6'
  note?: string
}

export const REF_SOURCE = {
  label: 'AACB/RCPA Harmonised Reference Intervals — Final Performance Report (Table 5, Table 6)',
  url: 'https://aacblm.imiscloud.com/common/Uploaded%20files/aacb/guidelines%20and%20position%20statements/position%20statements/supporting%20documentation/20140630%20GPS%20Harmonisation%20QUPP%20final%20report.pdf',
  rcpa: { label: 'RCPA (rcpa.edu.au)', url: 'https://www.rcpa.edu.au/' },
  caliper: { label: 'CALIPER — 소아 참고구간', url: 'https://caliperproject.ca' },
}

const NOTE_VITROS =
  '19세 미만 구간은 Ortho Vitros 효소법 크레아티닌 사용 검사실용입니다. 그 외 검사법은 18세부터 성인 구간을 적용할 수 있다고 보고서에 명시되어 있습니다.'

type Band = [string, string | null, number, number]

function rows(
  analyte: string, unit: string, specimen: Specimen, sex: Sex, table: IntervalRow['table'], bands: Band[], note?: string,
): IntervalRow[] {
  return bands.map(([ageFrom, ageTo, low, high]) => ({ analyte, unit, specimen, sex, table, ageFrom, ageTo, low, high, note }))
}

export const INTERVALS: IntervalRow[] = [
  ...rows('sodium', 'mmol/L', 'both', 'any', 'Table 6', [['0', '1wk', 132, 147], ['1wk', '18y', 133, 144], ['18y', null, 135, 145]]),
  ...rows('potassium', 'mmol/L', 'serum', 'any', 'Table 6', [
    ['0', '1wk', 3.8, 6.5], ['1wk', '6mo', 4.2, 6.7], ['6mo', '2y', 3.9, 5.6], ['2y', '18y', 3.6, 5.3], ['18y', null, 3.5, 5.2],
  ]),
  // 혈장 칼륨: 보고서는 18세 미만만 제시(성인 혈장 구간은 미수록)
  ...rows('potassium', 'mmol/L', 'plasma', 'any', 'Table 6', [
    ['0', '1wk', 3.5, 6.2], ['1wk', '6mo', 3.8, 6.4], ['6mo', '2y', 3.5, 5.4], ['2y', '18y', 3.3, 4.9],
  ]),
  ...rows('chloride', 'mmol/L', 'both', 'any', 'Table 6', [['0', '1wk', 98, 115], ['1wk', '18y', 97, 110], ['18y', null, 95, 110]]),
  ...rows('bicarbonate', 'mmol/L', 'both', 'any', 'Table 6', [
    ['0', '1wk', 15, 28], ['1wk', '2y', 16, 29], ['2y', '10y', 17, 30], ['10y', '18y', 20, 32], ['18y', null, 22, 32],
  ]),
  ...rows('calcium', 'mmol/L', 'both', 'any', 'Table 6', [
    ['0', '1wk', 1.85, 2.8], ['1wk', '6mo', 2.2, 2.8], ['6mo', '2y', 2.2, 2.7], ['2y', '18y', 2.2, 2.65], ['18y', null, 2.1, 2.6],
  ]),
  ...rows('magnesium', 'mmol/L', 'both', 'any', 'Table 6', [['0', '1wk', 0.6, 1.0], ['1wk', '18y', 0.65, 1.1], ['18y', null, 0.7, 1.1]]),
  ...rows('phosphate', 'mmol/L', 'both', 'any', 'Table 6', [
    ['0', '1wk', 1.25, 2.85], ['1wk', '1mo', 1.5, 2.75], ['1mo', '6mo', 1.45, 2.5], ['6mo', '1y', 1.3, 2.3], ['1y', '4y', 1.1, 2.2],
    ['4y', '15y', 0.9, 2.0], ['15y', '18y', 0.8, 1.85], ['18y', '20y', 0.75, 1.65], ['20y', null, 0.75, 1.5],
  ]),
  // 크레아티닌: 60세 이상은 보고서에 구간이 없다(검사실 자체 구간 유지) → 미수록
  ...rows('creatinine', 'umol/L', 'both', 'any', 'Table 6', [
    ['0', '1wk', 22, 93], ['1wk', '4wk', 17, 50], ['4wk', '2y', 11, 36], ['2y', '6y', 20, 44], ['6y', '12y', 27, 58],
  ], NOTE_VITROS),
  ...rows('creatinine', 'umol/L', 'both', 'M', 'Table 6', [['12y', '15y', 35, 83], ['15y', '19y', 50, 100], ['19y', '60y', 60, 110]], NOTE_VITROS),
  ...rows('creatinine', 'umol/L', 'both', 'F', 'Table 6', [['12y', '15y', 35, 74], ['15y', '19y', 38, 82], ['19y', '60y', 45, 90]], NOTE_VITROS),
  ...rows('alp', 'U/L', 'both', 'any', 'Table 6', [
    ['0', '1wk', 80, 380], ['1wk', '1mo', 120, 550], ['1mo', '6mo', 120, 650], ['6mo', '2y', 120, 450], ['2y', '6y', 120, 370],
    ['6y', '10y', 120, 440], ['22y', null, 30, 110],
  ]),
  ...rows('alp', 'U/L', 'both', 'M', 'Table 6', [
    ['10y', '14y', 130, 530], ['14y', '15y', 105, 480], ['15y', '17y', 80, 375], ['17y', '19y', 50, 220], ['19y', '22y', 45, 150],
  ]),
  ...rows('alp', 'U/L', 'both', 'F', 'Table 6', [
    ['10y', '13y', 100, 460], ['13y', '14y', 70, 330], ['14y', '15y', 50, 280], ['15y', '16y', 45, 170], ['16y', '22y', 35, 140],
  ]),
  // Table 5 (성인 18세 이상, 연령 세분 없음)
  ...rows('ld', 'U/L', 'both', 'any', 'Table 5', [['18y', null, 120, 250]], 'IFCC 방법(젖산→피루브산). 혈청·혈장 공용 구간(헤파린 혈장만 쓰는 검사실은 더 낮은 구간을 선택할 수 있음).'),
  ...rows('total-protein', 'g/L', 'both', 'any', 'Table 5', [['18y', null, 60, 80]]),
]

/** 구간표에 수록된 분석물 키 */
export const REF_KEYS = [...new Set(INTERVALS.map((r) => r.analyte))]
