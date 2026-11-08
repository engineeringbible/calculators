/**
 * hardness-conversion/calc.js — approximate conversion between Rockwell C, Rockwell B, Vickers and Brinell hardness of
 * non-austenitic steels, and an estimate of tensile strength, by linear interpolation in published tables.
 *
 * Hardness ↔ hardness: ASTM E140 Table 1 (Rockwell C range, HRC 20–68: HV, HBW 10 mm carbide ball 3 000 kgf) and
 * Table 2 (Rockwell B range, HRB 55–100: HV, HB 3 000 kgf). Tensile strength: ISO 18265 Table A.1 (Rm against HV10 for
 * unalloyed and low-alloy steels, HV 80–650, Rm 255–2 180 MPa). Values between rows are interpolated linearly in the
 * input scale; values outside a table are refused or shown as "—", never extrapolated.
 * Schema units: hardness numbers dimensionless, tensile strength in Pa.
 */
import { withDefaults, assertOneOf, assertFinite, assertPositive } from '../shared/validate.js';

/** ASTM E140 Table 1 (non-austenitic steels, Rockwell C range): [HRC, HV, HBW (carbide ball, 3 000 kgf) or null]. */
export const E140_TABLE1 = [
  [68, 940, null], [67, 900, null], [66, 865, null], [65, 832, 739], [64, 800, 722], [63, 772, 705], [62, 746, 688],
  [61, 720, 670], [60, 697, 654], [59, 674, 634], [58, 653, 615], [57, 633, 595], [56, 613, 577], [55, 595, 560],
  [54, 577, 543], [53, 560, 525], [52, 544, 512], [51, 528, 496], [50, 513, 481], [49, 498, 469], [48, 484, 455],
  [47, 471, 443], [46, 458, 432], [45, 446, 421], [44, 434, 409], [43, 423, 400], [42, 412, 390], [41, 402, 381],
  [40, 392, 371], [39, 382, 362], [38, 372, 353], [37, 363, 344], [36, 354, 336], [35, 345, 327], [34, 336, 319],
  [33, 327, 311], [32, 318, 301], [31, 310, 294], [30, 302, 286], [29, 294, 279], [28, 286, 271], [27, 279, 264],
  [26, 272, 258], [25, 266, 253], [24, 260, 247], [23, 254, 243], [22, 248, 237], [21, 243, 231], [20, 238, 226],
];

/** ASTM E140 Table 2 (non-austenitic steels, Rockwell B range): [HRB, HV]; the 3 000 kgf Brinell number equals HV here. */
export const E140_TABLE2 = [
  [100, 240], [99, 234], [98, 228], [97, 222], [96, 216], [95, 210], [94, 205], [93, 200], [92, 195], [91, 190],
  [90, 185], [89, 180], [88, 176], [87, 172], [86, 169], [85, 165], [84, 162], [83, 159], [82, 156], [81, 153],
  [80, 150], [79, 147], [78, 144], [77, 141], [76, 139], [75, 137], [74, 135], [73, 132], [72, 130], [71, 127],
  [70, 125], [69, 123], [68, 121], [67, 119], [66, 117], [65, 116], [64, 114], [63, 112], [62, 110], [61, 108],
  [60, 107], [59, 106], [58, 104], [57, 103], [56, 101], [55, 100],
];

/** ISO 18265:2013 Table A.1 (unalloyed and low-alloy steels): [HV10, Rm in MPa]. */
export const ISO18265_RM = [
  [80, 255], [85, 270], [90, 285], [95, 305], [100, 320], [105, 335], [110, 350], [115, 370], [120, 385], [125, 400],
  [130, 415], [135, 430], [140, 450], [145, 465], [150, 480], [155, 495], [160, 510], [165, 530], [170, 545], [175, 560],
  [180, 575], [185, 595], [190, 610], [195, 625], [200, 640], [205, 660], [210, 675], [215, 690], [220, 705], [225, 720],
  [230, 740], [235, 755], [240, 770], [245, 785], [250, 800], [255, 820], [260, 835], [265, 850], [270, 865], [275, 880],
  [280, 900], [285, 915], [290, 930], [295, 950], [300, 965], [310, 995], [320, 1030], [330, 1060], [340, 1095],
  [350, 1125], [360, 1155], [370, 1190], [380, 1220], [390, 1255], [400, 1290], [410, 1320], [420, 1350], [430, 1385],
  [440, 1420], [450, 1455], [460, 1485], [470, 1520], [480, 1555], [490, 1595], [500, 1630], [510, 1665], [520, 1700],
  [530, 1740], [540, 1775], [550, 1810], [560, 1845], [570, 1880], [580, 1920], [590, 1955], [600, 1995], [610, 2030],
  [620, 2070], [630, 2105], [640, 2145], [650, 2180],
];

/**
 * Linear interpolation of column `to` against column `from` in a monotonic table; null outside the table.
 * Rows whose `to` or `from` entry is null are skipped.
 */
