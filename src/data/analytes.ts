export interface Source {
  label: string
  url: string
}

export const SRC = {
  ucum: { label: 'UCUM 사양 (ucum.org) — @lhncbc/ucum-lhc로 계산', url: 'https://ucum.org/ucum' },
  iupac: { label: 'IUPAC/CIAAW 표준 원자량', url: 'https://iupac.qmul.ac.uk/AtWt/' },
  ngsp: { label: 'NGSP — IFCC Standardization (master equation)', url: 'https://ngsp.org/ifcc.asp' },
  kdigo: {
    label: 'KDIGO 2024 CKD Evaluation and Management Guideline',
    url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/',
  },
} satisfies Record<string, Source>

export interface AltMassBasis {
  /** 이 주석({...})이 붙은 질량 단위가 가리키는 물질의 분자식 (1 mol 분석물당 질량) */
  formula: string
  note: string
}

export interface Analyte {
  id: string
  en: string
  ko: string
  synonyms: string[]
  /** 분자식 → 분자량을 원자량 표로부터 계산 */
  formula?: string
  /** 몰질량 해석 방법 설명 (mg/dL이 무엇의 질량인지 등) */
  mwNote?: string
  /** UCUM 주석({BUN})별 대체 질량 기준 */
  altMassBasis?: Record<string, AltMassBasis>
  /** 이온 전하 |z| — mEq/L 변환용 */
  valence?: number
  noMwReason?: string
  noEqReason?: string
  special?: 'hba1c'
  assumptions?: string[]
  sources?: Source[]
  units: string[]
  defaultFrom: string
  defaultTo: string
  /** 참고구간 데이터 키 (없으면 RCPA Table 6에 수록되지 않은 분석물) */
  refKey?: string
}

const NO_MW_PROTEIN =
  '단백질은 분자량이 하나로 정해지지 않고(이종 혼합물/검사법 의존) 임상적으로도 질량농도(g/L)로 보고하므로 질량↔몰 변환 계수가 없습니다.'

