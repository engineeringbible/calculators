/**
 * specific-gravity/tests.js — checks against the API and Baumé definitions and published gravities.
 * Run: node run-tests.js specific-gravity
 */
import { calculate, WATER_60F } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '35 °API: SG 60/60 °F = 141.5 / 166.5 = 0.84985, 849.01 kg/m³, 7.085 lb/US gal, 34.7 °Bé light',
    source: 'API MPMS Ch. 11.1 definition of API gravity; Baumé light 140/SG − 130 (ASTM E100); hand calculation',
    run: () => {
      const o = calculate({ given: 'api', api_in: 35 }).outputs;
      assertClose(o.sg60, 0.849850, { abs: 1e-6 }, 'SG');
      assertClose(o.density_out, 849.014, { abs: 0.001 }, 'ρ');
      assertClose(o.lb_per_gal, 7.0853, { abs: 0.0005 }, 'lb/gal');
      assertClose(o.be_light, 34.735, { abs: 0.001 }, 'Bé');
      assertEqual(o.be_heavy, null, 'no heavy Baumé below SG 1');
    },
  },
  {
    name: 'Water at 60 °F is 10 °API, 0 °Bé heavy and 10 °Bé light; 10 °API round-trips to SG 1',
    source: 'Definitions of the API and Baumé scales (the scales are anchored on water)',
    run: () => {
      const o = calculate({ given: 'density', density_kg_m3: WATER_60F }).outputs;
      assertClose(o.api, 10, { abs: 1e-9 }, 'API');
      assertClose(o.be_heavy, 0, { abs: 1e-9 }, 'Bé heavy');
      assertClose(o.be_light, 10, { abs: 1e-9 }, 'Bé light');
      assertClose(calculate({ given: 'api', api_in: 10 }).outputs.sg60, 1, { abs: 1e-12 }, 'SG');
    },
  },
  {
    name: '66 °Bé sulphuric acid has a specific gravity of 1.835 at 60/60 °F',
    source: 'US Baumé heavy scale SG = 145 / (145 − °Bé); 66 °Bé is the commercial grade of concentrated sulphuric acid, sold as SG 1.835',
    run: () => {
      const o = calculate({ given: 'be_heavy', be_heavy_in: 66 }).outputs;
      assertClose(o.sg60, 1.8354, { abs: 0.0001 }, 'SG');
      assertEqual(o.be_light, null, 'no light Baumé above SG 1');
    },
  },
  {
    name: 'Reference choice: 850 kg/m³ is SG 0.85084 against water at 60 °F and 0.85002 against water at 4 °C',
    source: 'SG = ρ / ρ_water with ρ_water 999.016 (API MPMS 11.1) and 999.972 kg/m³ (CIPM 2001)',
    run: () => {
      assertClose(calculate({ density_kg_m3: 850, reference: 'f60' }).outputs.sg, 0.850838, { abs: 1e-6 }, '60 °F');
      assertClose(calculate({ density_kg_m3: 850, reference: 'c4' }).outputs.sg, 0.850024, { abs: 1e-6 }, '4 °C');
      assertClose(calculate({ given: 'sg', sg_in: 0.85, reference: 'c4' }).outputs.density_out, 849.976, { abs: 0.001 }, 'ρ from SG');
    },
  },
  {
    name: 'Gases: air is 1, methane 0.554, propane 1.522; methane at 15 °C and 1 atm is 0.6785 kg/m³ (ideal gas)',
    source: 'Gas SG = M / 28.964 (ISO 2533 air); IUPAC 2021 molar masses; ρ = P M / (R T) by hand',
    run: () => {
      assertClose(calculate({ fluid: 'gas', molar_mass: 28.9644 }).outputs.sg, 1, { abs: 1e-12 }, 'air');
      assertClose(calculate({ fluid: 'gas', molar_mass: 16.043 }).outputs.sg, 0.5539, { abs: 0.0001 }, 'methane');
      assertClose(calculate({ fluid: 'gas', molar_mass: 44.097 }).outputs.sg, 1.5225, { abs: 0.0001 }, 'propane');
      assertClose(calculate({ fluid: 'gas', molar_mass: 16.043, temp_k: 288.15, pressure_pa: 101325 }).outputs.density_out, 0.67850, { abs: 1e-5 }, 'ρ');
    },
  },
  {
    name: 'Out-of-range entries are rejected and an implausible gravity warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ given: 'api', api_in: 200 }), 'API gravity');
      assertThrows(() => calculate({ given: 'be_light', be_light_in: 5 }), 'Baumé degrees (light scale)');
      assertThrows(() => calculate({ fluid: 'gas', molar_mass: 0 }), 'Molar mass');
      assertEqual(calculate({ density_kg_m3: 7850 }).warnings.length, 1, 'warning');
    },
  },
];
