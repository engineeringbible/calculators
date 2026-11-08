/**
 * eu-ets-fueleu/tests.js — checks against the EC FuelEU guidance worked examples, the regulation's limits and the ETS rules.
 * Run: node run-tests.js eu-ets-fueleu
 */
import { calculate, FUELEU_FACTORS, ghgLimit, wtwIntensity, etsCo2ePerG, etsPhaseIn, GWP_FUELEU } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const HFO_ONLY = { year: '2025', fuel_1: 'hfo', mass_1_t: 5000, fuel_2: 'none', mass_2_t: 0, fuel_3: 'none', mass_3_t: 0, share_intra_pct: 100, share_extra_pct: 0, f_wind: '1', consecutive_years: 1, eua_price: 70 };

export const tests = [
  {
    name: 'FuelEU limits: 91.16 reference → 89.34 (2025–2029), 85.69 (2030), 77.94 (2035), 62.90 (2040), 34.64 (2045), 18.23 (2050) gCO₂e/MJ',
    source: 'Regulation (EU) 2023/1805 Article 4(2); KR FuelEU Guidelines Rev. 2 limits table',
    run: () => {
      assertClose(ghgLimit(2025), 89.3368, { abs: 1e-4 }, '2025');
      assertClose(ghgLimit(2029), 89.3368, { abs: 1e-4 }, '2029');
      assertClose(ghgLimit(2030), 85.6904, { abs: 1e-4 }, '2030');
      assertClose(ghgLimit(2035), 77.9418, { abs: 1e-4 }, '2035');
      assertClose(ghgLimit(2040), 62.9004, { abs: 1e-4 }, '2040');
      assertClose(ghgLimit(2045), 34.6408, { abs: 1e-4 }, '2045');
      assertClose(ghgLimit(2050), 18.232, { abs: 1e-4 }, '2050');
    },
  },
  {
    name: 'Well-to-wake intensities from Annex II: MGO 90.77 (EC guidance Table 4.3), LNG Diesel slow speed 76.08 (Table 4.4), HFO 91.744, LFO 90.4; LNG Otto medium speed ≈ 89.2 with 3.1 % slip',
    source: 'EC Guidance on the FuelEU Maritime Regulation (2025-10-08) Tables 4.2–4.4; Bettersea HFO example 91.744',
    run: () => {
      assertClose(wtwIntensity(FUELEU_FACTORS.mgo), 90.77, { abs: 0.01 }, 'MGO');
      assertClose(wtwIntensity(FUELEU_FACTORS.lng_diesel_ss), 76.08, { abs: 0.01 }, 'LNG Diesel SS');
      assertClose(wtwIntensity(FUELEU_FACTORS.hfo), 91.744, { abs: 2e-3 }, 'HFO');
      assertClose(wtwIntensity(FUELEU_FACTORS.lfo), 13.2 + (3.151 + 0.00005 * 25 + 0.00018 * 298) / 0.041, { rel: 1e-12 }, 'LFO formula');
      const lngMs = 18.5 + ((1 - 0.031) * (2.75 + 0.00011 * 298) + 0.031 * 25) / 0.0491;
      assertClose(wtwIntensity(FUELEU_FACTORS.lng_otto_ms), lngMs, { rel: 1e-12 }, 'LNG Otto MS slip arithmetic');
      assertEqual(lngMs > 89 && lngMs < 89.5, true, 'LNG Otto MS ≈ 89.2');
      assertEqual(GWP_FUELEU.ch4 === 25 && GWP_FUELEU.n2o === 298, true, 'RED II GWPs');
    },
  },
  {
    name: 'HFO-only ship, 5 000 t, 2025, 100 % intra-EEA: energy 202.5 TJ, intensity 91.744 vs limit 89.337 → deficit 487.5 t CO₂e, penalty |CB|/(91.744 × 41 000) × 2 400 = 311 048 EUR',
    source: 'Regulation (EU) 2023/1805 Annex IV penalty formula; KR Guidelines §C',
    run: () => {
      const { outputs } = calculate(HFO_ONLY);
      assertClose(outputs.energy_scope_j, 5000e6 * 0.0405 * 1e6, { rel: 1e-12 }, 'energy');
      assertClose(outputs.ghg_actual, 91.744, { abs: 2e-3 }, 'intensity');
      const cb = (89.3368 - outputs.ghg_actual) * 202.5e6;
      assertClose(outputs.compliance_balance_t, cb / 1e6, { rel: 1e-9 }, 'CB');
      assertClose(outputs.fueleu_penalty_eur, (Math.abs(cb) / (outputs.ghg_actual * 41000)) * 2400, { rel: 1e-9 }, 'penalty formula');
      assertClose(outputs.fueleu_penalty_eur, 311000, { rel: 2e-3 }, 'penalty value');
      assertEqual(outputs.fueleu_status.startsWith('DEFICIT'), true, 'status');
      assertEqual(outputs.penalty_multiplier, 1, 'multiplier');
    },
  },
  {
    name: 'Consecutive deficits: third year in a row multiplies the penalty by 1.2; a compliant ship (LNG Diesel slow speed in 2025) has zero penalty and a banked surplus',
    source: 'Annex IV: penalty × (1 + (N − 1)/10); Article 20 banking',
    run: () => {
      const one = calculate(HFO_ONLY).outputs;
      const three = calculate({ ...HFO_ONLY, consecutive_years: 3 }).outputs;
      assertClose(three.fueleu_penalty_eur / one.fueleu_penalty_eur, 1.2, { rel: 1e-9 }, '×1.2');
      assertEqual(three.penalty_multiplier, 1.2, 'multiplier');
      const lng = calculate({ ...HFO_ONLY, fuel_1: 'lng_diesel_ss' }).outputs;
      assertEqual(lng.fueleu_penalty_eur, 0, 'no penalty');
      assertEqual(lng.fueleu_status.startsWith('COMPLIANT'), true, 'compliant');
      assertEqual(lng.compliance_balance_t > 0, true, 'surplus');
    },
  },
  {
    name: 'Wind reward factor 0.99 applied to an MGO ship gives 0.99 × 90.77 = 89.86 gCO₂e/MJ (EC guidance Table 4.13)',
    source: 'EC Guidance Table 4.12–4.13 (f_wind 0.99 / 0.97 / 0.95)',
    run: () => {
      const r = calculate({ ...HFO_ONLY, fuel_1: 'mgo', f_wind: '0.99' }).outputs;
      assertClose(r.ghg_actual, 0.99 * 90.77, { abs: 0.01 }, 'f_wind 0.99');
      assertClose(r.ghg_actual, 89.86, { abs: 0.01 }, 'value');
      const strong = calculate({ ...HFO_ONLY, fuel_1: 'mgo', f_wind: '0.95' }).outputs;
      assertClose(strong.ghg_actual, 0.95 * 90.77, { abs: 0.01 }, 'f_wind 0.95');
    },
  },
  {
    name: 'Scope: 30 % intra + 50 % extra gives a 55 % factor on energy, emissions and fuel; shares above 100 % are rejected; mixed fuels are energy-weighted',
    source: 'Regulation (EU) 2023/1805 Article 2 and Directive 2003/87/EC Article 3ga (100 % intra-EEA and at berth, 50 % extra-EEA)',
    run: () => {
      const r = calculate({ ...HFO_ONLY, share_intra_pct: 30, share_extra_pct: 50 }).outputs;
      assertClose(r.ets_scope_factor, 55, { rel: 1e-12 }, 'scope');
      assertClose(r.energy_scope_j, 0.55 * 202.5e12, { rel: 1e-9 }, 'energy scoped');
      assertThrows(() => calculate({ ...HFO_ONLY, share_intra_pct: 60, share_extra_pct: 50 }), 'more than 100 %', 'shares');
      const mix = calculate({ ...HFO_ONLY, fuel_2: 'mgo', mass_2_t: 5000 }).outputs;
      const eHfo = 5000e6 * 0.0405;
      const eMgo = 5000e6 * 0.0427;
      assertClose(mix.ghg_actual, (eHfo * 91.744 + eMgo * 90.766) / (eHfo + eMgo), { abs: 5e-3 }, 'energy-weighted');
    },
  },
  {
    name: 'EU ETS: 5 000 t HFO, 2025, 40 % intra + 60 % extra → scope 70 %, CO₂ 15 570 t total, 10 899 t in scope, 70 % phase-in → 7 629 EUA, 534 051 EUR at 70 EUR; 2026 → 100 % and CH₄/N₂O added',
    source: 'Directive (EU) 2023/959 Article 3gb phase-in (40/70/100 %); MRV CO₂ factor HFO 3.114 (Regulation (EU) 2015/757 Annex I)',
    run: () => {
      const r = calculate({ ...HFO_ONLY, share_intra_pct: 40, share_extra_pct: 60 }).outputs;
      assertClose(r.ets_emissions_t, 5000 * 3.114 * 0.7, { rel: 1e-9 }, 'in scope');
      assertClose(r.ets_phase_in_pct, 70, { rel: 1e-12 }, 'phase-in');
      assertClose(r.ets_allowances_t, 5000 * 3.114 * 0.7 * 0.7, { rel: 1e-9 }, 'EUA');
      assertClose(r.ets_cost_eur, 5000 * 3.114 * 0.7 * 0.7 * 70, { rel: 1e-9 }, 'cost');
      assertClose(r.ets_cost_eur, 534051, { abs: 1 }, 'cost value');
      assertEqual(etsPhaseIn(2024), 0.4, '2024');
      assertEqual(etsPhaseIn(2027), 1, '2027');
      const r26 = calculate({ ...HFO_ONLY, year: '2026', share_intra_pct: 40, share_extra_pct: 60 }).outputs;
      assertClose(r26.ets_phase_in_pct, 100, { rel: 1e-12 }, '100 % in 2026');
      assertClose(etsCo2ePerG(FUELEU_FACTORS.hfo, 2026), 3.114 + 0.00005 * 28 + 0.00018 * 265, { rel: 1e-12 }, 'CO₂e per g 2026');
      assertEqual(r26.ets_emissions_t > r.ets_emissions_t, true, 'CH₄/N₂O add emissions');
    },
  },
  {
    name: 'LNG Otto medium speed under the ETS in 2026: CO₂e per gram = 0.969 × (2.75 + 0.00011 × 265) + 0.031 × 28 = 3.561 (slip at GWP 28); before 2026 only 0.969 × 2.75 = 2.665',
    source: 'Regulation (EU) 2020/1044 GWPs (28, 265); MRV treatment of methane slip by engine class',
    run: () => {
      assertClose(etsCo2ePerG(FUELEU_FACTORS.lng_otto_ms, 2026), 0.969 * (2.75 + 0.00011 * 265) + 0.031 * 28, { rel: 1e-12 }, '2026');
      assertClose(etsCo2ePerG(FUELEU_FACTORS.lng_otto_ms, 2026), 3.561, { abs: 2e-3 }, 'value');
      assertClose(etsCo2ePerG(FUELEU_FACTORS.lng_otto_ms, 2025), 0.969 * 2.75, { rel: 1e-12 }, '2025');
    },
  },
  {
    name: 'Totals and per-tonne cost: penalty + ETS cost, divided by the in-scope fuel tonnes; invalid inputs fail fast (no fuel in scope, fractional year count, unknown fuel)',
    source: 'Arithmetic and validation contract',
    run: () => {
      const r = calculate({ ...HFO_ONLY, share_intra_pct: 40, share_extra_pct: 60 }).outputs;
      assertClose(r.total_cost_eur, r.fueleu_penalty_eur + r.ets_cost_eur, { rel: 1e-12 }, 'total');
      assertClose(r.cost_per_t_fuel_eur, r.total_cost_eur / (5000 * 0.7), { rel: 1e-12 }, 'per tonne');
      assertThrows(() => calculate({ ...HFO_ONLY, mass_1_t: 0 }), 'No fuel in scope', 'no fuel');
      assertThrows(() => calculate({ ...HFO_ONLY, consecutive_years: 1.5 }), 'whole number', 'years');
      assertThrows(() => calculate({ ...HFO_ONLY, fuel_1: 'coal' }), 'must be one of', 'fuel');
    },
  },
];
