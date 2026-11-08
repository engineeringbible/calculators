# Pump NPSH and suction lift calculator

**Summary:** NPSH available from suction conditions, vapour pressure and losses, margin against NPSH required and the maximum suction lift.

## Introduction

A centrifugal pump does not suck; the atmosphere (or the pressure in the suction vessel) pushes liquid into it, and only as far as the liquid's vapour pressure allows. The net positive suction head available is what remains of that push at the impeller eye after the static lift and the suction-line friction, and it must exceed the pump's NPSH required with a margin or the liquid flashes to vapour and the impeller cavitates. This calculator computes NPSH available from the surface pressure, liquid temperature, static head and line losses, compares it with the maker's NPSH required using the Hydraulic Institute margin rules, finds the maximum suction lift and the temperature at which a water pump would start to cavitate, and reports the suction specific speed and Thoma number.

It is for marine and plant engineers placing pumps relative to tanks (bilge, ballast, fuel transfer, boiler feed, condensate), for troubleshooting a noisy pump, and for students.

## Formulas

    NPSHa = (p_abs − p_v) / (ρ g) + z_s − h_f
    p_abs = p_atm + p_gauge             (absolute pressure on the liquid surface)
    margin = NPSHa − NPSHr,  ratio = NPSHa / NPSHr
    required NPSHa = max(NPSHr + margin_min, NPSHr × ratio_min)       (ANSI/HI 9.6.1: 0.6–1 m or 1.1–1.3)
    maximum lift:  z_max = −(required NPSHa + h_f − (p_abs − p_v)/(ρ g))

Water vapour pressure: IAPWS-IF97 region-4 saturation equation (steam tables; 2.339 kPa at 20 °C, 19.95 at 60 °C, 70.2 at 90 °C, 101.4 at 100 °C).

    N_ss = n √Q_gpm / NPSHr_ft^0.75        (US customary; > 11 000 prone to recirculation)
    σ = NPSHr / H                           (Thoma cavitation number)

## Assumptions and limitations

- Hydraulic Institute definitions; velocity head excluded on both sides. NPSHr is the 3 % head-drop value; incipient cavitation begins at 2–5 times that, hence the margins.
- The IF97 saturation curve is for pure water (0.01–100 °C here); seawater is about 2 % lower; other liquids need their own vapour pressure.
- Friction loss must be the suction-line loss at the duty flow including strainer, foot valve and entrance (pipe-flow calculator); it is the most often underestimated term.
- Air entrainment, vortexing at low tank levels, pre-rotation and transients are not covered; practical cold-water lifts rarely exceed 6–7 m.

## Worked example

A bilge pump with NPSHr 3 m at 100 m³/h and 1 450 rpm draws 20 °C water from a well 3 m below the impeller through a strainer and 12 m of pipe with 1 m of losses; open tank at sea level.

1. Vapour pressure 2.34 kPa; pressure head (101.325 − 2.34) × 1000 / (998 × 9.81) = 10.1 m (the theoretical lift).
2. NPSHa = 10.1 − 3 − 1 = 6.1 m. Margin 3.1 m, ratio 2.0: well above the required 4 m (max of 3 + 1 and 3 × 1.2). OK.
3. Maximum lift for this pump and line: 10.1 − 1 − 4 = 5.1 m.
4. The same layout pumping hot water would reach NPSHa = NPSHr at about 71 °C (vapour pressure 33 kPa). At 90 °C the pressure head is only 3.3 m, so the pump would need the liquid about 1.7 m above the impeller, not below it.
5. N_ss = 1 450 × √440 / 9.84^0.75 = 5 480 (comfortably below 11 000); σ = 3/40 = 0.075.

## FAQ

**Why can't a pump lift water 10 m?**
The 10 m is the atmospheric push with nothing left for friction, for the NPSH the impeller needs or for vapour pressure; after those, 5–7 m is the practical limit for cold water and zero for hot.

**What margin should I use?**
ANSI/HI 9.6.1 suggests at least 0.6–1 m or a ratio of 1.1–1.3 for ordinary pumps, more for high-energy pumps and for liquids with dissolved gas. The calculator applies the stricter of the two forms you enter.

**My pump cavitates although NPSHa exceeds NPSHr. Why?**
NPSHr is the 3 % head-drop point; damaging cavitation starts earlier. Also check the actual friction loss (fouled strainer), the actual flow (further out on the curve than designed) and air leaks.

**How does altitude affect it?**
Atmospheric pressure falls about 1.2 kPa per 100 m, i.e. 0.12 m of head; at 2 000 m the theoretical lift is 7.6 m instead of 10.1.

**Closed or pressurised tanks?**
Add the gauge pressure. For a liquid at its boiling point in the vessel (deaerator, condenser hotwell) the pressure head term is zero and only the static height above the pump remains.

**What is suction specific speed?**
A measure of how aggressively the impeller eye is designed; high values mean low NPSHr but a narrow stable operating range. Below about 11 000 (US units) is conventional.

**Does viscosity matter?**
It increases the friction loss (use the pipe-flow calculator with the actual viscosity) and, for very viscous liquids, the NPSHr itself.

## Related calculators

- [Pipe flow and pressure drop](../pipe-flow/index.html) — the suction-line friction loss.
- [Pump and fan affinity laws](../pump-affinity/index.html) — NPSHr scales with the square of speed.
- [Tank volume and partial fill](../tank-volume/index.html) — liquid level above the pump.
- [Fuel blending and heating viscosity](../fuel-blend-heating/index.html) — vapour pressure and viscosity of heated fuel.
