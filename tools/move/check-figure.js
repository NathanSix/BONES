#!/usr/bin/env node
/* Physics check for every lift animation. Run: node tools/move/check-figure.js
   Prints the key numbers per lift and FAILS lines for anything physically wrong. */
const F = require('./figure.js');
const { SEG, FLOOR, KIT, MID } = F;
const N = 60;
let fails = 0;
const seen = new Set();
const fail = (L, msg) => { const k = L.title + msg.replace(/frame \d+.*$/, ''); if (seen.has(k)) return; seen.add(k); fails++; console.log(`  FAIL ${L.title}: ${msg}`); };
const r1 = (v) => Math.round(v * 10) / 10;
const ang = (a, b) => Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180 / Math.PI;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// which side of the line a→b point p is on (+ = clockwise on screen)
const side = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
// x of the shin line at height y
const shinX = (J, y) => { const t = (y - J.ankle[1]) / (J.knee[1] - J.ankle[1]); return J.ankle[0] + t * (J.knee[0] - J.ankle[0]); };

for (const [k, lift] of Object.entries(F.LIFTS)) for (const L of lift.rungs) {
  const fr = []; for (let i = 0; i <= N; i++) fr.push(F.frame(L, i / N));
  const a = fr[0], b = fr[N];
  const tors = fr.map((J) => J.P.torso);
  console.log(`${k} · ${L.title}: torso ${r1(Math.min(...tors))}..${r1(Math.max(...tors))}`);
  fr.forEach((J, i) => {
    const c = F.com(J, L);
    const kneeFlex = J.P.thigh - J.P.shin;           // 0 = straight leg
    const hipAng = J.P.thigh - J.P.torso;             // 0 = straight hip, + = flexed
    if (kneeFlex < -4) fail(L, `knee hyperextends at frame ${i} (${r1(kneeFlex)}°)`);
    if (L.bal === 'feet') {
      const m = J.ankle[0] + MID;
      if (Math.abs(c[0] - m) > 1) fail(L, `off balance at frame ${i}: COM ${r1(c[0])} vs midfoot ${r1(m)}`);
      if (hipAng < -12) fail(L, `hip overextended at frame ${i} (${r1(hipAng)}°)`);
      if (J.P.torso < 8 || J.P.torso > 105 || J.P.thigh > 195) fail(L, `posture out of range at frame ${i}: torso ${r1(J.P.torso)}, thigh ${r1(J.P.thigh)}`);
      if (J.toe[1] > FLOOR + 0.5) fail(L, 'foot below floor');
    }
    if (L.bal === 'hang' && Math.abs(c[0] - J.hand[0]) > 1) fail(L, `not hanging under the bar at frame ${i}`);
    if (dist(J.sh, J.hand) > (J.P.uaL || SEG.ua) + (J.P.faL || SEG.fa) + 0.6) fail(L, `hand can't reach its target at frame ${i}`);
    // nothing below the floor
    if (!L.noFloor) ['knee', 'hip', 'sh', 'elbow', 'hand'].forEach((p) => { if (J[p][1] > FLOOR + 0.5) fail(L, `${p} below floor at frame ${i}`); });
    if (J.head[1] + SEG.head > FLOOR + 0.5 && !L.noFloor) fail(L, `head through floor at frame ${i}`);
    // loads
    if (L.kit === 'kb' && J.kit[1] + KIT.kb.r > FLOOR + 0.5) fail(L, `kettlebell through floor at frame ${i}`);
    if (L.kit === 'bb' && L.floorBar && J.kit[1] + KIT.bb.r > FLOOR + 0.6) fail(L, `plates through floor at frame ${i} (${r1(J.kit[1] + KIT.bb.r)})`);
    if (L.floorBar && J.kit[1] > J.knee[1] - 2 && J.kit[1] < J.ankle[1]) { const gap = J.kit[0] - shinX(J, J.kit[1]); if (gap < 3) fail(L, `bar runs into the shin at frame ${i} (gap ${r1(gap)})`); }
    if (L.floorBar && Math.abs(J.kit[1] - J.knee[1]) < 4 && J.kit[0] < J.knee[0] + 2) fail(L, `bar runs into the knee at frame ${i}`);
  });
  const kx = fr.filter((J) => J.kit).map((J) => J.kit[0]);
  if (kx.length) console.log(`  load path x ${r1(Math.min(...kx))}..${r1(Math.max(...kx))}, y ${r1(a.kit[1])} → ${r1(b.kit[1])}`);
  // lift-specific truths
  const t = L.title;
  if (t === 'Deadlift') {
    if (Math.abs(b.kit[1] + KIT.bb.r - FLOOR) > 1) fail(L, `bar should rest on the floor at the bottom, plates end at ${r1(b.kit[1] + KIT.bb.r)}`);
    if (Math.max(...kx) - Math.min(...kx) > 8) fail(L, 'bar path drifts more than 8 cm');
    const mf = b.ankle[0] + MID; if (Math.abs(b.kit[0] - mf) > 4) fail(L, `bar not over midfoot at the start (${r1(b.kit[0])} vs ${r1(mf)})`);
  }
  if (t === 'Kettlebell deadlift' && Math.abs(b.kit[1] + KIT.kb.r - FLOOR) > 1) fail(L, `bell should rest on the floor at the bottom (${r1(b.kit[1] + KIT.kb.r)})`);
  if (t === 'Back squat') { if (Math.max(...kx) - Math.min(...kx) > 6) fail(L, 'bar path drifts more than 6 cm'); const hipBelow = b.hip[1] - b.knee[1]; console.log(`  bottom: hip ${r1(hipBelow)} below knee`); }
  if (/squat/i.test(t)) { const depth = b.hip[1] - b.knee[1]; if (depth < -2) fail(L, `squat stops above parallel (hip ${r1(-depth)} above knee)`); }
  if (t === 'Bench press') {
    if (Math.abs(a.hand[0] - a.sh[0]) > 5) fail(L, 'lockout not over the shoulder');
    if (b.kit[0] <= b.sh[0] + 4) fail(L, 'bar should touch the chest below the shoulder line, toward the sternum');
    if (b.elbow[1] < b.sh[1] - 4) fail(L, `elbows should drop to about bench level at the bottom (elbow ${r1(b.elbow[1])}, back ${r1(b.sh[1])})`);
    if (Math.abs(b.elbow[0] - b.hand[0]) > 4) fail(L, 'forearm should be near vertical at the bottom');
    if (side(b.sh, b.hand, b.elbow) * side(a.sh, [a.sh[0], a.sh[1] + 10], [a.sh[0] + 10, a.sh[1]]) < 0) {}
    fr.forEach((J, i) => { if (J.elbow[0] < J.sh[0] - 1) fail(L, `elbow flares toward the head at frame ${i}`); });
    if (Math.abs(b.toe[1] - FLOOR) > 1) fail(L, 'feet not flat on the floor');
  }
  if (t === 'Push-up') {
    if (Math.abs(a.sh[0] - a.hand[0]) > 3) fail(L, 'arms not vertical at the top');
    if (Math.abs(b.elbow[0] - b.hand[0]) > 5) fail(L, 'forearm not near vertical at the bottom');
    if (b.elbow[0] > b.sh[0]) fail(L, 'elbows should point back toward the feet');
    console.log(`  bottom: back ${r1(FLOOR - b.sh[1])} cm above floor`);
  }
  if (t === 'Dumbbell overhead press') {
    if (Math.abs(b.hand[0] - (b.ankle[0] + MID)) > 4) fail(L, `lockout not over midfoot (${r1(b.hand[0])})`);
    if (Math.abs(a.hand[1] - a.sh[1]) > 6) fail(L, 'start should be at shoulder height');
    fr.forEach((J, i) => { if (J.elbow[1] < J.hand[1] - 1 && i < N * 0.9) fail(L, `elbow above the hand at frame ${i}`); });
  }
  if (t === 'Pull-up') {
    const chin = b.head[1] + 8; if (chin > 2 + 1) fail(L, `chin not over the bar at the top (chin ${r1(chin)})`);
    if (dist(a.sh, a.hand) < 54) fail(L, 'not a full hang at the bottom');
    fr.forEach((J, i) => { if (J.elbow[0] < J.sh[0] - 6) fail(L, `elbows behind the body at frame ${i}`); });
  }
  if (t === 'Doorframe row') { if (dist(a.sh, a.hand) < 55) fail(L, 'arms not straight at the start'); if (dist(b.sh, b.hand) > 26) fail(L, `chest not pulled to the hands (${r1(dist(b.sh, b.hand))})`); }
  if (t === 'Bent-over dumbbell row') { if (b.elbow[1] > b.sh[1]) {} if (b.elbow[1] > Math.min(b.sh[1], b.hip[1])) fail(L, 'elbow should rise above the back at the top'); }
  if (t === 'Hip hinge' && b.P.torso > 45) fail(L, 'not much of a hinge');
}
console.log(fails ? `\n${fails} problems` : '\nAll lifts pass.');
process.exit(fails ? 1 : 0);
