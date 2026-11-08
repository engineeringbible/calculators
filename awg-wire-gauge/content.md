# AWG wire gauge chart and converter

**Summary:** Diameter, mm², circular mils, resistance and weight of every AWG size from 4/0 to 40, or the gauge of a measured wire, with the matching metric size.

## Introduction

American Wire Gauge (AWG) is the wire size system used in North America. The numbers run backwards: the higher the gauge, the thinner the wire. 12 AWG, the usual size for a 20 A household circuit, is 2.05 mm across and has a cross-section of 3.31 mm². Every six gauges halve the diameter, and every three gauges halve the area.

This calculator gives the diameter, area in mm² and circular mils, resistance and weight of any gauge from 4/0 to 40, in copper or aluminium, solid or stranded, at any temperature. It also works backwards from a measured diameter or a metric cross-section to the gauge, and shows the metric IEC size to use instead. The full chart is in the next section.

## Formulas and AWG chart

ASTM B258 defines every gauge from two fixed points, 0000 at 0.4600 in and 36 at 0.0050 in, with 39 steps of equal ratio between them:

    d = 0.005 in × 92^((36 − n) / 39)
    A = π × d² / 4
    area in circular mils = (d in mils)²

Resistance and weight per unit length:

    R' = ρ20 × (1 + α (T − 20)) / A × k_s
    m' = ρ_m × A × k_s

- n — gauge number; 0 (1/0) is 0, 00 (2/0) is −1, 000 (3/0) is −2 and 0000 (4/0) is −3
- ρ20 — resistivity at 20 °C: copper 1.7241 × 10⁻⁸ Ω·m, aluminium 2.8264 × 10⁻⁸ Ω·m
- α — temperature coefficient: copper 0.00393 /K, aluminium 0.00403 /K
- k_s — 1.02 for concentric stranded conductors (ASTM B8), 1 for solid wire
- ρ_m — mass density: copper 8 890 kg/m³, aluminium 2 705 kg/m³

### AWG chart

Solid copper at 20 °C, from the formulas above. For stranded wire add 2 % to the resistance; for aluminium multiply the copper resistance by 1.64. The last column is the smallest IEC metric size with at least the same area.

| AWG | Diameter (in) | Diameter (mm) | Area (mm²) | Area (kcmil) | Copper Ω/km | Copper Ω/1000 ft | Next IEC size |
|---|---|---|---|---|---|---|---|
| 4/0 | 0.4600 | 11.684 | 107.2 | 211.6 | 0.161 | 0.0490 | 120 mm² |
| 3/0 | 0.4096 | 10.405 | 85.03 | 167.8 | 0.203 | 0.0618 | 95 mm² |
| 2/0 | 0.3648 | 9.266 | 67.43 | 133.1 | 0.256 | 0.0779 | 70 mm² |
| 1/0 | 0.3249 | 8.251 | 53.48 | 105.5 | 0.322 | 0.0983 | 70 mm² |
| 1 | 0.2893 | 7.348 | 42.41 | 83.69 | 0.407 | 0.124 | 50 mm² |
| 2 | 0.2576 | 6.544 | 33.63 | 66.37 | 0.513 | 0.156 | 35 mm² |
| 3 | 0.2294 | 5.827 | 26.67 | 52.63 | 0.646 | 0.197 | 35 mm² |
| 4 | 0.2043 | 5.189 | 21.15 | 41.74 | 0.815 | 0.248 | 25 mm² |
| 5 | 0.1819 | 4.621 | 16.77 | 33.10 | 1.028 | 0.313 | 25 mm² |
| 6 | 0.1620 | 4.115 | 13.30 | 26.25 | 1.296 | 0.395 | 16 mm² |
| 7 | 0.1443 | 3.665 | 10.55 | 20.82 | 1.634 | 0.498 | 16 mm² |
| 8 | 0.1285 | 3.264 | 8.366 | 16.51 | 2.061 | 0.628 | 10 mm² |
| 9 | 0.1144 | 2.906 | 6.634 | 13.09 | 2.599 | 0.792 | 10 mm² |
| 10 | 0.1019 | 2.588 | 5.261 | 10.38 | 3.277 | 0.999 | 6 mm² |
| 11 | 0.0907 | 2.305 | 4.172 | 8.234 | 4.132 | 1.260 | 6 mm² |
| 12 | 0.0808 | 2.053 | 3.309 | 6.530 | 5.211 | 1.588 | 4 mm² |
| 13 | 0.0720 | 1.828 | 2.624 | 5.178 | 6.571 | 2.003 | 4 mm² |
| 14 | 0.0641 | 1.628 | 2.081 | 4.107 | 8.285 | 2.525 | 2.5 mm² |
| 15 | 0.0571 | 1.450 | 1.650 | 3.257 | 10.45 | 3.184 | 2.5 mm² |
| 16 | 0.0508 | 1.291 | 1.309 | 2.583 | 13.17 | 4.015 | 1.5 mm² |
| 17 | 0.0453 | 1.150 | 1.038 | 2.048 | 16.61 | 5.063 | 1.5 mm² |
| 18 | 0.0403 | 1.024 | 0.823 | 1.624 | 20.95 | 6.385 | 1 mm² |
| 19 | 0.0359 | 0.912 | 0.653 | 1.288 | 26.41 | 8.051 | 0.75 mm² |
| 20 | 0.0320 | 0.812 | 0.518 | 1.022 | 33.31 | 10.15 | 0.75 mm² |
| 21 | 0.0285 | 0.723 | 0.410 | 0.810 | 42.00 | 12.80 | — |
| 22 | 0.0253 | 0.644 | 0.326 | 0.642 | 52.96 | 16.14 | — |
| 23 | 0.0226 | 0.573 | 0.258 | 0.509 | 66.78 | 20.36 | — |
| 24 | 0.0201 | 0.511 | 0.205 | 0.404 | 84.21 | 25.67 | — |
| 25 | 0.0179 | 0.455 | 0.162 | 0.320 | 106.2 | 32.37 | — |
| 26 | 0.0159 | 0.405 | 0.129 | 0.254 | 133.9 | 40.81 | — |
| 27 | 0.0142 | 0.361 | 0.102 | 0.202 | 168.9 | 51.47 | — |
| 28 | 0.0126 | 0.321 | 0.0810 | 0.160 | 212.9 | 64.90 | — |
| 29 | 0.0113 | 0.286 | 0.0642 | 0.127 | 268.5 | 81.83 | — |
| 30 | 0.0100 | 0.255 | 0.0509 | 0.101 | 338.5 | 103.2 | — |
| 31 | 0.0089 | 0.227 | 0.0404 | 0.0797 | 426.9 | 130.1 | — |
| 32 | 0.0080 | 0.202 | 0.0320 | 0.0632 | 538.3 | 164.1 | — |
| 33 | 0.0071 | 0.180 | 0.0254 | 0.0501 | 678.8 | 206.9 | — |
| 34 | 0.0063 | 0.160 | 0.0201 | 0.0398 | 856.0 | 260.9 | — |
| 35 | 0.0056 | 0.143 | 0.0160 | 0.0315 | 1079 | 329.0 | — |
| 36 | 0.0050 | 0.127 | 0.0127 | 0.0250 | 1361 | 414.8 | — |
| 37 | 0.0045 | 0.113 | 0.0100 | 0.0198 | 1716 | 523.1 | — |
| 38 | 0.0040 | 0.101 | 0.00797 | 0.0157 | 2164 | 659.6 | — |
| 39 | 0.0035 | 0.090 | 0.00632 | 0.0125 | 2729 | 831.8 | — |
| 40 | 0.0031 | 0.080 | 0.00501 | 0.00989 | 3441 | 1049 | — |

