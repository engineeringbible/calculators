/**
 * shared/units.js — the single source of unit definitions and conversion factors.
 *
 * Every unit group has a `base` unit. A unit converts to the base with
 *   base = (value + offset) * factor          (offset is 0 for everything except temperature)
 * and back with
 *   value = base / factor - offset
 *
 * Base units are SI, or the conventional engineering unit where SI is never used in practice
 * (rpm for rotational speed, g/kWh for specific fuel consumption, t/cm for TPC, t·m/cm for MCTC).
 * Factors are exact definitions where one exists (international yard and pound agreement 1959,
 * BIPM SI Brochure, 1 nautical mile = 1852 m, 1 hp = 550 ft·lbf/s, 1 PS = 75 kgf·m/s, 1 Btu(IT) = 1055.05585262 J).
 */

export const UNIT_GROUPS = {
  length: {
    name: 'Length',
    base: 'm',
    units: {
      m: { label: 'm', name: 'metre', factor: 1 },
      mm: { label: 'mm', name: 'millimetre', factor: 0.001 },
      um: { label: 'µm', name: 'micrometre (micron)', factor: 1e-6 },
      cm: { label: 'cm', name: 'centimetre', factor: 0.01 },
      km: { label: 'km', name: 'kilometre', factor: 1000 },
      nmi: { label: 'nmi', name: 'nautical mile', factor: 1852 },
      in: { label: 'in', name: 'inch', factor: 0.0254 },
      mil: { label: 'mil', name: 'mil (thousandth of an inch)', factor: 0.0000254 },
      ft: { label: 'ft', name: 'foot', factor: 0.3048 },
      yd: { label: 'yd', name: 'yard', factor: 0.9144 },
      mi: { label: 'mi', name: 'statute mile', factor: 1609.344 },
      fathom: { label: 'fathom', name: 'fathom', factor: 1.8288 },
      shackle: { label: 'shackle', name: 'shackle of anchor cable (27.5 m, ISO 1704)', factor: 27.5 },
    },
  },
  area: {
    name: 'Area',
    base: 'm2',
    units: {
      m2: { label: 'm²', name: 'square metre', factor: 1 },
      cm2: { label: 'cm²', name: 'square centimetre', factor: 1e-4 },
      mm2: { label: 'mm²', name: 'square millimetre', factor: 1e-6 },
      ft2: { label: 'ft²', name: 'square foot', factor: 0.09290304 },
      in2: { label: 'in²', name: 'square inch', factor: 0.00064516 },
      kcmil: { label: 'kcmil', name: 'thousand circular mils (MCM)', factor: Math.PI / 4 * 0.0254 ** 2 * 1e-3 },
      cmil: { label: 'cmil', name: 'circular mil', factor: Math.PI / 4 * 0.0000254 ** 2 },
    },
  },
  volume: {
    name: 'Volume',
    base: 'm3',
    units: {
      m3: { label: 'm³', name: 'cubic metre', factor: 1 },
      L: { label: 'L', name: 'litre', factor: 1e-3 },
      mL: { label: 'mL', name: 'millilitre', factor: 1e-6 },
      ft3: { label: 'ft³', name: 'cubic foot', factor: 0.028316846592 },
      yd3: { label: 'yd³', name: 'cubic yard', factor: 0.764554857984 },
      in3: { label: 'in³', name: 'cubic inch', factor: 1.6387064e-5 },
      gal_us: { label: 'US gal', name: 'US gallon', factor: 0.003785411784 },
      gal_uk: { label: 'imp gal', name: 'imperial gallon', factor: 0.00454609 },
      bbl: { label: 'bbl', name: 'oil barrel (42 US gal)', factor: 0.158987294928 },
    },
  },
  mass: {
    name: 'Mass',
    base: 'kg',
    units: {
      kg: { label: 'kg', name: 'kilogram', factor: 1 },
      g: { label: 'g', name: 'gram', factor: 1e-3 },
      t: { label: 't', name: 'tonne (metric ton)', factor: 1000 },
      lb: { label: 'lb', name: 'pound', factor: 0.45359237 },
      lt: { label: 'long ton', name: 'long ton (2240 lb)', factor: 1016.0469088 },
      st: { label: 'short ton', name: 'short ton (2000 lb)', factor: 907.18474 },
    },
  },
  time: {
    name: 'Time',
    base: 's',
    units: {
      s: { label: 's', name: 'second', factor: 1 },
      min: { label: 'min', name: 'minute', factor: 60 },
      h: { label: 'h', name: 'hour', factor: 3600 },
      day: { label: 'day', name: 'day', factor: 86400 },
      year: { label: 'year', name: 'year (365.25 days)', factor: 31557600 },
    },
  },
  pressure_gradient: {
    name: 'Pressure drop per length',
    base: 'Pa_m',
    units: {
      Pa_m: { label: 'Pa/m', name: 'pascal per metre', factor: 1 },
      inwc_100ft: { label: 'in. w.c./100 ft', name: 'inch of water per 100 feet', factor: 249.0889 / 30.48 },
    },
  },
  specific_volume: {
    name: 'Specific volume',
    base: 'm3_kg',
    units: {
      m3_kg: { label: 'm³/kg', name: 'cubic metre per kilogram', factor: 1 },
      L_kg: { label: 'L/kg', name: 'litre per kilogram', factor: 1e-3 },
      ft3_lb: { label: 'ft³/lb', name: 'cubic foot per pound', factor: 0.028316846592 / 0.45359237 },
    },
  },
  speed: {
    name: 'Speed',
    base: 'm_s',
    units: {
      m_s: { label: 'm/s', name: 'metre per second', factor: 1 },
      km_h: { label: 'km/h', name: 'kilometre per hour', factor: 1 / 3.6 },
      kn: { label: 'kn', name: 'knot', factor: 1852 / 3600 },
      mph: { label: 'mph', name: 'mile per hour', factor: 0.44704 },
      ft_s: { label: 'ft/s', name: 'foot per second', factor: 0.3048 },
      fpm: { label: 'ft/min', name: 'foot per minute', factor: 0.00508 },
      m_min: { label: 'm/min', name: 'metre per minute', factor: 1 / 60 },
      mm_s: { label: 'mm/s', name: 'millimetre per second', factor: 1e-3 },
    },
  },
  angle: {
    name: 'Angle',
    base: 'rad',
    units: {
      rad: { label: 'rad', name: 'radian', factor: 1 },
      deg: { label: '°', name: 'degree', factor: Math.PI / 180 },
      arcmin: { label: '′', name: 'minute of arc', factor: Math.PI / 10800 },
    },
  },
  force: {
    name: 'Force',
    base: 'N',
    units: {
      N: { label: 'N', name: 'newton', factor: 1 },
      kN: { label: 'kN', name: 'kilonewton', factor: 1e3 },
      MN: { label: 'MN', name: 'meganewton', factor: 1e6 },
      kgf: { label: 'kgf', name: 'kilogram-force', factor: 9.80665 },
      tf: { label: 'tf', name: 'tonne-force', factor: 9806.65 },
      lbf: { label: 'lbf', name: 'pound-force', factor: 4.4482216152605 },
      kip: { label: 'kip', name: 'kip (1000 lbf)', factor: 4448.2216152605 },
    },
  },
  pressure: {
    name: 'Pressure / stress',
    base: 'Pa',
    units: {
      Pa: { label: 'Pa', name: 'pascal', factor: 1 },
      kPa: { label: 'kPa', name: 'kilopascal', factor: 1e3 },
      MPa: { label: 'MPa', name: 'megapascal (N/mm²)', factor: 1e6 },
      GPa: { label: 'GPa', name: 'gigapascal', factor: 1e9 },
      bar: { label: 'bar', name: 'bar', factor: 1e5 },
      mbar: { label: 'mbar', name: 'millibar (hPa)', factor: 100 },
      hPa: { label: 'hPa', name: 'hectopascal', factor: 100 },
      psi: { label: 'psi', name: 'pound per square inch', factor: 6894.757293168 },
      ksi: { label: 'ksi', name: 'kip per square inch', factor: 6894757.293168 },
      atm: { label: 'atm', name: 'standard atmosphere', factor: 101325 },
      inH2O: { label: 'in. w.c.', name: 'inch of water column (4 °C)', factor: 249.0889 },
      mmH2O: { label: 'mm w.c.', name: 'millimetre of water column', factor: 9.80665 },
      mmHg: { label: 'mmHg', name: 'millimetre of mercury', factor: 133.322387415 },
      inHg: { label: 'inHg', name: 'inch of mercury', factor: 3386.388640341 },
      psf: { label: 'psf', name: 'pound-force per square foot', factor: 4.4482216152605 / 0.09290304 },
      ksf: { label: 'ksf', name: 'kip per square foot', factor: 4448.2216152605 / 0.09290304 },
      mH2O: { label: 'mH₂O', name: 'metre of water', factor: 9806.65 },
      ftH2O: { label: 'ftH₂O', name: 'foot of water', factor: 2989.0669 },
      kgf_cm2: { label: 'kgf/cm²', name: 'kilogram-force per cm²', factor: 98066.5 },
    },
  },
  torque: {
    name: 'Torque',
    base: 'N_m',
    units: {
      N_m: { label: 'N·m', name: 'newton metre', factor: 1 },
      kN_m: { label: 'kN·m', name: 'kilonewton metre', factor: 1e3 },
      kgf_m: { label: 'kgf·m', name: 'kilogram-force metre', factor: 9.80665 },
      lbf_ft: { label: 'lbf·ft', name: 'pound-force foot', factor: 1.3558179483314 },
      lbf_in: { label: 'lbf·in', name: 'pound-force inch', factor: 0.1129848290276167 },
    },
  },
  power: {
    name: 'Power',
    base: 'W',
    units: {
      W: { label: 'W', name: 'watt', factor: 1 },
      kW: { label: 'kW', name: 'kilowatt', factor: 1e3 },
      MW: { label: 'MW', name: 'megawatt', factor: 1e6 },
      hp: { label: 'hp', name: 'horsepower (mechanical, 550 ft·lbf/s)', factor: 745.69987158227 },
      PS: { label: 'PS', name: 'metric horsepower (75 kgf·m/s)', factor: 735.49875 },
      btu_h: { label: 'Btu/h', name: 'Btu (IT) per hour', factor: 0.29307107017 },
      ton_r: { label: 'TR', name: 'ton of refrigeration (12 000 Btu/h)', factor: 12000 * 1055.05585262 / 3600 },
      kcal_h: { label: 'kcal/h', name: 'kilocalorie per hour', factor: 1.163 },
    },
  },
  energy: {
    name: 'Energy',
    base: 'J',
    units: {
      J: { label: 'J', name: 'joule', factor: 1 },
      mJ: { label: 'mJ', name: 'millijoule', factor: 1e-3 },
      kJ: { label: 'kJ', name: 'kilojoule', factor: 1e3 },
      MJ: { label: 'MJ', name: 'megajoule', factor: 1e6 },
      GJ: { label: 'GJ', name: 'gigajoule', factor: 1e9 },
      Wh: { label: 'Wh', name: 'watt hour', factor: 3600 },
      kWh: { label: 'kWh', name: 'kilowatt hour', factor: 3.6e6 },
      MWh: { label: 'MWh', name: 'megawatt hour', factor: 3.6e9 },
      Btu: { label: 'Btu', name: 'British thermal unit (IT)', factor: 1055.05585262 },
      kcal: { label: 'kcal', name: 'kilocalorie (thermochemical)', factor: 4184 },
      toe: { label: 'toe', name: 'tonne of oil equivalent (41.868 GJ)', factor: 41.868e9 },
    },
  },
  volume_flow: {
    name: 'Volume flow',
    base: 'm3_s',
    units: {
      m3_s: { label: 'm³/s', name: 'cubic metre per second', factor: 1 },
      m3_h: { label: 'm³/h', name: 'cubic metre per hour', factor: 1 / 3600 },
      m3_day: { label: 'm³/day', name: 'cubic metre per day', factor: 1 / 86400 },
      L_s: { label: 'L/s', name: 'litre per second', factor: 1e-3 },
      L_min: { label: 'L/min', name: 'litre per minute', factor: 1e-3 / 60 },
      cfm: { label: 'cfm', name: 'cubic foot per minute', factor: 0.028316846592 / 60 },
      cfs: { label: 'ft³/s', name: 'cubic foot per second', factor: 0.028316846592 },
      gpm_us: { label: 'US gpm', name: 'US gallon per minute', factor: 0.003785411784 / 60 },
      gpm_uk: { label: 'imp gpm', name: 'imperial gallon per minute', factor: 0.00454609 / 60 },
    },
  },
  mass_flow: {
    name: 'Mass flow',
    base: 'kg_s',
    units: {
      kg_s: { label: 'kg/s', name: 'kilogram per second', factor: 1 },
      kg_h: { label: 'kg/h', name: 'kilogram per hour', factor: 1 / 3600 },
      t_h: { label: 't/h', name: 'tonne per hour', factor: 1000 / 3600 },
      t_day: { label: 't/day', name: 'tonne per day', factor: 1000 / 86400 },
      lb_h: { label: 'lb/h', name: 'pound per hour', factor: 0.45359237 / 3600 },
      lt_day: { label: 'long ton/day', name: 'long ton per day', factor: 1016.0469088 / 86400 },
    },
  },
  density: {
    name: 'Density',
    base: 'kg_m3',
    units: {
      kg_m3: { label: 'kg/m³', name: 'kilogram per cubic metre', factor: 1 },
      t_m3: { label: 't/m³', name: 'tonne per cubic metre', factor: 1000 },
      g_cm3: { label: 'g/cm³', name: 'gram per cubic centimetre', factor: 1000 },
      kg_L: { label: 'kg/L', name: 'kilogram per litre', factor: 1000 },
      lb_ft3: { label: 'lb/ft³', name: 'pound per cubic foot', factor: 16.01846337396 },
    },
  },
  temperature: {
    name: 'Temperature',
    base: 'K',
    units: {
      K: { label: 'K', name: 'kelvin', factor: 1, offset: 0 },
      C: { label: '°C', name: 'degree Celsius', factor: 1, offset: 273.15 },
      F: { label: '°F', name: 'degree Fahrenheit', factor: 5 / 9, offset: 459.67 },
    },
  },
  temperature_difference: {
    name: 'Temperature difference',
    base: 'K',
    units: {
      K: { label: 'K', name: 'kelvin', factor: 1 },
      C: { label: '°C', name: 'Celsius degree', factor: 1 },
      F: { label: '°F', name: 'Fahrenheit degree', factor: 5 / 9 },
    },
  },
  temperature_rate: {
    name: 'Rate of temperature change',
    base: 'K_s',
    units: {
      K_s: { label: 'K/s', name: 'kelvin per second', factor: 1 },
      C_min: { label: '°C/min', name: 'Celsius degree per minute', factor: 1 / 60 },
      C_h: { label: '°C/h', name: 'Celsius degree per hour', factor: 1 / 3600 },
    },
  },
  specific_fuel: {
    name: 'Specific fuel consumption',
    base: 'g_kWh',
    units: {
      g_kWh: { label: 'g/kWh', name: 'gram per kilowatt hour', factor: 1 },
      kg_kWh: { label: 'kg/kWh', name: 'kilogram per kilowatt hour', factor: 1000 },
      g_MJ: { label: 'g/MJ', name: 'gram per megajoule', factor: 3.6 },
      lb_hph: { label: 'lb/hp·h', name: 'pound per horsepower hour', factor: 453.59237 / 0.74569987158227 },
    },
  },
  rotational_speed: {
    name: 'Rotational speed',
    base: 'rpm',
    units: {
      rpm: { label: 'rpm', name: 'revolutions per minute', factor: 1 },
      rps: { label: 'rev/s', name: 'revolutions per second', factor: 60 },
      rad_s: { label: 'rad/s', name: 'radian per second', factor: 60 / (2 * Math.PI) },
    },
  },
  ratio: {
    name: 'Ratio',
    base: 'frac',
    units: {
      frac: { label: '–', name: 'fraction', factor: 1 },
      pct: { label: '%', name: 'percent', factor: 0.01 },
      permille: { label: '‰', name: 'per mille', factor: 0.001 },
      ppm: { label: 'ppm', name: 'parts per million', factor: 1e-6 },
    },
  },
  dimensionless: {
    name: 'Dimensionless',
    base: 'none',
    units: {
      none: { label: '', name: 'dimensionless', factor: 1 },
    },
  },
  money: {
    name: 'Money',
    base: 'cur',
    units: {
      cur: { label: '$', name: 'currency units (no exchange-rate conversion)', factor: 1 },
    },
  },
  price_per_mass: {
    name: 'Price per mass',
    base: 'cur_t',
    units: {
      cur_t: { label: '$/t', name: 'currency per tonne', factor: 1 },
      cur_kg: { label: '$/kg', name: 'currency per kilogram', factor: 1000 },
      cur_lt: { label: '$/long ton', name: 'currency per long ton', factor: 1 / 1.0160469088 },
    },
  },
  price_per_volume: {
    name: 'Price per volume',
    base: 'cur_m3',
    units: {
      cur_m3: { label: '$/m³', name: 'currency per cubic metre', factor: 1 },
      cur_yd3: { label: '$/yd³', name: 'currency per cubic yard', factor: 1 / 0.764554857984 },
    },
  },
  money_per_distance: {
    name: 'Cost per distance',
    base: 'cur_nmi',
    units: {
      cur_nmi: { label: '$/nmi', name: 'currency per nautical mile', factor: 1 },
      cur_km: { label: '$/km', name: 'currency per kilometre', factor: 1.852 },
    },
  },
  mass_per_distance: {
    name: 'Mass per distance',
    base: 'kg_nmi',
    units: {
      kg_nmi: { label: 'kg/nmi', name: 'kilogram per nautical mile', factor: 1 },
      t_nmi: { label: 't/nmi', name: 'tonne per nautical mile', factor: 1000 },
      kg_km: { label: 'kg/km', name: 'kilogram per kilometre', factor: 1.852 },
    },
  },
  tpc: {
    name: 'Tonnes per centimetre immersion',
    base: 't_cm',
    units: {
      t_cm: { label: 't/cm', name: 'tonne per centimetre', factor: 1 },
      t_m: { label: 't/m', name: 'tonne per metre', factor: 0.01 },
      lt_in: { label: 'long ton/in (TPI)', name: 'long ton per inch', factor: 1.0160469088 / 2.54 },
    },
  },
  mctc: {
    name: 'Moment to change trim',
    base: 't_m_cm',
    units: {
      t_m_cm: { label: 't·m/cm', name: 'tonne metre per centimetre', factor: 1 },
      lt_ft_in: { label: 'long ton·ft/in (MCT1")', name: 'long ton foot per inch', factor: (1.0160469088 * 0.3048) / 2.54 },
    },
  },
  mass_moment: {
    name: 'Mass moment',
    base: 't_m',
    units: {
      t_m: { label: 't·m', name: 'tonne metre', factor: 1 },
      kg_m: { label: 'kg·m', name: 'kilogram metre', factor: 1e-3 },
      lt_ft: { label: 'long ton·ft', name: 'long ton foot', factor: 1.0160469088 * 0.3048 },
    },
  },
  kinematic_viscosity: {
    name: 'Kinematic viscosity',
    base: 'm2_s',
    units: {
      m2_s: { label: 'm²/s', name: 'square metre per second', factor: 1 },
      cSt: { label: 'cSt', name: 'centistokes (mm²/s)', factor: 1e-6 },
      St: { label: 'St', name: 'stokes', factor: 1e-4 },
      ft2_s: { label: 'ft²/s', name: 'square foot per second', factor: 0.09290304 },
    },
  },
  dynamic_viscosity: {
    name: 'Dynamic viscosity',
    base: 'Pa_s',
    units: {
      Pa_s: { label: 'Pa·s', name: 'pascal second', factor: 1 },
      mPa_s: { label: 'mPa·s (cP)', name: 'millipascal second / centipoise', factor: 1e-3 },
      P: { label: 'P', name: 'poise', factor: 0.1 },
    },
  },
  heat_transfer_coefficient: {
    name: 'Heat transfer coefficient',
    base: 'W_m2K',
    units: {
      W_m2K: { label: 'W/(m²·K)', name: 'watt per square metre kelvin', factor: 1 },
      kW_m2K: { label: 'kW/(m²·K)', name: 'kilowatt per square metre kelvin', factor: 1e3 },
      btu_hft2F: { label: 'Btu/(h·ft²·°F)', name: 'Btu per hour square foot Fahrenheit', factor: 5.678263 },
    },
  },
  thermal_conductivity: {
    name: 'Thermal conductivity',
    base: 'W_mK',
    units: {
      W_mK: { label: 'W/(m·K)', name: 'watt per metre kelvin', factor: 1 },
      btu_hftF: { label: 'Btu/(h·ft·°F)', name: 'Btu per hour foot Fahrenheit', factor: 1.730735 },
    },
  },
  specific_heat: {
    name: 'Specific heat capacity',
    base: 'J_kgK',
    units: {
      J_kgK: { label: 'J/(kg·K)', name: 'joule per kilogram kelvin', factor: 1 },
      kJ_kgK: { label: 'kJ/(kg·K)', name: 'kilojoule per kilogram kelvin', factor: 1e3 },
      btu_lbF: { label: 'Btu/(lb·°F)', name: 'Btu per pound Fahrenheit', factor: 4186.8 },
    },
  },
  second_moment_of_area: {
    name: 'Second moment of area',
    base: 'm4',
    units: {
      m4: { label: 'm⁴', name: 'metre to the fourth', factor: 1 },
      cm4: { label: 'cm⁴', name: 'centimetre to the fourth', factor: 1e-8 },
      mm4: { label: 'mm⁴', name: 'millimetre to the fourth', factor: 1e-12 },
      in4: { label: 'in⁴', name: 'inch to the fourth', factor: 4.162314256e-7 },
    },
  },
  mass_moment_of_inertia: {
    name: 'Mass moment of inertia',
    base: 'kg_m2',
    units: {
      kg_m2: { label: 'kg·m²', name: 'kilogram square metre', factor: 1 },
      g_cm2: { label: 'g·cm²', name: 'gram square centimetre', factor: 1e-7 },
      kg_mm2: { label: 'kg·mm²', name: 'kilogram square millimetre', factor: 1e-6 },
      lb_ft2: { label: 'lb·ft²', name: 'pound square foot', factor: 0.45359237 * 0.09290304 },
      lb_in2: { label: 'lb·in²', name: 'pound square inch', factor: 0.45359237 * 0.00064516 },
      slug_ft2: { label: 'slug·ft²', name: 'slug square foot', factor: 14.593902937 * 0.09290304 },
    },
  },
  section_modulus: {
    name: 'Section modulus',
    base: 'm3',
    units: {
      m3: { label: 'm³', name: 'cubic metre', factor: 1 },
      cm3: { label: 'cm³', name: 'cubic centimetre', factor: 1e-6 },
      mm3: { label: 'mm³', name: 'cubic millimetre', factor: 1e-9 },
      in3: { label: 'in³', name: 'cubic inch', factor: 1.6387064e-5 },
    },
  },
  line_load: {
    name: 'Distributed load',
    base: 'N_m',
    units: {
      N_m: { label: 'N/m', name: 'newton per metre', factor: 1 },
      kN_m: { label: 'kN/m', name: 'kilonewton per metre', factor: 1e3 },
      kgf_m: { label: 'kgf/m', name: 'kilogram-force per metre', factor: 9.80665 },
      lbf_ft: { label: 'lbf/ft', name: 'pound-force per foot', factor: 14.593902937206 },
    },
  },
  apparent_power: {
    name: 'Apparent power',
    base: 'VA',
    units: {
      VA: { label: 'VA', name: 'volt-ampere', factor: 1 },
      kVA: { label: 'kVA', name: 'kilovolt-ampere', factor: 1e3 },
      MVA: { label: 'MVA', name: 'megavolt-ampere', factor: 1e6 },
    },
  },
  reactive_power: {
    name: 'Reactive power',
    base: 'var',
    units: {
      var: { label: 'var', name: 'volt-ampere reactive', factor: 1 },
      kvar: { label: 'kvar', name: 'kilovolt-ampere reactive', factor: 1e3 },
      Mvar: { label: 'Mvar', name: 'megavolt-ampere reactive', factor: 1e6 },
    },
  },
  voltage: {
    name: 'Voltage',
    base: 'V',
    units: {
      V: { label: 'V', name: 'volt', factor: 1 },
      kV: { label: 'kV', name: 'kilovolt', factor: 1e3 },
      mV: { label: 'mV', name: 'millivolt', factor: 1e-3 },
    },
  },
  current: {
    name: 'Electric current',
    base: 'A',
    units: {
      A: { label: 'A', name: 'ampere', factor: 1 },
      kA: { label: 'kA', name: 'kiloampere', factor: 1e3 },
      mA: { label: 'mA', name: 'milliampere', factor: 1e-3 },
    },
  },
  stiffness: {
    name: 'Stiffness (spring rate)',
    base: 'N_m',
    units: {
      N_m: { label: 'N/m', name: 'newton per metre', factor: 1 },
      N_mm: { label: 'N/mm', name: 'newton per millimetre', factor: 1000 },
      kN_m: { label: 'kN/m', name: 'kilonewton per metre', factor: 1000 },
      lbf_in: { label: 'lbf/in', name: 'pound-force per inch', factor: 4.4482216152605 / 0.0254 },
    },
  },
  current_density: {
    name: 'Current density',
    base: 'A_m2',
    units: {
      A_m2: { label: 'A/m²', name: 'ampere per square metre', factor: 1 },
      mA_m2: { label: 'mA/m²', name: 'milliampere per square metre', factor: 1e-3 },
      mA_ft2: { label: 'mA/ft²', name: 'milliampere per square foot', factor: 1e-3 / 0.09290304 },
    },
  },
  spreading_rate: {
    name: 'Spreading rate',
    base: 'm2_L',
    units: {
      m2_L: { label: 'm²/L', name: 'square metre per litre', factor: 1 },
      ft2_gal_us: { label: 'ft²/US gal', name: 'square foot per US gallon', factor: 0.09290304 / 3.785411784 },
    },
  },
  humidity_ratio: {
    name: 'Humidity ratio',
    base: 'g_kg',
    units: {
      g_kg: { label: 'g/kg', name: 'gram of water vapour per kilogram of dry air', factor: 1 },
      kg_kg: { label: 'kg/kg', name: 'kilogram per kilogram of dry air', factor: 1000 },
      gr_lb: { label: 'gr/lb', name: 'grain per pound of dry air', factor: 1 / 7 },
    },
  },
  resistance: {
    name: 'Electrical resistance',
    base: 'ohm',
    units: {
      ohm: { label: 'Ω', name: 'ohm', factor: 1 },
      mohm: { label: 'mΩ', name: 'milliohm', factor: 1e-3 },
      kohm: { label: 'kΩ', name: 'kilohm', factor: 1e3 },
      Mohm: { label: 'MΩ', name: 'megohm', factor: 1e6 },
    },
  },
  resistivity: {
    name: 'Electrical resistivity',
    base: 'ohm_m',
    units: {
      ohm_m: { label: 'Ω·m', name: 'ohm metre', factor: 1 },
      ohm_mm2_m: { label: 'Ω·mm²/m', name: 'ohm square millimetre per metre', factor: 1e-6 },
    },
  },
  acceleration: {
    name: 'Acceleration',
    base: 'm_s2',
    units: {
      m_s2: { label: 'm/s²', name: 'metre per second squared', factor: 1 },
      g: { label: 'g', name: 'standard gravity', factor: 9.80665 },
      ft_s2: { label: 'ft/s²', name: 'foot per second squared', factor: 0.3048 },
    },
  },
  frequency: {
    name: 'Frequency',
    base: 'Hz',
    units: {
      Hz: { label: 'Hz', name: 'hertz', factor: 1 },
      kHz: { label: 'kHz', name: 'kilohertz', factor: 1e3 },
      MHz: { label: 'MHz', name: 'megahertz', factor: 1e6 },
    },
  },
  resistance_per_length: {
    name: 'Resistance per length',
    base: 'ohm_km',
    units: {
      ohm_km: { label: 'Ω/km', name: 'ohm per kilometre', factor: 1 },
      mohm_m: { label: 'mΩ/m', name: 'milliohm per metre', factor: 1 },
      ohm_kft: { label: 'Ω/1000 ft', name: 'ohm per thousand feet', factor: 1 / 0.3048 },
    },
  },
  thermal_expansion: {
    name: 'Thermal expansion coefficient',
    base: 'per_K',
    units: {
      per_K: { label: '1/K', name: 'per kelvin (per °C)', factor: 1 },
      ppm_K: { label: 'µm/(m·K)', name: 'micrometre per metre kelvin (ppm/K)', factor: 1e-6 },
      per_F: { label: '1/°F', name: 'per degree Fahrenheit', factor: 1.8 },
      ppm_F: { label: 'µin/(in·°F)', name: 'microinch per inch Fahrenheit (ppm/°F)', factor: 1.8e-6 },
    },
  },
  linear_density: {
    name: 'Mass per length',
    base: 'kg_m',
    units: {
      kg_m: { label: 'kg/m', name: 'kilogram per metre', factor: 1 },
      lb_ft: { label: 'lb/ft', name: 'pound per foot', factor: 0.45359237 / 0.3048 },
      kg_km: { label: 'kg/km', name: 'kilogram per kilometre', factor: 0.001 },
      lb_kft: { label: 'lb/1000 ft', name: 'pound per thousand feet', factor: 0.45359237 / 304.8 },
    },
  },
  specific_energy: {
    name: 'Specific energy (calorific value)',
    base: 'J_kg',
    units: {
      J_kg: { label: 'J/kg', name: 'joule per kilogram', factor: 1 },
      kJ_kg: { label: 'kJ/kg', name: 'kilojoule per kilogram', factor: 1e3 },
      btu_lb: { label: 'Btu/lb', name: 'Btu (IT) per pound', factor: 2326 },
      MJ_kg: { label: 'MJ/kg', name: 'megajoule per kilogram', factor: 1e6 },
      kcal_kg: { label: 'kcal/kg', name: 'kilocalorie per kilogram', factor: 4184 },
      btu_lb: { label: 'Btu/lb', name: 'Btu (IT) per pound', factor: 2326 },
    },
  },
  carbon_intensity: {
    name: 'Carbon intensity',
    base: 'g_cap_nmi',
    units: {
      g_cap_nmi: { label: 'g CO₂/(cap·nmi)', name: 'gram CO₂ per capacity unit (DWT or GT) and nautical mile', factor: 1 },
    },
  },
  ghg_intensity: {
    name: 'GHG intensity of energy',
    base: 'gCO2e_MJ',
    units: {
      gCO2e_MJ: { label: 'gCO₂e/MJ', name: 'gram CO₂ equivalent per megajoule (well-to-wake)', factor: 1 },
      kgCO2e_GJ: { label: 'kgCO₂e/GJ', name: 'kilogram CO₂ equivalent per gigajoule', factor: 1 },
      gCO2e_kWh: { label: 'gCO₂e/kWh', name: 'gram CO₂ equivalent per kilowatt hour', factor: 1 / 3.6 },
    },
  },
  thermal_resistance_area: {
    name: 'Fouling resistance',
    base: 'm2K_W',
    units: {
      m2K_W: { label: 'm²·K/W', name: 'square metre kelvin per watt', factor: 1 },
      hft2F_Btu: { label: 'h·ft²·°F/Btu', name: 'hour square foot Fahrenheit per Btu', factor: 0.17611018 },
    },
  },
  electric_charge: {
    name: 'Electric charge (battery capacity)',
    base: 'C',
    units: {
      C: { label: 'C', name: 'coulomb', factor: 1 },
      mAh: { label: 'mAh', name: 'milliampere-hour', factor: 3.6 },
      Ah: { label: 'Ah', name: 'ampere-hour', factor: 3600 },
      kAh: { label: 'kAh', name: 'kiloampere-hour', factor: 3.6e6 },
    },
  },
  capacitance: {
    name: 'Capacitance',
    base: 'F',
    units: {
      F: { label: 'F', name: 'farad', factor: 1 },
      mF: { label: 'mF', name: 'millifarad', factor: 1e-3 },
      uF: { label: 'µF', name: 'microfarad', factor: 1e-6 },
      nF: { label: 'nF', name: 'nanofarad', factor: 1e-9 },
      pF: { label: 'pF', name: 'picofarad', factor: 1e-12 },
    },
  },
};