export function interp(table, from, to, value) {
  const rows = table.filter((r) => r[from] !== null && r[to] !== null).slice().sort((a, b) => a[from] - b[from]);
  if (!rows.length || value < rows[0][from] - 1e-9 || value > rows[rows.length - 1][from] + 1e-9) return null;
  for (let k = 0; k < rows.length - 1; k += 1) {
    const [a, b] = [rows[k], rows[k + 1]];
    if (value <= b[from] + 1e-12) return a[to] + ((value - a[from]) * (b[to] - a[to])) / (b[from] - a[from]);
  }
  return rows[rows.length - 1][to];
}

const T1 = { HRC: 0, HV: 1, HB: 2 };
const T2 = { HRB: 0, HV: 1 };
const LIMITS = {
  hrc: [20, 68, 'Rockwell C hardness', 'HRC 20 to 68 (ASTM E140 Table 1); below HRC 20 use Rockwell B'],
  hrb: [55, 100, 'Rockwell B hardness', 'HRB 55 to 100 (ASTM E140 Table 2); above HRB 100 use Rockwell C'],
  hv: [100, 940, 'Vickers hardness', 'HV 100 to 940 (ASTM E140 Tables 1 and 2)'],
  hbw: [100, 739, 'Brinell hardness', 'HBW 100 to 739 (ASTM E140 Tables 1 and 2)'],
};

