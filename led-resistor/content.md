# LED series resistor calculator

**Summary:** Series resistor for an LED or a string of LEDs: exact value, next standard value, actual current, resistor power and the rating to buy.

## Introduction

An LED must never be connected straight across a voltage source. Its current rises steeply once the forward voltage is reached, and without something to limit it the LED burns out within moments. The simplest limit is a resistor in series, which takes up the difference between the supply and the LED's forward voltage at the current you choose.

This calculator finds that resistor for one LED or for several LEDs in series. It returns the exact value, the next standard E12 or E24 value above it so the current never exceeds your target, the current that value actually gives, the power in the resistor, and the rating to buy. Typical forward voltages for each colour are built in, or you can enter the data-sheet value. It is for hobbyists, students and engineers wiring indicator lamps and small lighting.

## Formulas

Series resistor:

    R = (V_s − n × V_f) / I

Current with the standard resistor R_std, and powers:

    I = (V_s − n × V_f) / R_std
    P_R = I² × R_std
    P_LED = n × V_f × I

Resistor rating: the smallest standard rating at least twice P_R.

- V_s — supply voltage
- V_f — forward voltage of one LED at the design current
- n — number of LEDs in series
- I — LED current

## Assumptions and limitations

- The forward voltage is taken as constant at the design current. The built-in values are typical, and the same colour can differ by about 0.2 V between makers, so the data-sheet value is better.
- The supply is a steady DC voltage. For a battery, use its highest voltage, so a fresh battery does not overdrive the LED.
- The resistor chosen is the next standard value above the exact one, so the actual current is at or below your target.
- LEDs in parallel strings each need their own resistor, because their forward voltages never match exactly.
- Power LEDs of 350 mA and more are better driven by a constant-current driver than by a resistor.

## Worked example

A white LED is to run at 20 mA from a 5 V supply. Which resistor is needed?

1. Forward voltage of a white LED: about 3.2 V, so the resistor takes 5 − 3.2 = 1.8 V.
2. Exact resistor: R = 1.8 / 0.020 = 90 Ω.
3. 90 Ω is not a standard value; the next E24 value above it is 91 Ω.
4. Actual current: I = 1.8 / 91 = 19.8 mA, just under the target.
5. Power in the resistor: P = 0.0198² × 91 = 0.036 W. Twice that is 0.072 W, so a 1/8 W resistor is enough.

With three red LEDs (2.0 V each) in series on 12 V at 20 mA, the resistor is (12 − 6) / 0.02 = 300 Ω, which is itself an E24 value, and it dissipates 0.12 W, so a 1/4 W part is needed.

## FAQ

**Why do LEDs need a resistor?**
An LED's current climbs very steeply above its forward voltage, so a small change in supply voltage would change the current enormously. The resistor makes the current depend on the voltage difference, which is far more stable.

**What forward voltage should I use?**
The data sheet's typical value at your current. Red, orange and yellow LEDs are around 2 V, while blue, true green and white are around 3 to 3.3 V.

**Can several LEDs share one resistor?**
In series, yes: one resistor serves the whole string, provided the supply exceeds their total forward voltage with some margin. In parallel, no: each LED needs its own resistor.

**Why round up instead of to the nearest value?**
Rounding down would raise the current above your target. Rounding up lowers it slightly, which is safe and barely visible in brightness.

**How much current should an indicator LED have?**
Standard 5 mm indicator LEDs are usually rated at 20 mA maximum. Modern high-efficiency LEDs are bright at 2 to 10 mA, which also saves power.

**What if the supply is only slightly above the forward voltage?**
Then the resistor's voltage is small, and small changes in supply or forward voltage swing the current a lot. Keep at least 1 V across the resistor, or use a constant-current driver.

## Related calculators

- [Ohm's law and electrical power](../ohms-law/index.html) — the relation the resistor value comes from.
- [Voltage divider](../voltage-divider/index.html) — another two-element series circuit.
- [Resistor colour code](../resistor-color-code/index.html) — finding the 91 Ω part in the drawer.
- [Battery capacity and runtime](../battery-runtime/index.html) — how long a battery runs the LEDs.