/** Standard gravity, m/s² (BIPM, 3rd CGPM 1901). Shared by every calculator that needs it. */
export const GRAVITY_M_S2 = 9.80665;

/**
 * Return a unit group definition or throw a clear error.
 * @param {string} groupId
 */
export function getGroup(groupId) {
  const group = UNIT_GROUPS[groupId];
  if (!group) throw new Error(`Unknown unit group "${groupId}"`);
  return group;
}

/**
 * Return a unit definition within a group or throw a clear error.
 * @param {string} groupId
 * @param {string} unitId
 */
export function getUnit(groupId, unitId) {
  const group = getGroup(groupId);
  const unit = group.units[unitId];
  if (!unit) throw new Error(`Unknown unit "${unitId}" in group "${groupId}" (known: ${Object.keys(group.units).join(', ')})`);
  return unit;
}

/** Convert a value expressed in `unitId` to the group's base unit. */
export function toBase(value, unitId, groupId) {
  const unit = getUnit(groupId, unitId);
  return (value + (unit.offset || 0)) * unit.factor;
}

/** Convert a value expressed in the group's base unit to `unitId`. */
export function fromBase(baseValue, unitId, groupId) {
  const unit = getUnit(groupId, unitId);
  return baseValue / unit.factor - (unit.offset || 0);
}

/**
 * Convert a value between two units of the same group.
 * @param {number} value
 * @param {string} fromUnitId
 * @param {string} toUnitId
 * @param {string} groupId
 * @returns {number}
 */
export function convert(value, fromUnitId, toUnitId, groupId) {
  if (fromUnitId === toUnitId) return value;
  return fromBase(toBase(value, fromUnitId, groupId), toUnitId, groupId);
}

/** Display label of a unit (e.g. "m/s"). */
export function unitLabel(groupId, unitId) {
  return getUnit(groupId, unitId).label;
}

/** Ordered list of `{ id, label, name }` for the dropdown of a group. */
export function unitsOf(groupId) {
  const group = getGroup(groupId);
  return Object.entries(group.units).map(([id, unit]) => ({ id, label: unit.label, name: unit.name }));
}