export const schema = {
  id: 'hardness-conversion',
  name: 'Hardness conversion calculator (HRC, HRB, HV, HB)',
  category: 'mechanical',
  summary: 'Approximate conversion of steel hardness between Rockwell C, Rockwell B, Vickers and Brinell, with tensile strength, from ASTM E140 and ISO 18265.',
  related: ['material-properties', 'stress-strain', 'fatigue-goodman', 'bolt-torque'],
  assumptions: [
    'The conversions apply only to non-austenitic carbon and low-alloy steels, in the heat-treated, hot-rolled or annealed condition the tables were built from. Austenitic stainless steel, cold-worked steel, cast iron and non-ferrous metals need their own tables.',
    'Hardness numbers are converted with ASTM E140 Table 1 (Rockwell C range, HRC 20 to 68) and Table 2 (Rockwell B range, HRB 55 to 100), interpolating linearly between rows. Brinell is the 10 mm tungsten carbide ball at 3 000 kgf (HBW).',
    'Tensile strength is estimated from the Vickers number with ISO 18265 Table A.1 (HV 80 to 650, Rm 255 to 2 180 MPa). ISO 18265 warns that tensile estimates are the least reliable converted values.',
    'E140 Tables 1 and 2 meet at about HRB 97 to 100 and HRC 20 to 23 and disagree there by up to about 10 HV; conversions in that band are less certain.',
    'Values outside a table are refused or shown as "—", never extrapolated. A converted hardness never replaces a test in the scale a specification requires.',
  ],
  notes: [
    'Verification 2026-11-08: 45 HRC converts to 446 HV and 421 HBW (E140 Table 1 row) and to 1 441 MPa tensile strength (ISO 18265: 1 420 + 0.6 × 35); 85 HRB converts to 165 HV and 165 HB and 530 MPa. Checked by hand.',
    'Table provenance: the E140 HRC, HV and HBW columns were taken from two independent reproductions of E140 (Miki Pulley technical data, Rockwell C hardness conversion; Thread Check Inc., ASTM hardness conversion chart), which agree row by row except HRC 62 (746 against 745 HV; 746 kept). The HRB column comes from the LabTesting.com Rockwell B chart and Thread Check, which agree except HRB 90 (185 against 186 HV; 185 kept, as in a third table by Kemet). The ISO 18265 Rm–HV pairs come from the ws-stahl and Studer-Biennaform reproductions of Table A.1, which agree.',
    'Spot-check of the tensile estimate against the approximate tensile column of the SAE/ASTM-based table published by Miki Pulley: 1 480 MPa at 45 HRC (ISO 18265 gives 1 441 MPa), 950 MPa at 30 HRC (971 MPa), 760 MPa at 20 HRC (764 MPa); the two methods differ by less than 3 %.',
  ],
  sources: [
    'ASTM E140-12b(2019)e1, Standard Hardness Conversion Tables for Metals, Table 1 (non-austenitic steels, Rockwell C range) and Table 2 (Rockwell B range)',
    'ISO 18265:2013, Metallic materials — Conversion of hardness values, Annex A, Table A.1 (unalloyed and low-alloy steels and cast steel)',
    'ASTM A370-24, Standard Test Methods and Definitions for Mechanical Testing of Steel Products, §17 and Tables 3–4 (use of hardness conversions)',
  ],
  inputs: [
    {
      id: 'scale', label: 'Hardness you have', type: 'select', default: 'hrc',
      options: [
        { value: 'hrc', label: 'Rockwell C (HRC)' }, { value: 'hrb', label: 'Rockwell B (HRB)' },
        { value: 'hv', label: 'Vickers (HV)' }, { value: 'hbw', label: 'Brinell (HBW, 10 mm ball, 3 000 kgf)' },
        { value: 'rm', label: 'Tensile strength (estimate the hardness)' },
      ],
    },
    { id: 'value', label: 'Hardness number', group: 'dimensionless', unit: 'none', default: 45, min: 20, max: 940, visibleWhen: { scale: ['hrc', 'hrb', 'hv', 'hbw'] } },
    { id: 'rm_pa', label: 'Tensile strength', group: 'pressure', unit: 'Pa', display: 'MPa', default: 800e6, min: 320e6, max: 2180e6, visibleWhen: { scale: 'rm' } },
  ],
  outputs: [
    { id: 'hrc', label: 'Rockwell C, HRC', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'hrb', label: 'Rockwell B, HRB', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'hv', label: 'Vickers, HV', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'hbw', label: 'Brinell, HBW (10 mm, 3 000 kgf)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'tensile_pa', label: 'Approximate tensile strength (ISO 18265)', group: 'pressure', unit: 'Pa', display: 'MPa', decimals: 0 },
    { id: 'basis', label: 'Tables used', type: 'text' },
  ],
  example: {
    inputs: { scale: 'hrc', value: 45 },
    results: { hv: '446', hbw: '421', tensile_pa: '1 441 MPa' },
  },
};

/** Vickers number from a reading in any scale; throws outside the tables. */
export function toVickers(scale, value) {
  if (scale === 'hrc') return interp(E140_TABLE1, T1.HRC, T1.HV, value);
  if (scale === 'hrb') return interp(E140_TABLE2, T2.HRB, T2.HV, value);
  if (scale === 'hv') return value;
  // Brinell: Table 2 (HB = HV) up to 240, Table 1 above
  if (value <= 240) return value;
  return interp(E140_TABLE1, T1.HB, T1.HV, value);
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.scale, ['hrc', 'hrb', 'hv', 'hbw', 'rm'], 'scale', 'Hardness you have');
  let hv;
  const warnings = [];
  if (x.scale === 'rm') {
    const rm = assertPositive(x.rm_pa, 'rm_pa', 'Tensile strength') / 1e6;
    if (rm < 320 - 1e-9 || rm > 2180 + 1e-9) throw new Error(`Tensile strength: ${Math.round(rm)} MPa is outside ISO 18265 Table A.1 as used here (320 to 2 180 MPa, HV 100 to 650).`);
    hv = interp(ISO18265_RM, 1, 0, rm);
  } else {
    const v = assertFinite(x.value, 'value', 'Hardness number');
    const [lo, hi, name, range] = LIMITS[x.scale];
    if (v < lo || v > hi) throw new Error(`Hardness number: ${v} is outside the conversion table for ${name}, ${range}.`);
    hv = toVickers(x.scale, v);
  }
  const inT1 = hv >= 238 - 1e-9;
  const inT2 = hv <= 240 + 1e-9;
  const hrc = x.scale === 'hrc' ? x.value : inT1 ? interp(E140_TABLE1, T1.HV, T1.HRC, hv) : null;
  const hrb = x.scale === 'hrb' ? x.value : inT2 ? interp(E140_TABLE2, T2.HV, T2.HRB, hv) : null;
  let hbw;
  if (x.scale === 'hbw') hbw = x.value;
  else if (x.scale === 'hrb' || !inT1) hbw = hv; // Table 2: HB = HV
  else hbw = interp(E140_TABLE1, T1.HV, T1.HB, hv);
  const rmMpa = interp(ISO18265_RM, 0, 1, hv);
  if (hv >= 228 && hv <= 260) warnings.push('Near the junction of E140 Tables 1 and 2 (about HRB 98 to 100, HRC 20 to 24) the two tables differ by up to 10 HV: the conversion is less certain here.');
  if (hbw !== null && hbw > 650) warnings.push('Brinell numbers above 650 HBW are outside the range of ISO 6506 and ASTM E10; the value is for comparison only.');
  if (hv > 650) warnings.push('Above 650 HV, ISO 18265 Table A.1 gives no tensile strength: such hard steels are brittle and their tensile strength is not well defined by hardness.');
  return {
    outputs: {
      hrc, hrb, hv, hbw,
      tensile_pa: rmMpa === null ? null : rmMpa * 1e6,
      basis: [
        x.scale === 'rm' ? 'Tensile strength → HV by ISO 18265 Table A.1' : null,
        hrc !== null || (x.scale !== 'hrb' && inT1) ? 'Rockwell C range: ASTM E140 Table 1' : null,
        hrb !== null ? 'Rockwell B range: ASTM E140 Table 2' : null,
        rmMpa !== null && x.scale !== 'rm' ? 'Tensile strength: ISO 18265 Table A.1' : null,
      ].filter(Boolean).join('; ') + '. Approximate, non-austenitic steels only.',
    },
    warnings,
  };
}