export const ANALYTES: Analyte[] = [
  {
    id: 'glucose', en: 'Glucose', ko: '포도당(혈당)', synonyms: ['혈당', '글루코스', 'blood sugar', 'FBS', 'glc'],
    formula: 'C6H12O6', units: ['mg/dL', 'mmol/L', 'g/L'], defaultFrom: 'mg/dL', defaultTo: 'mmol/L',
  },
  {
    id: 'creatinine', en: 'Creatinine', ko: '크레아티닌', synonyms: ['크레아티닌', 'Cr', 'creat'],
    formula: 'C4H7N3O', units: ['mg/dL', 'umol/L', 'mmol/L'], defaultFrom: 'mg/dL', defaultTo: 'umol/L', refKey: 'creatinine',
  },
  {
    id: 'cholesterol', en: 'Cholesterol, total', ko: '총콜레스테롤', synonyms: ['콜레스테롤', 'TC', 'chol', 'cholesterol total'],
    formula: 'C27H46O', units: ['mg/dL', 'mmol/L'], defaultFrom: 'mg/dL', defaultTo: 'mmol/L',
  },
  {
    id: 'hdl', en: 'HDL cholesterol', ko: 'HDL 콜레스테롤', synonyms: ['HDL-C', 'HDL', '고밀도지단백'],
    formula: 'C27H46O', units: ['mg/dL', 'mmol/L'], defaultFrom: 'mg/dL', defaultTo: 'mmol/L',
  },
  {
    id: 'ldl', en: 'LDL cholesterol', ko: 'LDL 콜레스테롤', synonyms: ['LDL-C', 'LDL', '저밀도지단백'],
    formula: 'C27H46O', units: ['mg/dL', 'mmol/L'], defaultFrom: 'mg/dL', defaultTo: 'mmol/L',
  },
  {
    id: 'triglycerides', en: 'Triglycerides', ko: '중성지방', synonyms: ['TG', 'trigs', '트리글리세라이드', 'TAG'],
    formula: 'C57H104O6',
    mwNote: '중성지방 평균 분자량으로 트리올레인(triolein, C57H104O6)을 가정',
    assumptions: [
      '중성지방은 지방산 조성이 서로 다른 혼합물이라 분자량이 하나가 아닙니다. 트리올레인(C57H104O6, ≈885 g/mol)을 대표 분자로 가정한 근사 계수입니다.',
      'TODO(verify): 가정한 대표 분자(트리올레인)와 관례 계수(0.01129 mmol/L per mg/dL)의 1차 출처 문헌 미확인.',
    ],
    units: ['mg/dL', 'mmol/L'], defaultFrom: 'mg/dL', defaultTo: 'mmol/L',
  },
  {
    id: 'urea', en: 'Urea / Blood urea nitrogen (BUN)', ko: '요소 / 요소질소(BUN)', synonyms: ['BUN', '요소질소', '요소', 'urea nitrogen', 'urea'],
    formula: 'CH4N2O',
    mwNote: '주석 없는 mg/dL은 요소(urea) 분자 전체의 질량, mg/dL{BUN}은 요소 속 질소(N₂)의 질량',
    altMassBasis: {
      BUN: { formula: 'N2', note: 'BUN은 요소 분자 1 mol당 질소 2원자(N₂)의 질량만 보고한다.' },
    },
    units: ['mg/dL{BUN}', 'mg/dL', 'mmol/L'], defaultFrom: 'mg/dL{BUN}', defaultTo: 'mmol/L',
  },
  {
    id: 'uric-acid', en: 'Uric acid (urate)', ko: '요산', synonyms: ['urate', 'UA'],
    formula: 'C5H4N4O3', units: ['mg/dL', 'umol/L', 'mmol/L'], defaultFrom: 'mg/dL', defaultTo: 'umol/L',
  },
  {
    id: 'bilirubin', en: 'Bilirubin, total', ko: '총빌리루빈', synonyms: ['빌리루빈', 'T-bil', 'TB', 'tbil', 'bilirubin'],
    formula: 'C33H36N4O6', units: ['mg/dL', 'umol/L'], defaultFrom: 'mg/dL', defaultTo: 'umol/L',
  },
  {
    id: 'calcium', en: 'Calcium', ko: '칼슘', synonyms: ['Ca', 'Ca2+'],
    formula: 'Ca', valence: 2, units: ['mg/dL', 'mmol/L', 'meq/L'], defaultFrom: 'mg/dL', defaultTo: 'mmol/L', refKey: 'calcium',
  },
  {
    id: 'magnesium', en: 'Magnesium', ko: '마그네슘', synonyms: ['Mg', 'Mg2+'],
    formula: 'Mg', valence: 2, units: ['mg/dL', 'mmol/L', 'meq/L'], defaultFrom: 'mg/dL', defaultTo: 'mmol/L', refKey: 'magnesium',
  },
  {
    id: 'sodium', en: 'Sodium', ko: '나트륨', synonyms: ['Na', 'Na+', '소디움'],
    formula: 'Na', valence: 1, units: ['meq/L', 'mmol/L', 'mg/dL'], defaultFrom: 'meq/L', defaultTo: 'mmol/L', refKey: 'sodium',
  },
  {
    id: 'potassium', en: 'Potassium', ko: '칼륨', synonyms: ['K', 'K+', '포타슘'],
    formula: 'K', valence: 1, units: ['meq/L', 'mmol/L', 'mg/dL'], defaultFrom: 'meq/L', defaultTo: 'mmol/L', refKey: 'potassium',
  },
  {
    id: 'chloride', en: 'Chloride', ko: '염소(클로라이드)', synonyms: ['Cl', 'Cl-', '염화물', '클로라이드'],
    formula: 'Cl', valence: 1, units: ['meq/L', 'mmol/L', 'mg/dL'], defaultFrom: 'meq/L', defaultTo: 'mmol/L', refKey: 'chloride',
  },
  {
    id: 'bicarbonate', en: 'Bicarbonate', ko: '중탄산염', synonyms: ['HCO3', 'HCO3-', '탄산수소', '중탄산'],
    formula: 'HCO3', valence: 1, units: ['meq/L', 'mmol/L'], defaultFrom: 'meq/L', defaultTo: 'mmol/L', refKey: 'bicarbonate',
    mwNote: 'HCO₃⁻ 이온의 분자량',
  },
  {
    id: 'phosphate', en: 'Phosphate (inorganic phosphorus)', ko: '인(무기인산)', synonyms: ['phosphorus', 'Pi', 'P', '인산염', '인'],
    formula: 'P',
    mwNote: '임상 관례에 따라 mg/dL은 인(P) 원소 질량 기준',
    noEqReason:
      '인산염의 이온가는 pH에 따라 달라져(pH 7.4에서 평균 약 1.8) 고정된 전하로 mEq/L를 정의할 수 없습니다. mmol/L 또는 mg/dL(인 원소 기준)로만 변환합니다.',
    units: ['mg/dL', 'mmol/L'], defaultFrom: 'mg/dL', defaultTo: 'mmol/L', refKey: 'phosphate',
  },
  {
    id: 'albumin', en: 'Albumin', ko: '알부민', synonyms: ['Alb', 'ALB'],
    noMwReason: NO_MW_PROTEIN, noEqReason: NO_MW_PROTEIN, units: ['g/dL', 'g/L'], defaultFrom: 'g/dL', defaultTo: 'g/L',
  },
  {
    id: 'total-protein', en: 'Total protein', ko: '총단백', synonyms: ['TP', 'protein total', '단백질'],
    noMwReason: NO_MW_PROTEIN, noEqReason: NO_MW_PROTEIN, units: ['g/dL', 'g/L'], defaultFrom: 'g/dL', defaultTo: 'g/L', refKey: 'total-protein',
  },
  {
    id: 'hemoglobin', en: 'Hemoglobin', ko: '헤모글로빈', synonyms: ['Hb', 'Hgb', '혈색소'],
    noMwReason:
      '헤모글로빈의 mmol/L는 단량체(≈16 kg/mol) 기준인지 사량체(≈64 kg/mol) 기준인지 관례가 갈려 4배 차이가 나므로, 근거를 하나로 정할 수 없어 거부합니다. g/dL↔g/L만 변환합니다. TODO(verify): 기관별 관례 확인.',
    units: ['g/dL', 'g/L'], defaultFrom: 'g/dL', defaultTo: 'g/L',
  },
  {
    id: 'hba1c', en: 'HbA1c', ko: '당화혈색소(HbA1c)', synonyms: ['A1c', 'glycated hemoglobin', 'glycohemoglobin', '당화혈색소'],
    special: 'hba1c',
    assumptions: [
      'NGSP master equation은 NGSP 인증/IFCC 정렬된 검사법의 결과 사이의 선형 관계입니다. 개별 검사법·개인별 편차는 반영되지 않습니다.',
    ],
    sources: [SRC.ngsp],
    units: ['%', 'mmol/mol'], defaultFrom: '%', defaultTo: 'mmol/mol',
  },
  {
    id: 'uacr', en: 'Urine albumin-to-creatinine ratio (uACR)', ko: '소변 알부민/크레아티닌 비(uACR)', synonyms: ['ACR', 'albumin creatinine ratio', '미세알부민뇨', '알부민뇨', 'UACR'],
    formula: 'C4H7N3O',
    mwNote: '분모(크레아티닌)의 몰질량으로 g → mmol 환산',
    assumptions: [
      'mg/g → mg/mmol은 분모 크레아티닌의 몰질량(113.12 g/mol)으로 계산한 정확 환산입니다.',
      'KDIGO 표는 임상 편의를 위해 반올림한 대응(30 mg/g ≈ 3 mg/mmol, 300 mg/g ≈ 30 mg/mmol)을 제시합니다. 정확 환산 값(30 mg/g = 3.39 mg/mmol)과 다를 수 있습니다.',
      'TODO(verify): KDIGO 2024 원문(Kidney Int 2024;105(4S))의 해당 표를 직접 열람해 확인하지 못했습니다(2차 자료 기준).',
    ],
    sources: [SRC.kdigo],
    units: ['mg/g', 'mg/mmol'], defaultFrom: 'mg/g', defaultTo: 'mg/mmol',
  },
  {
    id: 'upcr', en: 'Urine protein-to-creatinine ratio (uPCR)', ko: '소변 단백/크레아티닌 비(uPCR)', synonyms: ['PCR', 'protein creatinine ratio', '단백뇨', 'UPCR'],
    formula: 'C4H7N3O',
    mwNote: '분모(크레아티닌)의 몰질량으로 g → mmol 환산',
    assumptions: [
      'mg/g → mg/mmol은 분모 크레아티닌의 몰질량(113.12 g/mol)으로 계산한 정확 환산입니다.',
      'KDIGO 표의 PCR 대응(150 mg/g ≈ 15 mg/mmol, 500 mg/g ≈ 50 mg/mmol)은 반올림 값입니다.',
      'TODO(verify): KDIGO 2024 원문에서 PCR 기준값을 직접 확인하지 못했습니다(2012 지침 재수록 표 기준).',
    ],
    sources: [SRC.kdigo],
    units: ['mg/g', 'mg/mmol'], defaultFrom: 'mg/g', defaultTo: 'mg/mmol',
  },
  {
    id: 'alp', en: 'Alkaline phosphatase (ALP)', ko: '알칼리인산분해효소(ALP)', synonyms: ['ALP', 'alk phos', 'ALKP'],
    units: ['U/L', 'ukat/L', 'nkat/L'], defaultFrom: 'U/L', defaultTo: 'ukat/L', refKey: 'alp',
  },
  {
    id: 'ld', en: 'Lactate dehydrogenase (LD)', ko: '젖산탈수소효소(LD/LDH)', synonyms: ['LDH', 'LD', '락테이트탈수소효소'],
    units: ['U/L', 'ukat/L', 'nkat/L'], defaultFrom: 'U/L', defaultTo: 'ukat/L', refKey: 'ld',
  },
  {
    id: 'alt', en: 'Alanine aminotransferase (ALT)', ko: '알라닌아미노전이효소(ALT)', synonyms: ['ALT', 'GPT', 'SGPT'],
    units: ['U/L', 'ukat/L', 'nkat/L'], defaultFrom: 'U/L', defaultTo: 'ukat/L',
  },
  {
    id: 'ast', en: 'Aspartate aminotransferase (AST)', ko: '아스파르트산아미노전이효소(AST)', synonyms: ['AST', 'GOT', 'SGOT'],
    units: ['U/L', 'ukat/L', 'nkat/L'], defaultFrom: 'U/L', defaultTo: 'ukat/L',
  },
]

export function getAnalyte(id: string): Analyte {
  const a = ANALYTES.find((x) => x.id === id)
  if (!a) throw new Error(`알 수 없는 분석물: ${id}`)
  return a
}

const norm = (s: string) => s.toLowerCase().replace(/[\s\-_/()]/g, '')

/** 영문·한글·동의어 부분일치 검색 */
export function searchAnalytes(query: string, list: Analyte[] = ANALYTES): Analyte[] {
  const q = norm(query)
  if (!q) return list
  return list.filter((a) => [a.en, a.ko, ...a.synonyms].some((t) => norm(t).includes(q)))
}
