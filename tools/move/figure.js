/* ================= The figure: a side-view stick figure that has to obey physics =================
   Units are roughly centimetres. The figure faces right. Angles are degrees counterclockwise from
   pointing right (90 = straight up): shin points ankle→knee, thigh knee→hip, torso hip→shoulder.

   Each frame is checked against three rules (tools/move/check-figure.js runs them on every lift):
   1. Standing lifts stay balanced: the centre of mass of body plus load sits over the middle of the
      foot. The engine enforces this each frame by solving the torso angle (bal: 'feet').
   2. Hanging lifts hang: in a pull-up the centre of mass sits under the hands (bal: 'hang').
   3. Loads go where they really go: barbells travel close to vertical, rest on the floor at the
      bottom of a deadlift, touch the chest at the bottom of a bench press, and so on.
   Arms that swing out to the side (bench press, push-up, pull-up) look shorter from the side,
   so poses can shorten the upper arm and forearm (uaL, faL) to draw that foreshortening. */
const FIG = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const SEG = { shin: 40, thigh: 42, torso: 52, ua: 29, fa: 27, head: 10, neck: 5, foot: 18 };
  const FLOOR = 178, ANK = 7, BODY = 75;
  const MASS = { head: 0.081, trunk: 0.497, ua: 0.056, fa: 0.044, thigh: 0.2, shin: 0.122 }; // Dempster fractions, both sides together
  const KIT = { kb: { r: 10.5, drop: 16 }, db: { r: 7 }, bb: { r: 22.5 } };
  const MID = 6.5; // middle of the foot (heel to toe), ahead of the ankle bone
  const rad = Math.PI / 180;
  const dir = (a) => [Math.cos(a * rad), -Math.sin(a * rad)];
  const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  function ik(sh, T, la, lb, bend) {
    const dx = T[0] - sh[0], dy = T[1] - sh[1];
    const d = clamp(Math.hypot(dx, dy), Math.abs(la - lb) + 0.5, la + lb - 0.01);
    const th = Math.atan2(dy, dx);
    const A = Math.acos(clamp((la * la + d * d - lb * lb) / (2 * la * d), -1, 1));
    return { elbow: [sh[0] + la * Math.cos(th + bend * A), sh[1] + la * Math.sin(th + bend * A)], hand: [sh[0] + d * Math.cos(th), sh[1] + d * Math.sin(th)] };
  }

  /* One pose → joint positions, hand target and load position */
  function solve(P, L) {
    const ankle = P.hip ? add(add(P.hip, dir(P.thigh), -SEG.thigh), dir(P.shin), -SEG.shin) : (P.ankle || [118, FLOOR - ANK]);
    const knee = add(ankle, dir(P.shin), SEG.shin);
    const hip = add(knee, dir(P.thigh), SEG.thigh);
    const d = dir(P.torso), back = [d[1], -d[0]], front = [-d[1], d[0]];
    const sh = add(hip, d, SEG.torso);
    const head = add(sh, dir(P.torso + (P.headTilt || 0)), SEG.head + SEG.neck);
    const la = P.uaL || SEG.ua, lb = P.faL || SEG.fa;
    const J0 = { ankle, knee, hip, sh, d, back, front, la, lb };
    // Hand targets can't be blended as modes, so each key's target is found on the current body and the
    // targets are blended. That keeps a press moving from the shoulders to overhead, for example.
    let A = armTarget(P, J0), kit = A.kit;
    let T = A.T;
    if (P._B) {
      const B = armTarget(P._B, J0), t = P._t;
      T = lerp2(T, B.T, t);
      if (kit && B.kit) kit = lerp2(kit, B.kit, t); else if (B.kit && t > 0.5) kit = B.kit; else if (kit && t > 0.5 && !B.kit) kit = null;
    }
    const { elbow, hand } = ik(sh, T, la, lb, P.bend || 1);
    if (!kit && L && L.kit !== 'none') kit = L.kit === 'kb' ? [hand[0], hand[1] + KIT.kb.drop] : hand;
    let toe;
    if (P.foot != null) toe = add(ankle, dir(P.foot), SEG.foot);
    else { const a = Math.asin(clamp((FLOOR - ankle[1]) / SEG.foot, 0, 1)); toe = [ankle[0] + SEG.foot * Math.cos(a), FLOOR]; }
    return { ankle, knee, hip, sh, head, elbow, hand, toe, kit, back, front };
  }
  function armTarget(P, J) {
    const { ankle, knee, hip, sh, d, back, front, la, lb } = J;
    let T, kit = null;
    switch (P.arm) {
      case 'back': kit = add(add(sh, d, -5), back, 7); T = add(kit, front, 1); break;                // bar on the upper back
      case 'chest': T = add(add(sh, d, -13), front, 15); kit = [T[0] + 1, T[1] + 9]; break;            // goblet: horns at the chest, bell hangs below
      case 'rack': T = add(add(sh, d, -2), front, P.out || 9); break;                                   // dumbbells resting at the shoulders
      case 'hang': { const L2 = (P.uaL || SEG.ua) + (P.faL || SEG.fa) - 0.5; T = [sh[0] + (P.dx || 0), sh[1] + Math.sqrt(Math.max(0, L2 * L2 - (P.dx || 0) ** 2))]; break; }
      case 'thigh': { const dt = dir(P.thigh); T = add(lerp2(hip, knee, P.at || 0.55), [-dt[1], dt[0]], 6); break; }
      case 'torso': T = add(add(sh, d, -P.along), back, P.out || 0); break;                           // pulled to the side of the torso
      case 'up': { const L2 = (P.uaL || SEG.ua) + (P.faL || SEG.fa) - 0.5, x = ankle[0] + MID + (P.dx || 0); T = [x, sh[1] - Math.sqrt(Math.max(0, L2 * L2 - (x - sh[0]) ** 2))]; break; } // locked out over the middle of the foot
      case 'rel': T = [sh[0] + P.rel[0], sh[1] + P.rel[1]]; break;
      case 'at': T = P.hand; break;
      default: { const e = add(sh, dir(P.ua), P.uaL || SEG.ua); T = add(e, dir(P.fa), P.faL || SEG.fa); }
    }
    return { T, kit };
  }
  function lerp2(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }

  function com(J, L) {
    const parts = [[J.head, MASS.head], [mid(J.hip, J.sh), MASS.trunk], [mid(J.sh, J.elbow), MASS.ua], [mid(J.elbow, J.hand), MASS.fa], [mid(J.knee, J.hip), MASS.thigh], [mid(J.ankle, J.knee), MASS.shin]];
    let m = 0, x = 0, y = 0;
    parts.forEach(([p, w]) => { m += w * BODY; x += p[0] * w * BODY; y += p[1] * w * BODY; });
    if (J.kit && L.load) { m += L.load; x += J.kit[0] * L.load; y += J.kit[1] * L.load; }
    return [x / m, y / m];
  }

  const DEF = { uaL: SEG.ua, faL: SEG.fa, dx: 0, out: 0, headTilt: 0 };
  function mixPose(A, B, t) {
    const o = {};
    for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
      let a = A[k], b = B[k];
      if (a == null && k in DEF) a = DEF[k];
      if (b == null && k in DEF) b = DEF[k];
      if (a == null) { o[k] = b; continue; }
      if (b == null) { o[k] = a; continue; }
      if (Array.isArray(a)) o[k] = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
      else if (typeof a === 'number') o[k] = lerp(a, b, t);
      else o[k] = a;
    }
    o._B = B; o._t = t;
    return o;
  }
  function poseAt(L, s) {
    const K = L.keys, n = K.length - 1, x = clamp(s, 0, 1) * n, i = Math.min(n - 1, Math.floor(x));
    return mixPose(K[i], K[i + 1], x - i);
  }
  /* Solve the balancing variable so the centre of mass lands where it must */
  function balance(P, L) {
    if (L.bal === 'feet') {
      const target = (P.ankle || [118])[0] + MID;
      // Squats balance by leaning the torso. Hinges and rows hold the torso angle and balance by
      // moving the hips back, which is what the movement actually is.
      const v = L.balVar || 'torso';
      let lo = v === 'torso' ? 0 : 80, hi = v === 'torso' ? 120 : 180; // both move the mass back as they increase
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; P[v] = m; const c = com(solve(P, L), L)[0]; if (c > target) lo = m; else hi = m; }
      P[v] = (lo + hi) / 2;
    } else if (L.bal === 'hang') {
      const hx = P.hand[0];
      let lo = hx - 60, hi = hx + 60;
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; P.hip = [m, P.hip[1]]; const c = com(solve(P, L), L)[0]; if (c < hx) lo = m; else hi = m; }
      P.hip = [(lo + hi) / 2, P.hip[1]];
    }
    return P;
  }
  function frame(L, s) { const P = balance(poseAt(L, s), L); return Object.assign(solve(P, L), { P }); }
  /* Rep timing: pause, go (slower), pause, return (a little faster) */
  const PERIOD = 3600;
  const smooth = (x) => x * x * (3 - 2 * x);
  function phase(u) {
    if (u < 0.1) return 0;
    if (u < 0.52) return smooth((u - 0.1) / 0.42);
    if (u < 0.62) return 1;
    if (u < 0.95) return 1 - smooth((u - 0.62) / 0.33);
    return 0;
  }

  const STAND = { shin: 86, thigh: 86.5, torso: 88 }; // upright, leaning very slightly forward from the ankles as people really stand
  const hangArms = { arm: 'hang', bend: -1 };

  /* Each lift: three rungs (no equipment / dumbbell or kettlebell / barbell).
     keys run from the start position to the far end of the movement. */
  const LIFTS = {
    squat: { name: 'Squat', trains: 'Thighs and glutes, and the bones of the hips and spine.', rungs: [
      { rung: 'No equipment', title: 'Bodyweight squat', kit: 'none', bal: 'feet',
        keys: [{ ...STAND, ua: -92, fa: -90 }, { shin: 66, thigh: 140, torso: 70, ua: -40, fa: -35 }, { shin: 52, thigh: 188, torso: 50, ua: 2, fa: 4 }],
        cues: ['Feet about shoulder-width apart, toes turned out a little.', 'Sit down between your heels, knees tracking over your toes.', 'Go as low as you can keep your back flat, then stand up through your whole foot.'],
        easier: 'Sit down to a chair and stand back up without using your hands.', harder: 'Take 3 seconds on the way down, or pause at the bottom.', mistake: 'Knees caving in. Push them out over your toes.' },
      { rung: 'Dumbbell or kettlebell', title: 'Goblet squat', kit: 'kb', load: 16, bal: 'feet',
        keys: [{ ...STAND, arm: 'chest', faL: 16, bend: 1 }, { shin: 50, thigh: 186, torso: 60, arm: 'chest', faL: 16, bend: 1 }],
        cues: ['Hold the weight against your chest, elbows pointing down.', 'Sit down between your knees, chest tall.', 'Let your elbows brush the inside of your knees at the bottom, then stand.'],
        easier: 'Use a lighter weight, or squat down to a box or chair.', harder: 'Go heavier, or pause for two seconds at the bottom.', mistake: 'Letting the weight drift away from your chest pulls you forward.' },
      { rung: 'Barbell', title: 'Back squat', kit: 'bb', load: 60, bal: 'feet', scene: 'rack',
        keys: [{ ...STAND, arm: 'back', bend: -1, uaL: 20, faL: 18 }, { shin: 58, thigh: 184, torso: 50, arm: 'back', bend: -1, uaL: 20, faL: 18 }],
        cues: ['Bar on your upper back, shoulder blades squeezed so it sits on muscle.', 'Take a big breath and brace your stomach, then sit down.', 'Drive up so the bar stays over the middle of your foot.'],
        easier: 'The goblet squat builds the same pattern with less to manage.', harder: 'Add weight in small jumps, about 2 to 5 kg at a time.', mistake: 'Squatting without safety arms. Set them just below your lowest point, every time.' }
    ] },
    hinge: { name: 'Hinge', trains: 'Hamstrings, glutes and the long muscles of the back. The deadlift loads the whole skeleton.', rungs: [
      { rung: 'No equipment', title: 'Hip hinge', kit: 'none', bal: 'feet', balVar: 'thigh',
        keys: [{ ...STAND, arm: 'thigh', at: 0.3, bend: -1 }, { shin: 82, thigh: 130, torso: 28, arm: 'thigh', at: 0.92, bend: -1 }],
        cues: ['Soft knees. Push your hips back, like closing a car door with your backside.', 'Keep your back flat as your hands slide down your thighs.', 'Stop when the backs of your legs stretch, then squeeze your glutes to stand.'],
        easier: 'Glute bridge: lie on your back, knees bent, and lift your hips.', harder: 'Single-leg hinge, reaching one hand toward the floor.', mistake: 'Rounding your back to reach lower. The hips move; the back doesn’t.' },
      { rung: 'Dumbbell or kettlebell', title: 'Kettlebell deadlift', kit: 'kb', load: 24, bal: 'feet',
        keys: [{ ...STAND, ...hangArms }, { shin: 68, thigh: 161.5, torso: 28, ...hangArms, dx: -6 }],
        cues: ['Stand over the bell, push your hips back and grip it with both hands.', 'Pull your shoulders down and back so your back is flat and tight.', 'Stand up by pushing the floor away, then hinge back down the same way.'],
        easier: 'Use a lighter bell, or raise it on a step so you don’t go as low.', harder: 'Go heavier. Once the deadlift is solid, the kettlebell swing is next.', mistake: 'Squatting the bell up. Your hips should go back, not just down.' },
      { rung: 'Barbell', title: 'Deadlift', kit: 'bb', load: 80, bal: 'feet', floorBar: true,
        keys: [{ ...STAND, ...hangArms }, { shin: 88, thigh: 135, torso: 30, ...hangArms, dx: -6 }, { shin: 68, thigh: 168.5, torso: 29, ...hangArms, dx: -9 }],
        cues: ['Bar over the middle of your foot, shins almost touching it.', 'Hinge down, grip just outside your legs, chest up and back flat.', 'Push the floor away and keep the bar close to your legs all the way up.'],
        easier: 'A trap-bar deadlift, or a lighter Romanian deadlift from standing.', harder: 'Add weight slowly. Sets of 3 to 5 are plenty.', mistake: 'Jerking the bar off the floor. Pull the slack out first, then push.' }
    ] },
    push: { name: 'Push', trains: 'Chest, shoulders and triceps, and the bones of the arms and wrists.', rungs: [
      { rung: 'No equipment', title: 'Push-up', kit: 'none',
        keys: [{ ankle: [42, 168], shin: 21.4, thigh: 21.4, torso: 21.4, arm: 'at', hand: [167, 175], bend: 1, foot: -62, headTilt: -6 },
               { ankle: [42, 168], shin: 8.5, thigh: 8.5, torso: 8.5, arm: 'at', hand: [167, 175], bend: 1, uaL: 9, faL: 24, foot: -62, headTilt: -4 }],
        cues: ['Hands just wider than your shoulders, body in one straight line.', 'Lower your chest to a fist’s height from the floor, elbows angled back.', 'Push the floor away until your arms are straight.'],
        easier: 'Put your hands on a counter or a step. The higher your hands, the easier it is.', harder: 'Feet up on a step, or take 3 seconds on the way down.', mistake: 'Hips sagging. Squeeze your glutes and hold the line.' },
      { rung: 'Dumbbell or kettlebell', title: 'Dumbbell overhead press', kit: 'db', load: 24, bal: 'feet',
        keys: [{ ...STAND, arm: 'rack', bend: 1 }, { ...STAND, arm: 'up', dx: 2, bend: 1 }],
        cues: ['Dumbbells at your shoulders, palms forward or facing in.', 'Squeeze your glutes and brace so your lower back doesn’t arch.', 'Press straight up until your arms are beside your ears.'],
        easier: 'Press one arm at a time, or sit with your back supported.', harder: 'Heavier dumbbells, or a barbell press standing up.', mistake: 'Leaning back to finish the rep. Use a lighter weight and a tighter brace.' },
      { rung: 'Barbell', title: 'Bench press', kit: 'bb', load: 60, scene: 'bench',
        keys: [{ hip: [128, 136], thigh: 176, shin: 92, torso: 180, arm: 'rel', rel: [3, -55.5], bend: 1, headTilt: 0 },
               { hip: [128, 136], thigh: 176, shin: 92, torso: 180, arm: 'rel', rel: [11, -21], uaL: 11, faL: 22, bend: 1, headTilt: 0 }],
        cues: ['Eyes under the bar, feet flat, shoulder blades squeezed together.', 'Lower the bar to the middle of your chest under control.', 'Press it back up, drifting slightly toward your face.'],
        easier: 'Dumbbell bench press, or push-ups.', harder: 'Add weight in small jumps.', mistake: 'Benching alone without safety arms. Set them, or use dumbbells.' }
    ] },
    pull: { name: 'Pull', trains: 'Upper back, lats and biceps, and your grip.', rungs: [
      { rung: 'No equipment', title: 'Doorframe row', kit: 'none', scene: 'door',
        keys: [{ ankle: [170, 171], shin: 111, thigh: 111, torso: 111, arm: 'at', hand: [178, 52], bend: 1, foot: -8 },
               { ankle: [170, 171], shin: 95, thigh: 95, torso: 95, arm: 'at', hand: [178, 52], bend: 1, foot: -8 }],
        cues: ['Stand in a doorway with your toes near the frame and grip both sides at chest height.', 'Lean back until your arms are straight and your body is one straight line.', 'Pull your chest to your hands, squeezing your shoulder blades together.'],
        easier: 'Stand more upright so you lean back less.', harder: 'Walk your feet closer to the frame so you lean back further, or pause at the top.', mistake: 'Using a frame that isn’t solid. Test it first, and keep your feet under you.' },
      { rung: 'Dumbbell or kettlebell', title: 'Bent-over dumbbell row', kit: 'db', load: 30, bal: 'feet', balVar: 'thigh',
        keys: [{ shin: 78, thigh: 130, torso: 32, ...hangArms }, { shin: 78, thigh: 130, torso: 32, arm: 'torso', along: 24, out: -3, bend: 1 }],
        cues: ['Hinge forward with a flat back until your chest is low, knees soft.', 'Let the dumbbells hang, then pull them toward your hips.', 'Squeeze your shoulder blades at the top, then lower slowly.'],
        easier: 'One arm at a time, with your other hand on a bench.', harder: 'Heavier dumbbells, or a pause at the top.', mistake: 'Jerking your body up to swing the weight.' },
      { rung: 'Barbell rack', title: 'Pull-up', kit: 'none', scene: 'bar', noFloor: true, bal: 'hang',
        keys: [{ hip: [120, 110], shin: 60, thigh: 100, torso: 94, arm: 'at', hand: [126, 2], bend: 1, foot: -40 },
               { hip: [120, 60], shin: 52, thigh: 96, torso: 98, arm: 'at', hand: [126, 2], bend: 1, uaL: 22, faL: 24, foot: -40 }],
        cues: ['Hang with your hands a little wider than your shoulders, palms facing away.', 'Pull your shoulder blades down first, then drive your elbows toward your ribs.', 'Get your chin over the bar, then lower all the way down.'],
        easier: 'Jump up and lower yourself slowly, use a resistance band, or do barbell rows.', harder: 'Add weight with a backpack or a dip belt.', mistake: 'Half reps. Go all the way down each time.' }
    ] }
  };
  return { SEG, FLOOR, KIT, MID, LIFTS, solve, com, frame, phase, PERIOD, poseAt, balance };
})();
if (typeof module !== 'undefined') module.exports = FIG;
