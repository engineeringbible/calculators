/**
 * vertical-curve/tests.js — checks against the parabola by hand and the AASHTO Green Book tables.
 * Run: node run-tests.js vertical-curve
 */
import { calculate, stationText, sightLengthCrest, sightLengthSag, sightDistance } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const US = { crest: 2158, sag: 400 };
const MET = { crest: 658, sag: 120 };
const base = { system: 'us', g1: 0.03, g2: -0.02, length_m: 600 * FT, pvi_station_m: 2500 * FT, pvi_elev_m: 500 * FT, station_m: 2400 * FT, speed_m_s: 50 * 0.44704 };

export const tests = [
  {
    name: 'Crest +3 % / −2 %, L 600 ft, PVI 25+00 at 500.00 ft: PVC 22+00 at 491.00, PVT 28+00 at 494.00, 495.33 ft at 24+00, high point 25+60 at 496.40 ft',
    source: 'Hand calculation: y = y_PVC + g1 x + (g2 − g1) x²/(2L); x_high = −g1 L/(g2 − g1) = 360 ft (Ghilani & Wolf, Vertical Curves)',
    run: () => {
      const o = calculate(base).outputs;
      assertEqual(o.pvc_station, '22+00.00', 'PVC');
      assertEqual(o.pvt_station, '28+00.00', 'PVT');
      assertClose(o.pvc_elev_m / FT, 491, { abs: 1e-9 }, 'PVC elevation');
      assertClose(o.pvt_elev_m / FT, 494, { abs: 1e-9 }, 'PVT elevation');
      assertClose(o.elev_m / FT, 491 + 6 - 0.05 * 200 * 200 / 1200, { abs: 1e-9 }, 'elevation at 24+00');
      assertEqual(o.turn_station, '25+60.00', 'high point station');
      assertClose(o.turn_elev_m / FT, 496.4, { abs: 1e-9 }, 'high point');
      assertClose(o.k_m / FT, 120, { abs: 1e-9 }, 'K');
    },
  },
  {
    name: 'Middle ordinate at the PVI is A L / 800 = 5 × 600 / 800 = 3.75 ft; outside the curve the tangent applies; the grade is zero at the high point',
    source: 'Property of the equal-tangent parabola: e = (g2 − g1) L / 8',
    run: () => {
      assertClose(calculate({ ...base, station_m: 2500 * FT }).outputs.elev_m / FT, 500 - 3.75, { abs: 1e-9 }, 'curve at PVI');
      assertClose(calculate({ ...base, station_m: 3000 * FT }).outputs.elev_m / FT, 494 - 0.02 * 200, { abs: 1e-9 }, 'forward tangent');
      assertClose(calculate({ ...base, station_m: 2560 * FT }).outputs.grade_at, 0, { abs: 1e-12 }, 'zero grade');
    },
  },
  {
    name: 'AASHTO stopping sight distance: 423.7 ft at 50 mph (design 425), 566.0 ft at 60 mph (570), 129.0 m at 80 km/h (130)',
    source: 'AASHTO Green Book 2018, section 3.2.2 and Table 3-1: SSD = 1.47 V t + 1.075 V²/a, t = 2.5 s, a = 11.2 ft/s²',
    run: () => {
      assertClose(calculate(base).outputs.ssd_m / FT, 423.71, { abs: 0.01 }, '50 mph');
      assertClose(calculate({ ...base, speed_m_s: 60 * 0.44704 }).outputs.ssd_m / FT, 566.0, { abs: 0.05 }, '60 mph');
      assertClose(calculate({ ...base, system: 'metric', speed_m_s: 80 / 3.6 }).outputs.ssd_m, 129.0, { abs: 0.05 }, '80 km/h');
    },
  },
  {
    name: 'AASHTO design K: crest 84 (50 mph, S 425 ft), 151 (60 mph, 570 ft), 26 (80 km/h, 130 m); sag 96 (50 mph) and 30 (80 km/h)',
    source: 'AASHTO Green Book 2018, section 3.4.6 design controls for crest and sag vertical curves (K = L/A rounded up, from L = A S²/2158 or A S²/(400 + 3.5 S))',
    run: () => {
      assertEqual(Math.ceil(sightLengthCrest(425, 20, US) / 20), 84, 'crest 50 mph');
      assertEqual(Math.ceil(sightLengthCrest(570, 20, US) / 20), 151, 'crest 60 mph');
      assertEqual(Math.ceil(sightLengthCrest(130, 20, MET) / 20), 26, 'crest 80 km/h');
      assertEqual(Math.ceil(sightLengthSag(425, 20, US) / 20), 96, 'sag 50 mph');
      assertEqual(Math.ceil(sightLengthSag(130, 20, MET) / 20), 30, 'sag 80 km/h');
      // the curve of the example provides √(600 × 2158 / 5) = 508.9 ft, and inverting gives back L = 600 ft
      assertClose(sightDistance('crest', 600, 5, US), Math.sqrt(600 * 2158 / 5), { rel: 1e-12 }, 'S');
      assertClose(sightLengthSag(sightDistance('sag', 600, 5, US), 5, US), 600, { rel: 1e-9 }, 'sag inverse');
      assertClose(sightLengthCrest(sightDistance('crest', 300, 5, US), 5, US), 300, { rel: 1e-9 }, 'crest inverse, S > L');
    },
  },
  {
    name: 'Stations print as 25+60.00 and 1+250.000; equal grades, a negative PVC station and too fine a table interval are refused',
    source: 'Validation contract; US 100 ft and metric kilometre station notation',
    run: () => {
      assertEqual(stationText(2560 * FT, 'us'), '25+60.00', 'US');
      assertEqual(stationText(1250, 'metric'), '1+250.000', 'metric');
      assertThrows(() => calculate({ ...base, g2: 0.03 }), 'no vertical curve');
      assertThrows(() => calculate({ ...base, pvi_station_m: 200 * FT }), 'PVI station');
      assertThrows(() => calculate({ ...base, interval_m: 0.1 }), 'more than 400 rows');
    },
  },
];
