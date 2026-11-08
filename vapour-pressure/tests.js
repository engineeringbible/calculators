/**
 * vapour-pressure/tests.js — checks against IAPWS-IF97 for water and the NIST reference equations of state.
 * Run: node run-tests.js vapour-pressure
 */
import { calculate, vapourPressure, boilingPoint } from './calc.js';
import { psat, tsat } from '../shared/iapws97.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Ethanol at 50 °C: log10 P = 5.24677 − 1598.673 / 276.726 → 29.49 kPa; normal boiling point 351.45 K (NIST 351.44 K)',
    source: 'NIST WebBook Antoine parameters (Ambrose and Sprake 1970), hand calculation; NIST Tboil of ethanol',
    run: () => {
      const o = calculate({ fluid: 'ethanol', mode: 'pressure', temp_k: 323.15 }).outputs;
      assertClose(o.psat_pa, 29489.9, { abs: 0.1 }, 'P');
      assertClose(o.nbp_k, 351.44, { abs: 0.06 }, 'Tb');
    },
  },
  {
    name: 'Water from 0 to 100 °C is within 0.12 % of IAPWS-IF97, and from 120 to 370 °C within 1.3 %',
    source: 'IAPWS R7-97(2012) eq. 30 (shared/iapws97.js psat)',
    run: () => {
      for (const c of [0.01, 10, 20, 25, 40, 50, 60, 80, 90, 99]) assertClose(vapourPressure('water', c + 273.15), psat(c + 273.15) * 1e6, { rel: 0.0012 }, `${c} °C`);
      for (const c of [120, 150, 200, 250, 300, 350, 370]) assertClose(vapourPressure('water', c + 273.15), psat(c + 273.15) * 1e6, { rel: 0.013 }, `${c} °C`);
      assertClose(calculate({ temp_k: 353.15 }).outputs.iapws_pa, 47414.5, { abs: 1 }, 'IAPWS at 80 °C');
    },
  },
  {
    name: 'Water boils at 100.00 °C at 101.325 kPa and within 0.3 K of IAPWS-IF97 at 50 kPa and 5 bar',
    source: 'IAPWS-IF97 saturation temperature (eq. 31, shared/iapws97.js tsat)',
    run: () => {
      assertClose(calculate({ mode: 'boiling', pressure_pa: 101325 }).outputs.tsat_k, 373.15, { abs: 0.01 }, '1 atm');
      assertClose(boilingPoint('water', 50000), tsat(0.05), { abs: 0.05 }, '50 kPa');
      assertClose(boilingPoint('water', 500000), tsat(0.5), { abs: 0.3 }, '5 bar');
    },
  },
  {
    name: 'At 25 °C benzene 12.70, toluene 3.799, n-hexane 20.16, n-pentane 68.35, cyclohexane 13.02, methanol 16.98 kPa within 0.3 %',
    source: 'NIST WebBook fluid properties (reference equations of state), saturation pressures interpolated at 298.15 K',
    run: () => {
      for (const [f, p] of [['benzene', 12.695], ['toluene', 3.7992], ['hexane', 20.164], ['pentane', 68.355], ['cyclohexane', 13.019], ['methanol', 16.981]]) {
        assertClose(vapourPressure(f, 298.15) / 1000, p, { rel: 0.003 }, f);
      }
      assertClose(vapourPressure('heptane', 323.15) / 1000, 18.894, { rel: 0.003 }, 'n-heptane at 50 °C');
    },
  },
  {
    name: 'At 20 °C ammonia 857 kPa (within 1 %), propane 836 kPa and n-butane 208 kPa (within 0.3 %)',
    source: 'NIST WebBook fluid properties (reference equations of state)',
    run: () => {
      assertClose(vapourPressure('ammonia', 293.15) / 1000, 857.0, { rel: 0.01 }, 'ammonia');
      assertClose(vapourPressure('propane', 293.15) / 1000, 836.5, { rel: 0.003 }, 'propane');
      assertClose(vapourPressure('butane', 293.15) / 1000, 207.65, { rel: 0.003 }, 'butane');
    },
  },
  {
    name: 'Boiling point inverts the vapour pressure in every fluid; ammonia warns',
    source: 'Consistency of T = B / (A − log10 P) − C with the forward equation',
    run: () => {
      for (const [f, T] of [['acetone', 300], ['toluene', 350], ['propane', 250], ['water', 450], ['acetic_acid', 330]]) {
        const p = vapourPressure(f, T);
        assertClose(calculate({ fluid: f, mode: 'boiling', pressure_pa: p }).outputs.tsat_k, T, { abs: 1e-6 }, f);
      }
      assertEqual(calculate({ fluid: 'ammonia', temp_k: 250 }).warnings.length, 1, 'ammonia warning');
    },
  },
  {
    name: 'Temperatures and pressures outside the tabulated range are refused, not extrapolated',
    source: 'Validation contract (Antoine constants are valid only in their fitted range)',
    run: () => {
      assertThrows(() => calculate({ fluid: 'heptane', temp_k: 298.15 }), 'does not extrapolate');
      assertThrows(() => calculate({ fluid: 'methanol', mode: 'boiling', pressure_pa: 1e6 }), 'does not extrapolate');
      assertThrows(() => calculate({ fluid: 'mercury' }), 'Liquid');
    },
  },
];
