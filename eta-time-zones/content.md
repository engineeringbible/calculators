# ETA calculator with time zones

**Summary:** Passage ETA in local time at the destination from departure time and UTC offset, distance and speed, with clock changes and the date line.

## Introduction

To find the ETA of a passage across time zones, convert the departure time to UTC, add the passage time, then convert to the local time of the destination. The passage time is the distance divided by the speed. A ship leaving Yokohama at 14:00 on 8 November (UTC+9) for a 3 400 nmi passage at 15 kn is under way for 226 h 40 min. It arrives at 15:40 UTC on 17 November, which is 05:40 the same day in Honolulu at UTC−10.

This calculator does that arithmetic, including the date rollover, leap years and the International Date Line. It takes one distance and speed or a list of legs at different speeds, adds stops, and gives the ETA in UTC, in destination local time and in the departure zone. It also describes the clock changes on the way. It is for navigators planning a passage, yacht skippers and anyone booking crew changes or berths across time zones.

## Formulas

Passage time and arrival:

    t = Σ (d_i / V_i) + stops
    UTC_departure = local_departure − offset_departure
    UTC_arrival = UTC_departure + t
    local_arrival = UTC_arrival + offset_arrival

Clock change on the way:

    Δclock = offset_arrival − offset_departure       (+ = clocks advanced)

- d_i, V_i — distance and speed over the ground of each leg
- offset — hours from UTC, east positive: UTC+9 is 9, UTC−5 is −5, India 5.5
- A net change of more than 12 hours means the shorter route crosses the date line: eastbound the date is repeated, westbound a day is skipped

## Assumptions and limitations

- Speeds are planned speeds over the ground. Allow separately for current, weather, slow steaming and pilot or canal waiting time, or enter them as stops.
- The ETA in UTC and in local time does not depend on where the clocks are changed on passage. Only the description of the clock changes depends on the direction.
- Daylight saving time is not applied. Enter the offset in force on the day, such as UTC+2 for Central European summer time.
- Offsets are as the clocks show them. A ship's zone description has the opposite sign, so UTC+9 is ZD −9.

## Worked example

A ship leaves Yokohama at 2026-11-08 14:00 local time, UTC+9, bound for Honolulu, UTC−10. The passage is 3 400 nmi at 15 kn.

1. Passage time: 3 400 / 15 = 226.7 h, which is 9 d 10 h 40 min.
2. Departure in UTC: 14:00 − 9 h = 05:00 UTC on 8 November.
3. Arrival in UTC: 05:00 + 226 h 40 min = 15:40 UTC on 17 November.
4. Local arrival at UTC−10: 15:40 − 10 h = 05:40 on 17 November.
5. Clock change: −10 − 9 = −19 h. The ship goes east across the date line: it advances its clocks 5 h zone by zone and repeats one date.

The local calendar shows 9 days from departure to arrival, although the ship is at sea for 9 days and 10 hours.

## FAQ

**How do I calculate an ETA?**
Divide the distance by the speed for the passage time, add it to the departure time in UTC, and convert the result to the destination's local time.

**How do I convert local time to UTC?**
Subtract the UTC offset. 14:00 at UTC+9 is 05:00 UTC, and 14:00 at UTC−5 is 19:00 UTC.

**Do ships advance or retard their clocks going east?**
Going east, the clocks are advanced one hour for each time zone. Going west they are retarded, which gives the crew a 25-hour day.

**What happens at the International Date Line?**
Crossing it westbound, the date jumps forward one day. Crossing it eastbound, the same date is repeated, so the calendar shows the same day twice.

**Can I enter legs at different speeds?**
Yes. Choose legs and enter one line per leg, "distance; speed", such as "120; 10" for a slow pilotage leg and "3000; 15" for the ocean passage.

**Does the calculator handle daylight saving time?**
No. Enter the offset in force at departure and at arrival. For example, the UK is UTC+0 in winter and UTC+1 in summer.

## Related calculators

- [Passage plan from waypoints](../passage-plan/index.html) — leg distances and ETAs from a route.
- [Great circle distance](../great-circle-distance/index.html) — the distance for the passage.
- [Boat fuel consumption](../boat-fuel/index.html) — fuel for a small-craft passage.
- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — fuel and cost for a ship.
