# Resistor colour code calculator

**Summary:** Resistance, tolerance and temperature coefficient from the colour bands of a 4, 5 or 6-band resistor, and the colour bands for any value.

## Introduction

Through-hole resistors are too small to print a value on, so they carry coloured bands instead. Each colour stands for a digit, a power of ten, a tolerance or a temperature coefficient, following the international standard IEC 60062. Reading them quickly is a basic skill on the bench, and checking a reading avoids the classic mistake of fitting a 47 kΩ part where 4.7 kΩ was meant.

This calculator reads 4, 5 and 6-band resistors. It gives the value, the tolerance, the lowest and highest values within tolerance, the temperature coefficient of six-band parts, and which standard E series the value belongs to. It also works the other way: enter a resistance and it lists the bands to look for. It is for students, hobbyists, technicians and anyone sorting a drawer of resistors.

## Formulas

The colour code (IEC 60062):

    black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, grey 8, white 9

Resistance:

    4 bands:     R = (10 d₁ + d₂) × 10^m
    5 or 6 bands: R = (100 d₁ + 10 d₂ + d₃) × 10^m

Multiplier band m: silver −2, gold −1, then the digit colours black 0 to white 9.

Tolerance band: brown ± 1 %, red ± 2 %, green ± 0.5 %, blue ± 0.25 %, violet ± 0.1 %, gold ± 5 %, silver ± 10 %, no band ± 20 %.

Range within tolerance:

    R_min = R (1 − t),   R_max = R (1 + t)

Sixth band, temperature coefficient in ppm/K: black 250, brown 100, red 50, yellow 25, green 20, orange 15, blue 10, violet 5, grey 1.

## Assumptions and limitations

- The colours follow IEC 60062:2016. Orange, yellow and grey tolerance bands have had different meanings in different editions, so they are not offered.
- Four-band resistors carry two significant digits and five- and six-band parts three. A value that needs more digits is rounded and flagged.
- Read from the end where the bands are grouped together. The tolerance band is usually set slightly apart, and gold or silver never comes first.
- Faded or heat-darkened bands are easy to misread, particularly red, orange and brown. When in doubt, measure the resistor out of circuit with a meter.
- The tolerance applies at 25 °C. The temperature coefficient adds its value in parts per million for every kelvin away from that.

## Worked example

A resistor has four bands: yellow, violet, red, gold. What is it?

1. First digit: yellow = 4. Second digit: violet = 7. Together they make 47.
2. Multiplier: red = 10², so the value is 47 × 100 = 4 700 Ω = 4.7 kΩ.
3. Tolerance: gold = ± 5 %.
4. Lowest value within tolerance: 4 700 × 0.95 = 4.465 kΩ. Highest: 4 700 × 1.05 = 4.935 kΩ.
5. 4.7 kΩ is in the E6 series, the most common values of all, and so in E12 and E24 as well.

A five-band resistor reading brown, black, black, brown, brown is 100 × 10¹ = 1 kΩ ± 1 %. Adding a red sixth band means a temperature coefficient of 50 ppm/K.

## FAQ

**Which end do I start reading from?**
The end where the bands are bunched together. The tolerance band, often gold or silver, is usually separated by a wider gap at the other end, and gold and silver are never the first band.

**What is the difference between 4, 5 and 6 bands?**
Four-band parts give two significant digits, which suits 5 % and 10 % resistors. Five-band parts give three digits for 1 % and tighter parts. The sixth band adds the temperature coefficient.

**What does gold mean as the third band of four?**
It is the multiplier ×0.1, used for values below 10 Ω. Green, blue, gold, gold is 5.6 Ω ± 5 %.

**How do I tell red from orange, or brown from red?**
Under warm light they look alike. Compare with a known resistor, use daylight, or measure the part.

**Why is my measured value slightly off?**
Within the tolerance band, that is normal. A gold-band 4.7 kΩ resistor can read anywhere from 4.465 to 4.935 kΩ. Also measure out of circuit, because parallel parts change the reading.

**What do surface-mount resistors use instead?**
A printed code: three or four digits where the last is the power of ten (472 = 4.7 kΩ), or the EIA-96 code of two digits and a letter for 1 % parts.

## Related calculators

- [Ohm's law and electrical power](../ohms-law/index.html) — what the resistor does in the circuit.
- [Voltage divider](../voltage-divider/index.html) — choosing standard values for a target voltage.
- [LED series resistor](../led-resistor/index.html) — another common resistor to identify.
- [Series and parallel resistors](../resistors-series-parallel/index.html) — combining parts to reach a value you don't have.
