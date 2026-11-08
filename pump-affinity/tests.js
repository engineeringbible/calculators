/**
 * pump-affinity/tests.js — checks against the Hydraulic Institute affinity laws and hand-verified values.
 * Run: node run-tests.js pump-affinity
 */
import { calculate, affinityMultipliers, pumpHydraulicPowerW, specificSpeedNq } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Speed 1 450 → 1 750 rpm: Q × 1.2069, H × 1.4566, P × 1.7580 (200 m³/h, 50 m, 35 kW → 241.4 m³/h, 72.8 m, 61.5 kW)',
    source: 'Affinity laws Q ∝ N, H ∝ N², P ∝ N³ — ANSI/HI 14.3 Rotodynamic Pumps for Design and Application; Karassik et al., Pump Handbook, 4th ed., §2.3',
    run: () => {
      const m = affinityMultipliers(1750 / 1450, 1);
      assertClose(m.flow, 1.206897, { abs: 1e-6 }, 'flow multiplier');
      assertClose(m.head, 1.456599, { abs: 1e-6 }, 'head multiplier');
      assertClose(m.power, 1.757964, { abs: 1e-6 }, 'power multiplier');
      const { outputs } = calculate({});
      assertClose(convert(outputs.flow2_m3_s, 'm3_s', 'm3_h', 'volume_flow'), 241.379, { abs: 2e-3 }, 'Q₂');
      assertClose(outputs.head2_m, 72.830, { abs: 2e-3 }, 'H₂');
      assertClose(outputs.power2_w, 61528.7, { abs: 1 }, 'P₂');
    },
  },
  {
    name: 'Impeller trim 250 → 225 mm (ratio 0.9) at constant speed: Q × 0.9, H × 0.81, P × 0.729',
    source: 'Trimming approximation Q ∝ D, H ∝ D², P ∝ D³ — Karassik, Pump Handbook, 4th ed., §2.3 "Impeller diameter change"; Gülich, Centrifugal Pumps, 3rd ed., §4.5.1',
    run: () => {
      const { outputs, warnings } = calculate({ speed2_rpm: 1450, diameter2_m: 0.225, diameter_law: 'trim' });
      assertClose(outputs.diameter_ratio, 0.9, { rel: 1e-12 }, 'ratio');
      assertClose(convert(outputs.flow2_m3_s, 'm3_s', 'm3_h', 'volume_flow'), 180, { rel: 1e-9 }, 'Q₂');
      assertClose(outputs.head2_m, 40.5, { rel: 1e-9 }, 'H₂');
      assertClose(outputs.power2_w, 35000 * 0.729, { rel: 1e-9 }, 'P₂');
      assertEqual(warnings.some((w) => w.includes('Trim below 75')), false, 'no trim warning at 90 %');
    },
  },
  {
    name: 'Geometrically similar machine, diameter × 2 at the same speed: Q × 8, H × 4, P × 32',
    source: 'Similarity laws Q ∝ N D³, H ∝ N² D², P ∝ N³ D⁵ — Gülich, Centrifugal Pumps, 3rd ed., §3.4; White, Fluid Mechanics, §11.3 (pump similarity rules)',
    run: () => {
      const m = affinityMultipliers(1, 2, 'similar');
      assertClose(m.flow, 8, { rel: 1e-12 }, 'flow');
      assertClose(m.head, 4, { rel: 1e-12 }, 'head');
      assertClose(m.power, 32, { rel: 1e-12 }, 'power');
      const combined = affinityMultipliers(2, 2, 'similar');
      assertClose(combined.power, 2 ** 3 * 2 ** 5, { rel: 1e-12 }, 'combined speed and size');
    },
  },
  {
    name: 'Hydraulic power ρ g Q H = 27.24 kW for 200 m³/h at 50 m; efficiency 77.8 % with 35 kW shaft power',
    source: 'P_hyd = ρ g Q H — Karassik, Pump Handbook, 4th ed., §2.1; g = 9.80665 m/s²',
    run: () => {
      assertClose(pumpHydraulicPowerW(1000, 200 / 3600, 50), 27240.7, { abs: 0.5 }, 'hydraulic power');
      const { outputs } = calculate({});
      assertClose(outputs.hydraulic_power1_w, 27240.7, { abs: 0.5 }, 'in calculate()');
      assertClose(outputs.efficiency_pct, 77.83, { abs: 0.01 }, 'efficiency');
    },
  },
  {
    name: 'Fan: 10 m³/s at 1 000 Pa with 12 kW, speed × 1.2 → 12 m³/s, 1 440 Pa, 20.74 kW; efficiency 83.3 %',
    source: 'Fan laws (same as pump affinity laws, pressure in place of head) — ASHRAE Handbook, HVAC Systems and Equipment, ch. 21 "Fans"',
    run: () => {
      const { outputs } = calculate({ machine: 'fan', flow1_m3_s: 10, pressure1_pa: 1000, power1_w: 12000, rho_kg_m3: 1.2, speed1_rpm: 1000, speed2_rpm: 1200 });
      assertClose(outputs.flow2_m3_s, 12, { rel: 1e-12 }, 'Q₂');
      assertClose(outputs.pressure2_pa, 1440, { rel: 1e-12 }, 'Δp₂');
      assertClose(outputs.power2_w, 20736, { rel: 1e-12 }, 'P₂');
      assertClose(outputs.hydraulic_power1_w, 10000, { rel: 1e-12 }, 'air power');
      assertClose(outputs.efficiency_pct, 83.333, { abs: 1e-3 }, 'efficiency');
      assertEqual(outputs.head2_m, undefined, 'no head output for a fan');
    },
  },
  {
    name: 'Specific speed n_q = 1 450 × √0.0556 / 50^0.75 = 18.2 (radial-flow range 10–30)',
    source: 'n_q definition (rpm, m³/s, m) — Gülich, Centrifugal Pumps, 3rd ed., eq. 3.4; radial impellers n_q ≈ 10–30',
    run: () => {
      assertClose(specificSpeedNq(1450, 200 / 3600, 50), 18.18, { abs: 0.01 }, 'n_q');
      assertClose(calculate({}).outputs.specific_speed_nq, 18.18, { abs: 0.01 }, 'in calculate()');
    },
  },
  {
    name: 'Warnings: trim below 75 % and hydraulic power above shaft power are flagged',
    source: 'Trim limit guidance — Karassik, Pump Handbook, 4th ed., §2.3 (trims beyond 20–25 % not recommended)',
    run: () => {
      const trimmed = calculate({ speed2_rpm: 1450, diameter2_m: 0.18 });
      assertEqual(trimmed.warnings.some((w) => w.includes('Trim below 75')), true, 'trim warning');
      const impossible = calculate({ power1_w: 20000 });
      assertEqual(impossible.warnings.some((w) => w.includes('exceeds shaft power')), true, 'efficiency > 100 % warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero speed, zero diameter, unknown law',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ speed1_rpm: 0 }), 'greater than zero', 'speed');
      assertThrows(() => calculate({ diameter2_m: 0 }), 'greater than zero', 'diameter');
      assertThrows(() => calculate({ diameter_law: 'magic' }), 'must be one of', 'law');
    },
  },
];
