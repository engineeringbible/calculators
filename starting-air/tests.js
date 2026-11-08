/**
 * starting-air/tests.js — IACS UR M61 starts, receiver volume, charging pressure and compressor capacity.
 * Run: node run-tests.js starting-air
 */
import { calculate, usableAirPerVolume } from './calc.js';
import { calculate as co2 } from '../co2-fire-system/calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const ATM = 1.01325;

export const tests = [
  {
    name: 'Starts: 12 per reversible main engine, 6 per non-reversible engine with a CPP, so two CPP engines also need 12',
    source: 'IACS UR M61.1.5 (Rev.3, 2024)',
    run: () => {
      assertEqual(calculate({}).outputs.starts_required, 12, 'reversible');
      assertEqual(calculate({ engine_type: 'non_reversible' }).outputs.starts_required, 6, 'non-reversible');
      assertEqual(calculate({ engine_type: 'non_reversible', number_of_engines: 2 }).outputs.starts_required, 12, 'two engines');
    },
  },
  {
    name: 'Isothermal sizing: 12 starts of 3 m³ between 30 and 12 bar gauge need 36 × 1.01325/18 = 2.0265 m³ of receivers, two of 1.013 m³',
    source: 'Free air between two pressures, V (p1 − p2)/p_atm; two receivers of about equal capacity (UR M61.1.4)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.receiver_volume_m3, (36 * ATM) / 18, { rel: 1e-12 }, 'volume');
      assertClose(outputs.each_receiver_m3, (36 * ATM) / 36, { rel: 1e-12 }, 'each');
    },
  },
  {
    name: 'Adiabatic expansion (n = 1.4) yields 79.6 % of the isothermal air between 31.0 and 13.0 bar absolute, so 25.6 % more volume',
    source: 'Polytropic expansion of the receiver contents, m2/m1 = (p2/p1)^(1/n)',
    run: () => {
      const p1 = 30 + ATM;
      const p2 = 12 + ATM;
      const ratio = usableAirPerVolume(p1, p2, 1.4) / usableAirPerVolume(p1, p2, 1);
      assertClose(ratio, (p1 * (1 - (p2 / p1) ** (1 / 1.4))) / (p1 - p2), { rel: 1e-12 }, 'ratio');
      assertClose(ratio, 0.7964, { abs: 0.00005 }, 'value');
      assertClose(calculate({ polytropic_n: 1.4 }).outputs.receiver_volume_m3 / calculate({}).outputs.receiver_volume_m3, 1 / ratio, { rel: 1e-12 }, 'volume');
    },
  },
  {
    name: 'The installed 2.5 m³ hold the 12 starts at 12 + 36 × 1.01325/2.5 = 26.59 bar; charging them from atmospheric pressure in one hour needs 65.6 m³/h, 74.0 m³/h to 30 bar',
    source: 'IACS UR M61.1.3: total compressor capacity to supply the air for M61.1.5 within one hour from atmospheric pressure',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.charge_pressure_bar, 12 + (36 * ATM) / 2.5, { rel: 1e-9 }, 'pressure');
      assertClose(outputs.compressor_m3_h, (2.5 * (12 + (36 * ATM) / 2.5)) / ATM, { rel: 1e-9 }, 'to that pressure');
      assertClose(outputs.compressor_full_m3_h, (2.5 * 30) / ATM, { rel: 1e-12 }, 'to 30 bar');
      assertClose(outputs.each_compressor_m3_h, outputs.compressor_m3_h / 2, { rel: 1e-12 }, 'equally divided');
    },
  },
  {
    name: 'Receivers that are too small are flagged: 1.5 m³ give 8.9 of the 12 starts',
    source: 'IACS UR M61.1.5',
    run: () => {
      const { outputs, warnings } = calculate({ installed_volume_m3: 1.5 });
      assertClose(outputs.starts_available, (1.5 * 18) / ATM / 3, { rel: 1e-12 }, 'starts');
      assertEqual(warnings.some((w) => w.includes('give only')), true, 'warning');
    },
  },
  {
    name: 'The free air of the receivers at 30 bar, 2.5 × 31.01/1.013 = 76.5 m³, is what the CO₂ calculator adds to the engine room volume',
    source: 'FSS Code ch. 5, 2.1.1.2 (receivers converted to free air volume)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.free_air_content_m3, (2.5 * (30 + ATM)) / ATM, { rel: 1e-12 }, 'free air');
      const withAir = co2({ receiver_volume_m3: 2.5, receiver_pressure_bar: 30 }).outputs.criteria_table.rows[1][1];
      assertClose(withAir - 6000, outputs.free_air_content_m3, { rel: 1e-12 }, 'same in the CO₂ calculator');
    },
  },
  {
    name: 'Invalid inputs are rejected: a minimum pressure at the maximum, a fractional number of engines, zero air per start',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ p_min_bar: 30 }), 'below the maximum');
      assertThrows(() => calculate({ number_of_engines: 1.5 }), 'whole number');
      assertThrows(() => calculate({ air_per_start_m3: 0 }), 'greater than zero');
    },
  },
];
