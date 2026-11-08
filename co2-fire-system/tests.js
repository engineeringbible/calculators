/**
 * co2-fire-system/tests.js — FSS Code chapter 5 quantities, receivers, cylinders and discharge rates.
 * Run: node run-tests.js co2-fire-system
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Engine room of 6000 m³ (5000 m³ without the upper casing) and 2.5 m³ of receivers at 30 bar: max(0.40 × 5076.5, 0.35 × 6076.5) = 2126.8 m³, 3797.8 kg, 85 cylinders of 45 kg',
    source: 'FSS Code ch. 5, 2.1.1.2, 2.2.1.2 and 2.2.1.4 (MSC.206(81)): 40 %/35 % criteria, receiver air, 0.56 m³/kg',
    run: () => {
      const { outputs } = calculate({});
      const air = (2.5 * (30 + 1.01325)) / 1.01325;
      assertClose(outputs.free_gas_m3, 0.35 * (6000 + air), { rel: 1e-12 }, 'free gas');
      assertClose(outputs.co2_mass_kg, (0.35 * (6000 + air)) / 0.56, { rel: 1e-12 }, 'mass');
      assertEqual(outputs.cylinders, 85, 'cylinders');
      assertClose(outputs.installed_mass_kg, 3825, { rel: 1e-12 }, 'installed');
    },
  },
  {
    name: 'With the receiver safety valves led to the open air the engine room needs 0.35 × 6000 = 2100 m³, i.e. 3750 kg of CO₂',
    source: 'FSS Code ch. 5, 2.1.1.2: alternatively a discharge pipe from the safety valves led to the open air',
    run: () => {
      const { outputs } = calculate({ receivers: 'vented' });
      assertClose(outputs.co2_mass_kg, 3750, { rel: 1e-12 }, 'mass');
    },
  },
  {
    name: 'A small upper casing makes the 40 % criterion govern: 0.40 × 5800 = 2320 m³ against 0.35 × 6000 = 2100 m³',
    source: 'FSS Code ch. 5, 2.2.1.2.1 and 2.2.1.2.2: the larger of the two volumes',
    run: () => {
      const { outputs } = calculate({ receivers: 'vented', volume_excl_casing_m3: 5800 });
      assertClose(outputs.free_gas_m3, 2320, { rel: 1e-12 }, 'free gas');
      assertEqual(outputs.criteria_table.rows[0][0].includes('governs'), true, 'first criterion governs');
    },
  },
  {
    name: 'Cargo ship under 2000 GT with machinery spaces not entirely separate: 35 % and 30 % instead of 40 % and 35 %',
    source: 'FSS Code ch. 5, 2.2.1.3 (renumbered 2.2.1.4 by MSC.339(91))',
    run: () => {
      const { outputs } = calculate({ receivers: 'vented', small_ship: 'yes' });
      assertClose(outputs.free_gas_m3, Math.max(0.35 * 5000, 0.3 * 6000), { rel: 1e-12 }, 'free gas');
    },
  },
  {
    name: 'Cargo holds 30 %, vehicle spaces 45 %; two thirds within 10 min (cargo, vehicle) or 20 min (solid bulk), 85 % within 2 min for machinery',
    source: 'FSS Code ch. 5, 2.2.1.1, 2.2.1.2 and 2.2.1.7 (MSC.339(91)); 2.2.1.5 (MSC.206(81))',
    run: () => {
      const cargo = calculate({ space_type: 'cargo', gross_volume_m3: 12000 }).outputs;
      assertClose(cargo.free_gas_m3, 3600, { rel: 1e-12 }, 'cargo');
      assertClose(cargo.discharge_rate_kg_s, ((2 / 3) * (3600 / 0.56)) / 600, { rel: 1e-12 }, 'cargo rate');
      const bulk = calculate({ space_type: 'bulk', gross_volume_m3: 12000 }).outputs;
      assertClose(bulk.discharge_rate_kg_s, cargo.discharge_rate_kg_s / 2, { rel: 1e-12 }, 'bulk rate');
      assertClose(calculate({ space_type: 'vehicle', gross_volume_m3: 20000 }).outputs.free_gas_m3, 9000, { rel: 1e-12 }, 'vehicle');
      const machinery = calculate({}).outputs;
      assertClose(machinery.discharge_rate_kg_s, (0.85 * machinery.co2_mass_kg) / 120, { rel: 1e-12 }, 'machinery rate');
    },
  },
  {
    name: 'A 45 kg charge needs at least 67.5 L of cylinder water capacity at 2/3 kg/L; free efflux of 35 % free gas leaves 1 − e^(−0.35) = 29.5 % CO₂',
    source: 'MCA MSIS 12 ch. 7, 7.3.1.1 (filling ratio); NFPA 12 free-efflux relation',
    run: () => {
      const { outputs } = calculate({ receivers: 'vented' });
      assertClose(outputs.cylinder_capacity_l, 67.5, { rel: 1e-12 }, 'cylinder');
      assertClose(outputs.concentration_pct, (1 - Math.exp(-0.35)) * 100, { rel: 1e-12 }, 'concentration');
    },
  },
  {
    name: 'Invalid inputs are rejected: a volume without the casing larger than the gross volume, an unknown space, zero cylinder charge',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ volume_excl_casing_m3: 7000 }), 'cannot exceed the gross volume');
      assertThrows(() => calculate({ space_type: 'galley' }), 'must be one of');
      assertThrows(() => calculate({ cylinder_mass_kg: 0 }), 'greater than zero');
    },
  },
];
