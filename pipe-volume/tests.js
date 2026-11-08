/**
 * pipe-volume/tests.js — checks against the volume of a cylinder, reference densities and fill time.
 * Run: node run-tests.js pipe-volume
 */
import { calculate, boreArea } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '150 mm bore, 120 m: 2.1206 m³, 17.67 L/m, 2 117 kg of fresh water; 4.24 min to fill at 30 m³/h',
    source: 'V = π D² L / 4 (Machinery\'s Handbook, areas and volumes); ρ water 20 °C = 998.2 kg/m³ (ITTC 7.5-02-01-03)',
    run: () => {
      const { outputs } = calculate({ diameter_m: 0.15, length_m: 120, fluid: 'water_20c', flow_m3_s: 30 / 3600 });
      assertClose(outputs.volume_m3, Math.PI * 0.15 ** 2 * 120 / 4, { rel: 1e-12 }, 'V');
      assertClose(outputs.per_metre_l, 17.6715, { abs: 1e-4 }, 'L/m');
      assertClose(outputs.mass_kg, 998.2 * outputs.volume_m3, { rel: 1e-12 }, 'mass');
      assertClose(outputs.fill_time_s / 60, 4.2412, { abs: 1e-4 }, 'fill time');
    },
  },
  {
    name: 'One metre of 1 inch (25.4 mm) bore holds 0.5067 L; doubling the bore quadruples the volume',
    source: 'Area π D² / 4 scales with D²',
    run: () => {
      assertClose(boreArea(0.0254) * 1000, 0.50671, { abs: 1e-5 }, '1 inch');
      assertClose(boreArea(0.2) / boreArea(0.1), 4, { rel: 1e-12 }, 'D² scaling');
    },
  },
  {
    name: 'Sea water in the same pipe weighs 2.776 % more than fresh water; a custom density of 1260 kg/m³ is used as given',
    source: 'ρ sea water 15 °C = 1025.87 kg/m³ (ITTC 7.5-02-01-03)',
    run: () => {
      const fresh = calculate({ diameter_m: 0.1, length_m: 50, fluid: 'water_20c', flow_m3_s: 0 }).outputs.mass_kg;
      const sea = calculate({ diameter_m: 0.1, length_m: 50, fluid: 'seawater_15c', flow_m3_s: 0 }).outputs.mass_kg;
      assertClose(sea / fresh, 1025.87 / 998.2, { rel: 1e-12 }, 'ratio');
      const custom = calculate({ diameter_m: 0.1, length_m: 50, fluid: 'custom', rho_kg_m3: 1260, flow_m3_s: 0 }).outputs;
      assertClose(custom.mass_kg, 1260 * custom.volume_m3, { rel: 1e-12 }, 'custom');
    },
  },
  {
    name: 'No flow rate means no fill time; heavy fuel oil adds a warning',
    source: 'Behaviour specification',
    run: () => {
      assertEqual(calculate({ flow_m3_s: 0 }).outputs.fill_time_s, null, 'no fill time');
      assertEqual(calculate({ fluid: 'hfo_50c' }).warnings.length, 1, 'HFO warning');
    },
  },
  {
    name: 'Zero bore, negative length and an unknown fluid are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ diameter_m: 0 }), 'Inside diameter must be greater than zero');
      assertThrows(() => calculate({ length_m: -1 }), 'Pipe length');
      assertThrows(() => calculate({ fluid: 'mercury' }), 'Fluid must be one of');
    },
  },
];
