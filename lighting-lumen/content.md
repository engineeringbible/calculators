# Lighting design (lumen method) calculator

**Summary:** Number of luminaires for a target illuminance from room index, utilisation and maintenance factors; power density.

## Introduction

How many light fittings does a room need? The lumen method answers for general lighting in a few steps: the room's proportions give a room index, the index and the surface reflectances give the fraction of each luminaire's light that reaches the working plane (the utilisation factor), dirt and lamp ageing take their share (the maintenance factor), and the rest is arithmetic against the illuminance the task requires. This calculator does that for EN 12464-1 task levels, lays the luminaires out in a grid, checks the spacing against the mounting height for uniformity, and reports the power density and energy, so an office, a workshop or an engine room can be lit to standard without a photometric program.

It is for electrical engineers and designers at concept stage, facility and ship managers checking an existing installation, and students; final designs use the manufacturer's photometric data in a lighting program.

## Formulas

    K = L W / (h_m (L + W))                      room index (h_m above the working plane)
    N = E A / (Φ UF MF)                          luminaires for the maintained illuminance E
    E_achieved = N Φ UF MF / A,   E_initial = E_achieved / MF
    SHR = max(spacing) / h_m  ≤ SHR_max          uniformity criterion
    power density = N P / A,   energy = N P × hours

Typical UF (direct luminaire, ceiling/walls/floor 70/50/20): K 1.0 → 0.45, 1.5 → 0.54, 2.0 → 0.59, 3.0 → 0.65, 5.0 → 0.70 (darker surfaces 10–15 % less). MF 0.8 clean, 0.67 dirty, 0.9 sealed LED in clean rooms. EN 12464-1: offices 500 lx, drawing 750, corridors 100, rough workshop 300, fine bench work 500; engine rooms 200 lx.

## Assumptions and limitations

- Average horizontal illuminance of a uniform grid; uniformity, glare (UGR), colour rendering, vertical illuminance, task and emergency lighting are not assessed.
- The built-in utilisation factors are indicative for a direct distribution; the luminaire's own UF table (for the actual reflectances) should replace them.
- The room-index formula needs L < 4 W; long corridors and L-shaped rooms are split into zones.
- Daylight and obstructions are ignored; dark machinery and racks lower the real illuminance.

## Worked example

An open-plan office 12 × 8 m, luminaires 3.05 m above the floor (2.3 m above the 0.75 m working plane), 500 lx maintained, 4 000 lm / 36 W LED panels, UF 0.55 from the photometric table, MF 0.8.

1. K = 96/(2.3 × 20) = 2.09.
2. N = 500 × 96/(4 000 × 0.55 × 0.8) = 27.3 → 28 luminaires in 4 rows × 7 columns.
3. Spacing 2.0 m across and 1.71 m along; SHR = 2.0/2.3 = 0.87, below the 1.5 limit: good uniformity.
4. Achieved 513 lx maintained (642 lx when new); power 1 008 W = 10.5 W/m², efficacy 111 lm/W, 2 520 kWh/year at 2 500 h.

The typical UF table for 70/50/20 reflectances would give UF 0.60 and 25.1 luminaires required (the 4 × 7 grid still installs 28, now at 557 lx); using the table for a budget and the manufacturer's data for the design is normal practice.

## FAQ

**Why a maintenance factor?**
Lamps lose output, luminaires and room surfaces get dirty; the installation is designed so that the illuminance never falls below the maintained value just before cleaning and relamping.

**What is the utilisation factor?**
The fraction of the luminaire's lumens that reach the working plane after interreflections; it rises with room index (large, low rooms) and bright surfaces and falls for narrow, tall or dark rooms.

**Where does the working plane sit?**
0.75–0.85 m above the floor for desks and benches, floor level for circulation and storage; h_m is measured from it, not from the floor.

**Why check the spacing-to-height ratio?**
If luminaires are too far apart for their height, the average may be fine but there will be dark patches between them; EN 12464-1 requires E_min/E_avg ≥ 0.6 on task areas.

**How do I use a manufacturer's data sheet?**
Read the luminaire lumens and the UF for your room index and reflectances, enter both, and the result matches a lumen-method program to a few per cent.

**What illuminance for an engine room?**
ISO 8995 and class practice use 200 lx general, with 300–500 lx at control stations and workbenches; corridors and stores 100 lx.

**Is 10 W/m² good?**
For a 500 lx office with LED, 8–12 W/m² is the current benchmark; fluorescent installations were 12–18 W/m².

## Related calculators

- [Three-phase power and motor current](../three-phase-power/index.html) — lighting load on the distribution board.
- [Cable sizing and voltage drop](../cable-sizing/index.html) — lighting circuits.
- [Solar PV array and storage sizing](../solar-pv-sizing/index.html) — supplying the lighting load off-grid.
- [Generator load, kVA and fuel](../generator-load/index.html) — the hotel load on board.
