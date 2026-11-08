/**
 * cii-rating/tests.js — checks against the IMO resolution texts (MEPC.352/353/354(78), MEPC.338(76), MEPC.400(83)).
 * Run: node run-tests.js cii-rating
 */
import { calculate, referenceCii, requiredCii, ratingBoundaries, rateCii, attainedCii, SHIP_TYPES, REDUCTION_FACTOR_PCT } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'IMO worked example: required 10 for a bulk carrier → boundaries 8.6 / 9.4 / 10.6 / 11.8; attained 9 rates B',
    source: 'MEPC.354(78), 2022 CII rating guidelines (G4), text following Table 1',
    run: () => {
      const boundaries = ratingBoundaries(10, SHIP_TYPES.bulk_carrier.ddVector(80000));
      assertClose(boundaries[0], 8.6, { rel: 1e-12 }, 'A/B');
      assertClose(boundaries[1], 9.4, { rel: 1e-12 }, 'B/C');
      assertClose(boundaries[2], 10.6, { rel: 1e-12 }, 'C/D');
      assertClose(boundaries[3], 11.8, { rel: 1e-12 }, 'D/E');
      assertEqual(rateCii(9, boundaries), 'B', 'rating');
      assertEqual(rateCii(8.0, boundaries), 'A', 'A');
      assertEqual(rateCii(10.0, boundaries), 'C', 'C');
      assertEqual(rateCii(11.0, boundaries), 'D', 'D');
      assertEqual(rateCii(12.0, boundaries), 'E', 'E');
    },
  },
  {
    name: 'Reference line, bulk carrier 80 000 DWT: 4745 × 80 000^−0.622 = 4.2317 g/(DWT·nmi); DWT above 279 000 is capped',
    source: 'MEPC.353(78), 2022 CII reference lines guidelines (G2), eq. (1) and Table 1; value computed by hand',
    run: () => {
      assertClose(referenceCii('bulk_carrier', 80000), 4.2317, { abs: 2e-3 }, 'CIIref 80k');
      assertClose(referenceCii('bulk_carrier', 300000), referenceCii('bulk_carrier', 279000), { rel: 1e-12 }, 'cap at 279 000');
      assertClose(referenceCii('tanker', 100000), 4.6764, { abs: 2e-3 }, 'tanker 100k: 5247 × 100 000^−0.610');
    },
  },
  {
    name: 'Reduction factors Z: 5/7/9/11 % for 2023–2026 and 13.625/16.25/18.875/21.5 % for 2027–2030',
    source: 'MEPC.338(76) (G3, 2021) and MEPC.400(83) adopted 11 April 2025 (2027–2030, +2.625 %/year)',
    run: () => {
      assertEqual(REDUCTION_FACTOR_PCT[2023], 5, '2023');
      assertEqual(REDUCTION_FACTOR_PCT[2026], 11, '2026');
      assertEqual(REDUCTION_FACTOR_PCT[2027], 13.625, '2027');
      assertEqual(REDUCTION_FACTOR_PCT[2030], 21.5, '2030');
      assertClose(requiredCii('bulk_carrier', 80000, 2026), 4.2317 * 0.89, { abs: 2e-3 }, 'required 2026');
      const years = Object.keys(REDUCTION_FACTOR_PCT).map(Number);
      for (let k = 1; k < years.length; k += 1) {
        assertEqual(REDUCTION_FACTOR_PCT[years[k]] > REDUCTION_FACTOR_PCT[years[k - 1]], true, `Z increases ${years[k - 1]}→${years[k]}`);
      }
    },
  },
  {
    name: 'Attained CII: 5 000 t HFO (15 570 t CO₂) over 60 000 nmi on 80 000 DWT = 3.2438 g/(DWT·nmi) → B in 2026; 4 800 t → A',
    source: 'MEPC.352(78) (G1) eq. for attained CII; CF 3.114 from MEPC.364(79); boundaries from MEPC.354(78)',
    run: () => {
      assertClose(attainedCii(15570, 80000, 60000), 3.24375, { rel: 1e-9 }, 'attained');
      const b = calculate({ ship_type: 'bulk_carrier', dwt: 80000, year: 2026, distance_nmi: 60000, fuel_hfo_t: 5000, fuel_vlsfo_t: 0, fuel_mgo_t: 0 });
      assertClose(b.outputs.co2_total_t, 15570, { rel: 1e-12 }, 'CO₂');
      assertClose(b.outputs.attained_cii, 3.24375, { rel: 1e-9 }, 'attained_cii');
      assertClose(b.outputs.required_cii, 3.7662, { abs: 2e-3 }, 'required_cii');
      assertEqual(b.outputs.rating, 'B', 'rating 5 000 t');
      const a = calculate({ ship_type: 'bulk_carrier', dwt: 80000, year: 2026, distance_nmi: 60000, fuel_hfo_t: 4800, fuel_vlsfo_t: 0, fuel_mgo_t: 0 });
      assertEqual(a.outputs.rating, 'A', 'rating 4 800 t');
    },
  },
  {
    name: 'GT-based type: cruise ship 100 000 GT reference 930 × 100 000^−0.383 = 11.31 g/(GT·nmi)',
    source: 'MEPC.353(78) Table 1 (cruise passenger ship row); value computed by hand',
    run: () => {
      assertClose(referenceCii('cruise_passenger', 100000), 11.31, { abs: 0.02 }, 'CIIref cruise');
      const r = calculate({ ship_type: 'cruise_passenger', gt: 100000, year: 2025, emissions_basis: 'co2', co2_t: 60000, distance_nmi: 60000 });
      assertClose(r.outputs.capacity_used, 100000, { rel: 1e-12 }, 'capacity is GT');
      assertClose(r.outputs.attained_cii, 10.0, { rel: 1e-12 }, 'attained 60 000 t over 100 000 GT × 60 000 nmi');
      assertClose(r.outputs.required_cii, 11.31 * 0.91, { abs: 0.02 }, 'required 2025');
      assertClose(r.outputs.boundary_bc, 0.95 * 11.3106 * 0.91, { abs: 0.02 }, 'B/C boundary 9.78');
      assertEqual(r.outputs.rating, 'C', 'rating: 10.0 is above the B/C boundary 9.78');
      const better = calculate({ ship_type: 'cruise_passenger', gt: 100000, year: 2025, emissions_basis: 'co2', co2_t: 55000, distance_nmi: 60000 });
      assertEqual(better.outputs.rating, 'B', 'rating with 55 000 t: 9.17 lies between 8.95 and 9.78');
    },
  },
  {
    name: 'LNG carrier below 65 000 DWT uses capacity 65 000 and 14779E10 in the reference line (≈ 20.17); attained still uses the real DWT',
    source: 'MEPC.353(78) Table 1, LNG carrier rows; MEPC.354(78) dd vector for LNG carriers below 100 000 DWT',
    run: () => {
      assertClose(referenceCii('lng_carrier', 50000), 20.17, { abs: 0.05 }, 'CIIref');
      assertClose(referenceCii('lng_carrier', 120000), 9.827, { rel: 1e-12 }, 'flat line above 100 000 DWT');
      const r = calculate({ ship_type: 'lng_carrier', dwt: 50000, year: 2024, emissions_basis: 'co2', co2_t: 40000, distance_nmi: 50000 });
      assertClose(r.outputs.attained_cii, 16.0, { rel: 1e-12 }, 'attained uses 50 000 DWT');
      assertClose(r.outputs.boundary_ab / r.outputs.required_cii, 0.78, { rel: 1e-9 }, 'dd vector <100k');
    },
  },
  {
    name: 'Gas-carrier dd vectors switch at 65 000 DWT (0.81… above, 0.85… below); every dd vector is increasing',
    source: 'MEPC.354(78) Table 1',
    run: () => {
      assertEqual(SHIP_TYPES.gas_carrier.ddVector(70000)[0], 0.81, 'gas ≥65k');
      assertEqual(SHIP_TYPES.gas_carrier.ddVector(60000)[0], 0.85, 'gas <65k');
      assertEqual(SHIP_TYPES.combination_carrier.referenceLine(50000).a, 5119, 'combination carrier a');
      for (const [id, type] of Object.entries(SHIP_TYPES)) {
        const dd = type.ddVector(80000);
        for (let k = 1; k < 4; k += 1) assertEqual(dd[k] > dd[k - 1], true, `${id} dd increasing`);
        assertEqual(dd[1] < 1 && dd[2] > 1, true, `${id} straddles 1.0`);
      }
    },
  },
  {
    name: 'CO₂ limit for C: 1.06 × 3.7662 × 80 000 × 60 000 / 10⁶ = 19 162 t; margin = limit − actual',
    source: 'Rearranged attained-CII formula (MEPC.352(78)) with the C/D boundary (MEPC.354(78))',
    run: () => {
      const r = calculate({ ship_type: 'bulk_carrier', dwt: 80000, year: 2026, distance_nmi: 60000, emissions_basis: 'co2', co2_t: 15570 });
      assertClose(r.outputs.co2_limit_c_t, 19162, { abs: 12 }, 'limit');
      assertClose(r.outputs.co2_margin_t, 19162 - 15570, { abs: 12 }, 'margin');
      assertClose(r.outputs.margin_to_d_pct, (1 - 15570 / 19162) * 100, { abs: 0.1 }, 'margin %');
    },
  },
  {
    name: 'Invalid inputs fail fast: year 2031, zero gross tonnage, unknown ship type, negative fuel',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ year: 2031 }), 'must be one of', 'year');
      assertThrows(() => calculate({ ship_type: 'roro_cargo', gt: 0 }), 'greater than zero', 'gt');
      assertThrows(() => calculate({ ship_type: 'submarine' }), 'must be one of', 'type');
      assertThrows(() => calculate({ fuel_mgo_t: -5 }), 'must not be negative', 'fuel');
    },
  },
];
