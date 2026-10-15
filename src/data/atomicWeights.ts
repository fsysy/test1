// IUPAC/CIAAW 표준 원자량(축약, conventional value).
// 출처: https://iupac.qmul.ac.uk/AtWt/ , https://ciaaw.org/atomic-weights.htm
// 구간으로 주어지는 원소(H, C, N, O, Mg, S, Cl)는 IUPAC conventional value를 사용한다.
export const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.98976928,
  Mg: 24.305,
  P: 30.973761998,
  S: 32.06,
  Cl: 35.45,
  K: 39.0983,
  Ca: 40.078,
  Fe: 55.845,
  Zn: 65.38,
}
