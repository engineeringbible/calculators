# CPA and TCPA from radar plots calculator

**Summary:** Target course and speed, closest point of approach and its time, bow crossing, aspect and the alteration for a safe passing distance.

## Introduction

Two radar observations of the same target, a few minutes apart, contain everything needed to judge a close-quarters situation: how the target moves relative to own ship, where it will pass, when, and what it is really doing through the water. This calculator solves the classic plotting triangle that every officer of the watch learns on the manoeuvring board and that ARPA performs automatically. It adds the bow crossing range, the target's aspect, an indicative encounter type under the collision regulations, and the smallest alteration of course or speed that opens the passing distance to a chosen limit.

It is for watchkeeping officers checking ARPA or AIS data, cadets learning radar plotting, and anyone reconstructing an incident from recorded positions.

## Formulas

    Target position from own ship:    P = R (sin B, cos B)        x east, y north, nmi
    Relative velocity (two plots):    V_r = (P₂ − P₁) / Δt
    Own velocity:                     V_o = S_o (sin C_o, cos C_o)
    Target true velocity:             V_t = V_r + V_o     (course = atan2(x, y), speed = |V_t|)
    Time to CPA:                      TCPA = −(P · V_r) / |V_r|²
    Closest point of approach:        CPA = |P + V_r · TCPA|
    Bow crossing:                     the point where P + V_r t meets own heading line; BCR = its distance ahead
    Aspect:                           (B + 180°) − C_t, red to port, green to starboard
    Range rate:                       (P · V_r) / R

- B, R — true bearing and range of the target; C_o, S_o — own course and speed; Δt — time between the plots.

## Assumptions and limitations

- Both ships hold course and speed from the first plot to the CPA.
- Bearings are true; own course and speed through the water give the target's motion through the water.
- A plot over less than about three minutes magnifies bearing and range errors in the target's course and speed.
- The encounter type assumes vessels in sight of one another (Rules 13–17); Rule 19 governs restricted visibility.
- The avoiding action assumes the course or speed change happens instantly; real ships need time and sea room.

## Worked example

Own ship steers 000° at 12 kn. A target bears 045° at 8.0 nmi and, six minutes later, 045° at 7.0 nmi.

1. The bearing is steady and the range closes by 1.0 nmi in 0.1 h: relative motion 225° at 10 kn, straight at own ship.
2. CPA = 0 and TCPA = 7.0 nmi / 10 kn = 0.7 h = 42 minutes: a collision course.
3. Target velocity = relative velocity + own velocity = (−7.07, −7.07) + (0, 12) = (−7.07, 4.93) kn: course 304.9°, speed 8.6 kn.
4. The target is on the starboard bow and crossing, so own ship is the give-way vessel. The calculator reports that an alteration of 22° to starboard, to 022°, opens the CPA to 2 nmi, or a speed reduction to 8.7 kn does the same.

## FAQ

**Why is the target's speed different from its relative speed?**
Relative motion combines both ships' movement. Only after adding own ship's velocity back do you get what the target is actually doing.

**What does a steady bearing with a closing range mean?**
Risk of collision. Rule 7(d) says such risk shall be deemed to exist; a large ship at close range can be dangerous even with a slowly changing bearing.

**Should I use course over ground or through the water?**
Through the water for collision avoidance, because aspect and the rules relate to the ships' headings. Over the ground mixes in the current and gives the target's ground track.

**Why is an alteration to starboard suggested?**
The rules favour starboard alterations for crossing and head-on situations, and Rule 19 advises against alterations to port for a vessel forward of the beam. The page searches starboard alterations up to 90° and speed reductions; the best action depends on the whole traffic picture.

**How accurate is a two-plot solution?**
A 1° bearing error at 8 nmi is 0.14 nmi of position; over a 6-minute plot that is 1.4 kn of relative velocity. Use longer intervals or several plots and compare with ARPA.

**What is bow crossing range?**
The distance ahead (or astern) at which the target crosses own ship's heading line. A small positive value means it passes close ahead, which Rule 15 tells the give-way vessel to avoid.

## Related calculators

- [Course to steer with set and drift](../course-to-steer/index.html) — the current triangle for own ship's track.
- [True wind from apparent wind](../true-wind/index.html) — the same vector triangle for wind.
- [Light, radar and VHF range](../light-range/index.html) — when a target can first be seen or detected.
- [Great-circle distance](../great-circle-distance/index.html) — passage distances and courses.
