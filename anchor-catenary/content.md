# Anchor cable catenary and scope calculator

**Summary:** Anchor cable catenary: chain on the bottom, uplift at the anchor, tension at the hawse, maximum force before the anchor lifts, wind force, holding capacity and swinging radius.

## Introduction

An anchor holds only while the pull on it is horizontal; the moment the cable lifts off the seabed at the shank, the anchor begins to break out. The cable's own weight, hanging in a catenary, is what keeps the pull horizontal and absorbs gusts, which is why the amount of chain paid out, the scope, matters more than the anchor itself in most anchorages. This calculator solves the catenary for the depth to the hawse pipe, the chain weight and the horizontal force on the ship: how much cable lies on the bottom, the uplift angle if the cable is too short, the horizontal reach and swinging radius, the tension at the hawse, and the maximum force the paid-out cable can take before the anchor lifts. It estimates the wind force from the windage area and compares the load with a rough holding capacity of the anchor.

It is for masters and officers choosing how much cable to veer, for planners of anchorage layouts, and for cadets learning why "more cable" is the answer to a dragging anchor.

## Formulas

Chain weight:

    m [kg/m] = 0.0219 d²          (d in mm, ISO 1704 stud-link approximation)
    w = m g (1 − ρ_water/ρ_steel)   submerged weight per metre, N/m

Catenary with horizontal tension H (parameter a = H/w), hawse pipe D above the seabed:

    Cable needed for a horizontal pull at the anchor:   s = √(D² + 2 a D)
    If L ≥ s:   cable on the bottom = L − s,   uplift = 0,
                horizontal reach x = a asinh(s/a) + (L − s),   hawse tension T = H + w D
    If L < s:   the cable is fully suspended; the uplift angle θ at the anchor follows from
                D = √(a² + (s₀ + L)²) − √(a² + s₀²),  tan θ = s₀ / a   (solved numerically)
    Maximum H without uplift for a cable L:   H_max = w (L² − D²) / (2 D)

Environmental force and holding:

    F_wind = ½ ρ_air C_d A V²
    Holding capacity = m_anchor g × holding coefficient
    Scope = L / D
    Swinging radius = x + ship length

Rules of thumb (Admiralty Manual of Seamanship): cable in shackles ≈ 1.5 √D (D in metres); scope 6 × depth in normal conditions, up to 10 × in heavy weather.

- D — seabed to hawse pipe (water depth + hawse height above the waterline); L — cable paid out; A — frontal windage area; C_d — drag coefficient (OCIMF head-wind values 0.7–1.1)

## Assumptions and limitations

- Ideal inextensible catenary in still water on a flat, horizontal seabed; the grounded chain lies straight along the line of pull and its friction is not counted as holding.
- Static loading. Yawing, pitching and snatching in a seaway can double the cable tension; a scope that is adequate statically may still snatch.
- The wind force uses a single drag coefficient on the frontal area; beam-on wind with a yawing ship, current and waves must be added through the "other force" input or a proper OCIMF calculation.
- Chain mass from the ISO 1704 approximation; actual grades and manufacturers vary by a few per cent (enter the catalogue mass if known).
- Holding coefficients are crude (ordinary stockless 3–4, high-holding-power 6–10 in sand, less in soft mud or on rock) and depend on burial and fluke angle; the margin is indicative only.
- Holding reduction with uplift angle is not quantified; any uplift is treated as a warning.
- The swinging radius assumes the ship lies back along the cable; with wind against tide the ship may lie differently.

## Worked example

Bulk carrier, 76 mm stud-link chain, anchored in 25 m of water with the hawse pipe 5 m above the waterline (D = 30 m), five shackles (137.5 m) paid out, 30 knots of wind on 1 500 m² of windage, 7 800 kg HHP anchor in sand.

1. Chain: m = 0.0219 × 76² = 126.5 kg/m; submerged weight w = 126.5 × 9.81 × (1 − 1025/7850) = 1 078 N/m.
2. Wind force: ½ × 1.225 × 1.0 × 1 500 × 15.43² = 219 kN. Catenary parameter a = 219 000 / 1 078 = 203 m.
3. Cable needed for a horizontal pull: √(30² + 2 × 203 × 30) = 114 m → 23 m of the 137.5 m lie on the bottom; the pull at the anchor is horizontal. Horizontal reach ≈ 109 m suspended + 23 m on the bottom = 132 m; swinging radius ≈ 132 + 190 = 322 m.
4. Hawse tension: 219 + 1.078 × 30 = 251 kN.
5. Maximum force before uplift with 137.5 m: 1 078 × (137.5² − 30²) / 60 = 324 kN, i.e. about 36 knots of wind on this area. Beyond that the anchor starts to lift: veer another shackle or two before the wind reaches that.
6. Holding: 7 800 × 9.81 × 7 = 535 kN, margin 2.4 over the static force — adequate, but the dynamic loads in a swell are not included.

## FAQ

**Why does more cable help more than a bigger anchor?**
The weight of the suspended chain is what keeps the pull horizontal and damps the surges; a heavier anchor with a short cable still breaks out as soon as the cable lifts at the shank.

**How much cable should I use?**
Common guidance: 1.5 √D shackles as a minimum in fair weather, a scope of 6 in normal conditions and up to 10 in heavy weather, more in poor holding ground. Check the swinging room and the maximum force the cable can take with this calculator.

**What is the uplift angle?**
The angle between the seabed and the cable at the anchor when the chain is too short to lie flat. Even a few degrees reduce the holding of many anchor types markedly; the aim is zero.

**Does the depth include the hawse pipe height?**
Yes: the catenary runs from the seabed to the hawse pipe, so D is the water depth plus the height of the hawse above the waterline at the current draft, and it changes with the tide.

**What C_d should I use for wind?**
About 0.7–0.9 for tankers and bulk carriers head to wind, up to 1.1 for ships with high superstructures or when yawing presents a larger area. OCIMF MEG4 gives coefficients by ship type and heading.

**My holding margin looks fine but the ship dragged. Why?**
Dynamic loads (yawing, snatching in swell), poor holding ground, a fouled anchor or an uplift during a yaw. The static check is a necessary condition, not a sufficient one.

**Can I use this for a mooring chain or a wire?**
The catenary mathematics is the same with the correct submerged weight per metre; wire has far less weight, so it provides little catenary compliance and the uplift condition arrives much earlier.

## Related calculators

- [Beaufort, wind speed and sea state converter](../beaufort-sea-state/index.html) — wind speed for the force estimate.
- [Tidal height (rule of twelfths)](../tidal-height/index.html) — the depth at the anchorage through the tide.
- [Ship squat and under-keel clearance](../ship-squat/index.html) — clearance when leaving the anchorage.
- [Engineering unit converter](../unit-converter/index.html) — shackles, fathoms and kN to tonnes-force.
