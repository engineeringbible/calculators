/**
 * rotor-sail/tests.js — Tillig & Ringsberg coefficients, apparent wind, force resolution, best spin and the wind table.
 * Run: node run-tests.js rotor-sail
 */
import { calculate, liftCoefficient, dragCoefficient, powerCoefficient, apparentWind } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const KN = 1852 / 3600;
const UNIFORM = { profile_exponent: 0, wind_table: '' };

export const tests = [
  {
    name: 'Coefficients: c_L(3) = 9.52 against the full-scale value of about 9.5, c_D(0) = 0.6375 with its minimum of 0.184 at SR 0.61, c_P(0) = 0 and c_P(3) = 0.297',
    source: 'Tillig & Ringsberg (2020), eqs (7)–(9) and Section 3.4',
    run: () => {
      assertClose(liftCoefficient(3), 9.5172, { abs: 5e-5 }, 'c_L(3)');
      assertClose(dragCoefficient(0), 0.6375, { abs: 1e-12 }, 'c_D(0)');
      assertEqual(dragCoefficient(0.6) < dragCoefficient(0.5) && dragCoefficient(0.6) < dragCoefficient(0.7), true, 'drag minimum between SR 0.5 and 0.7');
      assertClose(dragCoefficient(0.6052), 0.1839, { abs: 5e-5 }, 'minimum drag');
      assertEqual(powerCoefficient(0), 0, 'c_P(0)');
      assertClose(powerCoefficient(3), 0.297, { abs: 5e-5 }, 'c_P(3)');
    },
  },
  {
    name: 'Apparent wind: 20 kn true wind on the beam at 12 kn gives 23.32 kn from 59.04° off the bow',
    source: 'Vector sum of the true wind and the wind of the ship\'s own motion',
    run: () => {
      const { aws, awa } = apparentWind(20 * KN, Math.PI / 2, 12 * KN);
      assertClose(aws / KN, Math.hypot(12, 20), { rel: 1e-12 }, 'speed');
      assertClose((awa * 180) / Math.PI, (Math.atan2(20, 12) * 180) / Math.PI, { rel: 1e-12 }, 'angle');
      assertClose((awa * 180) / Math.PI, 59.04, { abs: 0.005 }, 'value');
    },
  },
  {
    name: 'Apparent wind on the beam with the ship stopped: the thrust is the lift and the side force the drag, at ½ ρ D H AWS² × c_L and c_D',
    source: 'Tillig & Ringsberg (2020), eqs (2)–(4) with AWA = 90°',
    run: () => {
      const { outputs } = calculate({ ...UNIFORM, ship_speed_kn: 0, tws_kn: 20, twa_deg: 90, spin_mode: 'fixed', rotor_rpm: 120 });
      const aws = 20 * KN;
      const sr = (120 * (2 * Math.PI) / 60 * 2.5) / aws;
      const q = 0.5 * 1.225 * 5 * 30 * aws ** 2;
      assertClose(outputs.thrust_kn, (liftCoefficient(sr) * q) / 1000, { rel: 1e-9 }, 'thrust');
      assertClose(outputs.side_force_kn, (dragCoefficient(sr) * q) / 1000, { rel: 1e-9 }, 'side force');
      assertClose(outputs.rotor_power_kw, (powerCoefficient(sr) * q * aws) / 1000, { rel: 1e-9 }, 'spin power');
    },
  },
  {
    name: 'The best spin maximises the net power: at 6 kn in 30 kn of beam wind (best SR 3.22) rotor speeds 1 % and 5 % off, and a fixed 150 rpm, give less',
    source: 'Tillig & Ringsberg (2020), eq. (10): initial rpm at the maximum net power of the rotor',
    run: () => {
      const windy = { wind_table: '', ship_speed_kn: 6, tws_kn: 30 };
      const best = calculate({ ...windy, max_rpm: 1000 }).outputs;
      assertClose(best.spin_ratio, 3.22, { abs: 0.01 }, 'best spin ratio');
      [0.95, 0.99, 1.01, 1.05].forEach((f) => {
        const other = calculate({ ...windy, spin_mode: 'fixed', rotor_rpm: best.rpm * f }).outputs;
        assertEqual(other.net_power_kw < best.net_power_kw, true, `${f} × rpm`);
      });
      assertEqual(calculate({ ...windy, spin_mode: 'fixed', rotor_rpm: 150 }).outputs.net_power_kw < best.net_power_kw, true, '150 rpm');
    },
  },
  {
    name: 'Head wind: the rotor gives negative thrust, the best spin sits near the drag minimum (SR about 0.6) and the loss is flagged',
    source: 'Tillig & Ringsberg (2020): minimum drag at a low spin ratio, about 0.5 after Li et al. (2012)',
    run: () => {
      const { outputs, warnings } = calculate({ wind_table: '', twa_deg: 0 });
      assertEqual(outputs.thrust_kn < 0, true, 'negative thrust');
      assertEqual(outputs.spin_ratio > 0.4 && outputs.spin_ratio < 0.7, true, `spin ratio ${outputs.spin_ratio}`);
      assertEqual(warnings.some((w) => w.includes('costs power')), true, 'warning');
    },
  },
  {
    name: 'Two rotors without interaction give twice the thrust, side force and spin power of one',
    source: 'Linear sum of identical rotors (interaction not modelled)',
    run: () => {
      const one = calculate({ wind_table: '' }).outputs;
      const two = calculate({ wind_table: '', number_of_rotors: 2 }).outputs;
      assertClose(two.thrust_kn, 2 * one.thrust_kn, { rel: 1e-12 }, 'thrust');
      assertClose(two.side_force_kn, 2 * one.side_force_kn, { rel: 1e-12 }, 'side force');
      assertClose(two.rotor_power_kw, 2 * one.rotor_power_kw, { rel: 1e-12 }, 'spin power');
    },
  },
  {
    name: 'Wind table: a single line at the conditions entered reproduces them, and the mean is the share-weighted mean of the rows',
    source: 'Time-weighted average over the wind distribution',
    run: () => {
      const single = calculate({ wind_table: '20; 90; 100' }).outputs;
      assertClose(single.mean_net_power_kw, single.net_power_kw, { rel: 1e-12 }, 'single line');
      const { outputs } = calculate({});
      const rows = outputs.wind_results.rows;
      const mean = rows.reduce((sum, r) => sum + r[2] * r[7], 0) / rows.reduce((sum, r) => sum + r[2], 0);
      assertClose(outputs.mean_net_power_kw, mean, { rel: 1e-12 }, 'weighted mean');
    },
  },
  {
    name: 'Invalid inputs are rejected: a wind angle above 180°, a wind table line with two numbers, a fractional number of rotors',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ twa_deg: 200 }), 'must be between');
      assertThrows(() => calculate({ wind_table: '20; 90' }), 'three numbers');
      assertThrows(() => calculate({ number_of_rotors: 1.5 }), 'whole number');
    },
  },
];
