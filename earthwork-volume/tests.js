/**
 * earthwork-volume/tests.js — checks against a published prismoidal/average-end-area example and the earth-state factors.
 * Run: node run-tests.js earthwork-volume
 */
import { calculate, averageEndArea, prismoidal, estimatedMidArea, SOILS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const EXAMPLE = { area1_m2: 150.25, area2_m2: 259.375, mid_mode: 'given', area_mid_m2: 201.375, length_m: 20, count: 1, operation: 'cut', soil: 'clay', truck_m3: 12 };

export const tests = [
  {
    name: 'Published example: A₁ 150.25, A_m 201.375, A₂ 259.375 m², L 20 m → prismoidal 4 050.42 m³, average end area 4 096.25 m³, correction 45.8 m³ (1.1 %)',
    source: 'Earthworks lecture notes (Scribd "Earthworks" ch. 5) worked example: V_p = 4 050.42 m³, V_AEA = 4 096.25 m³',
    run: () => {
      assertClose(prismoidal(150.25, 201.375, 259.375, 20), 4050.42, { abs: 0.01 }, 'prismoidal');
      assertClose(averageEndArea(150.25, 259.375, 20), 4096.25, { abs: 0.01 }, 'AEA');
      const { outputs } = calculate(EXAMPLE);
      assertClose(outputs.volume_prismoidal_m3, 4050.42, { abs: 0.01 }, 'in calculate');
      assertClose(outputs.volume_aea_m3, 4096.25, { abs: 0.01 }, 'AEA in calculate');
      assertClose(outputs.prismoidal_correction_m3, 45.83, { abs: 0.01 }, 'correction');
      assertClose(outputs.correction_pct, (45.83 / 4096.25) * 100, { rel: 1e-3 }, 'correction %');
    },
  },
  {
    name: 'Mid-area estimate for similar sections ((√A₁ + √A₂)/2)² = 201.11 m² (measured 201.375) → 4 046.9 m³, within 0.1 % of the measured-mid result; exact for a pyramid: A₁ 100, A₂ 0 → estimate 25, prismoidal 333.3 vs AEA 500 (the classic 50 % over-estimate)',
    source: 'Prismoidal formula exactness for prismoids; pyramid volume L A/3',
    run: () => {
      assertClose(estimatedMidArea(150.25, 259.375), ((Math.sqrt(150.25) + Math.sqrt(259.375)) / 2) ** 2, { rel: 1e-12 }, 'estimate formula');
      assertClose(estimatedMidArea(150.25, 259.375), 201.11, { abs: 0.01 }, 'estimate');
      const est = calculate({ ...EXAMPLE, mid_mode: 'estimate' });
      assertClose(est.outputs.volume_prismoidal_m3, 4046.9, { abs: 0.1 }, 'estimated-mid volume');
      assertClose(est.outputs.volume_prismoidal_m3, 4050.42, { abs: 5 }, 'close to measured');
      assertEqual(est.warnings.some((w) => w.includes('estimated from')), true, 'warning');
      assertClose(estimatedMidArea(100, 0), 25, { rel: 1e-12 }, 'pyramid mid-area');
      assertClose(prismoidal(100, 25, 0, 10), 1000 / 3, { rel: 1e-12 }, 'pyramid exact');
      assertClose(averageEndArea(100, 0, 10), 500, { rel: 1e-12 }, 'AEA over-estimate');
    },
  },
  {
    name: 'Cut in clay (swell 33 %, shrinkage 10 %): 4 050 m³ bank → 5 387 m³ loose, 3 645 m³ compacted, 7 291 t at 1 800 kg/m³, loose density 1 353 kg/m³, 449 truck loads of 12 m³',
    source: 'Bank/loose/compacted relations (Peurifoy & Schexnayder); clay 33 % swell and 90 % compacted (reference values)',
    run: () => {
      const { outputs } = calculate(EXAMPLE);
      assertClose(outputs.bank_m3, 4050.42, { abs: 0.01 }, 'bank');
      assertClose(outputs.loose_m3, 4050.42 * 1.33, { rel: 1e-6 }, 'loose');
      assertClose(outputs.compacted_m3, 4050.42 * 0.9, { rel: 1e-6 }, 'compacted');
      assertClose(outputs.mass_t, (4050.42 * 1800) / 1000, { rel: 1e-6 }, 'mass');
      assertClose(outputs.loose_density_kg_m3, 1800 / 1.33, { rel: 1e-12 }, 'loose density');
      assertEqual(outputs.truck_loads, Math.ceil((4050.42 * 1.33) / 12), 'loads');
      assertEqual(SOILS.clay.swell === 0.33 && SOILS.clay.shrink === 0.1, true, 'clay factors');
    },
  },
  {
    name: 'Fill mode: 4 050 m³ of compacted clay fill needs 4 500 m³ of bank excavation and 5 986 m³ of loose haul; rock bulks (shrinkage −30 %): 1 000 m³ bank → 1 300 m³ placed',
    source: 'V_bank = V_compacted/(1 − shrinkage); blasted rock bulking',
    run: () => {
      const fill = calculate({ ...EXAMPLE, operation: 'fill' }).outputs;
      assertClose(fill.compacted_m3, 4050.42, { abs: 0.01 }, 'compacted = prismoidal');
      assertClose(fill.bank_m3, 4050.42 / 0.9, { rel: 1e-6 }, 'bank');
      assertClose(fill.loose_m3, (4050.42 / 0.9) * 1.33, { rel: 1e-6 }, 'loose');
      assertEqual(fill.summary.startsWith('Fill'), true, 'summary');
      const rock = calculate({ ...EXAMPLE, soil: 'rock_blasted', mid_mode: 'estimate', area1_m2: 50, area2_m2: 50, length_m: 20, count: 1 }).outputs;
      assertClose(rock.bank_m3, 1000, { rel: 1e-9 }, 'rock bank');
      assertClose(rock.compacted_m3, 1300, { rel: 1e-9 }, 'rock placed');
      assertClose(rock.loose_m3, 1500, { rel: 1e-9 }, 'rock loose');
    },
  },
  {
    name: 'Intervals and custom factors: 10 identical intervals multiply all volumes by 10; custom swell 20 % / shrinkage 5 % / density 1 600 are honoured',
    source: 'Arithmetic; custom-material path',
    run: () => {
      const ten = calculate({ ...EXAMPLE, count: 10 }).outputs;
      assertClose(ten.volume_prismoidal_m3, 40504.2, { abs: 0.1 }, '× 10');
      const custom = calculate({ ...EXAMPLE, soil: 'custom', swell_custom: 0.2, shrink_custom: 0.05, density_custom: 1600 }).outputs;
      assertClose(custom.swell_used, 1.2, { rel: 1e-12 }, 'swell');
      assertClose(custom.shrinkage_used, 0.95, { rel: 1e-12 }, 'shrinkage');
      assertClose(custom.mass_t, (4050.42 * 1600) / 1000, { rel: 1e-6 }, 'mass');
    },
  },
  {
    name: 'Warnings and validation: end areas differing by more than 2× trigger the over-estimate warning; both areas zero, zero length and unknown material are rejected',
    source: 'Average end area error for dissimilar sections (FHWA ch. 9); validation contract',
    run: () => {
      const skew = calculate({ ...EXAMPLE, area1_m2: 50, area2_m2: 300, mid_mode: 'estimate' });
      assertEqual(skew.warnings.some((w) => w.includes('over-estimates')), true, 'warning');
      assertThrows(() => calculate({ ...EXAMPLE, area1_m2: 0, area2_m2: 0 }), 'Both cross-section areas are zero', 'zero areas');
      assertThrows(() => calculate({ ...EXAMPLE, length_m: 0 }), 'greater than zero', 'length');
      assertThrows(() => calculate({ ...EXAMPLE, soil: 'peat' }), 'must be one of', 'material');
    },
  },
];
