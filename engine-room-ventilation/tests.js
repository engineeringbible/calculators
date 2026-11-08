/**
 * engine-room-ventilation/tests.js — checks against the ISO 8861:1998 constants and formulas.
 * Run: node run-tests.js engine-room-ventilation
 */
import { calculate, M_AD, AIR_DENSITY_KG_M3, AIR_SPECIFIC_HEAT_KJ_KGK, TEMPERATURE_RISE_K, BOILER_FUEL_KG_PER_KWH, BOILER_AIR_KG_PER_KG_FUEL, HEAT_RECOVERY_FACTOR } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const PLANT = { main_power_kw: 10000, main_type: 'two_stroke', main_heat_pct: 1.5, gen_power_kw: 3000, gen_type: 'four_stroke', gen_heat_pct: 3, alternator_eff: 0.95, boiler_kw: 2000, boiler_heat_pct: 1, exhaust_kw: 100, pipes_kw: 30, electrical_kw: 50, tanks_kw: 20, other_kw: 30, room_volume_m3: 15000, fans: 4 };

export const tests = [
  {
    name: 'ISO 8861 constants: m_ad 0.0023 (2-stroke) and 0.0020 kg/(kW·s) (4-stroke), ρ 1.13 kg/m³, c 1.01 kJ/(kg·K), ΔT 12.5 K, boiler 15.7 kg air/kg fuel, heat recovery factor 0.4',
    source: 'ISO 8861:1998 clauses 5.2.2–5.3 (standard text, iTeh preview)',
    run: () => {
      assertEqual(M_AD.two_stroke, 0.0023, '2-stroke');
      assertEqual(M_AD.four_stroke, 0.002, '4-stroke');
      assertEqual(AIR_DENSITY_KG_M3, 1.13, 'ρ');
      assertEqual(AIR_SPECIFIC_HEAT_KJ_KGK, 1.01, 'c');
      assertEqual(TEMPERATURE_RISE_K, 12.5, 'ΔT');
      assertEqual(BOILER_AIR_KG_PER_KG_FUEL, 15.7, 'm_af');
      assertEqual(BOILER_FUEL_KG_PER_KWH, 0.11, 'm_fs');
      assertEqual(HEAT_RECOVERY_FACTOR, 0.4, '0.4');
    },
  },
  {
    name: 'Combustion air: 10 000 kW 2-stroke → 10 000 × 0.0023/1.13 = 20.35 m³/s; 3 000 kW 4-stroke → 5.31 m³/s; 2 000 kW boiler → 2 000 × 0.11/3600 × 15.7/1.13 = 0.849 m³/s; q_c = 26.51 m³/s',
    source: 'ISO 8861 §5.2.2–5.2.4',
    run: () => {
      const { outputs } = calculate(PLANT);
      assertClose(outputs.q_main_m3_s, (10000 * 0.0023) / 1.13, { rel: 1e-12 }, 'q_dp');
      assertClose(outputs.q_main_m3_s, 20.354, { abs: 1e-3 }, 'q_dp value');
      assertClose(outputs.q_gen_m3_s, (3000 * 0.002) / 1.13, { rel: 1e-12 }, 'q_dg');
      assertClose(outputs.q_boiler_m3_s, (2000 * (0.11 / 3600) * 15.7) / 1.13, { rel: 1e-12 }, 'q_b');
      assertClose(outputs.q_boiler_m3_s, 0.849, { abs: 1e-3 }, 'q_b value');
      assertClose(outputs.q_combustion_m3_s, outputs.q_main_m3_s + outputs.q_gen_m3_s + outputs.q_boiler_m3_s, { rel: 1e-12 }, 'sum');
    },
  },
  {
    name: 'Heat emission: main 150 kW (1.5 %), generators 90 kW + alternator losses 2 850 × (1/0.95 − 1) = 150 kW, boiler 20 kW, others 230 kW → Σφ = 640 kW; gross airflow 640/(1.13 × 1.01 × 12.5) = 44.86 m³/s',
    source: 'ISO 8861 §6.1–6.2 (φ = P h_d/100), §6.5 (electrical generator losses), §5.3 denominator ρ c ΔT',
    run: () => {
      const { outputs } = calculate(PLANT);
      assertClose(outputs.heat_main_kw, 150, { rel: 1e-12 }, 'main');
      assertClose(outputs.heat_gen_kw, 90 + 2850 * (1 / 0.95 - 1), { rel: 1e-9 }, 'generators');
      assertClose(outputs.heat_total_kw, 150 + 90 + 150 + 20 + 100 + 30 + 50 + 20 + 30, { rel: 1e-9 }, 'Σφ');
      assertClose(outputs.q_heat_gross_m3_s, outputs.heat_total_kw / (1.13 * 1.01 * 12.5), { rel: 1e-12 }, 'gross');
      assertClose(outputs.q_heat_gross_m3_s, 44.86, { abs: 0.01 }, 'gross value');
    },
  },
  {
    name: 'Heat-evacuation airflow with credits: q_h = 44.86 − 0.4 × (20.35 + 5.31) − 0.85 = 33.74 m³/s; total Q = q_c + q_h = 60.25 m³/s (216 900 m³/h) > 1.5 q_c = 39.8 → combustion + heat governs; 14.5 air changes/h; 15.06 m³/s per fan; exhaust Q − q_c = 33.7',
    source: 'ISO 8861 §5.1 (larger of q_c + q_h and 1.5 q_c) and §5.3',
    run: () => {
      const { outputs } = calculate(PLANT);
      const qc = outputs.q_combustion_m3_s;
      assertClose(outputs.q_heat_m3_s, outputs.q_heat_gross_m3_s - 0.4 * (outputs.q_main_m3_s + outputs.q_gen_m3_s) - outputs.q_boiler_m3_s, { rel: 1e-12 }, 'q_h');
      assertClose(outputs.q_total_m3_s, qc + outputs.q_heat_m3_s, { rel: 1e-12 }, 'Q');
      assertClose(outputs.q_total_m3_s, 60.25, { abs: 0.05 }, 'Q value');
      assertClose(outputs.q_min_m3_s, 1.5 * qc, { rel: 1e-12 }, '1.5 q_c');
      assertEqual(outputs.governing.startsWith('Combustion + heat'), true, 'governing');
      assertClose(outputs.air_changes_h, (outputs.q_total_m3_s * 3600) / 15000, { rel: 1e-12 }, 'ACH');
      assertClose(outputs.per_fan_m3_s, outputs.q_total_m3_s / 4, { rel: 1e-12 }, 'per fan');
      assertClose(outputs.exhaust_m3_s, outputs.q_total_m3_s - qc, { rel: 1e-12 }, 'exhaust');
      assertClose(outputs.temperature_rise_k, 12.5, { rel: 1e-9 }, 'ΔT = 12.5 K when Q = q_c + q_h');
    },
  },
  {
    name: 'Minimum rule governs for a cool plant: heat losses set to zero → q_h negative, Q = 1.5 q_c = 39.77 m³/s, warning issued, and the resulting temperature rise is below 12.5 K',
    source: 'ISO 8861 §5.1 b (airflow for combustion + 50 %)',
    run: () => {
      const cool = calculate({ ...PLANT, main_heat_pct: 0, gen_heat_pct: 0, alternator_eff: 1, boiler_heat_pct: 0, exhaust_kw: 0, pipes_kw: 0, electrical_kw: 0, tanks_kw: 0, other_kw: 10 });
      assertEqual(cool.outputs.q_heat_m3_s < 0, true, 'negative q_h');
      assertClose(cool.outputs.q_total_m3_s, 1.5 * cool.outputs.q_combustion_m3_s, { rel: 1e-12 }, 'Q = 1.5 q_c');
      assertEqual(cool.outputs.governing.startsWith('Minimum rule'), true, 'governing');
      assertEqual(cool.warnings.some((w) => w.includes('negative')), true, 'warning');
      assertEqual(cool.outputs.temperature_rise_k < 12.5, true, 'cooler');
    },
  },
  {
    name: 'Engine type and boiler: switching the main engine to 4-stroke lowers q_dp by 0.0020/0.0023; removing the boiler removes q_b and its heat; stand-by generators excluded by entering only running sets',
    source: 'ISO 8861 §5.2.2 (m_ad by engine type), §5.2.4',
    run: () => {
      const two = calculate(PLANT).outputs;
      const four = calculate({ ...PLANT, main_type: 'four_stroke' }).outputs;
      assertClose(four.q_main_m3_s / two.q_main_m3_s, 0.002 / 0.0023, { rel: 1e-12 }, 'ratio');
      const noBoiler = calculate({ ...PLANT, boiler_kw: 0 }).outputs;
      assertEqual(noBoiler.q_boiler_m3_s, 0, 'no boiler air');
      assertClose(two.heat_total_kw - noBoiler.heat_total_kw, 20, { rel: 1e-9 }, 'boiler heat removed');
    },
  },
  {
    name: 'Invalid inputs fail fast: no machinery at all, fractional fan count, heat loss above 30 %',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...PLANT, main_power_kw: 0, gen_power_kw: 0, boiler_kw: 0 }), 'No machinery', 'no machinery');
      assertThrows(() => calculate({ ...PLANT, fans: 2.5 }), 'whole number', 'fans');
      assertThrows(() => calculate({ ...PLANT, main_heat_pct: 40 }), 'between', 'heat loss');
    },
  },
];
