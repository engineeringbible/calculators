/**
 * orifice-flow/tests.js — checks against the ISO 5167-2 equation structure and a published calculator case.
 * Run: node run-tests.js orifice-flow
 */
import { calculate, readerHarrisGallagher, orificeExpansibility, venturiExpansibility, orificeLossRatio, DEVICES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** instrumentationblog.in ISO 5167-2 calculator case: 4" Sch 40 pipe, β 0.5, flange taps, water 20 °C, 250 mbar. */
const FLANGE = { device: 'orifice_flange', mode: 'flow', pipe_d_m: 0.10226, bore_d_m: 0.05113, fluid: 'liquid', density_kg_m3: 998.2, viscosity_pa_s: 0.001002, dp_pa: 25000 };

export const tests = [
  {
    name: 'Published case: flange taps, D 102.26 mm, d 51.13 mm (β 0.5), water 998.2 kg/m³ / 1.002 mPa·s, Δp 250 mbar → Re_D 112 800, C 0.6059, q_m 9.078 kg/s, q_v 32.74 m³/h, pipe velocity 1.107 m/s',
    source: 'instrumentationblog.in ISO 5167-2 orifice calculator worked example (C 0.6059, 32 680 kg/h, 32.739 m³/h, 1.107 m/s)',
    run: () => {
      const { outputs } = calculate(FLANGE);
      assertClose(outputs.beta, 0.5, { rel: 1e-9 }, 'β');
      assertClose(outputs.reynolds_pipe, 112800, { rel: 3e-3 }, 'Re_D');
      assertClose(outputs.discharge_coefficient, 0.6059, { abs: 5e-4 }, 'C');
      assertClose(outputs.mass_flow_out_kg_s, 9.0777, { rel: 2e-3 }, 'q_m');
      assertClose(outputs.volume_flow_out_m3_s * 3600, 32.739, { rel: 2e-3 }, 'q_v');
      assertClose(outputs.pipe_velocity_m_s, 1.107, { rel: 3e-3 }, 'velocity');
      assertEqual(outputs.expansibility, 1, 'liquid ε = 1');
      assertEqual(outputs.validity.startsWith('Within'), true, 'valid');
    },
  },
  {
    name: 'Reader-Harris/Gallagher structure: at very high Re_D the corner-tap coefficient tends to 0.5961 + 0.0261β² − 0.216β⁸ (the L1 bracket 0.043 + 0.080 − 0.123 vanishes for corner taps); flange and D–D/2 taps differ only through L1 and M′2; the small-pipe term adds for D < 71.12 mm',
    source: 'ISO 5167-2:2003 eq. 4 (as reproduced by HydrauCalc, March 2019)',
    run: () => {
      const beta = 0.5;
      const cInf = 0.5961 + 0.0261 * beta ** 2 - 0.216 * beta ** 8;
      assertClose(readerHarrisGallagher(beta, 1e12, 'orifice_corner', 0.2), cInf, { abs: 1e-4 }, 'corner limit (residual Re terms ≈ 3·10⁻⁵ at Re_D 10¹²)');
      const dd2 = readerHarrisGallagher(beta, 1e6, 'orifice_dd2', 0.2);
      const corner = readerHarrisGallagher(beta, 1e6, 'orifice_corner', 0.2);
      const flange = readerHarrisGallagher(beta, 1e6, 'orifice_flange', 0.2);
      assertEqual(Math.abs(dd2 - corner) < 0.01 && Math.abs(flange - corner) < 0.01, true, 'tapping differences small');
      assertEqual(dd2 !== corner && flange !== corner, true, 'but not identical');
      const small = readerHarrisGallagher(beta, 1e5, 'orifice_corner', 0.05);
      const sameNoTerm = readerHarrisGallagher(beta, 1e5, 'orifice_corner', 0.0712);
      assertClose(small - sameNoTerm, 0.011 * 0.25 * (2.8 - 50 / 25.4), { abs: 1e-6 }, 'D < 71.12 mm term');
      assertEqual(DEVICES.orifice_dd2.L1 === 1 && DEVICES.orifice_dd2.L2 === 0.47, true, 'D–D/2 constants');
    },
  },
  {
    name: 'Δp from flow inverts the flow mode: 9.078 kg/s (32.74 m³/h) through the same plate gives 250 mbar; mass and volume bases agree',
    source: 'Inverse of q_m = C E ε (π/4) d² √(2 Δp ρ)',
    run: () => {
      const forward = calculate(FLANGE).outputs;
      const back = calculate({ ...FLANGE, mode: 'dp', flow_basis: 'mass', mass_flow_kg_s: forward.mass_flow_out_kg_s }).outputs;
      assertClose(back.dp_out_pa, 25000, { rel: 1e-6 }, 'Δp round trip');
      const backV = calculate({ ...FLANGE, mode: 'dp', flow_basis: 'volume', volume_flow_m3_s: forward.volume_flow_out_m3_s }).outputs;
      assertClose(backV.dp_out_pa, 25000, { rel: 1e-6 }, 'volume basis');
      assertClose(back.discharge_coefficient, forward.discharge_coefficient, { rel: 1e-6 }, 'same C');
    },
  },
  {
    name: 'Gas expansibility: β 0.5, p₂/p₁ 0.9, κ 1.4 → ε = 1 − (0.351 + 0.256·0.0625 + 0.93·0.0039)(1 − 0.9^(1/1.4)) = 0.9731; ε → 1 as Δp → 0; the isentropic Venturi ε at the same point is lower (0.9405)',
    source: 'ISO 5167-2:2003 eq. 5; ISO 5167-4:2003 eq. 3',
    run: () => {
      assertClose(orificeExpansibility(0.5, 0.9, 1.4), 1 - (0.351 + 0.256 * 0.0625 + 0.93 * 0.5 ** 8) * (1 - 0.9 ** (1 / 1.4)), { rel: 1e-12 }, 'formula');
      assertClose(orificeExpansibility(0.5, 0.9, 1.4), 0.9731, { abs: 2e-4 }, 'value');
      assertClose(orificeExpansibility(0.5, 1 - 1e-9, 1.4), 1, { abs: 1e-8 }, 'ε → 1');
      const ev = venturiExpansibility(0.5, 0.9, 1.4);
      const tau = 0.9;
      const k = 1.4;
      const b4 = 0.0625;
      const expectedEv = Math.sqrt(((k * tau ** (2 / k)) / (k - 1)) * ((1 - b4) / (1 - b4 * tau ** (2 / k))) * ((1 - tau ** ((k - 1) / k)) / (1 - tau)));
      assertClose(ev, expectedEv, { rel: 1e-12 }, 'Venturi ε formula');
      assertClose(ev, 0.9405, { abs: 5e-4 }, 'Venturi ε value');
      assertEqual(ev < orificeExpansibility(0.5, 0.9, 1.4), true, 'Venturi ε below the orifice ε');
      const gas = calculate({ ...FLANGE, fluid: 'gas', density_kg_m3: 6, viscosity_pa_s: 1.8e-5, p1_pa: 500000, dp_pa: 50000 }).outputs;
      assertClose(gas.expansibility, orificeExpansibility(0.5, 0.9, 1.4), { rel: 1e-9 }, 'in calculate');
    },
  },
  {
    name: 'Venturi (machined, C 0.995): same geometry and Δp gives (0.995/0.6059) × the orifice flow; permanent loss 10 % of Δp vs the orifice formula [√(1−β⁴(1−C²)) − Cβ²]/[√(1−β⁴(1−C²)) + Cβ²] = 0.737 at β 0.5',
    source: 'ISO 5167-4 discharge coefficients; ISO 5167-2 §5.4.1 pressure loss',
    run: () => {
      const orifice = calculate(FLANGE).outputs;
      const venturi = calculate({ ...FLANGE, device: 'venturi_machined', pipe_d_m: 0.2, bore_d_m: 0.1, dp_pa: 25000 }).outputs;
      assertEqual(venturi.discharge_coefficient, 0.995, 'C venturi');
      assertClose(venturi.pressure_loss_ratio_pct, 10, { rel: 1e-12 }, 'venturi loss');
      assertClose(orificeLossRatio(0.5, orifice.discharge_coefficient), (Math.sqrt(1 - 0.0625 * (1 - orifice.discharge_coefficient ** 2)) - orifice.discharge_coefficient * 0.25) / (Math.sqrt(1 - 0.0625 * (1 - orifice.discharge_coefficient ** 2)) + orifice.discharge_coefficient * 0.25), { rel: 1e-12 }, 'orifice loss formula');
      assertClose(orifice.pressure_loss_ratio_pct, 73.7, { abs: 0.5 }, 'orifice loss ≈ 74 %');
      assertClose(orifice.velocity_of_approach, 1 / Math.sqrt(1 - 0.0625), { rel: 1e-12 }, 'E');
    },
  },
  {
    name: 'Validity flags: β 0.8 or Re_D below 5 000 is reported as outside ISO 5167-2; a 40 mm pipe is outside the 50–1 000 mm range; Venturi below Re_D 2·10⁵ is flagged',
    source: 'ISO 5167-2 §5.3.1 and ISO 5167-4 §5.5 limits of use',
    run: () => {
      const wide = calculate({ ...FLANGE, bore_d_m: 0.0818 }).outputs;
      assertEqual(wide.validity.includes('β outside'), true, 'β');
      const slow = calculate({ ...FLANGE, viscosity_pa_s: 0.05 }).outputs;
      assertEqual(slow.validity.includes('Re_D < 5 000'), true, 'Re');
      const small = calculate({ ...FLANGE, pipe_d_m: 0.04, bore_d_m: 0.02 }).outputs;
      assertEqual(small.validity.includes('D outside'), true, 'D');
      const venturiSlow = calculate({ ...FLANGE, device: 'venturi_machined', pipe_d_m: 0.2, bore_d_m: 0.1, viscosity_pa_s: 0.01 }).outputs;
      assertEqual(venturiSlow.validity.includes('Re_D outside'), true, 'venturi Re');
    },
  },
  {
    name: 'Invalid inputs fail fast: bore not smaller than the pipe, Δp above the upstream gas pressure, unknown device',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...FLANGE, bore_d_m: 0.11 }), 'must be smaller', 'bore');
      assertThrows(() => calculate({ ...FLANGE, fluid: 'gas', p1_pa: 20000, dp_pa: 25000 }), 'exceeds the upstream', 'Δp > p₁');
      assertThrows(() => calculate({ ...FLANGE, device: 'nozzle' }), 'must be one of', 'device');
    },
  },
];
