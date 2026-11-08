# OEE and takt time calculator

**Summary:** OEE from availability, performance and quality using shift times and part counts, plus takt time from demand and a cycle-time check against it.

## Introduction

Overall equipment effectiveness (OEE) is the share of planned time in which a machine makes good parts at full speed. It is the product of three ratios: availability, performance and quality. A line that runs 88.81 % of its planned time, at 86.11 % of its ideal speed, with 97.80 % good parts, has an OEE of 74.79 %. Takt time is the pace demand sets: the available time divided by the number of parts the customer needs.

This calculator gives availability, performance, quality and OEE from shift length, stops, downtime, ideal cycle time and part counts. It also gives the takt time for a demand and checks whether the line keeps up with it. It is for production engineers, supervisors and continuous improvement teams.

## Formulas

Times:

    planned production time = shift − planned stops
    run time = planned production time − downtime

OEE:

    availability A = run time / planned production time
    performance P = ideal cycle time × total count / run time
    quality Q = good count / total count
    OEE = A × P × Q = ideal cycle time × good count / planned production time

Takt time:

    takt = planned production time / demand

- Planned stops: breaks, meals and planned maintenance
- Downtime: breakdowns, changeovers and other unplanned stops
- Ideal cycle time: the fastest cycle the machine can sustain

## Assumptions and limitations

- Planned stops are taken out of the time before OEE is measured. A related measure, TEEP, counts all calendar time instead and gives a lower figure.
- Performance needs a true ideal cycle time. If it is set too slow, performance goes above 100 % and OEE looks better than it is.
- Quality counts parts good the first time. Reworked parts count as rejects.
- Takt uses the same planned time as OEE. The line meets demand when its planned time per good part is at or below takt.
- OEE does not show why time is lost. The loss categories behind each ratio point to the fixes.

## Worked example

This is the example of OEE.com. A shift is 480 min with two 15 min breaks and a 30 min meal. The line was down for 47 min. The ideal cycle time is 1.0 s. It made 19 271 parts, of which 423 were rejected. The customer needs 18 000 parts a shift.

1. Planned production time: 480 − 60 = 420 min. Run time: 420 − 47 = 373 min.
2. Availability: 373 / 420 = 88.81 %.
3. Performance: 1.0 × 19 271 / (373 × 60) = 86.11 %.
4. Quality: 18 848 / 19 271 = 97.80 %.
5. OEE: 0.8881 × 0.8611 × 0.9780 = 74.79 %.
6. Takt: 420 × 60 / 18 000 = 1.40 s.

The line needs 25 200 / 18 848 = 1.337 s of planned time per good part, which is within takt.

## FAQ

**What is a good OEE?**
85 % is often quoted as world class. OEE.com notes that most manufacturers score closer to 60 %, and scores below 45 % are more common than scores above 85 %.

**What is the difference between takt time and cycle time?**
Takt is the pace the customer demand sets. Cycle time is how long the process takes per part. The cycle time must be at or below takt.

**How do I calculate takt time?**
Divide the available working time by the demand for the same period. 420 minutes for 18 000 parts is 1.4 s per part.

**Why can performance exceed 100 %?**
Only if the ideal cycle time is set slower than the machine really runs. Use the nameplate rate or the best cycle time ever sustained.

**What is the quickest way to raise OEE?**
Find the largest loss. Long changeovers and breakdowns lower availability, small stops and slow cycles lower performance, and scrap lowers quality.

**Should breaks count as downtime?**
Not for OEE. Planned stops are removed from the planned production time first. Counting them anyway is a different measure.

## Related calculators

- [Machining time calculator](../machining-time/index.html) — the cycle time of machined parts.
- [Reliability and redundancy](../reliability/index.html) — availability of machines and systems.
- [Speeds and feeds calculator](../speeds-feeds/index.html) — faster cutting for a shorter cycle.
- [Injection molding clamp tonnage calculator](../injection-clamp-tonnage/index.html) — sizing the moulding machine.
