/**
 * pipe-flow/tests.js — checks against exact laminar theory, the smooth- and rough-pipe laws, and the Moody chart.
 * Run: node run-tests.js pipe-flow
 */
import { calculate, colebrookFrictionFactor, swameeJainFrictionFactor, laminarFrictionFactor, ROUGHNESS_M, FLUIDS } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** Custom fluid ρ = 1000 kg/m³, ν = 1e-6 m²/s (μ = 1 mPa·s) so Re and Hagen–Poiseuille are easy to check by hand. */
const UNIT_FLUID = { fluid: 'custom', rho_kg_m3: 1000, nu_m2_s: 1e-6, material: 'custom', roughness_m: 0 };

export const tests = [
  {
    name: 'Laminar flow Re = 1 000: f = 64/Re = 0.064 and Δp = 320 Pa, equal to Hagen–Poiseuille 32 μ L V / D²',
    source: 'Hagen–Poiseuille law; White, Fluid Mechanics, 7th ed., §6.4 (f = 64/Re for laminar pipe flow)',
    run: () => {
      assertClose(laminarFrictionFactor(1000), 0.064, { rel: 1e-12 }, 'f laminar');
      const { outputs } = calculate({ ...UNIT_FLUID, known: 'velocity', velocity_m_s: 0.1, diameter_m: 0.01, length_m: 10 });
      assertClose(outputs.reynolds, 1000, { rel: 1e-9 }, 'Re');
      assertEqual(outputs.regime, 'Laminar', 'regime');
      assertClose(outputs.friction_factor, 0.064, { rel: 1e-9 }, 'f');
      const hagenPoiseuille = (32 * 1e-3 * 10 * 0.1) / 0.01 ** 2;
      assertClose(hagenPoiseuille, 320, { rel: 1e-12 }, 'HP reference');
      assertClose(outputs.dp_friction_pa, 320, { rel: 1e-9 }, 'Δp friction');
      assertEqual(outputs.swamee_jain_f, null, 'no Swamee–Jain in laminar flow');
    },
  },
  {
    name: 'Smooth pipe, Re = 10⁵: Colebrook gives f = 0.0180 (Prandtl–von Kármán smooth-pipe law, Moody chart)',
    source: 'Moody (1944) chart; Prandtl universal law 1/√f = 2 log(Re√f) − 0.8 → 0.0180 at Re = 10⁵ (White, Fluid Mechanics, eq. 6.54)',
    run: () => {
      assertClose(colebrookFrictionFactor(1e5, 0), 0.0180, { abs: 2e-4 }, 'f smooth');
      const { outputs } = calculate({ ...UNIT_FLUID, known: 'velocity', velocity_m_s: 1, diameter_m: 0.1 });
      assertClose(outputs.reynolds, 1e5, { rel: 1e-9 }, 'Re');
      assertEqual(outputs.regime, 'Turbulent', 'regime');
      assertClose(outputs.friction_factor, 0.0180, { abs: 2e-4 }, 'f');
    },
  },
  {
    name: 'Fully rough pipe, ε/D = 0.01 at Re = 10⁹: f = [2 log(3.7 D/ε)]⁻² = 0.0379 (von Kármán rough-pipe law)',
    source: 'Nikuradse / von Kármán fully rough law, White, Fluid Mechanics, eq. 6.55; Moody chart ε/D = 0.01 → 0.038',
    run: () => {
      const vonKarman = 1 / (2 * Math.log10(3.7 / 0.01)) ** 2;
      assertClose(vonKarman, 0.0379, { abs: 1e-4 }, 'reference value');
      assertClose(colebrookFrictionFactor(1e9, 0.01), vonKarman, { rel: 1e-3 }, 'Colebrook at very high Re');
    },
  },
  {
    name: 'Moody chart check Re = 10⁵, ε/D = 0.001: Colebrook f ≈ 0.0222; Swamee–Jain within 1 % of Colebrook',
    source: 'Moody (1944) chart reading 0.0222 (Çengel & Cimbala, Fluid Mechanics, Fig. A-12); Swamee & Jain (1976) accuracy ±1 %',
    run: () => {
      const colebrook = colebrookFrictionFactor(1e5, 0.001);
      assertClose(colebrook, 0.0222, { rel: 0.015 }, 'Colebrook vs Moody');
      const swameeJain = swameeJainFrictionFactor(1e5, 0.001);
      assertClose(swameeJain, colebrook, { rel: 0.01 }, 'Swamee–Jain vs Colebrook');
      const { outputs } = calculate({ ...UNIT_FLUID, roughness_m: 0.0001, known: 'velocity', velocity_m_s: 1, diameter_m: 0.1 });
      assertClose(outputs.relative_roughness, 0.001, { rel: 1e-12 }, 'ε/D');
      assertClose(outputs.friction_factor, colebrook, { rel: 1e-12 }, 'f in calculate()');
      assertClose(outputs.swamee_jain_f, swameeJain, { rel: 1e-12 }, 'SJ in calculate()');
    },
  },
  {
    name: 'Darcy–Weisbach: minor losses ΣK = 5 at 2 m/s → 10 000 Pa (1.02 m); 10 m rise → 98 066.5 Pa static',
    source: 'Darcy–Weisbach h = f (L/D) V²/2g and h_minor = K V²/2g — Crane TP-410 (2013), ch. 2; g = 9.80665 m/s²',
    run: () => {
      const { outputs } = calculate({ ...UNIT_FLUID, known: 'velocity', velocity_m_s: 2, diameter_m: 0.1, length_m: 0, k_minor: 5, elevation_m: 10 });
      assertClose(outputs.dp_minor_pa, 10000, { rel: 1e-12 }, 'Δp minor');
      assertClose(outputs.dp_static_pa, 98066.5, { rel: 1e-12 }, 'Δp static');
      assertClose(outputs.dp_friction_pa, 0, { abs: 1e-12 }, 'no friction with zero length');
      assertClose(outputs.head_total_m, 10 + (5 * 4) / (2 * 9.80665), { rel: 1e-9 }, 'total head');
    },
  },
  {
    name: 'Velocity from flow: 100 m³/h in DN100 (0.1 m) = 3.537 m/s; velocity mode returns the same flow',
    source: 'Continuity V = Q / (π D²/4)',
    run: () => {
      const fromFlow = calculate({ known: 'flow', flow_m3_s: 100 / 3600, diameter_m: 0.1 }).outputs;
      assertClose(fromFlow.velocity_out_m_s, 3.5368, { abs: 5e-4 }, 'velocity');
      const fromVelocity = calculate({ known: 'velocity', velocity_m_s: fromFlow.velocity_out_m_s, diameter_m: 0.1 }).outputs;
      assertClose(fromVelocity.flow_out_m3_s, 100 / 3600, { rel: 1e-9 }, 'flow round trip');
    },
  },
  {
    name: 'Presets: commercial steel ε = 0.045 mm, cast iron 0.26 mm; ITTC sea water 15 °C ρ = 1025.87 kg/m³, ν = 1.18831e-6 m²/s',
    source: 'Moody (1944) / White Table 6.1 roughness; ITTC Recommended Procedure 7.5-02-01-03 (2011) fresh and sea water properties',
    run: () => {
      assertClose(ROUGHNESS_M.commercial_steel.value, 0.045e-3, { rel: 1e-12 }, 'steel');
      assertClose(ROUGHNESS_M.cast_iron.value, 0.26e-3, { rel: 1e-12 }, 'cast iron');
      assertClose(FLUIDS.seawater_15c.rho, 1025.87, { rel: 1e-12 }, 'ρ sea water');
      assertClose(FLUIDS.seawater_15c.nu, 1.18831e-6, { rel: 1e-12 }, 'ν sea water');
      assertClose(FLUIDS.water_20c.nu, 1.004e-6, { rel: 1e-12 }, 'ν fresh water 20 °C');
    },
  },
  {
    name: 'Unit layer: 1 cSt = 1e-6 m²/s, 100 m³/h = 0.027778 m³/s, 1 bar = 100 kPa',
    source: 'SI definitions (BIPM); 1 St = 1 cm²/s',
    run: () => {
      assertClose(convert(1, 'cSt', 'm2_s', 'kinematic_viscosity'), 1e-6, { rel: 1e-12 }, 'cSt');
      assertClose(convert(100, 'm3_h', 'm3_s', 'volume_flow'), 100 / 3600, { rel: 1e-12 }, 'm³/h');
      assertClose(convert(1, 'bar', 'kPa', 'pressure'), 100, { rel: 1e-12 }, 'bar');
    },
  },
  {
    name: 'Zero flow returns zero losses; invalid inputs fail fast: zero diameter, negative length, unknown fluid',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      const still = calculate({ known: 'velocity', velocity_m_s: 0 }).outputs;
      assertEqual(still.regime, 'No flow', 'regime');
      assertClose(still.dp_total_pa, 0, { abs: 1e-12 }, 'Δp');
      assertThrows(() => calculate({ diameter_m: 0 }), 'greater than zero', 'diameter');
      assertThrows(() => calculate({ length_m: -1 }), 'must not be negative', 'length');
      assertThrows(() => calculate({ fluid: 'mercury' }), 'must be one of', 'fluid');
    },
  },
  {
    name: 'Loss head for a suction line: (Δp_f + Δp_minor)/(ρ g) leaves out the elevation; the density output echoes the fluid',
    source: 'Darcy–Weisbach h = f (L/D) V²/2g + ΣK V²/2g — Crane TP-410 (2013), ch. 2; ITTC 7.5-02-01-03 sea water 15 °C',
    run: () => {
      const { outputs } = calculate({ ...UNIT_FLUID, known: 'velocity', velocity_m_s: 2, diameter_m: 0.1, length_m: 0, k_minor: 5, elevation_m: 10 });
      assertClose(outputs.head_loss_m, (5 * 4) / (2 * 9.80665), { rel: 1e-12 }, 'loss head = ΣK V²/2g with no friction');
      assertClose(outputs.head_total_m - outputs.head_loss_m, 10, { rel: 1e-12 }, 'the difference is the 10 m rise');
      assertClose(outputs.density_out_kg_m3, 1000, { rel: 1e-12 }, 'custom density');
      assertClose(calculate({ fluid: 'seawater_15c' }).outputs.density_out_kg_m3, 1025.87, { rel: 1e-12 }, 'sea water preset');
    },
  },
  {
    name: 'Zero flow still returns every output: no loss head and the fluid density used',
    source: 'Range fuzzing (fuzz.js): the no-flow branch lacked the two outputs that feed other calculators',
    run: () => {
      const { outputs } = calculate({ flow_m3_s: 0 });
      assertEqual(outputs.head_loss_m, 0, 'loss head');
      assertEqual(outputs.density_out_kg_m3 > 0, true, 'density');
    },
  },
];
