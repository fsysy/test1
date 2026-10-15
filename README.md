# 임상검사 단위 변환 · 참고구간

임상검사 **단위 변환**과 **공표된 참고구간 조회**를 하는 정적 웹앱입니다 (React + TypeScript + Vite, GitHub Pages).

**🔗 Pages URL: https://fsysy.github.io/test1/**

> 교육·참고용입니다. 진단·치료 결정에 단독으로 사용하지 마세요.

## 기능

1. **변환 탭** — 분석물 검색(영문·한글·동의어) → 값·원본 단위·대상 단위 → 큰 결과 + **계산 근거**(방법·계수·수식·가정·출처 링크). 양방향 스왑, 결과 복사. 근거가 없는 변환(예: ALP mg/dL→U/L, 알부민 g/dL→mmol/L)은 이유와 함께 거부합니다.
2. **참고구간 탭** — 분석물 + 나이 + 성별 + 검체 → **공표된 구간만** 표시(없는 나이 구간은 외삽하지 않음). 결과 값을 넣으면 low/normal/high 판정(필요 시 단위 환산 후 비교).

## 데이터 출처 (역할별 분리)

| 역할 | 출처 | 앱 포함 |
|---|---|---|
| 단위 변환 엔진 | UCUM — [`@lhncbc/ucum-lhc`](https://www.npmjs.com/package/@lhncbc/ucum-lhc) (차원 검사·스케일·몰질량·전하 옵션) | ✅ |
| 분자량 | [IUPAC/CIAAW 표준 원자량](https://iupac.qmul.ac.uk/AtWt/) → 분자식에서 **계산** (계수 표 복사 없음) | ✅ |
| HbA1c | [NGSP master equation](https://ngsp.org/ifcc.asp): NGSP = 0.09148 × IFCC + 2.152 | ✅ |
| uACR·uPCR | [KDIGO 2024](https://kdigo.org/guidelines/ckd-evaluation-and-management/) 기준값, mg/g↔mg/mmol은 크레아티닌 몰질량으로 계산 | ✅ |
| BUN↔요소, 중성지방 | 몰질량 계산(BUN은 질소 N₂ 기준) / 트리올레인 가정 | ✅ |
| 참고구간 | AACB/RCPA Harmonised Reference Intervals Final Performance Report Table 5·6 ([PDF](https://aacblm.imiscloud.com/common/Uploaded%20files/aacb/guidelines%20and%20position%20statements/position%20statements/supporting%20documentation/20140630%20GPS%20Harmonisation%20QUPP%20final%20report.pdf)) | ✅ |
| 소아 | [CALIPER](https://caliperproject.ca) 안내(링크만) | 링크 |
| 교차 검증 | Labcorp SI Unit Conversion Table (`test/fixtures/labcorp-si.json`) | ❌ 테스트 전용 |

## 데이터가 없는 부분과 이유 (TODO(verify))

- **TODO(verify) RCPA 사이트 직접 확인 불가**: `rcpa.edu.au`가 자동 접근에 403을 반환했습니다. 대신 AACB 호스팅 Final Performance Report(2014, AACB·RCPA 승인 대상)의 Table 5/6을 사용했습니다. RCPA 최신 개정본과 값·표 번호가 다를 수 있으니 대조가 필요합니다.
- **이후 추가된 분석물 미수록**: 2014 보고서 이후 추가된 ALT·AST·GGT·요소·알부민 등의 조화 구간은 이 문서에 없어 **넣지 않았습니다**(구간 탭에 "구간 미수록" 표시). 포도당·콜레스테롤·요산·빌리루빈·헤모글로빈 등도 같은 이유로 비어 있습니다.
- **크레아티닌 60세 이상, 혈장 칼륨 성인**: 보고서에 구간이 없어 비워 두었습니다(외삽 안 함).
- **소아 크레아티닌**: 19세 미만 구간은 Ortho Vitros 효소법 전용(보고서 각주).
- **TODO(verify) CMEinfo 변환표·NBME Laboratory Reference Values 교차 검증 미수행**: 해당 PDF의 공식 URL을 확보하지 못했습니다(404 또는 출처 불명 미러뿐). Labcorp 표(공식 웹페이지)만 대조했습니다.
- **TODO(verify) KDIGO 2024 원문 미열람**: uACR(30/300 mg/g)·uPCR(150/500 mg/g) 및 mg/mmol 대응값은 2차 자료로 확인했습니다. KDIGO의 대응값은 반올림(30 mg/g ≈ 3 mg/mmol)이며 앱은 정확 환산(3.39)을 사용합니다.
- **TODO(verify) 중성지방 분자량**: 지방산 조성이 일정하지 않아 트리올레인(≈885 g/mol)을 가정한 근사입니다. 관례 계수의 1차 문헌은 확인하지 못했습니다.
- **TODO(verify) 헤모글로빈 mmol/L**: 단량체/사량체 관례 차이로 변환을 거부합니다.
- **TODO(verify) 한글 명칭·동의어**: 직접 작성한 것으로 공식 용어집과 대조하지 않았습니다.
- Labcorp 표의 역방향 열은 "반올림된 정방향 계수의 역수"로 보입니다(예: 콜레스테롤 1/0.0259=38.61, 정확값 38.67). 교차 검증 테스트는 이를 반영한 허용오차를 씁니다.

## 개발

```bash
npm ci
npm test        # Vitest (변환·참고구간·Labcorp 교차검증)
npm run dev
npm run build   # tsc + vite build → dist/
```

`main`에 push하면 GitHub Actions가 테스트 → 빌드 → Pages 배포를 수행합니다 (`.github/workflows/deploy.yml`).
