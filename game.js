/* One round of the workshop table. Same machine as the big game. No next level. */
(function (root) {
  var TABLE = { W: 1000, H: 576, R: 12, LANE_X: 948, TOP: 36, APRON: 518, GRAV: 1280, MAX_V: 1180 };
  var RAMP = { lax: 58, lay: 208, lbx: 74, lby: 302, rax: 196, ray: 214, rbx: 214, rby: 312, sx1: 72, sy1: 272, sx2: 200, sy2: 296 };
  var LHP = { x: 392, y: 450 };
  var RHP = { x: 608, y: 450 };
  var PLUNGER_Y = 524;
  var GOALS = [
    { kind: "hit", need: 3, color: "#5ee7ff", title: "Invent", blurb: "Strike the spark coils", done: "SCHEMATIC LOCKED" },
    { kind: "ramp", need: 2, color: "#ff4fd8", title: "Prototype", blurb: "Drop through the test ramp", done: "PROTOTYPE SPINS" },
    { kind: "slot", need: 1, color: "#ffd24a", title: "Test", blurb: "Sink the gravity well", done: "GRAVITY CONFIRMED" },
  ];
  var PTS = { hit: 500, ramp: 2500, slot: 5000 };

  function closest(px, py, ax, ay, bx, by) {
    var abx = bx - ax;
    var aby = by - ay;
    var ab2 = abx * abx + aby * aby;
    var t = ab2 > 0 ? ((px - ax) * abx + (py - ay) * aby) / ab2 : 0;
    t = Math.max(0, Math.min(1, t));
    return { x: ax + abx * t, y: ay + aby * t };
  }

  function makeWall(ax, ay, bx, by, sx, sy, rest, kind, kick, oneWay) {
    var dx = bx - ax;
    var dy = by - ay;
    var len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len;
    var ny = dx / len;
    var mx = (ax + bx) / 2;
    var my = (ay + by) / 2;
    if ((sx - mx) * nx + (sy - my) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { ax: ax, ay: ay, bx: bx, by: by, nx: nx, ny: ny, rest: rest, kick: kick || 0, cool: 0, oneWay: !!oneWay, kind: kind };
  }

  function sideOf(ax, ay, bx, by, px, py) {
    return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  }

  function bladeNormal(ax, ay, bx, by, px, py) {
    var len = Math.hypot(bx - ax, by - ay) || 1;
    var nx = -(by - ay) / len;
    var ny = (bx - ax) / len;
    if (sideOf(ax, ay, bx, by, px, py) < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { nx: nx, ny: ny };
  }

  function wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function segHit(ax, ay, bx, by, cx, cy, dx, dy) {
    var cross = function (px, py, qx, qy, rx, ry) {
      return (qx - px) * (ry - py) - (qy - py) * (rx - px);
    };
    var d1 = cross(cx, cy, dx, dy, ax, ay);
    var d2 = cross(cx, cy, dx, dy, bx, by);
    var d3 = cross(ax, ay, bx, by, cx, cy);
    var d4 = cross(ax, ay, bx, by, dx, dy);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }

  function snd(name) {
    if (typeof AGSound !== "undefined" && AGSound.play) AGSound.play(name);
  }

  function flipper(side, tier, px, py, len, thick, rest, up) {
    return { side: side, tier: tier, px: px, py: py, len: len, thick: thick, rest: rest, up: up, angle: rest, prevAngle: rest, omega: 0, threw: false };
  }

  function createTable() {
    var s = { x: 480, y: 280 };
    var lane = { x: 960, y: 320 };
    var walls = [
      makeWall(26, TABLE.TOP, 900, TABLE.TOP, s.x, s.y, 0.42, "wall"),
      makeWall(26, TABLE.TOP, 26, 348, s.x, s.y, 0.46, "wall"),
      makeWall(26, 348, 128, 365, s.x, s.y, 0.34, "wall"),
      makeWall(128, 365, 161, 368, s.x, s.y, 0.34, "wall"),
      makeWall(161, 368, 195, 373, s.x, s.y, 0.34, "wall"),
      makeWall(195, 373, 228, 379, s.x, s.y, 0.32, "wall"),
      makeWall(228, 379, 261, 387, s.x, s.y, 0.32, "wall"),
      makeWall(261, 387, 294, 398, s.x, s.y, 0.32, "wall"),
      makeWall(294, 398, 326, 409, s.x, s.y, 0.3, "wall"),
      makeWall(326, 409, 357, 423, s.x, s.y, 0.3, "wall"),
      makeWall(357, 423, 387, 438, s.x, s.y, 0.3, "wall"),
      makeWall(LHP.x, LHP.y, LHP.x, 600, s.x, s.y, 0.2, "wall"),
      makeWall(RHP.x, RHP.y, RHP.x, 600, s.x, s.y, 0.2, "wall"),
      makeWall(613, 438, 643, 423, s.x, s.y, 0.3, "wall"),
      makeWall(643, 423, 674, 409, s.x, s.y, 0.3, "wall"),
      makeWall(674, 409, 706, 398, s.x, s.y, 0.32, "wall"),
      makeWall(706, 398, 739, 387, s.x, s.y, 0.32, "wall"),
      makeWall(739, 387, 772, 379, s.x, s.y, 0.32, "wall"),
      makeWall(772, 379, 805, 373, s.x, s.y, 0.34, "wall"),
      makeWall(805, 373, 839, 368, s.x, s.y, 0.34, "wall"),
      makeWall(839, 368, 872, 365, s.x, s.y, 0.34, "wall"),
      makeWall(872, 365, 900, 352, s.x, s.y, 0.34, "wall"),
      makeWall(900, 352, 900, 172, s.x, s.y, 0.46, "wall"),
      makeWall(900, TABLE.TOP, 900, 172, s.x, s.y, 0.4, "gate", 0, true),
      makeWall(986, TABLE.TOP, 986, 568, lane.x, lane.y, 0.3, "wall"),
      makeWall(918, 176, 918, 568, lane.x, lane.y, 0.25, "wall"),
      makeWall(918, 568, 986, 568, lane.x, lane.y, 0.05, "wall"),
      makeWall(900, TABLE.TOP, 986, TABLE.TOP + 86, 948, 220, 0.55, "wall"),
      makeWall(RAMP.lax, RAMP.lay, RAMP.lbx, RAMP.lby, 130, 250, 0.28, "ramp"),
      makeWall(RAMP.rax, RAMP.ray, RAMP.rbx, RAMP.rby, 130, 260, 0.28, "ramp"),
      makeWall(408, 172, 430, 144, 470, 160, 0.45, "funnel"),
      makeWall(532, 172, 510, 144, 470, 160, 0.45, "funnel"),
    ];
    var flippers = [
      flipper("L", "lower", LHP.x, LHP.y, 100, 11, 0.52, -0.46),
      flipper("R", "lower", RHP.x, RHP.y, 100, 11, Math.PI - 0.52, Math.PI + 0.46),
      flipper("L", "upper", 214, 136, 66, 9, 0.38, -0.9),
    ];
    var bumpers = [
      { x: 60, y: 70, r: 32, cool: 0, flash: 0 },
      { x: 292, y: 206, r: 32, cool: 0, flash: 0 },
      { x: 548, y: 156, r: 28, cool: 0, flash: 0 },
      { x: 748, y: 286, r: 32, cool: 0, flash: 0 },
    ];
    var targets = [636, 690, 744, 798].map(function (x) {
      return { x: x, y: 184, h: 40, r: 11, down: 0, flash: 0 };
    });
    var posts = [
      { x: LHP.x, y: LHP.y, r: 7 },
      { x: RHP.x, y: RHP.y, r: 7 },
    ];
    var slot = { x: 470, y: 102, r: 20 };
    var ball = { x: TABLE.LANE_X, y: PLUNGER_Y - TABLE.R, vx: 0, vy: 0, hidden: false, lane: true, captured: false, capT: 0, spin: 0, rail: null };
    var ballPrev = { x: ball.x, y: ball.y };
    var input = { left: false, right: false, launch: false, leftJust: false, rightJust: false, launchJustUp: false };
    var plunger = { pull: 0, recoil: 0 };
    var state = {
      phase: "attract",
      score: 0,
      highScore: 0,
      balls: 3,
      goal: 0,
      progress: 0,
      time: 0,
      shake: 0,
      flash: 0,
      toast: "",
      toastT: 0,
      saver: 0,
      trail: [],
      particles: [],
      floaters: [],
    };
    var acc = 0;
    var wait = 0;
    var stuck = 0;
    var ignoreRamp = 0;
    var captureLock = 0;
    var suppressLaunch = false;

    function placeOnPlunger() {
      ball.hidden = false;
      ball.lane = true;
      ball.rail = null;
      ball.captured = false;
      ball.vx = 0;
      ball.vy = 0;
      ball.x = TABLE.LANE_X;
      ball.y = PLUNGER_Y - TABLE.R - 1;
      plunger.pull = 0;
    }

    function serve(suppress) {
      placeOnPlunger();
      ball.hidden = false;
      wait = 0;
      if (suppress) suppressLaunch = true;
    }

    function addScore(n, x, y, color) {
      state.score += n;
      if (state.score > state.highScore) state.highScore = state.score;
      state.floaters.push({ x: x, y: y, text: "+" + n.toLocaleString("en-US"), life: 0.85, max: 0.85, color: color });
      if (state.floaters.length > 14) state.floaters.shift();
    }

    function burst(x, y, color, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var sp = 50 + Math.random() * 200;
        state.particles.push({
          x: x,
          y: y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0.28 + Math.random() * 0.28,
          max: 0.56,
          color: color,
          r: 1.4 + Math.random() * 2,
        });
      }
      if (state.particles.length > 110) state.particles.splice(0, state.particles.length - 80);
    }

    function activeGoal() {
      return GOALS[state.goal] || null;
    }

    function finish(kind) {
      state.phase = kind;
      ball.hidden = true;
      ball.lane = false;
      ball.rail = null;
      ball.vx = 0;
      ball.vy = 0;
      state.toast = "";
      state.toastT = 0;
    }

    function completeGoal() {
      var g = activeGoal();
      if (!g) return;
      addScore(10000, 500, 250, g.color);
      state.shake = Math.min(1.2, state.shake + 0.75);
      state.flash = 1;
      burst(500, 250, g.color, 20);
      if (state.goal < GOALS.length - 1) {
        snd("goal");
        state.toast = g.done;
        state.toastT = 1.55;
        state.goal += 1;
        state.progress = 0;
        return;
      }
      addScore(25000, 500, 210, "#ffd24a");
      state.toast = "YOU WIN";
      state.toastT = 2;
      snd("victory");
      finish("win");
    }

    function scoreShot(kind, x, y) {
      var g = activeGoal();
      var active = g && g.kind === kind;
      var pts = active ? PTS[kind] : Math.round(PTS[kind] / 8);
      addScore(pts, x, y - 16, active && g ? g.color : "#e7e7f2");
      if (!active || !g) return;
      state.progress += 1;
      if (state.progress >= g.need) completeGoal();
    }

    function onDrain() {
      if (state.saver > 0) {
        state.saver = 0;
        state.toast = "BALL SAVER";
        state.toastT = 1.15;
        snd("saver");
        placeOnPlunger();
        return;
      }
      state.balls -= 1;
      state.shake = Math.min(1, state.shake + 0.55);
      state.trail.length = 0;
      snd("drain");
      if (state.balls <= 0) {
        snd("over");
        finish("lose");
        return;
      }
      ball.hidden = true;
      ball.lane = false;
      ball.rail = null;
      ball.captured = false;
      wait = 0.75;
    }

    function tryLaunch() {
      if (state.phase !== "play" || !ball.lane || ball.hidden) return;
      var power = Math.max(plunger.pull, 0.5);
      plunger.pull = 0;
      plunger.recoil = 1;
      ball.lane = false;
      ball.rail = {
        pts: [
          { x: TABLE.LANE_X, y: ball.y },
          { x: TABLE.LANE_X, y: 168 },
        ],
        i: 0,
        u: 0,
        speed: 760 + power * 380,
        kind: "exit",
      };
      state.saver = 7;
      snd("launch");
      burst(TABLE.LANE_X, ball.y, "#ffd24a", 10);
    }

    function kickFlipper(f, cpX, cpY, nx, ny, energetic) {
      var rx = cpX - f.px;
      var ry = cpY - f.py;
      var svx = -f.omega * ry;
      var svy = f.omega * rx;
      var swinging = Math.abs(f.omega) > 6;
      var dir = Math.sign(f.omega || 1);
      var faceX = -Math.sin(f.angle) * dir;
      var faceY = Math.cos(f.angle) * dir;
      if (swinging && energetic && nx * faceX + ny * faceY > 0.2 && !f.threw) {
        f.threw = true;
        var vn = ball.vx * nx + ball.vy * ny;
        var tx = ball.vx - vn * nx;
        var ty = ball.vy - vn * ny;
        ball.vx = svx + nx * 150 + tx * 0.2;
        ball.vy = svy + ny * 150 + ty * 0.2;
        return;
      }
      var rvx = ball.vx - svx;
      var rvy = ball.vy - svy;
      var into = rvx * nx + rvy * ny;
      if (into < 0) {
        var bounce = into < -80 ? 0.28 : 0.05;
        rvx -= (1 + bounce) * into * nx;
        rvy -= (1 + bounce) * into * ny;
        ball.vx = rvx + svx;
        ball.vy = rvy + svy;
      }
    }

    function collideFlipper(f, energetic) {
      var tipX = f.px + Math.cos(f.angle) * f.len;
      var tipY = f.py + Math.sin(f.angle) * f.len;
      var min = TABLE.R + f.thick;
      var sweep = wrapAngle(f.angle - f.prevAngle);
      if (Math.abs(sweep) > 1e-4) {
        var ang = Math.atan2(ball.y - f.py, ball.x - f.px);
        var rel = wrapAngle(ang - f.prevAngle);
        var radial = Math.hypot(ball.x - f.px, ball.y - f.py);
        var swept = sweep > 0 ? rel >= -0.02 && rel <= sweep + 0.02 : rel <= 0.02 && rel >= sweep - 0.02;
        if (swept && radial > 8 && radial < f.len + TABLE.R) {
          var dir = Math.sign(sweep);
          var nx = -Math.sin(f.angle) * dir;
          var ny = Math.cos(f.angle) * dir;
          var cp = closest(ball.x, ball.y, f.px, f.py, tipX, tipY);
          ball.x = cp.x + nx * min;
          ball.y = cp.y + ny * min;
          kickFlipper(f, cp.x, cp.y, nx, ny, energetic);
          return;
        }
      }
      if (segHit(ballPrev.x, ballPrev.y, ball.x, ball.y, f.px, f.py, tipX, tipY)) {
        var n = bladeNormal(f.px, f.py, tipX, tipY, ballPrev.x, ballPrev.y);
        var hit = closest(ball.x, ball.y, f.px, f.py, tipX, tipY);
        ball.x = hit.x + n.nx * min;
        ball.y = hit.y + n.ny * min;
        kickFlipper(f, hit.x, hit.y, n.nx, n.ny, energetic);
        return;
      }
      var seat = closest(ball.x, ball.y, f.px, f.py, tipX, tipY);
      var dx = ball.x - seat.x;
      var dy = ball.y - seat.y;
      var dist = Math.hypot(dx, dy) || 0.001;
      if (dist >= min) return;
      ball.x = seat.x + (dx / dist) * min;
      ball.y = seat.y + (dy / dist) * min;
      kickFlipper(f, seat.x, seat.y, dx / dist, dy / dist, energetic);
    }

    function sweepWall(w, rad) {
      var s0 = sideOf(w.ax, w.ay, w.bx, w.by, ballPrev.x, ballPrev.y);
      var s1 = sideOf(w.ax, w.ay, w.bx, w.by, ball.x, ball.y);
      if (s0 * s1 >= 0) return false;
      var denom = s0 - s1;
      if (Math.abs(denom) < 1e-6) return false;
      var t = s0 / denom;
      if (t < 0 || t > 1) return false;
      var ix = ballPrev.x + (ball.x - ballPrev.x) * t;
      var iy = ballPrev.y + (ball.y - ballPrev.y) * t;
      var cp = closest(ix, iy, w.ax, w.ay, w.bx, w.by);
      if (Math.hypot(ix - cp.x, iy - cp.y) > rad + 1) return false;
      var dx = w.bx - w.ax;
      var dy = w.by - w.ay;
      var len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len;
      var ny = dx / len;
      if (s0 < 0) {
        nx = -nx;
        ny = -ny;
      }
      ball.x = ix + nx * (rad + 0.75);
      ball.y = iy + ny * (rad + 0.75);
      var vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        ball.vx -= (1 + w.rest) * vn * nx;
        ball.vy -= (1 + w.rest) * vn * ny;
      }
      return true;
    }

    function collideWall(w) {
      if (w.oneWay && ball.x > w.ax - 1) return;
      var rad = w.kind === "ramp" ? TABLE.R + 6 : TABLE.R;
      if (w.kind !== "gate" && sweepWall(w, rad)) return;
      var cp = closest(ball.x, ball.y, w.ax, w.ay, w.bx, w.by);
      var dx = ball.x - cp.x;
      var dy = ball.y - cp.y;
      var dist = Math.hypot(dx, dy);
      if (dist >= rad) return;
      var facing = dx * w.nx + dy * w.ny;
      var pen = rad - facing;
      if (w.kind === "ramp") {
        if (dist > 0.001) {
          ball.x += (dx / dist) * (rad - dist);
          ball.y += (dy / dist) * (rad - dist);
        }
      } else if (pen > 0 && pen < 32) {
        ball.x += w.nx * pen;
        ball.y += w.ny * pen;
      } else if (dist > 0.001) {
        ball.x += (dx / dist) * (rad - dist);
        ball.y += (dy / dist) * (rad - dist);
      }
      var nx = dist > 0.001 ? dx / dist : w.nx;
      var ny = dist > 0.001 ? dy / dist : w.ny;
      var vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        ball.vx -= (1 + w.rest) * vn * nx;
        ball.vy -= (1 + w.rest) * vn * ny;
      }
    }

    function collidePost(p) {
      var dx = ball.x - p.x;
      var dy = ball.y - p.y;
      var dist = Math.hypot(dx, dy) || 0.001;
      var min = TABLE.R + p.r;
      if (dist >= min) return;
      var nx = dx / dist;
      var ny = dy / dist;
      ball.x = p.x + nx * min;
      ball.y = p.y + ny * min;
      var vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        ball.vx -= 1.35 * vn * nx;
        ball.vy -= 1.35 * vn * ny;
      }
    }

    function collideBumper(b) {
      var dx = ball.x - b.x;
      var dy = ball.y - b.y;
      var dist = Math.hypot(dx, dy) || 0.001;
      var min = TABLE.R + b.r;
      if (dist >= min) return;
      var nx = dx / dist;
      var ny = dy / dist;
      ball.x = b.x + nx * min;
      ball.y = b.y + ny * min;
      if (b.cool > 0) {
        var vn = ball.vx * nx + ball.vy * ny;
        if (vn < 0) {
          ball.vx -= vn * nx;
          ball.vy -= vn * ny;
        }
        return;
      }
      ball.vx = nx * 700;
      ball.vy = ny * 700;
      b.cool = 0.14;
      b.flash = 0.18;
      addScore(150, b.x, b.y - b.r, "#ffffff");
      snd("bumper");
      state.shake = Math.min(1, state.shake + 0.28);
      burst(b.x, b.y, "#5ee7ff", 10);
    }

    function collideTarget(t) {
      if (t.down > 0) return;
      var ax = t.x;
      var ay = t.y - t.h * 0.5;
      var bx = t.x;
      var by = t.y + t.h * 0.5;
      var cp = closest(ball.x, ball.y, ax, ay, bx, by);
      var dx = ball.x - cp.x;
      var dy = ball.y - cp.y;
      var dist = Math.hypot(dx, dy) || 0.001;
      var min = TABLE.R + t.r;
      if (dist >= min) return;
      var nx = dx / dist;
      var ny = dy / dist;
      ball.x += nx * (min - dist);
      ball.y += ny * (min - dist);
      var vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        ball.vx -= 1.45 * vn * nx;
        ball.vy -= 1.45 * vn * ny;
      }
      t.down = 0.62;
      t.flash = 0.28;
      snd("target");
      scoreShot("hit", t.x, t.y);
      burst(t.x, t.y, activeGoal() && activeGoal().kind === "hit" ? activeGoal().color : "#d5def2", 8);
    }

    function solveCollisions() {
      var pass, i;
      for (pass = 0; pass < 3; pass++) {
        for (i = 0; i < walls.length; i++) collideWall(walls[i]);
        for (i = 0; i < flippers.length; i++) collideFlipper(flippers[i], pass === 0);
        for (i = 0; i < posts.length; i++) collidePost(posts[i]);
      }
      for (i = 0; i < bumpers.length; i++) collideBumper(bumpers[i]);
      for (i = 0; i < targets.length; i++) collideTarget(targets[i]);
    }

    function sensors() {
      if (ignoreRamp <= 0 && !ball.rail) {
        var crossed = segHit(ballPrev.x, ballPrev.y, ball.x, ball.y, RAMP.sx1, RAMP.sy1, RAMP.sx2, RAMP.sy2);
        if (crossed && ball.y > ballPrev.y + 0.35) {
          ignoreRamp = 0.65;
          scoreShot("ramp", 72, 290);
          snd("ramp");
          burst(72, 270, "#ff4fd8", 12);
        }
      }
      if (!ball.captured && captureLock <= 0) {
        var dx = ball.x - slot.x;
        var dy = ball.y - slot.y;
        if (dx * dx + dy * dy < 20 * 20 && ball.vy > -60) {
          ball.captured = true;
          ball.capT = 0;
          scoreShot("slot", slot.x, slot.y);
          snd("slot");
          burst(slot.x, slot.y, "#ffd24a", 14);
        }
      }
    }

    function capSpeed() {
      var sp = Math.hypot(ball.vx, ball.vy);
      if (sp > TABLE.MAX_V) {
        ball.vx = (ball.vx / sp) * TABLE.MAX_V;
        ball.vy = (ball.vy / sp) * TABLE.MAX_V;
      }
    }

    function blockedByFlipper(x0, y0, speed) {
      var x1 = ball.x;
      var y1 = ball.y;
      for (var i = 0; i < flippers.length; i++) {
        var f = flippers[i];
        var tipX = f.px + Math.cos(f.angle) * f.len;
        var tipY = f.py + Math.sin(f.angle) * f.len;
        var min = TABLE.R + f.thick;
        var cp = closest(x1, y1, f.px, f.py, tipX, tipY);
        var dist = Math.hypot(x1 - cp.x, y1 - cp.y);
        var crossed = segHit(x0, y0, x1, y1, f.px, f.py, tipX, tipY);
        if (dist >= min && !crossed) continue;
        var n = bladeNormal(f.px, f.py, tipX, tipY, x0, y0);
        var seat = closest(x0, y0, f.px, f.py, tipX, tipY);
        ballPrev.x = x0;
        ballPrev.y = y0;
        ball.x = seat.x + n.nx * (min - 0.8);
        ball.y = seat.y + n.ny * (min - 0.8);
        var mx = x1 - x0;
        var my = y1 - y0;
        var ml = Math.hypot(mx, my) || 1;
        ball.vx = (mx / ml) * speed;
        ball.vy = (my / ml) * speed;
        ball.rail = null;
        collideFlipper(f, true);
        return true;
      }
      return false;
    }

    function stepRail(dt) {
      var rail = ball.rail;
      if (!rail) return;
      var remain = rail.speed * dt;
      var pts = rail.pts;
      while (remain > 0 && rail.i < pts.length - 1 && ball.rail) {
        var a = pts[rail.i];
        var b = pts[rail.i + 1];
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var len = Math.hypot(dx, dy) || 0.001;
        var left = (1 - rail.u) * len;
        var x0 = ball.x;
        var y0 = ball.y;
        if (remain >= left) {
          remain -= left;
          rail.i += 1;
          rail.u = 0;
          ball.x = b.x;
          ball.y = b.y;
        } else {
          rail.u += remain / len;
          ball.x = a.x + dx * rail.u;
          ball.y = a.y + dy * rail.u;
          remain = 0;
        }
        if (blockedByFlipper(x0, y0, rail.speed)) return;
        ballPrev.x = ball.x;
        ballPrev.y = ball.y;
      }
      if (!ball.rail) return;
      if (rail.i >= pts.length - 1) {
        var a2 = pts[pts.length - 2];
        var b2 = pts[pts.length - 1];
        var dx2 = b2.x - a2.x;
        var dy2 = b2.y - a2.y;
        var len2 = Math.hypot(dx2, dy2) || 1;
        ball.vx = (dx2 / len2) * rail.speed;
        ball.vy = (dy2 / len2) * rail.speed;
        ball.rail = null;
        ballPrev.x = ball.x;
        ballPrev.y = ball.y;
      }
    }

    function stepLane(dt) {
      ball.vy += TABLE.GRAV * dt;
      ball.y += ball.vy * dt;
      ball.x = TABLE.LANE_X;
      ball.vx = 0;
      var head = PLUNGER_Y + plunger.pull * 32 - plunger.recoil * 18;
      var limit = head - TABLE.R;
      if (ball.y > limit) {
        ball.y = limit;
        if (ball.vy > 0) ball.vy = 0;
      }
      if (ball.y < 70) ball.y = 70;
      if (input.launch && !suppressLaunch) plunger.pull = Math.min(1, plunger.pull + dt * 0.85);
    }

    function stepCapture(dt) {
      ball.capT += dt;
      var k = Math.min(1, dt * 10);
      ball.x += (slot.x - ball.x) * k;
      ball.y += (slot.y - ball.y) * k;
      ball.vx = 0;
      ball.vy = 0;
      if (ball.capT > 0.62) {
        ball.captured = false;
        captureLock = 0.45;
        ball.vy = 460;
        ball.vx = (Math.random() - 0.5) * 90;
        ball.y = slot.y + 28;
      }
    }

    function stepFree(dt) {
      var prevX = ball.x;
      var prevY = ball.y;
      ballPrev.x = prevX;
      ballPrev.y = prevY;
      ball.vy += TABLE.GRAV * dt;
      var drag = Math.exp(-0.16 * dt);
      ball.vx *= drag;
      ball.vy *= drag;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.spin += ball.vx * dt * 0.02;
      solveCollisions();
      capSpeed();
      if (ball.y > 620 || ball.x < -30 || ball.x > 1080) {
        onDrain();
        return;
      }
      sensors();
      var sp = Math.hypot(ball.vx, ball.vy);
      if (sp < 16) stuck += dt;
      else stuck = 0;
      if (stuck > 2.5) {
        ball.vy -= 160;
        ball.vx += (Math.random() - 0.5) * 120;
        stuck = 0;
      }
    }

    function updateFlippers(dt) {
      var slices = 8;
      var h = dt / slices;
      var live = !ball.hidden && !ball.lane && !ball.rail && !ball.captured && wait <= 0;
      var s, i;
      for (i = 0; i < flippers.length; i++) flippers[i].threw = false;
      for (s = 0; s < slices; s++) {
        for (i = 0; i < flippers.length; i++) {
          var f = flippers[i];
          f.prevAngle = f.angle;
          var held = f.side === "L" ? input.left : input.right;
          var target = held ? f.up : f.rest;
          var speed = held ? 20 : 14;
          var delta = target - f.angle;
          var max = speed * h;
          if (Math.abs(delta) <= max) {
            f.omega = delta / Math.max(h, 1e-4);
            f.angle = target;
          } else {
            f.omega = Math.sign(delta) * speed;
            f.angle += f.omega * h;
          }
        }
        if (live) {
          for (i = 0; i < flippers.length; i++) collideFlipper(flippers[i], true);
        }
      }
    }

    function physics(dt) {
      if (state.phase !== "play") return;
      var i;
      for (i = 0; i < bumpers.length; i++) bumpers[i].cool = Math.max(0, bumpers[i].cool - dt);
      for (i = 0; i < walls.length; i++) walls[i].cool = Math.max(0, walls[i].cool - dt);
      for (i = 0; i < targets.length; i++) targets[i].down = Math.max(0, targets[i].down - dt);
      if (ignoreRamp > 0) ignoreRamp -= dt;
      if (captureLock > 0) captureLock -= dt;
      updateFlippers(dt);
      if (wait > 0) {
        wait -= dt;
        if (wait <= 0) serve(false);
        return;
      }
      if (ball.hidden) return;
      if (ball.rail) return stepRail(dt);
      if (ball.captured) return stepCapture(dt);
      if (ball.lane) return stepLane(dt);
      stepFree(dt);
      if (!Number.isFinite(ball.x) || !Number.isFinite(ball.y)) serve(false);
    }

    function decay(dt) {
      state.flash = Math.max(0, state.flash - dt * 1.5);
      state.shake = Math.max(0, state.shake - dt * 2.1);
      state.toastT = Math.max(0, state.toastT - dt);
      plunger.recoil = Math.max(0, plunger.recoil - dt * 3.2);
      var i;
      for (i = 0; i < bumpers.length; i++) bumpers[i].flash = Math.max(0, bumpers[i].flash - dt);
      for (i = 0; i < targets.length; i++) targets[i].flash = Math.max(0, targets[i].flash - dt);
      for (i = state.particles.length - 1; i >= 0; i--) {
        var p = state.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 280 * dt;
        if (p.life <= 0) state.particles.splice(i, 1);
      }
      for (i = state.floaters.length - 1; i >= 0; i--) {
        var f = state.floaters[i];
        f.life -= dt;
        f.y -= 32 * dt;
        if (f.life <= 0) state.floaters.splice(i, 1);
      }
    }

    function setHeld(which, down) {
      if (which === "left") {
        if (down && !input.left) {
          input.leftJust = true;
          snd("flip");
        }
        input.left = down;
      } else if (which === "right") {
        if (down && !input.right) {
          input.rightJust = true;
          snd("flip");
        }
        input.right = down;
      } else {
        if (!down && input.launch) input.launchJustUp = true;
        input.launch = down;
      }
    }

    function newGame() {
      state.phase = "play";
      state.score = 0;
      state.balls = 3;
      state.goal = 0;
      state.progress = 0;
      state.toast = "Invent it. Prototype it. Test it.";
      state.toastT = 2.6;
      state.flash = 0;
      state.saver = 0;
      wait = 0;
      stuck = 0;
      state.particles.length = 0;
      state.floaters.length = 0;
      targets.forEach(function (t) {
        t.down = 0;
        t.flash = 0;
      });
      flippers.forEach(function (f) {
        f.angle = f.rest;
        f.prevAngle = f.rest;
        f.omega = 0;
      });
      serve(true);
    }

    function frame(dt) {
      var step = Math.min(0.05, Math.max(0, dt));
      state.time += step;
      decay(step);
      if (state.phase === "play") {
        if (suppressLaunch && !input.launch) suppressLaunch = false;
        if (input.launchJustUp) {
          input.launchJustUp = false;
          if (!suppressLaunch) tryLaunch();
        }
        acc += step;
        var n = 0;
        var STEP = 1 / 180;
        while (acc >= STEP && n < 16 && state.phase === "play") {
          physics(STEP);
          acc -= STEP;
          n++;
        }
        if (n >= 16) acc = 0;
        if (state.saver > 0 && !ball.lane && !ball.hidden && !ball.rail) state.saver = Math.max(0, state.saver - step);
      } else if (state.phase === "attract") {
        placeOnPlunger();
        flippers.forEach(function (f, i) {
          f.angle = f.rest + Math.sin(state.time * 1.5 + i) * 0.05;
        });
      }
      input.leftJust = false;
      input.rightJust = false;
      if (ball.hidden) state.trail.length = 0;
      else {
        state.trail.push({ x: ball.x, y: ball.y });
        if (state.trail.length > 8) state.trail.shift();
      }
    }

    placeOnPlunger();
    return {
      TABLE: TABLE,
      RAMP: RAMP,
      GOALS: GOALS,
      walls: walls,
      flippers: flippers,
      bumpers: bumpers,
      targets: targets,
      posts: posts,
      slot: slot,
      ball: ball,
      plunger: plunger,
      state: state,
      setHeld: setHeld,
      newGame: newGame,
      frame: frame,
      activeGoal: activeGoal,
    };
  }

  var fieldArt = null;
  if (typeof Image !== "undefined") {
    fieldArt = new Image();
    fieldArt.src = "bg.jpg";
  }

  function outlined(ctx, text, x, y, fill, size, align) {
    ctx.font = "700 " + size + "px Oxanium, sans-serif";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, size * 0.22);
    ctx.strokeStyle = "rgba(6, 4, 16, 0.92)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  function round(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function draw(ctx, game) {
    var W = TABLE.W;
    var H = TABLE.H;
    var st = game.state;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (st.shake > 0.04) ctx.translate((Math.random() - 0.5) * st.shake * 8, (Math.random() - 0.5) * st.shake * 8);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#120826");
    g.addColorStop(0.5, "#1a1038");
    g.addColorStop(1, "#070512");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (fieldArt && fieldArt.complete && fieldArt.naturalWidth) {
      var iw = fieldArt.naturalWidth;
      var ih = fieldArt.naturalHeight;
      var scale = Math.max(W / iw, H / ih);
      var dw = iw * scale;
      var dh = ih * scale;
      ctx.drawImage(fieldArt, 0, (H - dh) / 2, dw, dh);
      var wash = ctx.createLinearGradient(0, 0, 0, H);
      wash.addColorStop(0, "rgba(7, 5, 26, 0.34)");
      wash.addColorStop(0.45, "rgba(7, 5, 26, 0.14)");
      wash.addColorStop(1, "rgba(7, 5, 26, 0.28)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, W, H);
    }
    if (!(fieldArt && fieldArt.complete && fieldArt.naturalWidth)) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#9ecbff";
    ctx.lineWidth = 1;
    var x, y;
    for (x = 40; x < 900; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, TABLE.TOP);
      ctx.lineTo(x, TABLE.APRON);
      ctx.stroke();
    }
    for (y = 50; y < TABLE.APRON; y += 48) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(900, y);
      ctx.stroke();
    }
    ctx.restore();
    var pg = ctx.createRadialGradient(-30 - 52, 210 - 52, 15, -30, 210, 150);
    pg.addColorStop(0, "#fff6e8");
    pg.addColorStop(0.25, "#ffb15a");
    pg.addColorStop(1, "#ff6a1a");
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(-30, 210, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    }
    var apron = ctx.createLinearGradient(0, TABLE.APRON, 0, H);
    apron.addColorStop(0, "rgba(8, 6, 18, 0.2)");
    apron.addColorStop(0.25, "#0c0816");
    apron.addColorStop(1, "#070510");
    ctx.fillStyle = apron;
    ctx.fillRect(0, TABLE.APRON, W, H - TABLE.APRON);

    var lit = game.activeGoal();
    game.walls.forEach(function (w) {
      if (w.kind === "gate") {
        ctx.save();
        ctx.setLineDash([5, 6]);
        ctx.strokeStyle = "rgba(180, 220, 255, 0.45)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w.ax, w.ay);
        ctx.lineTo(w.bx, w.by);
        ctx.stroke();
        ctx.restore();
        return;
      }
      if (w.kind === "ramp") return;
      var color = w.kind === "funnel" ? (lit && lit.kind === "slot" ? lit.color : "#9eb0d4") : "#d5e6ff";
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(4, 2, 12, 0.9)";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(w.ax, w.ay);
      ctx.lineTo(w.bx, w.by);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.stroke();
    });
    var rampColor = lit && lit.kind === "ramp" ? lit.color : "#8ea0c8";
    ctx.beginPath();
    ctx.moveTo(RAMP.lax, RAMP.lay);
    ctx.lineTo(RAMP.lbx, RAMP.lby);
    ctx.lineTo(RAMP.rbx, RAMP.rby);
    ctx.lineTo(RAMP.rax, RAMP.ray);
    ctx.closePath();
    ctx.fillStyle = "rgba(80, 110, 160, 0.18)";
    ctx.fill();
    ctx.lineCap = "round";
    ctx.lineWidth = 5;
    ctx.strokeStyle = rampColor;
    ctx.beginPath();
    ctx.moveTo(RAMP.lax, RAMP.lay);
    ctx.lineTo(RAMP.lbx, RAMP.lby);
    ctx.moveTo(RAMP.rax, RAMP.ray);
    ctx.lineTo(RAMP.rbx, RAMP.rby);
    ctx.stroke();

    var slotColor = lit && lit.kind === "slot" ? lit.color : "#8ea2cc";
    var sg = ctx.createRadialGradient(game.slot.x, game.slot.y, 2, game.slot.x, game.slot.y, game.slot.r);
    sg.addColorStop(0, lit && lit.kind === "slot" ? slotColor : "#1a1630");
    sg.addColorStop(1, "#05030c");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(game.slot.x, game.slot.y, game.slot.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = slotColor;
    ctx.stroke();

    game.bumpers.forEach(function (b) {
      var s = 1 + b.flash * 0.22;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(s, s);
      ctx.beginPath();
      ctx.arc(0, 0, b.r + 3, 0, Math.PI * 2);
      ctx.fillStyle = "#f7fbff";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#120a1c";
      ctx.stroke();
      var bg = ctx.createRadialGradient(-6, -8, 2, 0, 0, b.r);
      bg.addColorStop(0, "#ffffff");
      bg.addColorStop(0.45, "#5ee7ff");
      bg.addColorStop(1, "#1a1030");
      ctx.beginPath();
      ctx.arc(0, 0, b.r - 6, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.restore();
    });

    var hitColor = lit && lit.kind === "hit" ? lit.color : "#b7c3de";
    game.targets.forEach(function (t) {
      var drop = t.down > 0 ? 10 : 0;
      var h = t.h * (t.down > 0 ? 0.35 : 1);
      ctx.save();
      ctx.translate(t.x, t.y + drop);
      ctx.lineCap = "round";
      ctx.strokeStyle = t.flash > 0 ? "#ffffff" : hitColor;
      ctx.lineWidth = t.r * 2;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(0, h / 2);
      ctx.stroke();
      ctx.restore();
    });
    game.posts.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "#f4f7ff";
      ctx.fill();
    });
    outlined(ctx, "INVENT", 717, 132, lit ? lit.color : "#5ee7ff", 15, "center");
    outlined(ctx, "PROTOTYPE", 132, 242, lit ? lit.color : "#ff4fd8", 15, "center");
    outlined(ctx, "TEST", game.slot.x, game.slot.y - 36, lit ? lit.color : "#ffd24a", 15, "center");

    game.flippers.forEach(function (f) {
      var tipX = f.px + Math.cos(f.angle) * f.len;
      var tipY = f.py + Math.sin(f.angle) * f.len;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1a0828";
      ctx.lineWidth = f.thick * 2 + 8;
      ctx.beginPath();
      ctx.moveTo(f.px, f.py);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = f.thick * 2;
      ctx.stroke();
      ctx.strokeStyle = "#f3e8ff";
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    var head = PLUNGER_Y + game.plunger.pull * 32 - game.plunger.recoil * 18;
    ctx.strokeStyle = "#9fb4d8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(TABLE.LANE_X, head + 8);
    var springY = head + 8;
    for (var i = 0; i < 7; i++) {
      var ny = head + 8 + ((562 - head - 8) * (i + 1)) / 7;
      var swing = i % 2 === 0 ? -12 : 12;
      ctx.lineTo(TABLE.LANE_X + swing, (springY + ny) / 2);
      ctx.lineTo(TABLE.LANE_X, ny);
      springY = ny;
    }
    ctx.stroke();
    round(ctx, TABLE.LANE_X - 22, head - 8, 44, 18, 4);
    ctx.fillStyle = "#f7f8ff";
    ctx.fill();
    ctx.strokeStyle = "#ff4fd8";
    ctx.lineWidth = 2;
    ctx.stroke();
    var spaceCy = Math.min(head - 46, 478);
    round(ctx, TABLE.LANE_X - 28, spaceCy - 18, 56, 36, 4);
    ctx.fillStyle = "#0e0a16";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 11px Oxanium, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPACE", TABLE.LANE_X, spaceCy - 8);
    ctx.fillText("LAUNCH", TABLE.LANE_X, spaceCy + 8);

    st.trail.forEach(function (p, i) {
      ctx.fillStyle = "rgba(255,255,255," + ((i + 1) / st.trail.length) * 0.35 + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, TABLE.R * (0.35 + (i / st.trail.length) * 0.5), 0, Math.PI * 2);
      ctx.fill();
    });
    if (!game.ball.hidden) {
      var bx = game.ball.x;
      var by = game.ball.y;
      var ballG = ctx.createRadialGradient(bx - 4, by - 4, 1, bx, by, TABLE.R);
      ballG.addColorStop(0, "#ffffff");
      ballG.addColorStop(0.45, "#e7f0ff");
      ballG.addColorStop(1, "#7d8cff");
      ctx.beginPath();
      ctx.arc(bx, by, TABLE.R, 0, Math.PI * 2);
      ctx.fillStyle = ballG;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#140c22";
      ctx.stroke();
    }
    st.particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    st.floaters.forEach(function (f) {
      ctx.globalAlpha = Math.max(0, f.life / f.max);
      outlined(ctx, f.text, f.x, f.y, f.color, 16, "center");
    });
    ctx.globalAlpha = 1;

    outlined(ctx, st.score.toLocaleString("en-US"), 28, 18, "#ffffff", 18, "left");
    outlined(ctx, "WORKSHOP", 500, 18, "#ffffff", 16, "center");
    for (var b = 0; b < 3; b++) {
      ctx.beginPath();
      ctx.arc(860 + b * 16, 18, 5, 0, Math.PI * 2);
      ctx.fillStyle = b < st.balls ? "#ffffff" : "rgba(255,255,255,0.25)";
      ctx.fill();
    }
    if (st.saver > 0.05 && st.phase === "play") outlined(ctx, "SAVER " + st.saver.toFixed(1), 780, 36, "#3dff9a", 12, "right");
    if (st.toastT > 0 && st.toast) outlined(ctx, st.toast, 500, 250, "#ffffff", 22, "center");

    GOALS.forEach(function (goal, i) {
      var gap = 8;
      var w = (TABLE.W - 20 - gap * 2) / 3;
      var gx = 10 + i * (w + gap);
      var gy = 524;
      var done = i < st.goal || st.phase === "win";
      var active = i === st.goal && st.phase === "play";
      round(ctx, gx, gy, w, 46, 8);
      ctx.fillStyle = active ? "rgba(255,255,255,0.08)" : "rgba(12, 10, 22, 0.72)";
      ctx.fill();
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.strokeStyle = active || done ? goal.color : "rgba(180, 190, 220, 0.28)";
      ctx.stroke();
      outlined(ctx, goal.title.toUpperCase(), gx + 12, gy + 16, active || done ? goal.color : "rgba(220,224,240,0.55)", 13, "left");
      var prog = done ? "DONE" : active ? st.progress + "/" + goal.need : "";
      if (prog) outlined(ctx, prog, gx + w - 10, gy + 16, goal.color, 12, "right");
      ctx.font = "12px Sora, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = active ? "#f4f7ff" : "rgba(210, 214, 230, 0.62)";
      ctx.fillText(goal.blurb, gx + 12, gy + 34);
    });
    ctx.restore();
  }

  function start() {
    var canvas = document.getElementById("table");
    var ctx = canvas.getContext("2d");
    var overlay = document.getElementById("overlay");
    var headline = document.getElementById("headline");
    var blurb = document.getElementById("blurb");
    var playBtn = document.getElementById("play");
    var game = createTable();
    try {
      game.state.highScore = Number(localStorage.getItem("ag-small-best") || 0);
    } catch (err) {
      game.state.highScore = 0;
    }

    function showEnd() {
      if (game.state.phase === "attract") {
        headline.textContent = "AG Pinball";
        blurb.textContent = "The Workshop. Light Invent, Prototype, and Test. Three balls. This round does not continue.";
        playBtn.textContent = "Play";
        overlay.hidden = false;
        return;
      }
      if (game.state.phase !== "win" && game.state.phase !== "lose") {
        overlay.hidden = true;
        return;
      }
      headline.textContent = game.state.phase === "win" ? "You Win" : "Game Over";
      blurb.textContent =
        game.state.phase === "win"
          ? "Invent, Prototype, and Test are done. Score " + game.state.score.toLocaleString("en-US") + "."
          : "The lights are not all lit. Score " + game.state.score.toLocaleString("en-US") + ".";
      playBtn.textContent = "Play again";
      overlay.hidden = false;
      try {
        localStorage.setItem("ag-small-best", String(game.state.highScore));
      } catch (err) {
        /* private mode can refuse storage */
      }
    }

    function begin() {
      if (typeof AGSound !== "undefined") AGSound.unlock();
      game.newGame();
      showEnd();
    }

    playBtn.addEventListener("click", begin);

    function bindHold(id, which) {
      var el = document.getElementById(id);
      el.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        if (typeof AGSound !== "undefined") AGSound.unlock();
        el.setPointerCapture(e.pointerId);
        game.setHeld(which, true);
      });
      var up = function () {
        game.setHeld(which, false);
      };
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    }
    bindHold("left", "left");
    bindHold("right", "right");
    bindHold("launch", "launch");

    window.addEventListener("keydown", function (e) {
      if (e.repeat) return;
      if (typeof AGSound !== "undefined") AGSound.unlock();
      if (e.code === "KeyS" && typeof AGSound !== "undefined") {
        AGSound.toggleSound();
        return;
      }
      if (e.code === "KeyM" && typeof AGSound !== "undefined") {
        AGSound.toggleMusic();
        return;
      }
      if (e.code === "KeyZ") game.setHeld("left", true);
      if (e.code === "Slash") game.setHeld("right", true);
      if (e.code === "Space") {
        e.preventDefault();
        if (game.state.phase !== "play") begin();
        else game.setHeld("launch", true);
      }
    });
    window.addEventListener("keyup", function (e) {
      if (e.code === "KeyZ") game.setHeld("left", false);
      if (e.code === "Slash") game.setHeld("right", false);
      if (e.code === "Space") {
        e.preventDefault();
        game.setHeld("launch", false);
      }
    });
    window.addEventListener("blur", function () {
      game.setHeld("left", false);
      game.setHeld("right", false);
      game.setHeld("launch", false);
    });

    showEnd();
    var last = 0;
    var seen = game.state.phase;
    function loop(now) {
      var dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
      last = now;
      game.frame(dt);
      if (typeof AGSound !== "undefined") AGSound.tick(game.state.phase === "play");
      draw(ctx, game);
      if (game.state.phase !== seen) {
        seen = game.state.phase;
        showEnd();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  root.createTable = createTable;
  if (typeof document !== "undefined") start();
})(typeof module !== "undefined" && module.exports ? module.exports : typeof window !== "undefined" ? window : {});
