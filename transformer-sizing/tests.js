/**
 * transformer-sizing/tests.js — checks against the standard per-unit transformer relations and the IEC 60076 rating series.
 * Run: node run-tests.js transformer-sizing
 */
import { calculate, preferredRatingVa, regulationPu, PREFERRED_KVA, ANSI_KVA } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const GIVEN = { load_w: 800e3, pf: 0.8, pf_type: 'lagging', growth_pct: 0, max_loading: 1, rating_mode: 'given', rating_va: 1000e3, hv_voltage_v: 11000, lv_voltage_v: 400, uk_pct: 6, p0_w: 1100, pk_w: 10500, hours_per_year: 6000 };

export const tests = [
  {
    name: 'Rating selection: 800 kW at pf 0.8 = 1 000 kVA; with 20 % growth and 80 % loading the requirement is 1 500 kVA → preferred 1 600 kVA; the R10 list runs 25 … 5 000 kVA',
    source: 'IEC 60076-1 preferred ratings (R10 series); S_req = P/pf (1 + g)/k',
    run: () => {
      const { outputs } = calculate({ ...GIVEN, rating_mode: 'preferred', growth_pct: 20, max_loading: 0.8 });
      assertClose(outputs.apparent_load_va / 1000, 1000, { rel: 1e-12 }, 'S');
      assertClose(outputs.required_va / 1000, 1500, { rel: 1e-12 }, 'required');
      assertClose(outputs.rating_out_va / 1000, 1600, { rel: 1e-12 }, 'preferred');
      assertEqual(preferredRatingVa(1000e3), 1000e3, 'exact match stays');
      assertEqual(preferredRatingVa(1001e3), 1250e3, 'next up');
      assertEqual(preferredRatingVa(6000e3), null, 'above list');
      assertClose(calculate({ ...GIVEN, rating_mode: 'ansi', growth_pct: 20, max_loading: 0.8 }).outputs.rating_out_va / 1000, 1500, { rel: 1e-12 }, 'ANSI: 1 500 kVA required → 1 500 kVA standard');
      assertEqual(preferredRatingVa(150e3, ANSI_KVA), 150e3, 'ANSI exact');
      assertEqual(preferredRatingVa(188e3, ANSI_KVA), 225e3, 'ANSI 188 kVA → 225 kVA');
      assertEqual(preferredRatingVa(188e3), 200e3, 'IEC 188 kVA → 200 kVA');
      assertEqual(PREFERRED_KVA[0] === 25 && PREFERRED_KVA[PREFERRED_KVA.length - 1] === 5000, true, 'list ends');
    },
  },
  {
    name: 'Per-unit impedance: 1 000 kVA, u_k 6 %, P_k 10.5 kW → u_r = 1.05 %, u_x = √(36 − 1.1025) = 5.907 %',
    source: 'u_r = P_k/S_r, u_x = √(u_k² − u_r²) (IEC 60076-8; Say, Alternating Current Machines)',
    run: () => {
      const { outputs } = calculate(GIVEN);
      assertClose(outputs.ur_pct, 1.05, { rel: 1e-12 }, 'u_r');
      assertClose(outputs.ux_pct, Math.sqrt(36 - 1.05 ** 2), { rel: 1e-12 }, 'u_x');
      assertClose(outputs.ux_pct, 5.907, { abs: 1e-3 }, 'u_x value');
    },
  },
  {
    name: 'Regulation at full load, pf 0.8 lagging: ε = 1.05 × 0.8 + 5.907 × 0.6 + (5.907 × 0.8 − 1.05 × 0.6)²/200 = 4.47 %; secondary voltage 400 × (1 − 0.0447) = 382.1 V; leading pf 0.8 gives −2.9 % (voltage rise)',
    source: 'Standard regulation approximation ε = u_r cos φ + u_x sin φ + (u_x cos φ − u_r sin φ)²/200 (Say §; IEC 60076-8)',
    run: () => {
      const { outputs } = calculate(GIVEN);
      const expected = 1.05 * 0.8 + 5.907 * 0.6 + (5.907 * 0.8 - 1.05 * 0.6) ** 2 / 200;
      assertClose(outputs.regulation_pct, expected, { abs: 2e-3 }, 'regulation');
      assertClose(outputs.regulation_pct, 4.47, { abs: 0.01 }, 'value');
      assertClose(outputs.lv_voltage_load_v, 400 * (1 - outputs.regulation_pct / 100), { rel: 1e-12 }, 'V_load');
      assertClose(outputs.regulation_full_pct, outputs.regulation_pct, { rel: 1e-12 }, 'full load = present load here');
      assertClose(regulationPu(1, 0.0105, 0.05907, 0.8, 0.6) * 100, expected, { abs: 2e-3 }, 'helper');
      const leading = calculate({ ...GIVEN, pf_type: 'leading' }).outputs;
      assertEqual(leading.regulation_pct < 0, true, 'negative regulation');
      assertClose(leading.regulation_pct, 1.05 * 0.8 - 5.907 * 0.6 + (5.907 * 0.8 + 1.05 * 0.6) ** 2 / 200, { abs: 2e-3 }, 'leading value');
    },
  },
  {
    name: 'Losses and efficiency at full load: 1.1 + 10.5 = 11.6 kW → η = 800/(800 + 11.6) = 98.57 %; maximum efficiency at √(1.1/10.5) = 32.4 % load; at half load losses 1.1 + 2.625 = 3.725 kW and η = 99.08 %; annual loss 69.6 MWh at 6 000 h',
    source: 'P_loss = P_0 + x² P_k; η = P/(P + P_loss); x_max,η = √(P_0/P_k) (Theraja vol. II)',
    run: () => {
      const full = calculate(GIVEN).outputs;
      assertClose(full.losses_w, 11600, { rel: 1e-12 }, 'losses');
      assertClose(full.efficiency_pct, (800 / 811.6) * 100, { rel: 1e-12 }, 'η');
      assertClose(full.efficiency_pct, 98.57, { abs: 0.01 }, 'η value');
      assertClose(full.max_eff_load_pct, Math.sqrt(1100 / 10500) * 100, { rel: 1e-12 }, 'x at max η');
      assertClose(full.annual_loss_wh / 1e6, 69.6, { abs: 0.01 }, 'MWh');
      const half = calculate({ ...GIVEN, load_w: 400e3 }).outputs;
      assertClose(half.losses_w, 1100 + 0.25 * 10500, { rel: 1e-12 }, 'half-load losses');
      assertClose(half.efficiency_pct, (400 / (400 + 3.725)) * 100, { rel: 1e-12 }, 'half-load η');
    },
  },
  {
    name: 'Currents: 1 000 kVA at 11 kV / 400 V → 52.5 A HV, 1 443 A LV; 800 kW at pf 0.8 draws 1 443 A; secondary short-circuit I_r/u_k = 24.1 kA; inrush note 11.5–17.3 kA',
    source: 'I = S/(√3 U); Schneider Electrical Installation Guide (I_sc ≈ I_r/u_k)',
    run: () => {
      const { outputs, warnings } = calculate(GIVEN);
      assertClose(outputs.i_hv_a, 1e6 / (Math.sqrt(3) * 11000), { rel: 1e-12 }, 'I_HV');
      assertClose(outputs.i_lv_a, 1443.4, { abs: 0.1 }, 'I_LV');
      assertClose(outputs.i_load_a, outputs.i_lv_a, { rel: 1e-12 }, 'full load current');
      assertClose(outputs.isc_lv_a / 1000, 1443.4 / 0.06 / 1000, { rel: 1e-4 }, 'I_sc');
      assertClose(outputs.isc_lv_a / 1000, 24.06, { abs: 0.01 }, 'I_sc value');
      assertEqual(warnings.some((w) => w.includes('11.5–17.3 kA')), true, 'inrush note');
    },
  },
  {
    name: 'Remarks: an existing 1 000 kVA unit with 20 % growth at 80 % maximum loading is flagged (150 % after growth → 1 250 kVA next); a 200 kW load on 1 000 kVA is "lightly loaded"; regulation > 5 % warned for u_k 10 %',
    source: 'Behaviour specification',
    run: () => {
      const over = calculate({ ...GIVEN, growth_pct: 20, max_loading: 0.8 }).outputs;
      assertEqual(over.sizing_remark.startsWith('Loading after growth'), true, 'over');
      assertEqual(over.sizing_remark.includes('1250 kVA'), true, 'next rating');
      const light = calculate({ ...GIVEN, load_w: 200e3 }).outputs;
      assertEqual(light.sizing_remark.startsWith('Lightly loaded'), true, 'light');
      const highZ = calculate({ ...GIVEN, uk_pct: 10 });
      assertEqual(highZ.warnings.some((w) => w.includes('above 5 %')), true, 'regulation warning');
      assertEqual(calculate(GIVEN).outputs.sizing_remark.startsWith('OK'), true, 'OK');
    },
  },
  {
    name: 'Invalid inputs fail fast: load losses giving u_r ≥ u_k, requirement above the preferred list, unknown power factor type',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...GIVEN, pk_w: 70000 }), 'u_r', 'losses');
      assertThrows(() => calculate({ ...GIVEN, rating_mode: 'preferred', load_w: 6e6 }), 'exceeds the preferred list', 'too big');
      assertThrows(() => calculate({ ...GIVEN, pf_type: 'unity' }), 'must be one of', 'pf type');
    },
  },
];
