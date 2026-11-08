# Berthing energy and fender selection calculator

**Summary:** PIANC berthing energy from displacement, approach velocity and the mass, eccentricity, configuration and softness factors; fender energy and reaction.

## Introduction

A ship arriving at a quay carries kinetic energy that the fenders must absorb without damaging the hull or the structure. The energy is small per tonne but the tonnes are many: a laden Suezmax touching at 15 cm/s carries more than a megajoule. PIANC's 2002 guidelines give the standard way to estimate it: the ship's kinetic energy at the design berthing velocity, increased for the water dragged along (added mass) and reduced because an off-centre contact sets the ship rotating (eccentricity), with smaller adjustments for the berth structure and the fender stiffness, then multiplied by a safety factor for abnormal berthings. This calculator applies that method with the Brolsma design velocities and checks a chosen fender's rated energy, reaction and hull pressure.

It is for port and terminal engineers sizing fenders, naval architects checking hull pressures and students of port design; the 2024 PIANC WG211 guidelines supersede the 2002 method for new specifications that cite them.

## Formulas

Normal and abnormal berthing energy:

    E_N = ½ M_D v_B² C_M C_E C_C C_S        E_A = E_N × factor of safety
    C_B = M_D / (ρ L_BP B D)

Added mass C_M:

    PIANC 2002:  1.8 for K_C/D ≤ 0.1;  1.5 for K_C/D ≥ 0.5;  1.875 − 0.75 K_C/D between  (then C_C = 1)
    Vasco Costa: 1 + 2D/B           Ueda: 1 + πD / (2 C_B B)

Eccentricity (side berthing, contact at x from the bow, berthing angle α):

    K = (0.19 C_B + 0.11) L_BP,   R = √((L/2 − x)² + (B/2)²),   γ = 90° − α − asin(B / 2R)
    C_E = (K² + R² cos²γ) / (K² + R²)

Berth configuration C_C (with Vasco Costa or Ueda): solid quay 0.8 (K_C/D ≤ 0.5) or 0.9, partly closed 0.9 or 1.0, open piles 1.0; 1.0 whenever α > 5°. Softness C_S: 0.9 for hard fenders (deflection ≤ 150 mm), else 1.0.

Design velocity: Brolsma curves (BS 6349-4:2014 Fig. 9) by displacement and navigation condition a–e, minimum 0.08 m/s. Abnormal factors (PIANC Table 4.2.5): tankers and bulk carriers 1.25 (large) to 1.75 (small), container ships 1.5 to 2.0, general cargo 1.75, RoRo, ferries, cruise ships and tugs 2.0.

Fender check: E_RPD ≥ E_A (before tolerance, angle, temperature and velocity factors); hull pressure = R_F / panel area against the class allowable (tankers and bulk 150–300 kPa, container 200–400 kPa, general cargo 400–700 kPa).

## Assumptions and limitations

- PIANC WG33 (2002) method as used by BS 6349-4 and most existing specifications. PIANC WG211 (2024) removes C_C and C_S and revises velocities; use it where the specification requires.
- Displacement at berthing, not necessarily full load; the velocity is the component perpendicular to the berth.
- The eccentricity formula assumes contact at the parallel body with a small berthing angle; PIANC warns about the special case γ = 90°, and very small γ (contact in line with the velocity) is sensitive.
- Brolsma velocities assume tug assistance and conventional ships; without tugs multiply by 1.3–3 (EAU 2004, ROM 2.0-11). Measured velocities are better.
- Fender rated energy must still be derated for manufacturing tolerance, compression angle, temperature and velocity; multiple-fender contact and panel bending are not treated.

## Worked example

A laden 100 000 DWT tanker (M_D 125 000 t, L_BP 236 m, B 43 m, D 15.1 m) berths against dolphins (third-point contact) at 5°, with 3 m under the keel and a measured approach of 0.15 m/s.

1. C_B = 125 000 / (1.025 × 236 × 43 × 15.1) = 0.796.
2. Added mass (PIANC): K_C/D = 0.199 → C_M = 1.875 − 0.75 × 0.199 = 1.726; C_C = 1.0.
3. Eccentricity: K = (0.19 × 0.796 + 0.11) × 236 = 61.7 m; R = √(39.3² + 21.5²) = 44.8 m; γ = 90 − 5 − asin(43/89.6) = 56.3°; C_E = (61.7² + 44.8² cos² 56.3°)/(61.7² + 44.8²) = 0.761.
4. Energy: ½ × 125 000 × 0.15² = 1 406 kJ; E_N = 1 406 × 1.726 × 0.761 × 1.0 × 1.0 = 1 847 kJ. Factor 1.25 for a large tanker → E_A = 2 309 kJ.
5. A fender rated at 2 500 kJ / 2 200 kN on a 12 m² panel: energy OK with 8 % margin before derating; hull pressure 183 kPa, within the 200 kPa allowable for a VLCC-class hull.

Using the Brolsma curve for condition c (easy berthing, exposed) instead of the measured speed gives 0.12 m/s for 125 000 t and about 36 % less energy.

## FAQ

**Which velocity should I design for?**
Measured data from the berth if available; otherwise the Brolsma curve for the navigation condition, remembering that curves d and e are considered high by PIANC and that berthing without tugs is much faster.

**Why does the added mass depend on under-keel clearance?**
With little water under the keel the entrained water cannot escape and more of it moves with the ship, raising the effective mass towards 1.8 times the displacement.

**What does the eccentricity coefficient do?**
An off-centre contact makes the ship yaw; the rotational energy is not absorbed by the fender. For a third-point contact only about three quarters of the kinetic energy goes into the fender.

**Normal versus abnormal energy?**
The normal energy occurs routinely and must not damage the fender; the abnormal energy covers rare events (exceptional ship, human error, equipment failure) and the fender must still absorb it without significant damage.

**How do I choose the hull pressure limit?**
From the ship class: tankers and bulk carriers can take 150–300 kPa, container ships 200–400 kPa depending on size, general cargo up to 700 kPa; RoRo and ferries usually have beltings and are not pressure-limited in the same way.

**Can I use the 2024 PIANC method here?**
Not directly: WG211 drops C_C and C_S (set both to 1.0 here to approximate) and specifies new velocity guidance; the structure of the energy formula is otherwise the same.

**Does berthing angle matter much?**
Through γ in the eccentricity factor and through the single-fender contact at larger angles; above about 10° the first contact is near the bow and one fender takes the whole energy.

## Related calculators

- [Hydrostatics basics](../hydrostatics/index.html) — displacement and block coefficient from the particulars.
- [Anchor cable catenary and scope](../anchor-catenary/index.html) — the other holding problem at the berth.
- [Lifting sling and wire rope load](../lifting-sling/index.html) — mooring and lifting hardware ratings.
- [Wave properties and encounter period](../wave-properties/index.html) — exposure of the berth to waves.
