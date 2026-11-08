/**
 * hydrostatics/tests.js — checks against Derrett & Barrass formulas with hand-verified box-barge values.
 * Run: node run-tests.js hydrostatics
 */
import { calculate, tonnesPerCentimetre, freshWaterAllowanceMm, dockWaterAllowanceMm, estimateMctcBarrass } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** Box-shaped barge 100 × 10 × 5 m in salt water: every value can be checked by hand. */
const BOX_BARGE = { lbp_m: 100, beam_m: 10, draft_m: 5, cb: 1, cw: 1, rho_t_m3: 1.025, lcb_m: 50, lcg_m: 50, lcf_m: 50, mctc_t_m_cm: 100 };

export const tests = [
  {
    name: 'Box barge 100 × 10 × 5 m in salt water: ∇ 5 000 m³, Δ 5 125 t, A_W 1 000 m², TPC 10.25 t/cm',
    source: 'Derrett & Barrass, Ship Stability for Masters and Mates, 7th ed. (2012), ch. 2 "Form coefficients" and ch. 9 "TPC"; TPC = A_W × ρ / 100',
    run: () => {
      const { outputs } = calculate(BOX_BARGE);
      assertClose(outputs.volume_m3, 5000, { rel: 1e-12 }, 'volume');
      assertClose(outputs.displacement_t, 5125, { rel: 1e-12 }, 'displacement');
      assertClose(outputs.wpa_m2, 1000, { rel: 1e-12 }, 'waterplane area');
      assertClose(outputs.tpc_t_cm, 10.25, { rel: 1e-12 }, 'TPC');
      assertClose(tonnesPerCentimetre(1500, 1.025), 15.375, { rel: 1e-12 }, 'TPC helper');
    },
  },
  {
    name: 'FWA = Δ / (4 TPC) = 125 mm, verified against the volume change from 1.025 to 1.000 t/m³',
    source: 'Derrett & Barrass (2012), ch. 10 "Fresh water allowance": FWA (mm) = W / (4 × TPC); independent check 5 125 t × (1/1.000 − 1/1.025) ÷ 1 000 m² = 0.125 m',
    run: () => {
      const { outputs } = calculate(BOX_BARGE);
      assertClose(outputs.fwa_mm, 125, { rel: 1e-12 }, 'FWA');
      const sinkageFromVolumes = (5125 * (1 / 1.0 - 1 / 1.025)) / 1000;
      assertClose(sinkageFromVolumes, 0.125, { rel: 1e-9 }, 'independent FWA check (m)');
      assertClose(freshWaterAllowanceMm(5125, 10.25), 125, { rel: 1e-12 }, 'FWA helper');
    },
  },
  {
    name: 'Dock water allowance at 1.010 t/m³ is 75 mm (FWA × (1025 − 1010) / 25)',
    source: 'Derrett & Barrass (2012), ch. 10: DWA = FWA × (1025 − ρ_DW) / 25',
    run: () => {
      const { outputs } = calculate({ ...BOX_BARGE, dock_rho_t_m3: 1.010 });
      assertClose(outputs.dwa_mm, 75, { abs: 1e-9 }, 'DWA');
      assertClose(dockWaterAllowanceMm(125, 1.025), 0, { abs: 1e-9 }, 'DWA zero in sea water');
      assertClose(dockWaterAllowanceMm(125, 1.000), 125, { abs: 1e-9 }, 'DWA equals FWA in fresh water');
    },
  },
  {
    name: 'Δ 8 000 t with LCG 1 m aft of LCB and MCTC 100 t·m/cm trims 80 cm by the stern; drafts 5.40 / 4.60 m',
    source: 'Derrett & Barrass (2012), ch. 15 "Trim": trim = Δ × (LCB − LCG) / MCTC; change aft = trim × LCF/L, forward = trim × (L − LCF)/L',
    run: () => {
      const { outputs } = calculate({ ...BOX_BARGE, beam_m: 16, rho_t_m3: 1.0, lcb_m: 50, lcg_m: 49, lcf_m: 50, mctc_t_m_cm: 100 });
      assertClose(outputs.displacement_t, 8000, { rel: 1e-12 }, 'displacement');
      assertClose(outputs.trimming_moment_t_m, 8000, { rel: 1e-12 }, 'trimming moment');
      assertClose(outputs.trim_cm, 80, { rel: 1e-12 }, 'trim');
      assertEqual(outputs.trim_text, '80.0 cm by the stern', 'trim text');
      assertClose(outputs.draft_aft_m, 5.40, { abs: 1e-9 }, 'draft aft');
      assertClose(outputs.draft_fwd_m, 4.60, { abs: 1e-9 }, 'draft fwd');
    },
  },
  {
    name: 'LCF 40 m from AP splits the same 80 cm trim unequally: aft +32 cm, forward −48 cm',
    source: 'Derrett & Barrass (2012), ch. 15: draft changes are proportional to the distance of each perpendicular from the LCF',
    run: () => {
      const { outputs } = calculate({ ...BOX_BARGE, beam_m: 16, rho_t_m3: 1.0, lcb_m: 50, lcg_m: 49, lcf_m: 40, mctc_t_m_cm: 100 });
      assertClose(outputs.draft_aft_m, 5.32, { abs: 1e-9 }, 'draft aft');
      assertClose(outputs.draft_fwd_m, 4.52, { abs: 1e-9 }, 'draft fwd');
      assertClose(outputs.draft_aft_m - outputs.draft_fwd_m, 0.80, { abs: 1e-9 }, 'trim equals draft difference');
    },
  },
  {
    name: 'LCG forward of LCB trims by the head (negative trim, text "by the head"); even keel when LCG = LCB',
    source: 'Sign convention of this calculator (README) and Derrett & Barrass (2012), ch. 15',
    run: () => {
      const byHead = calculate({ ...BOX_BARGE, beam_m: 16, rho_t_m3: 1.0, lcg_m: 51 }).outputs;
      assertClose(byHead.trim_cm, -80, { rel: 1e-12 }, 'trim by head');
      assertEqual(byHead.trim_text, '80.0 cm by the head', 'trim text');
      assertEqual(calculate(BOX_BARGE).outputs.trim_text, 'Even keel', 'even keel text');
    },
  },
  {
    name: 'Barrass MCTC estimate: 7.31 × 10.25² / 10 = 76.80 t·m/cm, flagged as an estimate',
    source: 'C.B. Barrass, Ship Design and Performance for Masters and Mates (2004): MCTC ≈ 7.31 × TPC² / B',
    run: () => {
      assertClose(estimateMctcBarrass(10.25, 10), 76.8007, { abs: 5e-4 }, 'MCTC estimate');
      const result = calculate({ ...BOX_BARGE, mctc_source: 'estimate' });
      assertClose(result.outputs.mctc_used, 76.8007, { abs: 5e-4 }, 'mctc_used');
      assertEqual(result.warnings.some((w) => w.includes('rough estimate')), true, 'estimate warning');
    },
  },
  {
    name: 'Default ship 180 × 32 × 10 m, C_B 0.80, C_W 0.88: Δ 47 232 t, TPC 51.96 t/cm, FWA 227 mm',
    source: 'Hand calculation with the Derrett & Barrass formulas above',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.volume_m3, 46080, { rel: 1e-12 }, 'volume');
      assertClose(outputs.displacement_t, 47232, { rel: 1e-12 }, 'displacement');
      assertClose(outputs.tpc_t_cm, 51.955, { abs: 5e-4 }, 'TPC');
      assertClose(outputs.fwa_mm, 227.27, { abs: 0.01 }, 'FWA');
    },
  },
  {
    name: 'Unit layer: TPC 10.25 t/cm = 25.62 long tons per inch; MCTC 100 t·m/cm = 820.2 long ton·ft/in',
    source: '1 long ton = 1.0160469 t, 1 in = 2.54 cm, 1 ft = 0.3048 m (exact definitions)',
    run: () => {
      assertClose(convert(10.25, 't_cm', 'lt_in', 'tpc'), 25.623, { abs: 5e-3 }, 'TPC → TPI');
      assertClose(convert(100, 't_m_cm', 'lt_ft_in', 'mctc'), 820.17, { abs: 0.01 }, 'MCTC → MCT1"');
    },
  },
  {
    name: 'Invalid inputs fail fast: LCG beyond the ship length, zero draft, block coefficient above 1',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...BOX_BARGE, lcg_m: 120 }), 'between 0 and 100', 'LCG out of range');
      assertThrows(() => calculate({ ...BOX_BARGE, draft_m: 0 }), 'greater than zero', 'zero draft');
      assertThrows(() => calculate({ ...BOX_BARGE, cb: 1.2 }), 'between 0.1 and 1', 'C_B > 1');
    },
  },
];
