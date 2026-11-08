/**
 * bernoulli/tests.js — checks against Bernoulli's equation, continuity and the energy equation with head loss.
 * Run: node run-tests.js bernoulli
 */
import { calculate, pressureAt2 } from './calc.js';
import { GRAVITY_M_S2 } from '../shared/units.js';
import { assertClose, assertEqual } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Venturi 100 to 50 mm, water at 1 m/s and 200 kPa: V₂ = 4 m/s, p₂ = 192.51 kPa, drop 7.487 kPa',
    source: 'White, Fluid Mechanics, ch. 3.5: p₁ + ½ρV₁² = p₂ + ½ρV₂²; continuity V₂ = V₁ (D₁/D₂)²',
    run: () => {
      const { outputs } = calculate({ fluid: 'water_20c', reference: 'gauge', p1_pa: 200000, v1_m_s: 1, z1_m: 0, v2_mode: 'bores', d1_m: 0.1, d2_m: 0.05, z2_m: 0, head_loss_m: 0 });
      assertClose(outputs.v2_out_m_s, 4, { rel: 1e-12 }, 'V₂');
      assertClose(outputs.dp_pa, 0.5 * 998.2 * 15, { rel: 1e-12 }, 'Δp');
      assertClose(outputs.p2_pa, 192513.5, { abs: 0.1 }, 'p₂');
      assertClose(outputs.flow_m3_s, Math.PI * 0.01 / 4, { rel: 1e-12 }, 'Q');
    },
  },
  {
    name: 'Rising 10 m at constant velocity loses ρ g Δz = 97.9 kPa of water pressure',
    source: 'Hydrostatic term of Bernoulli\'s equation (Çengel and Cimbala, ch. 5)',
    run: () => {
      const { outputs } = calculate({ fluid: 'water_20c', p1_pa: 300000, v1_m_s: 2, z1_m: 0, v2_mode: 'direct', v2_m_s: 2, z2_m: 10, head_loss_m: 0 });
      assertClose(outputs.dp_pa, 998.2 * GRAVITY_M_S2 * 10, { rel: 1e-12 }, 'Δp');
    },
  },
  {
    name: 'A 3 m head loss lowers p₂ by ρ g × 3; total head is conserved without loss',
    source: 'Energy equation with head loss (White, ch. 3.6)',
    run: () => {
      const base = { rho: 1000, p1: 150000, v1: 1.5, z1: 2, v2: 3, z2: 0 };
      const lossless = pressureAt2(base);
      const lossy = pressureAt2({ ...base, headLoss: 3 });
      assertClose(lossless - lossy, 1000 * GRAVITY_M_S2 * 3, { rel: 1e-12 }, 'head loss');
      const h = (p, v, z) => p / (1000 * GRAVITY_M_S2) + v * v / (2 * GRAVITY_M_S2) + z;
      assertClose(h(lossless, 3, 0), h(150000, 1.5, 2), { rel: 1e-12 }, 'total head');
    },
  },
  {
    name: 'A fast nozzle from 50 kPa gauge drives point 2 below the vapour pressure: cavitation warning',
    source: 'Vapour pressure of water at 20 °C = 2.339 kPa (IAPWS)',
    run: () => {
      const { warnings } = calculate({ fluid: 'water_20c', reference: 'gauge', p1_pa: 50000, v1_m_s: 2, v2_mode: 'direct', v2_m_s: 18, z1_m: 0, z2_m: 0, head_loss_m: 0 });
      assertEqual(warnings.some((w) => w.includes('cavitat')), true, 'warning');
    },
  },
  {
    name: 'Equal bores and heights with no loss leave the pressure unchanged',
    source: 'Bernoulli with V₁ = V₂ and z₁ = z₂',
    run: () => {
      const { outputs } = calculate({ fluid: 'seawater_15c', p1_pa: 123456, v1_m_s: 2.5, v2_mode: 'bores', d1_m: 0.2, d2_m: 0.2, z1_m: 1, z2_m: 1, head_loss_m: 0 });
      assertClose(outputs.p2_pa, 123456, { rel: 1e-12 }, 'p₂ = p₁');
    },
  },
];
