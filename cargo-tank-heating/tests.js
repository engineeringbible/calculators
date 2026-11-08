/**
 * cargo-tank-heating/tests.js — checks of the energy balance, steam and coil arithmetic.
 * Run: node run-tests.js cargo-tank-heating
 */
import { calculate, STEAM } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const TANK = { cargo_mass_t: 5000, specific_heat_kj_kgk: 1.9, t_initial_c: 30, t_target_c: 55, mode: 'time', heating_time_h: 48, available_power_kw: 1500, deck_area_m2: 400, deck_u: 6, air_temp_c: 15, shell_area_m2: 600, shell_u: 6, sea_temp_c: 18, bulkhead_area_m2: 500, bulkhead_u: 3, adjacent_temp_c: 30, steam: 'bar7g', coil_u: 100 };

export const tests = [
  {
    name: 'Sensible heat and losses: 5 000 t × 1.9 kJ/kg·K × 25 K = 237.5 GJ; losses at the 42.5 °C mean: deck 400 × 6 × 27.5 = 66.0 kW, shell 600 × 6 × 24.5 = 88.2 kW, bulkheads 500 × 3 × 12.5 = 18.75 kW → 172.95 kW; at 55 °C 266.7 kW',
    source: 'Lumped energy balance; U A ΔT losses',
    run: () => {
      const { outputs } = calculate(TANK);
      assertClose(outputs.sensible_heat_j, 5000e3 * 1900 * 25, { rel: 1e-12 }, 'sensible');
      assertClose(outputs.sensible_heat_j / 1e9, 237.5, { rel: 1e-12 }, 'GJ');
      assertClose(outputs.loss_mean_w, 66000 + 88200 + 18750, { rel: 1e-12 }, 'mean loss');
      assertClose(outputs.loss_target_w, 400 * 6 * 40 + 600 * 6 * 37 + 500 * 3 * 25, { rel: 1e-12 }, 'target loss');
      assertClose(outputs.loss_target_w / 1000, 266.7, { abs: 0.1 }, 'target value');
    },
  },
  {
    name: 'Power and steam: 237.5 GJ / 48 h = 1 374 kW + 173 kW = 1 547 kW; 7 bar g steam (h_fg 2 047 kJ/kg) → 2 721 kg/h, 130.6 t over 48 h; maintaining 55 °C: 469 kg/h; heating rate 12.5 K/day',
    source: 'ṁ = P/h_fg; IAPWS-IF97 saturated steam at 8 bar abs',
    run: () => {
      const { outputs } = calculate(TANK);
      assertClose(outputs.heating_power_w, 237.5e9 / (48 * 3600) + 172950, { rel: 1e-12 }, 'power');
      assertClose(outputs.heating_power_w / 1000, 1547.2, { abs: 0.2 }, 'power value');
      assertClose(outputs.steam_rate_kg_h, (outputs.heating_power_w / 2047e3) * 3600, { rel: 1e-12 }, 'steam');
      assertClose(outputs.steam_rate_kg_h, 2721, { abs: 2 }, 'steam value');
      assertClose(outputs.steam_total_t, (outputs.steam_rate_kg_h * 48) / 1000, { rel: 1e-12 }, 'total');
      assertClose(outputs.steam_maintain_kg_h, (266700 / 2047e3) * 3600, { rel: 1e-6 }, 'maintain');
      assertClose(outputs.heat_rate_k_per_day, 12.5, { rel: 1e-12 }, 'K/day');
      assertEqual(STEAM.bar7g.hfgKjKg === 2047 && STEAM.bar7g.tSatC === 170.4, true, 'steam table');
    },
  },
  {
    name: 'Coil area: 1 547 kW / (100 W/m²K × (170.4 − 42.5) K) = 121.0 m² for the heat-up, 23.1 m² to maintain; the heat lost during heat-up is 11.2 % of the total 267.4 GJ',
    source: 'A = P/(U ΔT_mean); energy accounting',
    run: () => {
      const { outputs } = calculate(TANK);
      assertClose(outputs.coil_area_m2, outputs.heating_power_w / (100 * (170.4 - 42.5)), { rel: 1e-12 }, 'coil');
      assertClose(outputs.coil_area_m2, 121.0, { abs: 0.1 }, 'coil value');
      assertClose(outputs.coil_area_maintain_m2, 266700 / (100 * (170.4 - 55)), { rel: 1e-6 }, 'maintain coil');
      assertClose(outputs.energy_total_j, outputs.heating_power_w * 48 * 3600, { rel: 1e-12 }, 'total energy');
      assertClose(outputs.loss_share_pct, ((outputs.energy_total_j - 237.5e9) / outputs.energy_total_j) * 100, { rel: 1e-12 }, 'loss share');
      assertClose(outputs.loss_share_pct, 11.18, { abs: 0.02 }, 'share value');
    },
  },
  {
    name: 'Power mode: with 1 547.2 kW available the time comes back as 48 h; with 1 000 kW it takes 79.8 h; power below the losses is rejected',
    source: 't = E/(P − Q_loss)',
    run: () => {
      const back = calculate({ ...TANK, mode: 'power', available_power_kw: calculate(TANK).outputs.heating_power_w / 1000 }).outputs;
      assertClose(back.heating_time_h_out, 48, { rel: 1e-9 }, 'time back');
      const slow = calculate({ ...TANK, mode: 'power', available_power_kw: 1000 }).outputs;
      assertClose(slow.heating_time_h_out, 237.5e9 / ((1e6 - 172950) * 3600), { rel: 1e-12 }, '1 MW');
      assertClose(slow.heating_time_h_out, 79.8, { abs: 0.1 }, 'value');
      assertThrows(() => calculate({ ...TANK, mode: 'power', available_power_kw: 150 }), 'does not exceed the heat loss', 'too little power');
    },
  },
  {
    name: 'Steam pressure and warnings: 16 bar g steam (h_fg 1 919) needs 6.7 % more mass flow per kW than 7 bar g but a smaller coil; a 90 °C target is flagged for the cargo limit and the steam margin; target below initial is rejected',
    source: 'IAPWS-IF97 latent heat trend; behaviour specification',
    run: () => {
      const hi = calculate({ ...TANK, steam: 'bar16g' }).outputs;
      const lo = calculate(TANK).outputs;
      assertClose(hi.steam_rate_kg_h / lo.steam_rate_kg_h, 2047 / 1919, { rel: 1e-9 }, 'mass flow ratio');
      assertEqual(hi.coil_area_m2 < lo.coil_area_m2, true, 'smaller coil');
      const hot = calculate({ ...TANK, t_target_c: 90, steam: 'bar5g' });
      assertEqual(hot.warnings.some((w) => w.includes('65 °C')), true, 'cargo limit');
      assertEqual(hot.warnings.some((w) => w.includes('less than 30 K above')) === false, true, '158.8 − 90 = 69 K: no steam warning');
      assertEqual(calculate({ ...TANK, t_target_c: 140, steam: 'bar5g' }).warnings.some((w) => w.includes('less than 30 K above')), true, 'steam margin warning');
      assertThrows(() => calculate({ ...TANK, t_target_c: 25 }), 'above the initial', 'target');
    },
  },
];
