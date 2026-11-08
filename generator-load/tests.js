/**
 * generator-load/tests.js — checks against ISO 8528 rating arithmetic, three-phase relations and the IMO CO₂ factors.
 * Run: node run-tests.js generator-load
 */
import { calculate, sfocLoadFactor, recommendedSets } from './calc.js';
import { CO2_FACTOR_T_PER_T } from '../shared/fuels.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Two 1 000 kVA sets at 0.8 pf: 1 600 kW installed; 1 200 kW at 0.85 → 75 % on kW, 1 412 kVA = 70.6 % on kVA, 600 kW per set, 1 852 A at 440 V',
    source: 'Rated kW = kVA × pf (ISO 8528-1); S = P / pf; I = S / (√3 V)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.installed_kw_w, 1600e3, { rel: 1e-12 }, 'installed');
      assertClose(outputs.load_kva_va, 1200e3 / 0.85, { rel: 1e-12 }, 'kVA');
      assertClose(outputs.load_pct_kw, 75, { rel: 1e-12 }, 'kW %');
      assertClose(outputs.load_pct_kva, (1200 / 0.85 / 2000) * 100, { rel: 1e-12 }, 'kVA %');
      assertClose(outputs.load_per_set_w, 600e3, { rel: 1e-12 }, 'per set');
      assertClose(outputs.current_a, 1200e3 / 0.85 / (Math.sqrt(3) * 440), { rel: 1e-12 }, 'current');
      assertClose(outputs.current_a, 1852.4, { abs: 0.1 }, 'current value');
      assertEqual(outputs.band_status.startsWith('Within'), true, 'band OK');
    },
  },
  {
    name: 'N−1: 1 200 kW on one remaining 800 kW set is 150 % → redundancy FAIL and a load-shedding warning; 600 kW load gives 75 % → OK',
    source: 'SOLAS II-1 Reg. 41 / IEC 60092-301 (supply with one generator out of service); ISO 8528-1 10 % overload allowance',
    run: () => {
      const fail = calculate({});
      assertClose(fail.outputs.n_minus_1_pct, 150, { rel: 1e-12 }, 'N−1 %');
      assertEqual(fail.outputs.redundancy_status.startsWith('FAIL'), true, 'FAIL');
      assertEqual(fail.warnings.some((w) => w.includes('N−1 check fails')), true, 'warning');
      const ok = calculate({ load_w: 600e3 });
      assertClose(ok.outputs.n_minus_1_pct, 75, { rel: 1e-12 }, 'N−1 OK');
      assertEqual(ok.outputs.redundancy_status.startsWith('OK'), true, 'OK');
      const marginal = calculate({ load_w: 840e3 });
      assertEqual(marginal.outputs.redundancy_status.startsWith('Marginal'), true, 'marginal at 105 %');
      assertEqual(calculate({ sets_running: 1 }).outputs.n_minus_1_pct, null, 'single set');
    },
  },
  {
    name: 'Recommended sets for a 30–85 % band: 1 200 kW → 2 sets (75 %); 500 kW → 1 set (62.5 %); 2 000 kW → 3 sets (83 %); 200 kW → 1 set at 25 % with a low-load warning',
    source: 'Planning band 30–85 % (common practice; low-load fouling below ≈ 30 %, transient margin above ≈ 85 %)',
    run: () => {
      assertEqual(recommendedSets(1200e3, 800e3, 0.85), 2, '1 200 kW');
      assertEqual(recommendedSets(500e3, 800e3, 0.85), 1, '500 kW');
      assertEqual(recommendedSets(2000e3, 800e3, 0.85), 3, '2 000 kW');
      const { outputs } = calculate({});
      assertEqual(outputs.recommended_sets, 2, 'default');
      assertClose(outputs.recommended_load_pct, 75, { rel: 1e-12 }, 'load with recommended');
      const low = calculate({ sets_running: 1, load_w: 200e3 });
      assertEqual(low.outputs.band_status.startsWith('Below'), true, 'below band');
      assertEqual(low.warnings.some((w) => w.includes('Low-load operation')), true, 'low-load warning');
    },
  },
  {
    name: 'Alternator kVA limit: 1 400 kW at pf 0.6 on two 1 000 kVA sets is 87.5 % on kW but 117 % on kVA → overload on the alternator',
    source: 'Alternator rated in kVA; low power factor loads reach the kVA limit before the engine kW limit (ISO 8528-3)',
    run: () => {
      const { outputs, warnings } = calculate({ load_w: 1400e3, load_pf: 0.6 });
      assertClose(outputs.load_pct_kw, 87.5, { rel: 1e-12 }, 'kW %');
      assertClose(outputs.load_pct_kva, (1400 / 0.6 / 2000) * 100, { rel: 1e-12 }, 'kVA %');
      assertEqual(outputs.band_status.startsWith('OVERLOAD'), true, 'overload');
      assertEqual(warnings.some((w) => w.includes('Alternator overloaded on kVA')), true, 'kVA warning');
    },
  },
  {
    name: 'SFOC part-load curve: ×1.0 at 100 %, ×1.02 at 75 %, ×1.10 at 50 %, ×1.27 at 25 %, linear between (×1.06 at 62.5 %); switched off it stays at the entered value',
    source: 'Typical medium-speed genset SFOC curves (MAN and Wärtsilä project guides: +2 % at 75 %, +10 % at 50 %, +25–30 % at 25 % load)',
    run: () => {
      assertClose(sfocLoadFactor(1.0), 1.0, { rel: 1e-12 }, '100 %');
      assertClose(sfocLoadFactor(0.75), 1.02, { rel: 1e-12 }, '75 %');
      assertClose(sfocLoadFactor(0.5), 1.10, { rel: 1e-12 }, '50 %');
      assertClose(sfocLoadFactor(0.25), 1.27, { rel: 1e-12 }, '25 %');
      assertClose(sfocLoadFactor(0.625), 1.06, { rel: 1e-12 }, '62.5 % interpolated');
      assertClose(sfocLoadFactor(0.1), 1.27, { rel: 1e-12 }, 'clamped low');
      assertClose(calculate({}).outputs.sfoc_used_g_kwh, 210 * 1.02, { rel: 1e-12 }, 'default 75 %');
      assertClose(calculate({ use_load_curve: 'no' }).outputs.sfoc_used_g_kwh, 210, { rel: 1e-12 }, 'curve off');
    },
  },
  {
    name: 'Fuel, cost and CO₂: 1 200 kW × 214.2 g/kWh = 257.0 kg/h, 6.17 t/day, 4 318 $ at 700 $/t, 19.8 t CO₂ (MGO 3.206), 28.8 MWh',
    source: 'Fuel = P × SFOC × t; IMO MEPC.364(79) CF for MGO 3.206 t CO₂/t fuel',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.fuel_per_hour_kg, 1200 * 214.2 / 1000, { rel: 1e-9 }, 'kg/h');
      assertClose(outputs.fuel_period_t, (1200 * 214.2 * 24) / 1e6, { rel: 1e-9 }, 't/day');
      assertClose(outputs.fuel_period_t, 6.169, { abs: 1e-3 }, 't/day value');
      assertClose(outputs.fuel_cost, outputs.fuel_period_t * 700, { rel: 1e-12 }, 'cost');
      assertClose(outputs.co2_period_t, outputs.fuel_period_t * CO2_FACTOR_T_PER_T.mgo, { rel: 1e-12 }, 'CO₂');
      assertClose(outputs.co2_period_t, 19.78, { abs: 0.01 }, 'CO₂ value');
      assertClose(outputs.energy_period_wh, 1200e3 * 24, { rel: 1e-12 }, 'MWh');
      const hfo = calculate({ fuel_type: 'hfo' }).outputs;
      assertClose(hfo.co2_period_t / outputs.co2_period_t, 3.114 / 3.206, { rel: 1e-12 }, 'HFO factor');
    },
  },
  {
    name: 'Invalid inputs fail fast: fractional set count, band maximum below minimum, unknown fuel',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ sets_running: 1.5 }), 'whole number', 'sets');
      assertThrows(() => calculate({ band_min_pct: 80, band_max_pct: 60 }), 'must exceed the minimum', 'band');
      assertThrows(() => calculate({ fuel_type: 'coal' }), 'must be one of', 'fuel');
    },
  },
];
