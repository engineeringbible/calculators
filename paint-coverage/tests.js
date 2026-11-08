/**
 * paint-coverage/tests.js — checks of the spreading-rate arithmetic against industry worked examples.
 * Run: node run-tests.js paint-coverage
 */
import { calculate, theoreticalSpreadingRate, LOSS_PRESETS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const HULL = { area_m2: 10000, coats: 2, dft_um: 150e-6, volume_solids_pct: 60, thinner_pct: 0, loss_preset: 'custom', loss_pct: 30, profile_um: 0, density_kg_l: 1.4, price_per_l: 8, pack_l: 20 };

export const tests = [
  {
    name: 'Theoretical spreading rate: 55 % solids at 75 µm → 7.33 m²/L; 60 % at 150 µm → 4.0 m²/L; 100 % solids at 100 µm → 10 m²/L',
    source: 'TSR = VS × 10 / DFT (International Paint, Jotun, Hempel datasheet convention); worked example 55 × 10 / 75 = 7.33',
    run: () => {
      assertClose(theoreticalSpreadingRate(55, 75), 7.333, { abs: 1e-3 }, '55/75');
      assertClose(theoreticalSpreadingRate(60, 150), 4, { rel: 1e-12 }, '60/150');
      assertClose(theoreticalSpreadingRate(100, 100), 10, { rel: 1e-12 }, '100/100');
      assertClose(calculate(HULL).outputs.tsr_m2_l, 4, { rel: 1e-12 }, 'in calculate');
    },
  },
  {
    name: 'Practical rate: 4.0 m²/L with 39 % loss → 2.44 m²/L (coverage brochure efficiency 0.61); 30 % loss → 2.8 m²/L',
    source: 'Coatings coverage brochure worked case 4.0 × 0.61 = 2.44 m²/L; loss factor convention (1 − loss)',
    run: () => {
      assertClose(calculate({ ...HULL, loss_pct: 39 }).outputs.psr_m2_l, 2.44, { rel: 1e-9 }, '39 %');
      assertClose(calculate(HULL).outputs.psr_m2_l, 2.8, { rel: 1e-12 }, '30 %');
      assertEqual(LOSS_PRESETS.airless_flat.loss === 25 && LOSS_PRESETS.airless_complex.loss === 40, true, 'presets');
      assertClose(calculate({ ...HULL, loss_preset: 'airless_complex' }).outputs.loss_used_pct, 40, { rel: 1e-12 }, 'preset used');
    },
  },
  {
    name: 'Hull job: 10 000 m² × 2 coats of 150 µm at 60 % solids, 30 % loss → theoretical 5 000 L, practical 7 143 L, 358 × 20 L containers, 10 000 kg, 57 143 at 8/L (5.71 per m²), WFT 250 µm, total DFT 300 µm',
    source: 'Quantity = area × DFT / (10 × VS × (1 − loss)); WFT = DFT / VS',
    run: () => {
      const { outputs } = calculate(HULL);
      assertClose(outputs.theoretical_litres, (10000 * 300) / 600, { rel: 1e-12 }, 'theoretical');
      assertClose(outputs.practical_litres, 5000 / 0.7, { rel: 1e-12 }, 'practical');
      assertEqual(outputs.containers, Math.ceil(5000 / 0.7 / 20), 'containers');
      assertClose(outputs.mass_kg, (5000 / 0.7) * 1.4, { rel: 1e-12 }, 'mass');
      assertClose(outputs.cost, (5000 / 0.7) * 8, { rel: 1e-12 }, 'cost');
      assertClose(outputs.cost_per_m2, outputs.cost / 10000, { rel: 1e-12 }, 'cost per m²');
      assertClose(outputs.wft_um * 1e6, 250, { rel: 1e-12 }, 'WFT');
      assertClose(outputs.total_dft_um * 1e6, 300, { rel: 1e-12 }, 'total DFT');
      assertClose(outputs.litres_per_coat, outputs.practical_litres / 2, { rel: 1e-12 }, 'per coat');
    },
  },
  {
    name: 'Thinning 10 % lowers solids to 54.5 %, raises WFT to 275 µm and the quantity by 10 %; dry film mass = theoretical litres × solids × density',
    source: 'Volume solids after thinning = VS/(1 + thinner); mass balance of the dry film',
    run: () => {
      const base = calculate(HULL).outputs;
      const thinned = calculate({ ...HULL, thinner_pct: 10 }).outputs;
      assertClose(thinned.effective_solids_pct, 60 / 1.1, { rel: 1e-12 }, 'solids');
      assertClose(thinned.wft_um * 1e6, 150 / (60 / 110), { rel: 1e-9 }, 'WFT');
      assertClose(thinned.practical_litres / base.practical_litres, 1.1, { rel: 1e-9 }, 'quantity +10 %');
      assertClose(base.dry_mass_kg, 5000 * 0.6 * 1.4, { rel: 1e-12 }, 'dry mass');
      assertClose(thinned.dry_mass_kg, base.dry_mass_kg, { rel: 1e-9 }, 'same dry film regardless of thinning');
    },
  },
  {
    name: 'Surface profile allowance of 30 µm on the first coat adds 30/300 = 10 % to the quantity and makes the first coat 180 µm',
    source: 'Dead-volume allowance practice (add paint to fill the blast profile before film builds)',
    run: () => {
      const base = calculate(HULL).outputs;
      const rough = calculate({ ...HULL, profile_um: 30e-6 }).outputs;
      assertClose(rough.first_coat_dft_um * 1e6, 180, { rel: 1e-9 }, 'first coat');
      assertClose(rough.practical_litres / base.practical_litres, 330 / 300, { rel: 1e-9 }, '+10 %');
      assertClose(rough.total_dft_um * 1e6, 300, { rel: 1e-9 }, 'specified DFT unchanged');
    },
  },
  {
    name: 'Imperial reading: 4.0 m²/L = 163 ft²/US gal (unit conversion of the spreading-rate group)',
    source: '1 ft²/US gal = 0.09290 m² / 3.7854 L = 0.02454 m²/L',
    run: () => {
      const factor = 0.09290304 / 3.785411784;
      assertClose(4 / factor, 163.0, { abs: 0.2 }, 'ft²/gal');
    },
  },
  {
    name: 'Warnings: thinning, high wet film (> 600 µm), no profile allowance, rule-of-thumb loss; invalid inputs fail fast (fractional coats, solids above 100 %)',
    source: 'Behaviour specification; validation contract',
    run: () => {
      const r = calculate({ ...HULL, thinner_pct: 5, loss_preset: 'airless_flat' });
      assertEqual(r.warnings.some((w) => w.includes('Thinning')), true, 'thinning');
      assertEqual(r.warnings.some((w) => w.includes('rule of thumb')), true, 'preset');
      assertEqual(r.warnings.some((w) => w.includes('No surface-profile allowance')), true, 'profile');
      const thick = calculate({ ...HULL, dft_um: 400e-6, volume_solids_pct: 50 });
      assertEqual(thick.warnings.some((w) => w.includes('Wet film above 600')), true, 'WFT');
      assertThrows(() => calculate({ ...HULL, coats: 1.5 }), 'whole number', 'coats');
      assertThrows(() => calculate({ ...HULL, volume_solids_pct: 120 }), 'between', 'solids');
    },
  },
];