## Assumptions and limitations

- Diameters are those of solid round wire. A stranded conductor of the same gauge has the same metal area but a larger overall diameter, so measure stranded wire by its strand count and strand gauge, not by its outside diameter.
- Resistance is the DC value from ρ/A. Tinned copper, coated wire and real manufacturing tolerances give values a few percent higher.
- The metric size is the smallest IEC 60228 size at least as large in area. IEC conductors are specified by maximum resistance, so a 4 mm² conductor can carry slightly less copper than 4.00 mm².
- This page does not give the allowed current. Ampacity depends on the insulation rating, installation, bundling and ambient temperature, and is set by the wiring code: NEC Table 310.16 in the US, IEC 60364-5-52 elsewhere. Use the wire size calculator for the voltage drop.

## Worked example

What are the size and resistance of 12 AWG solid copper wire at 20 °C, and which metric cable replaces it?

1. Gauge number n = 12, so d = 0.005 × 92^(24 / 39) = 0.0808 in = 2.053 mm.
2. Area: A = π × 2.053² / 4 = 3.309 mm², or 80.8² = 6 530 circular mils.
3. Resistance at 20 °C: R' = 1.7241 × 10⁻⁸ / 3.309 × 10⁻⁶ = 5.211 × 10⁻³ Ω/m = 5.211 Ω/km, which is 1.588 Ω/1000 ft.
4. Weight: 8 890 × 3.309 × 10⁻⁶ = 0.0294 kg/m, or 19.8 lb per 1 000 ft.
5. The smallest IEC 60228 size with at least 3.309 mm² is 4 mm².

So 12 AWG copper is 2.05 mm thick with 3.31 mm² of copper, and 4 mm² is its metric replacement; 2.5 mm² would have 24 % less copper.

## FAQ

**What does the AWG number mean?**
It counts the drawing steps in the original wire-making process, which is why bigger numbers mean thinner wire. Today the sizes are fixed by the ASTM B258 formula.

**How many mm² is 12 AWG? And 14 AWG?**
12 AWG is 3.31 mm² and 14 AWG is 2.08 mm². The nearest metric sizes at least as large are 4 mm² and 2.5 mm².

**What is 1/0 or 4/0 wire?**
Sizes larger than 1 AWG are 1/0, 2/0, 3/0 and 4/0, spoken as one-aught to four-aught. 4/0 is 0.46 in across and 107 mm². Beyond 4/0, sizes are given in kcmil, starting at 250 kcmil.

**What is a kcmil or MCM?**
A circular mil is the area of a circle one mil, a thousandth of an inch, across. A kcmil, also written MCM, is 1 000 circular mils, about 0.5067 mm².

**How do I measure the gauge of a wire?**
Strip the insulation and measure the bare diameter with a micrometer, then enter it in the diameter mode. For stranded wire, measure one strand, find its gauge, and multiply its area by the number of strands.

**How much current can 12 AWG carry?**
The wiring code sets that, from the insulation and the installation. In US homes, NEC 240.4(D) limits the overcurrent protection of 12 AWG copper to 20 A and of 14 AWG to 15 A.

**Is aluminium wire the same gauge as copper for the same current?**
No. Aluminium has about 64 % more resistance, so it is usually two gauges larger for the same current and voltage drop.

## Related calculators

- [Wire size by voltage drop](../wire-size/index.html) — the smallest AWG and metric size for a circuit.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — IEC cable selection with reactance and power factor.
- [Ohm's law](../ohms-law/index.html) — voltage, current, resistance and power.
- [Unit converter](../unit-converter/index.html) — kcmil, mm², inches and more.
