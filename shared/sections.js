/**
 * shared/sections.js — cross-section properties shared by the structural calculators (beams, columns, shafts).
 *
 * Every function returns { area, iMajor, iMinor, cMajor, cMinor } in SI (m², m⁴, m): second moments of area about the
 * strong (major) and weak (minor) centroidal axes and the distances to the extreme fibres. Root fillets of rolled
 * sections are ignored (about 5 % less I than the section tables for an IPE/HE profile).
 */

/** Solid rectangle, width b (minor-axis dimension) × depth h. */
export function rectangleSection(widthM, depthM) {
  return {
    area: widthM * depthM,
    iMajor: (widthM * depthM ** 3) / 12,
    iMinor: (depthM * widthM ** 3) / 12,
    cMajor: depthM / 2,
    cMinor: widthM / 2,
  };
}

/** Hollow rectangle b × h with uniform wall t. */
export function hollowRectangleSection(widthM, depthM, wallM) {
  const bi = widthM - 2 * wallM;
  const hi = depthM - 2 * wallM;
  if (bi <= 0 || hi <= 0) throw new Error('Wall thickness must be less than half the width and half the depth');
  return {
    area: widthM * depthM - bi * hi,
    iMajor: (widthM * depthM ** 3 - bi * hi ** 3) / 12,
    iMinor: (depthM * widthM ** 3 - hi * bi ** 3) / 12,
    cMajor: depthM / 2,
    cMinor: widthM / 2,
  };
}

/** Solid circle of diameter d. */
export function circleSection(diameterM) {
  const i = (Math.PI * diameterM ** 4) / 64;
  return { area: (Math.PI * diameterM ** 2) / 4, iMajor: i, iMinor: i, cMajor: diameterM / 2, cMinor: diameterM / 2 };
}

/** Hollow circle (tube) with outside diameter D and wall t. */
export function hollowCircleSection(outerDiameterM, wallM) {
  const di = outerDiameterM - 2 * wallM;
  if (di <= 0) throw new Error('Wall thickness must be less than half the outside diameter');
  const i = (Math.PI * (outerDiameterM ** 4 - di ** 4)) / 64;
  return { area: (Math.PI * (outerDiameterM ** 2 - di ** 2)) / 4, iMajor: i, iMinor: i, cMajor: outerDiameterM / 2, cMinor: outerDiameterM / 2 };
}

/** Doubly symmetric I-section: flange width b, overall depth h, flange thickness tf, web thickness tw (no fillets). */
export function iSection(flangeWidthM, depthM, flangeM, webM) {
  const hw = depthM - 2 * flangeM;
  if (hw <= 0) throw new Error('Flange thickness must be less than half the depth');
  if (webM >= flangeWidthM) throw new Error('Web thickness must be less than the flange width');
  return {
    area: 2 * flangeWidthM * flangeM + hw * webM,
    iMajor: (flangeWidthM * depthM ** 3 - (flangeWidthM - webM) * hw ** 3) / 12,
    iMinor: (2 * flangeM * flangeWidthM ** 3 + hw * webM ** 3) / 12,
    cMajor: depthM / 2,
    cMinor: flangeWidthM / 2,
  };
}

/** Polar second moment of area of a solid or hollow circular shaft, m⁴. */
export function polarMomentCircle(outerDiameterM, innerDiameterM = 0) {
  if (innerDiameterM < 0 || innerDiameterM >= outerDiameterM) throw new Error('Inner diameter must be non-negative and less than the outer diameter');
  return (Math.PI * (outerDiameterM ** 4 - innerDiameterM ** 4)) / 32;
}

/** Radius of gyration r = √(I / A). */
export function radiusOfGyration(iM4, areaM2) {
  return Math.sqrt(iM4 / areaM2);
}
