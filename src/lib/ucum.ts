import ucumPkg from '@lhncbc/ucum-lhc'

interface UcumUnitInfo {
  property_: string
  moleExp_: number
  equivalentExp_: number
}
interface UcumConvertResult {
  status: 'succeeded' | 'failed' | 'error'
  toVal: number | null
  msg: string[]
  code?: string
}
interface UcumUtils {
  convertUnitTo(
    from: string,
    val: number,
    to: string,
    opts?: { molecularWeight?: number; charge?: number },
  ): UcumConvertResult
  getSpecifiedUnit(code: string, valConv: string): { status: string; unit: UcumUnitInfo | null; msg?: string[] }
}

// CJS 패키지: 번들러/Node 모두에서 default 또는 named로 노출될 수 있다.
const mod = ucumPkg as unknown as { UcumLhcUtils?: { getInstance(): UcumUtils }; default?: { UcumLhcUtils: { getInstance(): UcumUtils } } }
const Utils = (mod.UcumLhcUtils ?? mod.default?.UcumLhcUtils) as { getInstance(): UcumUtils }
const utils: UcumUtils = Utils.getInstance()

export type UcumFailure = 'missing-molecular-weight' | 'missing-charge' | 'incommensurable' | 'invalid' | 'other'

export type UcumResult = { ok: true; value: number } | { ok: false; code: UcumFailure; message: string }

export function ucumConvert(from: string, value: number, to: string, opts: { molecularWeight?: number; charge?: number } = {}): UcumResult {
  const r = utils.convertUnitTo(from, value, to, opts)
  if (r.status === 'succeeded' && r.toVal !== null) return { ok: true, value: r.toVal }
  const code: UcumFailure =
    r.code === 'missing-molecular-weight' || r.code === 'missing-charge' || r.code === 'incommensurable'
      ? r.code
      : r.code === 'unknown-unit' || r.status === 'error'
        ? 'invalid'
        : 'other'
  return { ok: false, code, message: (r.msg ?? []).join(' ') }
}

/** UCUM이 인식하는 단위인지, 어떤 종류(property)인지 */
export function ucumKind(code: string): { valid: boolean; property?: string } {
  const r = utils.getSpecifiedUnit(code, 'validate')
  return r.unit ? { valid: true, property: r.unit.property_ } : { valid: false }
}
