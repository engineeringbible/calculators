/**
 * ballast-exchange/tests.js — checks of the D-1 three-volume rule, the method timings and the location logic.
 * Run: node run-tests.js ballast-exchange
 */
import { calculate, mixingEfficiency } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const SHIP = { method: 'flow_through', tank_volume_m3: 1500, tanks: 10, pump_rate_m3_h: 1000, pumps: 2, volumes: 3, stripping_allowance_pct: 10, residual_pct: 2, speed_kn: 12, distance_from_land_nmi: 220, water_depth_m: 1500 };

export const tests = [
  {
    name: 'Perfect-mixing efficiency: 1 − e^(−3) = 95.02 % (the D-1 three-volume rule), 1 volume 63.2 %, 2 volumes 86.5 %; 99 % needs 4.61 volumes',
    source: 'BWM Convention Reg. D-1.2 (three volumes deemed 95 %); continuously stirred tank dilution e^(−n)',
    run: () => {
      assertClose(mixingEfficiency(3), 1 - Math.exp(-3), { rel: 1e-12 }, 'formula');
      assertClose(mixingEfficiency(3) * 100, 95.02, { abs: 0.01 }, '95 %');
      assertClose(mixingEfficiency(1) * 100, 63.21, { abs: 0.01 }, '1 volume');
      assertClose(mixingEfficiency(2) * 100, 86.47, { abs: 0.01 }, '2 volumes');
      const { outputs } = calculate(SHIP);
      assertClose(outputs.exchange_efficiency_pct, 95.02, { abs: 0.01 }, 'in calculate');
      assertClose(outputs.volumes_for_99_pct, 4.605, { abs: 1e-3 }, '99 %');
      assertEqual(outputs.d1_compliance.startsWith('Meets D-1'), true, 'meets');
    },
  },
  {
    name: 'Flow-through timing: 10 × 1 500 m³ with 2 × 1 000 m³/h → 45 000 m³ pumped in 22.5 h, 2.25 h per tank, 270 nmi run at 12 kn',
    source: 't = N n V / Q',
    run: () => {
      const { outputs } = calculate(SHIP);
      assertClose(outputs.total_pump_rate_m3_h, 2000, { rel: 1e-12 }, 'Q');
      assertClose(outputs.total_ballast_m3, 15000, { rel: 1e-12 }, 'total');
      assertClose(outputs.water_pumped_m3, 45000, { rel: 1e-12 }, 'pumped');
      assertClose(outputs.total_time_h, 22.5, { rel: 1e-12 }, 'time');
      assertClose(outputs.time_per_tank_h, 2.25, { rel: 1e-12 }, 'per tank');
      assertClose(outputs.distance_run_nmi, 270, { rel: 1e-12 }, 'distance');
    },
  },
  {
    name: 'Sequential timing and residual: 2 × 15 000 × 1.10 = 33 000 m³ pumped in 16.5 h; 2 % residual → 98 % exchange meets D-1; 6 % residual fails it',
    source: 't = N × 2V (1 + s)/Q; D-1 95 % criterion',
    run: () => {
      const seq = calculate({ ...SHIP, method: 'sequential' });
      assertClose(seq.outputs.water_pumped_m3, 33000, { rel: 1e-12 }, 'pumped');
      assertClose(seq.outputs.total_time_h, 16.5, { rel: 1e-12 }, 'time');
      assertClose(seq.outputs.exchange_efficiency_pct, 98, { rel: 1e-12 }, 'efficiency');
      assertEqual(seq.warnings.some((w) => w.includes('stability')), true, 'stability warning');
      const bad = calculate({ ...SHIP, method: 'sequential', residual_pct: 6 });
      assertEqual(bad.outputs.d1_compliance.startsWith('Below D-1'), true, 'fails');
    },
  },
  {
    name: 'Volumes below three fail D-1 (2 volumes → 86.5 %); dilution uses the same pumping-through arithmetic as flow-through',
    source: 'Reg. D-1.2; method definitions (G6)',
    run: () => {
      const two = calculate({ ...SHIP, volumes: 2 });
      assertEqual(two.outputs.d1_compliance.startsWith('Below D-1'), true, 'below');
      assertClose(two.outputs.total_time_h, 15, { rel: 1e-12 }, 'time 2 volumes');
      const dil = calculate({ ...SHIP, method: 'dilution' }).outputs;
      assertClose(dil.total_time_h, calculate(SHIP).outputs.total_time_h, { rel: 1e-12 }, 'same time');
      assertEqual(dil.summary.startsWith('Dilution'), true, 'summary');
    },
  },
  {
    name: 'Location rule: 220 nmi / 1 500 m meets B-4.1.1; 80 nmi / 500 m only the 50-nmi fallback; 30 nmi or 150 m depth fails; long exchanges (> 48 h) are flagged with the sea room',
    source: 'BWM Convention Reg. B-4.1 and B-4.4',
    run: () => {
      assertEqual(calculate(SHIP).outputs.location_check.startsWith('Meets Reg. B-4.1.1'), true, 'preferred');
      assertEqual(calculate({ ...SHIP, distance_from_land_nmi: 80, water_depth_m: 500 }).outputs.location_check.startsWith('Meets only the fallback'), true, 'fallback');
      assertEqual(calculate({ ...SHIP, distance_from_land_nmi: 30 }).outputs.location_check.startsWith('Does NOT'), true, 'too close');
      assertEqual(calculate({ ...SHIP, water_depth_m: 150 }).outputs.location_check.startsWith('Does NOT'), true, 'too shallow');
      const long = calculate({ ...SHIP, pumps: 1, tanks: 20 });
      assertEqual(long.outputs.total_time_h > 48 && long.warnings.some((w) => w.includes('sea room')), true, 'long exchange');
    },
  },
  {
    name: 'Validation: fractional tank count, zero pump rate and an unknown method are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ ...SHIP, tanks: 2.5 }), 'whole number', 'tanks');
      assertThrows(() => calculate({ ...SHIP, pump_rate_m3_h: 0 }), 'greater than zero', 'pump');
      assertThrows(() => calculate({ ...SHIP, method: 'treatment' }), 'must be one of', 'method');
    },
  },
];
