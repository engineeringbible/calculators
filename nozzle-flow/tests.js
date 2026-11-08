/**
 * nozzle-flow/tests.js — checks against NFPA 291 hydrant flow, IFSTA smooth-bore and fog-nozzle formulas and the
 * NFPA 13 K-factor equation.
 * Run: node run-tests.js nozzle-flow
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const PSI = 6894.757293168;
const GPM = 0.003785411784 / 60;
const LBF = 4.4482216152605;

export const tests = [
  {
    name: 'Hydrant flow test: 2½ in outlet, c = 0.90, pitot 23 psi gives 804–805 gpm by 29.84 c d² √p and by the orifice equation',
    source: 'NFPA 291 Q = 29.84 c d² √p; City of Temecula fire flow calculation examples (804 gpm)',
    run: () => {
      const o = calculate({ solve: 'flow', spec: 'orifice', diameter_m: 2.5 * IN, cd: 0.9, pressure_pa: 23 * PSI, density: 999 }).outputs;
      assertClose(o.freeman_m3s / GPM, 804.98, { abs: 0.01 }, 'Freeman formula (hand calculation)');
      assertClose(o.freeman_m3s / GPM, 804, { abs: 1.5 }, 'published 804 gpm');
      assertClose(o.flow_out_m3s / GPM, o.freeman_m3s / GPM, { rel: 1e-4 }, 'orifice equation at 999 kg/m³ agrees with 29.84');
    },
  },
  {
    name: 'Smooth bore 7/8 in at 50 psi: 161 gpm (29.7 d² √NP) and 60 lb reaction (1.57 d² NP)',
    source: 'IFSTA smooth-bore formulas; Fire Apparatus Magazine "Nozzle reaction" (161 gpm, 60 lb)',
    run: () => {
      const a = calculate({ solve: 'flow', diameter_m: 0.875 * IN, cd: 29.7 / 29.84, pressure_pa: 50 * PSI, density: 999 }).outputs;
      assertClose(a.flow_out_m3s / GPM, 161, { abs: 0.5 }, 'flow');
      const b = calculate({ solve: 'flow', diameter_m: 0.875 * IN, cd: 1, pressure_pa: 50 * PSI, density: 999 }).outputs;
      assertClose(b.reaction_n / LBF, 1.57 * 0.875 ** 2 * 50, { rel: 0.002 }, 'momentum = 1.57 d² NP at Cd = 1');
      assertClose(b.reaction_n / LBF, 60, { abs: 0.5 }, 'published 60 lb');
    },
  },
  {
    name: 'Fog nozzle 150 gpm at 50 psi: IFSTA reaction 0.0505 × 150 × √50 = 53.6 lb (about 54 lb); jet momentum 4 % more',
    source: 'IFSTA fog-nozzle reaction formula; Fire Apparatus Magazine "Nozzle reaction" (about 54 lb)',
    run: () => {
      const o = calculate({ solve: 'size', spec: 'k', flow_m3s: 150 * GPM, pressure_pa: 50 * PSI, density: 999 }).outputs;
      assertClose(o.reaction_fog_n / LBF, 53.56, { abs: 0.01 }, 'fog formula');
      assertClose(o.k_us, 150 / Math.sqrt(50), { rel: 1e-9 }, 'K needed');
      assertClose(o.reaction_n / o.reaction_fog_n, 1.043, { abs: 0.002 }, 'momentum / IFSTA');
    },
  },
  {
    name: 'Sprinkler K 5.6 at 7 psi flows 14.8 gpm; 20 gpm needs 12.8 psi; K 5.6 is K80.7 metric; K80 at 0.5 bar flows 56.6 L/min',
    source: 'NFPA 13 Q = K √p; 1 gpm/psi½ = 3.785 × √14.504 = 14.42 L/min/bar½',
    run: () => {
      const a = calculate({ solve: 'flow', spec: 'k', k_units: 'us', k_factor: 5.6, pressure_pa: 7 * PSI }).outputs;
      assertClose(a.flow_out_m3s / GPM, 5.6 * Math.sqrt(7), { rel: 1e-9 }, 'Q');
      assertClose(a.k_si, 80.73, { abs: 0.01 }, 'metric K');
      const b = calculate({ solve: 'pressure', spec: 'k', k_factor: 5.6, flow_m3s: 20 * GPM }).outputs;
      assertClose(b.pressure_out_pa / PSI, (20 / 5.6) ** 2, { rel: 1e-9 }, 'p');
      const c = calculate({ solve: 'flow', spec: 'k', k_units: 'si', k_factor: 80, pressure_pa: 0.5e5 }).outputs;
      assertClose(c.flow_out_m3s * 60000, 80 * Math.sqrt(0.5), { rel: 1e-9 }, 'L/min');
    },
  },
  {
    name: 'Round trip: the pressure for the computed flow, and the size for that flow and pressure, return the inputs',
    source: 'Q = Cd A √(2Δp/ρ) solved for each unknown',
    run: () => {
      const base = { spec: 'orifice', cd: 0.62, density: 1025 };
      const q = calculate({ ...base, solve: 'flow', diameter_m: 0.01, pressure_pa: 3e5 }).outputs.flow_out_m3s;
      assertClose(q, 0.62 * (Math.PI / 4) * 1e-4 * Math.sqrt(6e5 / 1025), { rel: 1e-12 }, 'Q');
      assertClose(calculate({ ...base, solve: 'pressure', diameter_m: 0.01, flow_m3s: q }).outputs.pressure_out_pa, 3e5, { rel: 1e-9 }, 'p');
      assertClose(calculate({ ...base, solve: 'size', flow_m3s: q, pressure_pa: 3e5 }).outputs.diameter_out_m, 0.01, { rel: 1e-9 }, 'd');
    },
  },
  {
    name: 'A sprinkler below 7 psi warns; zero pressure, Cd above 1 and an unknown option are rejected',
    source: 'NFPA 13 minimum operating pressure; validation contract',
    run: () => {
      assertEqual(calculate({ spec: 'k', pressure_pa: 5 * PSI }).warnings.length, 1, 'low pressure');
      assertThrows(() => calculate({ pressure_pa: 0 }), 'Nozzle pressure must be greater than zero');
      assertThrows(() => calculate({ cd: 1.2 }), 'Discharge coefficient');
      assertThrows(() => calculate({ solve: 'power' }), 'Solve for');
    },
  },
];
