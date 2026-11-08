# kW to amps calculator

**Summary:** Current from kW for single-phase, three-phase and DC loads, including motors from their shaft kW and efficiency, with the power factor.

## Introduction

Larger equipment is rated in kilowatts: heaters, chillers, chargers, pumps and motors. Before choosing a breaker, a contactor or a cable, the kilowatts must become amps. For three-phase supplies that means √3 and the power factor. For motors there is one more trap: the nameplate kW is the shaft output, not the power taken from the supply.

This calculator converts kW to amps for three-phase, single-phase and DC supplies. It can treat the kW either as the electrical power drawn or as a motor's nameplate output, which it divides by the efficiency first. It also gives the apparent power in kVA, which is what transformers and generators are sized on. It is for electricians, electrical and building-services engineers, and maintenance staff.

## Formulas

Electrical input power:

    P_in = P                 (electrical load)
    P_in = P_shaft / η       (motor nameplate)

Current:

    three-phase:   I = P_in / (√3 × V × cos φ)
    single-phase:  I = P_in / (V × cos φ)
    DC:            I = P_in / V

Apparent power:

    S = P_in / cos φ

- V — voltage, V (line-to-line for three-phase)
- cos φ — power factor (motors about 0.8 to 0.9 at full load)
- η — motor efficiency (IE3 motors about 0.89 at 5 kW to 0.95 at 100 kW)

## Assumptions and limitations

- For a motor the kW on the nameplate are mechanical output (IEC 60034-1). The calculator adds the motor's losses through its efficiency.
- The power factor and efficiency are full-load values. At part load a motor's power factor drops, so its current falls more slowly than its kW.
- For three-phase the load is balanced and the voltage is line-to-line.
- This is the running current. Motors started direct on line draw 6 to 8 times as much for a few seconds; see the motor starting calculator.

## Worked example

A 22 kW electric heater bank runs on 400 V three-phase. Its controller gives a power factor of 0.85. What current does it draw?

1. Electrical input: P_in = 22 kW.
2. Current: I = 22 000 / (1.732 × 400 × 0.85) = 37.4 A per line.
3. Apparent power: S = 22 / 0.85 = 25.9 kVA.

If the 22 kW were a motor's nameplate output at 93 % efficiency, the input would be 23.7 kW and the current 40.2 A, which is why motor circuits are sized on the input power, not the nameplate kW.

## FAQ

**How many amps is 1 kW?**
At 400 V three-phase and power factor 1, 1.44 A; at 230 V single-phase, 4.35 A; at 480 V three-phase, 1.20 A.

**Why √3 for three-phase?**
Three phases carry the power together, and the line-to-line voltage is √3 times the phase voltage. Combined, the power is √3 × V × I × cos φ.

**Is a motor's kW the input or the output?**
The output at the shaft. The input is higher by the efficiency: a 22 kW motor at 93 % efficiency draws 23.7 kW.

**What power factor should I use for a motor?**
The nameplate value at full load, typically 0.80 to 0.90. Small motors and lightly loaded motors are lower.

**How do I choose a breaker from the current?**
Take the full-load current, apply the local rules (often 125 % for continuous loads in North America) and allow for motor starting with a motor-rated breaker or fuse.

**What is the current of a 100 kW motor?**
At 400 V three-phase with 95 % efficiency and power factor 0.87, about 175 A.

## Related calculators

- [Amps to kW](../amps-to-kw/index.html) — the conversion the other way.
- [Watts to amps](../watts-to-amps/index.html) — small loads in watts.
- [Three-phase power and motor current](../three-phase-power/index.html) — motor starting and power-factor correction too.
- [kVA to amps](../kva-to-amps/index.html) — transformers and generators rated in kVA.
