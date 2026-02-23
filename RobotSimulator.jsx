import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import PhaserGame from "./PhaserGame.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────

const WORLD_M   = 4;
const PX_PER_M  = 100;
const WORLD_PX  = WORLD_M * PX_PER_M;
const ROBOT_PX  = 44;        // slightly larger for kid-friendly visibility
const SPEED_MPS = 1.0;       // curriculum scale: 1 square/s (100px/s)

// ─── Chassis presets ──────────────────────────────────────────────────────────

const CHASSIS_PRESETS = {
  rover: {
    label: "Rover",
    emoji: "🚗",
    desc: "Two drive wheels, front sensor",
    color: "#4fc3f7",
    ports: {
      A: { role:"wheel_left",  label:"Left wheel"  },
      B: { role:"wheel_right", label:"Right wheel" },
      C: { role:"arm",         label:"Arm"         },
      D: { role:"sensor",      label:"Sensor"      },
      E: { role:"empty",       label:"—"           },
      F: { role:"empty",       label:"—"           },
    },
    hasDrive: true,
  },
  arm_bot: {
    label: "Arm Bot",
    emoji: "🦾",
    desc: "Drive base + lifting arm + claw + light matrix",
    color: "#81c784",
    ports: {
      A: { role:"wheel_left",  label:"Left wheel"  },
      B: { role:"wheel_right", label:"Right wheel" },
      C: { role:"arm",         label:"Lift arm"    },
      D: { role:"claw",        label:"Claw"        },
      E: { role:"sensor",      label:"Sensor"      },
      F: { role:"color_light_matrix", label:"Color Light Matrix" },
    },
    hasDrive: true,
  },
  crane: {
    label: "Crane",
    emoji: "🏗️",
    desc: "Fixed base, rotating arm + claw",
    color: "#ffb74d",
    ports: {
      A: { role:"rotate",      label:"Base rotate" },
      B: { role:"arm",         label:"Lift arm"    },
      C: { role:"claw",        label:"Claw"        },
      D: { role:"sensor",      label:"Sensor"      },
      E: { role:"empty",       label:"—"           },
      F: { role:"empty",       label:"—"           },
    },
    hasDrive: false,
  },
  custom: {
    label: "Custom",
    emoji: "🔧",
    desc: "Define every port yourself",
    color: "#ce93d8",
    ports: {
      A: { role:"empty", label:"—" },
      B: { role:"empty", label:"—" },
      C: { role:"empty", label:"—" },
      D: { role:"empty", label:"—" },
      E: { role:"empty", label:"—" },
      F: { role:"empty", label:"—" },
    },
    hasDrive: false,
  },
};

const PORT_ROLES = [
  { id:"wheel_left",  icon:"⚙️", label:"Left Wheel",  color:"#4fc3f7" },
  { id:"wheel_right", icon:"⚙️", label:"Right Wheel", color:"#4fc3f7" },
  { id:"arm",         icon:"🦾", label:"Lift Arm",    color:"#81c784" },
  { id:"claw",        icon:"🤏", label:"Claw",        color:"#ffb74d" },
  { id:"rotate",      icon:"🔄", label:"Rotate Base", color:"#ce93d8" },
  { id:"grabber",     icon:"🪝", label:"Grabber",     color:"#f48fb1" },
  { id:"sensor",      icon:"📡", label:"Sensor",      color:"#90a4ae" },
  { id:"color_light_matrix", icon:"💡", label:"Color Light Matrix", color:"#ffeb3b" },
  { id:"empty",       icon:"—",  label:"Empty",       color:"#333"   },
];

// ─── Obstacle definitions ─────────────────────────────────────────────────────

const OBSTACLE_TYPES = {
  barrier: {
    label: "Barrier",
    icon: "🧱",
    color: "#ef5350",
    glow: "#ef535066",
    desc: "Blocks the robot's path",
    width: 40,
    height: 40,
    interactable: false,
  },
  wall_h: {
    label: "Wall (H)",
    icon: "🪨",
    color: "#8d6e63",
    glow: "#8d6e6366",
    desc: "Horizontal wall segment",
    width: 80,
    height: 16,
    interactable: false,
  },
  wall_v: {
    label: "Wall (V)",
    icon: "🪨",
    color: "#8d6e63",
    glow: "#8d6e6366",
    desc: "Vertical wall segment",
    width: 16,
    height: 80,
    interactable: false,
  },
  liftable: {
    label: "Lift Box",
    icon: "📦",
    color: "#ffb74d",
    glow: "#ffb74d66",
    desc: "Needs arm raised to lift",
    width: 30,
    height: 30,
    interactable: true,
    requires: { arm: true, armAngleMin: 45 },
  },
  grabbable: {
    label: "Grab Ball",
    icon: "🔴",
    color: "#e91e63",
    glow: "#e91e6366",
    desc: "Needs claw closed to grab",
    width: 24,
    height: 24,
    interactable: true,
    requires: { claw: true, clawOpen: false },
  },
  pushable: {
    label: "Push Block",
    icon: "🟦",
    color: "#42a5f5",
    glow: "#42a5f566",
    desc: "Robot can push this",
    width: 32,
    height: 32,
    interactable: true,
    requires: {},
  },
  goal: {
    label: "Goal Zone",
    icon: "🏁",
    color: "#66bb6a",
    glow: "#66bb6a66",
    desc: "Target destination",
    width: 50,
    height: 50,
    interactable: false,
  },
  ramp: {
    label: "Ramp",
    icon: "📐",
    color: "#ab47bc",
    glow: "#ab47bc66",
    desc: "Requires arm down to cross",
    width: 40,
    height: 24,
    interactable: true,
    requires: { arm: true, armAngleMax: 20 },
  },
};

// ─── Demo programs ────────────────────────────────────────────────────────────

const DEMO_PROGRAMS = {
  "Square (90°)": {
    commands: [
      { id:0, intent:"repeat",  slots:{ times:4 }, raw:"repeat 4 times" },
      { id:1, intent:"move",    slots:{ direction:"forward", duration:1.5 }, raw:"move forward 1.5s" },
      { id:2, intent:"turn",    slots:{ direction:"right", degrees:90 }, raw:"turn right 90°" },
      { id:3, intent:"stop_repeat", slots:{}, raw:"stop repeating" },
      { id:4, intent:"stop",    slots:{}, raw:"stop" },
    ],
    obstacles: [],
  },
  "Tight Corridor": {
    commands: [
      { id:0, intent:"move",  slots:{ direction:"forward", duration:1.2 }, raw:"move forward 1.2s" },
      { id:1, intent:"turn",  slots:{ direction:"right", degrees:90 }, raw:"turn right 90°" },
      { id:2, intent:"move",  slots:{ direction:"forward", duration:0.6 }, raw:"move forward 0.6s" },
      { id:3, intent:"turn",  slots:{ direction:"left", degrees:90 }, raw:"turn left 90°" },
      { id:4, intent:"move",  slots:{ direction:"forward", duration:1.5 }, raw:"move forward 1.5s" },
      { id:5, intent:"stop",  slots:{}, raw:"stop" },
    ],
    obstacles: [
      { id:"o1", type:"wall_v",  x:160, y:120 },
      { id:"o2", type:"wall_v",  x:240, y:120 },
      { id:"o3", type:"wall_h",  x:200, y:80 },
      { id:"o4", type:"wall_v",  x:160, y:260 },
      { id:"o5", type:"wall_v",  x:280, y:230 },
      { id:"o6", type:"goal",    x:200, y:50 },
    ],
  },
  "Lift & Carry": {
    commands: [
      { id:0, intent:"move",     slots:{ direction:"forward", duration:1 }, raw:"move forward 1s" },
      { id:1, intent:"arm_up",   slots:{ angle: 90 }, raw:"raise arm" },
      { id:2, intent:"claw_close", slots:{}, raw:"close claw" },
      { id:3, intent:"move",     slots:{ direction:"forward", duration:1.5 }, raw:"move forward 1.5s" },
      { id:4, intent:"arm_down", slots:{ angle: 0 }, raw:"lower arm" },
      { id:5, intent:"claw_open", slots:{}, raw:"open claw" },
      { id:6, intent:"stop",     slots:{}, raw:"stop" },
    ],
    obstacles: [
      { id:"o1", type:"liftable",  x:200, y:160 },
      { id:"o2", type:"goal",      x:200, y:80 },
    ],
  },
  "Grab & Turn": {
    commands: [
      { id:0, intent:"move",       slots:{ direction:"forward", duration:0.8 }, raw:"move forward 0.8s" },
      { id:1, intent:"claw_close", slots:{}, raw:"close claw" },
      { id:2, intent:"arm_up",     slots:{ angle:60 }, raw:"raise arm 60°" },
      { id:3, intent:"turn",       slots:{ direction:"right", degrees:90 }, raw:"turn right 90°" },
      { id:4, intent:"move",       slots:{ direction:"forward", duration:1.2 }, raw:"move forward 1.2s" },
      { id:5, intent:"arm_down",   slots:{ angle:0 }, raw:"lower arm" },
      { id:6, intent:"claw_open",  slots:{}, raw:"open claw" },
      { id:7, intent:"stop",       slots:{}, raw:"stop" },
    ],
    obstacles: [
      { id:"o1", type:"grabbable", x:200, y:155 },
      { id:"o2", type:"goal",      x:320, y:200 },
      { id:"o3", type:"barrier",   x:260, y:160 },
    ],
  },
  "Push Maze": {
    commands: [
      { id:0, intent:"move",  slots:{ direction:"forward", duration:2 }, raw:"move forward 2s" },
      { id:1, intent:"turn",  slots:{ direction:"left", degrees:90 }, raw:"turn left 90°" },
      { id:2, intent:"move",  slots:{ direction:"forward", duration:1 }, raw:"move forward 1s" },
      { id:3, intent:"stop",  slots:{}, raw:"stop" },
    ],
    obstacles: [
      { id:"o1", type:"pushable",  x:200, y:150 },
      { id:"o2", type:"wall_v",    x:150, y:100 },
      { id:"o3", type:"wall_v",    x:250, y:100 },
      { id:"o4", type:"goal",      x:200, y:60 },
    ],
  },
  "Angle Test": {
    commands: [
      { id:0, intent:"move",  slots:{ direction:"forward", duration:1 }, raw:"move forward 1s" },
      { id:1, intent:"turn",  slots:{ direction:"right", degrees:45 }, raw:"turn right 45°" },
      { id:2, intent:"move",  slots:{ direction:"forward", duration:1.2 }, raw:"move forward 1.2s" },
      { id:3, intent:"turn",  slots:{ direction:"left", degrees:135 }, raw:"turn left 135°" },
      { id:4, intent:"move",  slots:{ direction:"forward", duration:0.8 }, raw:"move forward 0.8s" },
      { id:5, intent:"turn",  slots:{ direction:"right", degrees:90 }, raw:"turn right 90°" },
      { id:6, intent:"move",  slots:{ direction:"forward", duration:1 }, raw:"move forward 1s" },
      { id:7, intent:"stop",  slots:{}, raw:"stop" },
    ],
    obstacles: [
      { id:"o1", type:"barrier",  x:250, y:130 },
      { id:"o2", type:"barrier",  x:130, y:240 },
      { id:"o3", type:"goal",     x:300, y:300 },
    ],
  },
  "Action Show": {
    commands: [
      { id:0, intent:"move",  slots:{ direction:"forward", duration:0.5 }, raw:"move forward 0.5s" },
      { id:1, intent:"beep",  slots:{}, raw:"beep" },
      { id:2, intent:"say",   slots:{ phrase:"hello" }, raw:"say hello" },
      { id:3, intent:"light", slots:{ color:"blue" }, raw:"light blue" },
      { id:4, intent:"light", slots:{ color:"green" }, raw:"light green" },
      { id:41, intent:"light_off", slots:{}, raw:"lights off" },
      { id:5, intent:"run_motor", slots:{ power:50 }, raw:"run motor 50%" },
      { id:6, intent:"if_button", slots:{}, raw:"if button pressed" },
      { id:7, intent:"if_force", slots:{ force:5 }, raw:"if force > 5 N" },
      { id:8, intent:"if_touched", slots:{}, raw:"if touched" },
      { id:9, intent:"if_color", slots:{ color:"red" }, raw:"if you see red" },
      { id:10, intent:"if_reflection", slots:{ comparison:"greater", value:50 }, raw:"if reflection > 50%" },
      { id:11, intent:"if_ambient", slots:{ comparison:"dark", value:20 }, raw:"if it's dark" },
      { id:12, intent:"move",  slots:{ direction:"forward", duration:0.5 }, raw:"move forward 0.5s" },
      { id:13, intent:"stop", slots:{}, raw:"stop" },
    ],
    obstacles: [],
  },
};

// ─── Physics engine ───────────────────────────────────────────────────────────

const FPS            = 30;
const TURN_DEG_PER_S = 180;
const ARM_SPEED      = 120;
const INTERACT_DIST  = 50;   // larger for easier interaction with bigger robot
const ROBOT_HALF_W   = ROBOT_PX * 0.45;
const ROBOT_HALF_H   = ROBOT_PX * 0.35;

function distBetween(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function degToRad(d) { return d * Math.PI / 180; }
function normalizeDeg(d) { return ((d % 360) + 360) % 360; }

// Separating Axis Theorem for two rotated rectangles.
// Each rect: { cx, cy, hw, hh, angle } (center, half-dims, degrees)
function satOverlap(a, b) {
  const aRad = degToRad(a.angle);
  const bRad = degToRad(b.angle);
  const axes = [
    { x: Math.cos(aRad), y: Math.sin(aRad) },
    { x: -Math.sin(aRad), y: Math.cos(aRad) },
    { x: Math.cos(bRad), y: Math.sin(bRad) },
    { x: -Math.sin(bRad), y: Math.cos(bRad) },
  ];
  function corners(r) {
    const c = Math.cos(degToRad(r.angle));
    const s = Math.sin(degToRad(r.angle));
    return [
      { x: r.cx + r.hw*c - r.hh*s, y: r.cy + r.hw*s + r.hh*c },
      { x: r.cx - r.hw*c - r.hh*s, y: r.cy - r.hw*s + r.hh*c },
      { x: r.cx - r.hw*c + r.hh*s, y: r.cy - r.hw*s - r.hh*c },
      { x: r.cx + r.hw*c + r.hh*s, y: r.cy + r.hw*s - r.hh*c },
    ];
  }
  const ca = corners(a);
  const cb = corners(b);
  for (const axis of axes) {
    let aMin = Infinity, aMax = -Infinity;
    let bMin = Infinity, bMax = -Infinity;
    for (const p of ca) {
      const proj = p.x * axis.x + p.y * axis.y;
      aMin = Math.min(aMin, proj);
      aMax = Math.max(aMax, proj);
    }
    for (const p of cb) {
      const proj = p.x * axis.x + p.y * axis.y;
      bMin = Math.min(bMin, proj);
      bMax = Math.max(bMax, proj);
    }
    if (aMax < bMin || bMax < aMin) return false;
  }
  return true;
}

function makeRobotRect(rx, ry, headingDeg) {
  return { cx: rx, cy: ry, hw: ROBOT_HALF_W, hh: ROBOT_HALF_H, angle: headingDeg + 90 };
}

function makeObstacleRect(ob) {
  const t = OBSTACLE_TYPES[ob.type];
  return { cx: ob.ox, cy: ob.oy, hw: t.width / 2, hh: t.height / 2, angle: 0 };
}

function buildFrames(commands, robotConfig, obstacles = []) {
  const frames = [];
  let x        = WORLD_PX / 2;
  let y        = WORLD_PX / 2;
  let heading  = -90;
  let armAngle = 0;
  let clawOpen = true;
  let carrying = null;
  // Trail uses shared array + length index to avoid O(n²) deep-copy per frame
  const trailFull = [{ x, y }];

  const obstacleState = obstacles.map(o => ({
    ...o,
    ...OBSTACLE_TYPES[o.type],
    ox: o.x, oy: o.y,
    pushed: false, lifted: false, grabbed: false,
  }));

  const push = (label, n = 1, event = null, effect = null) => {
    for (let i = 0; i < n; i++) {
      if (carrying) {
        const ob = obstacleState.find(o => o.id === carrying);
        if (ob) { ob.ox = x; ob.oy = y - 20; }
      }
      frames.push({
        x, y, heading, armAngle, clawOpen, carrying,
        trailLen: trailFull.length,
        label,
        obstacles: obstacleState.map(o => ({ ...o })),
        event: event || null,
        effect: i === 0 ? effect : null,
      });
    }
  };

  function validateInteraction(type) {
    const near = obstacleState.filter(o =>
      o.type === type && !o.lifted && !o.grabbed &&
      distBetween(x, y, o.ox, o.oy) < INTERACT_DIST
    );
    if (near.length === 0) return { ok: false, reason: `No ${type} nearby` };

    const target = near[0];
    const req = OBSTACLE_TYPES[type].requires || {};

    if (req.arm && !robotConfig.hasArm) return { ok: false, reason: "Robot has no arm" };
    if (req.claw && !robotConfig.hasClaw) return { ok: false, reason: "Robot has no claw" };
    if (req.armAngleMin != null && armAngle < req.armAngleMin)
      return { ok: false, reason: `Arm too low (${Math.round(armAngle)}° < ${req.armAngleMin}°)` };
    if (req.armAngleMax != null && armAngle > req.armAngleMax)
      return { ok: false, reason: `Arm too high (${Math.round(armAngle)}° > ${req.armAngleMax}°)` };
    if (req.clawOpen === false && clawOpen)
      return { ok: false, reason: "Claw must be closed" };
    if (req.clawOpen === true && !clawOpen)
      return { ok: false, reason: "Claw must be open" };

    return { ok: true, target };
  }

  // Check robot at (nx, ny, nh) against all obstacles using SAT
  // Returns: false = no collision, "blocked" = solid hit, "pushed" = pushed an object
  function checkCollision(nx, ny, nh) {
    const robotRect = makeRobotRect(nx, ny, nh);
    for (const ob of obstacleState) {
      if (ob.lifted || ob.grabbed || ob.id === carrying) continue;
      const ot = OBSTACLE_TYPES[ob.type];
      if (!ot) continue;
      const obsRect = makeObstacleRect(ob);
      if (satOverlap(robotRect, obsRect)) {
        if (ob.type === "pushable") {
          const pushAngle = degToRad(nh);
          // Push distance scales with robot step size for smooth interaction
          const pushDist = (SPEED_MPS * PX_PER_M / FPS) * 0.8;
          ob.ox += Math.cos(pushAngle) * pushDist;
          ob.oy += Math.sin(pushAngle) * pushDist;
          ob.ox = Math.max(ot.width / 2, Math.min(WORLD_PX - ot.width / 2, ob.ox));
          ob.oy = Math.max(ot.height / 2, Math.min(WORLD_PX - ot.height / 2, ob.oy));
          ob.pushed = true;
          return "pushed";
        }
        if (ob.type === "goal" || ob.type === "ramp") return false;
        return "blocked"; // solid collision
      }
    }
    return false;
  }

  const seq = unrollCommands(commands);

  for (const cmd of seq) {
    if (cmd.intent === "move") {
      const dist  = cmd.slots.duration * SPEED_MPS * PX_PER_M;
      const sign  = cmd.slots.direction === "backward" ? -1 : 1;
      const steps = Math.round(cmd.slots.duration * FPS);
      const headRad = degToRad(heading);
      const stepDist = (dist / steps) * sign;
      const dx = Math.cos(headRad) * stepDist;
      const dy = Math.sin(headRad) * stepDist;
      let blockedCount = 0;
      for (let i = 0; i < steps; i++) {
        const nx = Math.max(4, Math.min(WORLD_PX - 4, x + dx));
        const ny = Math.max(4, Math.min(WORLD_PX - 4, y + dy));
        const collision = checkCollision(nx, ny, heading);
        if (!collision || collision === "pushed") {
          x = nx; y = ny;
          trailFull.push({ x, y });
          push(collision === "pushed" ? `Pushing! 📦` : `Moving ${cmd.slots.direction}`);
          blockedCount = 0;
        } else {
          blockedCount++;
          push("Blocked! 🚫", 1, { type: "collision", msg: "Hit an obstacle!" });
          if (blockedCount >= 3) break; // stop after repeated collisions instead of grinding
        }
      }
    } else if (cmd.intent === "turn") {
      // Support both degree-based and duration-based turns
      const totalDeg = cmd.slots.degrees != null
        ? cmd.slots.degrees
        : cmd.slots.duration * TURN_DEG_PER_S;
      const sign     = cmd.slots.direction === "left" ? -1 : 1;
      const duration = cmd.slots.degrees != null
        ? cmd.slots.degrees / TURN_DEG_PER_S
        : cmd.slots.duration;
      const steps    = Math.max(1, Math.round(duration * FPS));
      const dh       = (totalDeg / steps) * sign;
      for (let i = 0; i < steps; i++) {
        const nextHeading = heading + dh;
        if (!checkCollision(x, y, nextHeading)) {
          heading = nextHeading;
          push(`Turning ${cmd.slots.direction} ${Math.round(normalizeDeg(heading))}°`);
        } else {
          push("Turn blocked! 🚫", 1, { type: "collision" });
          break;
        }
      }
    } else if (cmd.intent === "arm_up") {
      const target = cmd.slots.angle ?? 90;
      const steps  = Math.round(Math.abs(target - armAngle) / ARM_SPEED * FPS);
      const da     = steps > 0 ? (target - armAngle) / steps : 0;
      for (let i = 0; i < Math.max(steps, 1); i++) {
        armAngle = Math.min(180, Math.max(0, armAngle + da));
        push(`Raising arm ${Math.round(armAngle)}°`);
      }
      // Check if we can lift something
      const v = validateInteraction("liftable");
      if (v.ok && armAngle >= 45) {
        v.target.lifted = true;
        carrying = v.target.id;
        push("Lifting! ✅", FPS * 0.3, { type: "success", msg: "Object lifted!" });
      }
    } else if (cmd.intent === "arm_down") {
      const target = cmd.slots.angle ?? 0;
      const steps  = Math.round(Math.abs(armAngle - target) / ARM_SPEED * FPS);
      const da     = steps > 0 ? (target - armAngle) / steps : 0;
      for (let i = 0; i < Math.max(steps, 1); i++) {
        armAngle = Math.min(180, Math.max(0, armAngle + da));
        push(`Lowering arm ${Math.round(armAngle)}°`);
      }
      if (carrying) {
        const ob = obstacleState.find(o => o.id === carrying);
        if (ob) { ob.lifted = false; ob.ox = x; ob.oy = y - 20; }
        carrying = null;
        push("Set down ✅", FPS * 0.3, { type: "success", msg: "Object placed!" });
      }
    } else if (cmd.intent === "claw_close") {
      clawOpen = false;
      const steps = Math.round(FPS * 0.4);
      for (let i = 0; i < steps; i++) push("Closing claw");
      const v = validateInteraction("grabbable");
      if (v.ok && !clawOpen) {
        v.target.grabbed = true;
        carrying = v.target.id;
        push("Grabbed! ✅", FPS * 0.3, { type: "success", msg: "Object grabbed!" });
      } else if (v.ok === false && v.reason) {
        push(`⚠️ ${v.reason}`, FPS * 0.3, { type: "warning", msg: v.reason });
      }
    } else if (cmd.intent === "claw_open") {
      clawOpen = true;
      if (carrying) {
        const ob = obstacleState.find(o => o.id === carrying);
        if (ob) { ob.grabbed = false; ob.ox = x; ob.oy = y - 20; }
        carrying = null;
        push("Released ✅", FPS * 0.3, { type: "success", msg: "Object released!" });
      }
      const steps = Math.round(FPS * 0.4);
      for (let i = 0; i < steps; i++) push("Opening claw");
    } else if (cmd.intent === "stop") {
      push("Stopped", FPS * 0.3);
    } else if (cmd.intent === "beep") {
      push("Beep! 🔔", FPS * 0.4, null, { type: "beep" });
    } else if (cmd.intent === "say") {
      push(`"${cmd.slots.phrase}" 💬`, FPS * 0.6, null, { type: "say", phrase: cmd.slots.phrase || "hello" });
    } else if (cmd.intent === "light") {
      const hasCLM = robotConfig?.ports && Object.values(robotConfig.ports).some(p => p.role === "color_light_matrix");
      push(`Light ${cmd.slots.color} 💡`, FPS * 0.3, null,
        { type: "light", color: cmd.slots.color || "blue", hasColorLightMatrix: hasCLM });
    } else if (cmd.intent === "light_off") {
      push("Lights off 💡", FPS * 0.3, null, { type: "light_off" });
    } else if (cmd.intent === "if_color") {
      push("Checking color… 🎨", FPS * 0.5, null, { type: "sensor", sensor: "color", color: cmd.slots.color });
    } else if (cmd.intent === "if_distance") {
      push("Checking distance… 📡", FPS * 0.5, null, { type: "sensor", sensor: "distance" });
    } else if (cmd.intent === "if_button") {
      push("Checking button… 👆", FPS * 0.5, null, { type: "sensor", sensor: "button" });
    } else if (cmd.intent === "if_force") {
      push(`Checking force > ${cmd.slots.force ?? 3} N… ⚖️`, FPS * 0.5, null, { type: "sensor", sensor: "force", force: cmd.slots.force ?? 3 });
    } else if (cmd.intent === "if_touched") {
      push("Checking touch… ✋", FPS * 0.5, null, { type: "sensor", sensor: "touched" });
    } else if (cmd.intent === "if_reflection") {
      const comp = cmd.slots.comparison || "greater";
      const val = cmd.slots.value ?? 50;
      push(`Checking reflection ${comp === "less" ? "<" : ">"} ${val}%… 📊`, FPS * 0.5, null,
        { type: "sensor", sensor: "reflection", comparison: comp, value: val });
    } else if (cmd.intent === "if_ambient") {
      const comp = cmd.slots.comparison || "dark";
      const val = cmd.slots.value ?? 20;
      push(comp === "dark" ? `Checking dark < ${val}%… 🌙` : `Checking bright > ${val}%… ☀️`, FPS * 0.5, null,
        { type: "sensor", sensor: "ambient", comparison: comp, value: val });
    } else if (cmd.intent === "repeat" || cmd.intent === "repeat_forever") {
      push("Loop 🔁", FPS * 0.2);
    } else if (cmd.intent === "rotate_base") {
      const totalDeg = cmd.slots.degrees ?? cmd.slots.angle ?? 90;
      const sign = (cmd.slots.direction === "left" ? -1 : 1);
      const duration = totalDeg / TURN_DEG_PER_S;
      const steps = Math.max(1, Math.round(duration * FPS));
      const dh = (totalDeg / steps) * sign;
      for (let i = 0; i < steps; i++) {
        const nextHeading = heading + dh;
        if (!checkCollision(x, y, nextHeading)) {
          heading = nextHeading;
          push(`Rotating base ${cmd.slots.direction || "right"} ${Math.round(normalizeDeg(heading))}°`);
        } else {
          push("Base rotation blocked! 🚫", 1, { type: "collision" });
          break;
        }
      }
    } else if (cmd.intent === "run_motor") {
      const power = cmd.slots.power ?? 50;
      push(`Motor at ${power}% ⚙️`, FPS * 0.5, null, { type: "motor_run", power });
    } else if (cmd.intent === "motor_angle") {
      const target = cmd.slots.angle ?? 90;
      const steps = Math.round(Math.abs(target - armAngle) / ARM_SPEED * FPS);
      const da = steps > 0 ? (target - armAngle) / steps : 0;
      for (let i = 0; i < Math.max(steps, 1); i++) {
        armAngle = Math.min(180, Math.max(0, armAngle + da));
        push(`Arm to ${Math.round(armAngle)}°`);
      }
      const v = validateInteraction("liftable");
      if (v.ok && armAngle >= 45) {
        v.target.lifted = true;
        carrying = v.target.id;
        push("Lifting! ✅", FPS * 0.3, { type: "success", msg: "Object lifted!" });
      }
    }
  }

  // Final validation summary: goals, push results
  const goalObs = obstacleState.filter(o => o.type === "goal");
  if (goalObs.length > 0) {
    const atGoal = goalObs.some(g => distBetween(x, y, g.ox, g.oy) < 40);
    if (atGoal) {
      push("Goal reached! 🏁", FPS * 0.5, { type: "success", msg: "You reached the goal!" });
    } else {
      const closest = Math.min(...goalObs.map(g => distBetween(x, y, g.ox, g.oy)));
      push(`Missed goal (${Math.round(closest)}px away) 🏁`, FPS * 0.5,
        { type: "warning", msg: `Almost! ${Math.round(closest)}px from the goal.` });
    }
  }

  push("Done ✓", FPS * 0.5);
  return { frames, trailData: trailFull };
}

// ─── Code-driven simulation: parse Python and build frames from it ───────────

// Curriculum scale: 1mm code → 0.5px screen, so straight(200) = 100px = 1 grid square
const CURRICULUM_SCALE = 0.5;
const SPEED_MM_PER_S = 200;  // animation speed for code-driven simulation

function parseCodeToPrimitives(code) {
  const lines = code.split("\n");
  const MAX_WHILE_UNROLL = 3; // cap while True loops

  function processLines(startIdx, minIndent) {
    const block = [];
    let i = startIdx;
    while (i < lines.length) {
      const line = lines[i];
      const indent = line.search(/\S/);
      if (indent < 0) { i++; continue; }
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) { i++; continue; }

      if (indent <= minIndent && block.length > 0) break;

      // ── for _ in range(N): ──
      const forMatch = trimmed.match(/^for\s+\w+\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/);
      if (forMatch) {
        const times = parseInt(forMatch[1], 10);
        const { block: inner, nextIdx } = processLines(i + 1, indent);
        block.push({ type: "repeat", times });
        block.push(...inner);
        block.push({ type: "stop_repeat" });
        i = nextIdx;
        continue;
      }

      // ── while True: ──
      const whileMatch = trimmed.match(/^while\s+True\s*:/);
      if (whileMatch) {
        const { block: inner, nextIdx } = processLines(i + 1, indent);
        block.push({ type: "repeat_forever" });
        block.push(...inner);
        block.push({ type: "stop_repeat" });
        i = nextIdx;
        continue;
      }

      // ── if / elif / else blocks — skip the condition but parse the body ──
      const ifMatch = trimmed.match(/^(?:if|elif|else)\b.*:/);
      if (ifMatch) {
        const { block: inner, nextIdx } = processLines(i + 1, indent);
        block.push(...inner);
        i = nextIdx;
        continue;
      }

      let matched = false;

      // ── DriveBase.straight(mm) ──
      const straightMatch = line.match(/\.straight\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/);
      if (straightMatch) {
        block.push({ type: "straight", mm: parseFloat(straightMatch[1]) });
        matched = true;
      }

      // ── DriveBase.turn(degrees) ──
      const turnMatch = !matched && line.match(/\.turn\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/);
      if (turnMatch) {
        block.push({ type: "turn", degrees: parseFloat(turnMatch[1]) });
        matched = true;
      }

      // ── DriveBase.curve(radius, angle) — approximate as turn ──
      const curveMatch = !matched && line.match(/\.curve\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/);
      if (curveMatch) {
        const radius = parseFloat(curveMatch[1]);
        const angle = parseFloat(curveMatch[2]);
        // Approximate: move arc-length forward + turn the angle
        const arcMm = Math.abs(radius * angle * Math.PI / 180);
        if (arcMm > 0) block.push({ type: "straight", mm: arcMm });
        block.push({ type: "turn", degrees: angle });
        matched = true;
      }

      // ── Motor.run_time(speed, duration_ms) ──
      const runTimeMatch = !matched && line.match(/\.run_time\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\)/);
      if (runTimeMatch) {
        const speed = parseFloat(runTimeMatch[1]);
        const timeMs = parseFloat(runTimeMatch[2]);
        const mm = Math.round(speed * (timeMs / 1000));
        if (mm !== 0) block.push({ type: "straight", mm });
        matched = true;
      }

      // ── Motor.run_target(speed, target_angle) — treat as arm position ──
      const runTargetMatch = !matched && line.match(/\.run_target\s*\(\s*\d+\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/);
      if (runTargetMatch) {
        const angle = parseFloat(runTargetMatch[1]);
        if (angle >= 0 && angle <= 180) block.push({ type: "arm", angle });
        matched = true;
      }

      // ── Motor.run_angle(speed, angle) — can be turn or arm movement ──
      const runAngleMatch = !matched && line.match(/\.run_angle\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/);
      if (runAngleMatch) {
        const angle = parseFloat(runAngleMatch[2]);
        // If it looks like a small angle (≤180°), treat as arm; otherwise as a wheel rotation → straight
        if (Math.abs(angle) <= 180) {
          block.push({ type: "arm", angle: Math.max(0, Math.min(180, Math.abs(angle))) });
        } else {
          // Convert wheel degrees to mm (assuming 56mm wheel diameter)
          const mm = Math.round(angle * Math.PI * 56 / 360);
          if (mm !== 0) block.push({ type: "straight", mm });
        }
        matched = true;
      }

      // ── wait(ms) ──
      const waitMatch = !matched && line.match(/\bwait\s*\(\s*(\d+(?:\.\d+)?)\s*\)/);
      if (waitMatch) {
        const ms = parseFloat(waitMatch[1]);
        block.push({ type: "wait", ms });
        matched = true;
      }

      // ── hub.speaker.beep() ──
      const beepMatch = !matched && line.match(/\.(?:speaker\.)?beep\s*\(/);
      if (beepMatch) {
        block.push({ type: "beep" });
        matched = true;
      }

      // ── hub.light.on(Color.XXX) ──
      const lightMatch = !matched && line.match(/\.light\.on\s*\(\s*Color\.(\w+)\s*\)/);
      if (lightMatch) {
        block.push({ type: "light", color: lightMatch[1].toLowerCase() });
        matched = true;
      }

      // ── hub.speaker.say("...") ──
      const sayMatch = !matched && line.match(/\.speaker\.say\s*\(\s*"([^"]*)"\s*\)/);
      if (sayMatch) {
        block.push({ type: "say", phrase: sayMatch[1] });
        matched = true;
      }

      // ── Claw open / close (simulation-only markers) ──
      // These aren't standard pybricks APIs, but they let a Python program
      // express the same in-sim actions we support in Phaser.
      //
      // Supported patterns:
      // - claw_open / claw_close (as function calls or comments)
      // - open_claw / close_claw
      // - claw.open() / claw.close()
      // - gripper.open() / gripper.close()
      const clawCloseMatch = !matched && (
        /\bclaw_close\b/.test(trimmed) ||
        /\bclose_claw\b/.test(trimmed) ||
        /\b(gripper|claw)\.close\s*\(/.test(trimmed)
      );
      if (clawCloseMatch) {
        block.push({ type: "claw_close" });
        matched = true;
      }
      const clawOpenMatch = !matched && (
        /\bclaw_open\b/.test(trimmed) ||
        /\bopen_claw\b/.test(trimmed) ||
        /\b(gripper|claw)\.open\s*\(/.test(trimmed)
      );
      if (clawOpenMatch) {
        block.push({ type: "claw_open" });
        matched = true;
      }

      // ── robot.stop() / motor.stop() / motor.brake() / motor.hold() ──
      const stopMatch = !matched && line.match(/\.(?:stop|brake|hold)\s*\(\s*\)/);
      if (stopMatch) {
        block.push({ type: "stop" });
        matched = true;
      }

      i++;
    }
    return { block, nextIdx: i };
  }

  try {
    const { block } = processLines(0, -1);
    return { primitives: block, error: null };
  } catch (e) {
    return { primitives: [], error: e.message };
  }
}

function buildFramesFromPrimitives(primitives, robotConfig, obstacles = []) {
  if (primitives.length === 0) return [];

  // ── Unroll loop markers (repeat / repeat_forever / stop_repeat) into a
  //    flat primitive list so the frame builder can iterate simply. ──
  function unrollPrimitives(list, maxForever = 20) {
    const result = [];
    let i = 0;
    while (i < list.length) {
      const p = list[i];
      if (p.type === "repeat" || p.type === "repeat_forever") {
        const times = p.type === "repeat_forever" ? maxForever : (p.times ?? 1);
        const body = [];
        i++;
        let depth = 1;
        while (i < list.length && depth > 0) {
          if (list[i].type === "repeat" || list[i].type === "repeat_forever") depth++;
          if (list[i].type === "stop_repeat") {
            depth--;
            if (depth === 0) { i++; break; }
          }
          body.push(list[i]); i++;
        }
        for (let t = 0; t < times; t++) result.push(...unrollPrimitives(body, maxForever));
      } else if (p.type === "stop_repeat") {
        i++;
      } else {
        result.push(p); i++;
      }
    }
    return result;
  }

  const flatPrimitives = unrollPrimitives(primitives);

  const frames = [];
  let x = WORLD_PX / 2;
  let y = WORLD_PX / 2;
  let heading = -90;
  let armAngle = 0;
  let clawOpen = true;
  let carrying = null;
  const trailFull = [{ x, y }];

  const obstacleState = obstacles.map(o => ({
    ...o,
    ...OBSTACLE_TYPES[o.type],
    ox: o.x, oy: o.y,
    pushed: false, lifted: false, grabbed: false,
  }));

  const push = (label, n = 1, event = null, effect = null) => {
    for (let i = 0; i < n; i++) {
      if (carrying) {
        const ob = obstacleState.find(o => o.id === carrying);
        if (ob) { ob.ox = x; ob.oy = y - 20; }
      }
      frames.push({
        x, y, heading, armAngle, clawOpen, carrying,
        trailLen: trailFull.length,
        label,
        obstacles: obstacleState.map(o => ({ ...o })),
        event: event || null,
        effect: i === 0 ? effect : null,
      });
    }
  };

  // Returns: false = no collision, "blocked" = solid hit, "pushed" = pushed an object
  function checkCollision(nx, ny, nh) {
    const robotRect = makeRobotRect(nx, ny, nh);
    for (const ob of obstacleState) {
      if (ob.lifted || ob.grabbed || ob.id === carrying) continue;
      const ot = OBSTACLE_TYPES[ob.type];
      if (!ot) continue;
      const obsRect = makeObstacleRect(ob);
      if (satOverlap(robotRect, obsRect)) {
        if (ob.type === "pushable") {
          const pushAngle = degToRad(nh);
          const pushDist = (SPEED_MPS * PX_PER_M / FPS) * 0.8;
          ob.ox += Math.cos(pushAngle) * pushDist;
          ob.oy += Math.sin(pushAngle) * pushDist;
          ob.ox = Math.max(ot.width / 2, Math.min(WORLD_PX - ot.width / 2, ob.ox));
          ob.oy = Math.max(ot.height / 2, Math.min(WORLD_PX - ot.height / 2, ob.oy));
          ob.pushed = true;
          return "pushed";
        }
        if (ob.type === "goal" || ob.type === "ramp") return false;
        return "blocked";
      }
    }
    return false;
  }

  for (const p of flatPrimitives) {
    if (p.type === "straight") {
      const distPx = p.mm * CURRICULUM_SCALE;
      const sign = p.mm >= 0 ? 1 : -1;
      const duration = Math.abs(p.mm) / SPEED_MM_PER_S;
      const steps = Math.max(1, Math.round(duration * FPS));
      const stepDist = (distPx / steps) * sign;
      const headRad = degToRad(heading);
      const dx = Math.cos(headRad) * stepDist;
      const dy = Math.sin(headRad) * stepDist;
      let blockedCount = 0;
      for (let i = 0; i < steps; i++) {
        const nx = Math.max(4, Math.min(WORLD_PX - 4, x + dx));
        const ny = Math.max(4, Math.min(WORLD_PX - 4, y + dy));
        const collision = checkCollision(nx, ny, heading);
        if (!collision || collision === "pushed") {
          x = nx; y = ny;
          trailFull.push({ x, y });
          push(collision === "pushed" ? "Pushing! 📦" : (p.mm >= 0 ? "Moving forward" : "Moving backward"));
          blockedCount = 0;
        } else {
          blockedCount++;
          push("Blocked! 🚫", 1, { type: "collision", msg: "Hit an obstacle!" });
          if (blockedCount >= 3) break; // stop after repeated collisions
        }
      }
    } else if (p.type === "turn") {
      const totalDeg = p.degrees;
      const steps = Math.max(1, Math.round(Math.abs(totalDeg) / TURN_DEG_PER_S * FPS));
      const dh = totalDeg / steps;
      for (let i = 0; i < steps; i++) {
        const nextHeading = heading + dh;
        const turnCol = checkCollision(x, y, nextHeading);
        if (!turnCol || turnCol === "pushed") {
          heading = nextHeading;
          push(`Turning ${totalDeg >= 0 ? "right" : "left"} ${Math.round(normalizeDeg(heading))}°`);
        } else {
          push("Turn blocked! 🚫", 1, { type: "collision", msg: "Cannot turn — obstacle in the way!" });
          break;
        }
      }
    } else if (p.type === "arm") {
      const target = p.angle;
      const steps = Math.round(Math.abs(target - armAngle) / ARM_SPEED * FPS);
      const da = steps > 0 ? (target - armAngle) / steps : 0;
      for (let i = 0; i < Math.max(steps, 1); i++) {
        armAngle = Math.min(180, Math.max(0, armAngle + da));
        push(`Arm to ${Math.round(armAngle)}°`);
      }
    } else if (p.type === "wait") {
      const waitFrames = Math.max(1, Math.round((p.ms / 1000) * FPS));
      push(`Waiting ${(p.ms / 1000).toFixed(1)}s ⏱️`, waitFrames);
    } else if (p.type === "beep") {
      push("Beep! 🔔", Math.round(FPS * 0.4), null, { type: "beep" });
    } else if (p.type === "light") {
      push(`Light ${p.color} 💡`, Math.round(FPS * 0.3), null, { type: "light", color: p.color });
    } else if (p.type === "say") {
      push(`"${p.phrase}" 💬`, Math.round(FPS * 0.6), null, { type: "say", phrase: p.phrase });
    } else if (p.type === "stop") {
      push("Stopped", Math.round(FPS * 0.3));
    }
  }

  // Final summary: check goals, collisions, pushes
  const goalObs = obstacleState.filter(o => o.type === "goal");
  const pushedAny = obstacleState.some(o => o.pushed);
  if (goalObs.length > 0) {
    const atGoal = goalObs.some(g => distBetween(x, y, g.ox, g.oy) < 40);
    if (atGoal) {
      push("Goal reached! 🏁", Math.round(FPS * 0.5), { type: "success", msg: "You reached the goal!" });
    } else {
      const closest = Math.min(...goalObs.map(g => distBetween(x, y, g.ox, g.oy)));
      push(`Missed goal (${Math.round(closest)}px away) 🏁`, Math.round(FPS * 0.5),
        { type: "warning", msg: `Almost! ${Math.round(closest)}px from the goal.` });
    }
  } else {
    push("Done ✓", Math.round(FPS * 0.5));
  }
  return { frames, trailData: trailFull };
}

function unrollCommands(commands, maxForever = 3) {
  const result = [];
  function walk(cmds) {
    let i = 0;
    while (i < cmds.length) {
      const c = cmds[i];
      if (c.intent === "repeat" || c.intent === "repeat_forever") {
        const times = c.intent === "repeat_forever" ? maxForever : (c.slots.times ?? 1);
        const body = [];
        i++;
        let depth = 1;
        while (i < cmds.length && depth > 0) {
          if (cmds[i].intent === "repeat" || cmds[i].intent === "repeat_forever") depth++;
          if (cmds[i].intent === "stop_repeat") { depth--; if (depth === 0) { i++; break; } }
          body.push(cmds[i]); i++;
        }
        result.push(c);
        for (let t = 0; t < times; t++) walk(body);
      } else if (c.intent === "stop_repeat") {
        i++;
      } else {
        result.push(c);
        i++;
      }
    }
  }
  walk(commands);
  return result;
}

// ─── SVG Obstacle renderer ───────────────────────────────────────────────────

function ObstacleSVG({ obstacle, animated = false }) {
  const type = OBSTACLE_TYPES[obstacle.type];
  if (!type) return null;
  const ox = obstacle.ox ?? obstacle.x;
  const oy = obstacle.oy ?? obstacle.y;
  const w = type.width;
  const h = type.height;

  if (obstacle.lifted || obstacle.grabbed) {
    return (
      <g transform={`translate(${ox},${oy})`} opacity={0.3}>
        <rect x={-w/2} y={-h/2} width={w} height={h} rx={4}
          fill="none" stroke={type.color} strokeWidth={1} strokeDasharray="4 2"/>
      </g>
    );
  }

  if (obstacle.type === "barrier") {
    return (
      <g transform={`translate(${ox},${oy})`}>
        <rect x={-w/2} y={-h/2} width={w} height={h} rx={5}
          fill={`${type.color}33`} stroke={type.color} strokeWidth={2}/>
        <line x1={-w/2+4} y1={-h/2+4} x2={w/2-4} y2={h/2-4}
          stroke={type.color} strokeWidth={1.5} opacity={0.5}/>
        <line x1={w/2-4} y1={-h/2+4} x2={-w/2+4} y2={h/2-4}
          stroke={type.color} strokeWidth={1.5} opacity={0.5}/>
        {animated && <rect x={-w/2-2} y={-h/2-2} width={w+4} height={h+4} rx={7}
          fill="none" stroke={type.color} strokeWidth={1} opacity={0.3}>
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite"/>
        </rect>}
      </g>
    );
  }

  if (obstacle.type === "wall_h" || obstacle.type === "wall_v") {
    return (
      <g transform={`translate(${ox},${oy})`}>
        <rect x={-w/2} y={-h/2} width={w} height={h} rx={3}
          fill={type.color} stroke={`${type.color}cc`} strokeWidth={1.5}/>
        <rect x={-w/2+2} y={-h/2+2} width={w-4} height={h-4} rx={2}
          fill="none" stroke={`${type.color}44`} strokeWidth={0.5}/>
      </g>
    );
  }

  if (obstacle.type === "liftable") {
    return (
      <g transform={`translate(${ox},${oy})`}>
        <rect x={-w/2} y={-h/2} width={w} height={h} rx={4}
          fill={`${type.color}44`} stroke={type.color} strokeWidth={2}/>
        <line x1={-w/2+6} y1={-4} x2={w/2-6} y2={-4}
          stroke={type.color} strokeWidth={2} strokeLinecap="round"/>
        <line x1={-3} y1={-h/2+4} x2={-3} y2={-6}
          stroke={type.color} strokeWidth={1.5} opacity={0.6}/>
        <line x1={3} y1={-h/2+4} x2={3} y2={-6}
          stroke={type.color} strokeWidth={1.5} opacity={0.6}/>
        <text x={0} y={h/2-6} textAnchor="middle"
          style={{ fontSize:8, fill:type.color, fontWeight:900, fontFamily:"monospace" }}>LIFT</text>
      </g>
    );
  }

  if (obstacle.type === "grabbable") {
    return (
      <g transform={`translate(${ox},${oy})`}>
        <circle cx={0} cy={0} r={w/2}
          fill={`${type.color}44`} stroke={type.color} strokeWidth={2}/>
        <circle cx={0} cy={0} r={w/4} fill={type.color} opacity={0.6}/>
        {animated && <circle cx={0} cy={0} r={w/2+3}
          fill="none" stroke={type.color} strokeWidth={1} opacity={0.4}>
          <animate attributeName="r" values={`${w/2+2};${w/2+6};${w/2+2}`} dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite"/>
        </circle>}
      </g>
    );
  }

  if (obstacle.type === "pushable") {
    return (
      <g transform={`translate(${ox},${oy})`}>
        <rect x={-w/2} y={-h/2} width={w} height={h} rx={6}
          fill={`${type.color}33`} stroke={type.color} strokeWidth={2}/>
        <polygon points={`0,${-h/2+6} ${w/2-6},0 0,${h/2-6} ${-w/2+6},0`}
          fill="none" stroke={type.color} strokeWidth={1} opacity={0.5}/>
        <text x={0} y={4} textAnchor="middle"
          style={{ fontSize:7, fill:type.color, fontWeight:900, fontFamily:"monospace" }}>PUSH</text>
      </g>
    );
  }

  if (obstacle.type === "goal") {
    return (
      <g transform={`translate(${ox},${oy})`}>
        <rect x={-w/2} y={-h/2} width={w} height={h} rx={8}
          fill={`${type.color}18`} stroke={type.color} strokeWidth={2}
          strokeDasharray="6 3"/>
        <circle cx={0} cy={0} r={12} fill="none" stroke={type.color} strokeWidth={1.5} opacity={0.6}/>
        <circle cx={0} cy={0} r={5} fill={type.color} opacity={0.5}/>
        {animated && <rect x={-w/2} y={-h/2} width={w} height={h} rx={8}
          fill="none" stroke={type.color} strokeWidth={1.5}>
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite"/>
        </rect>}
        <text x={0} y={h/2-5} textAnchor="middle"
          style={{ fontSize:7, fill:type.color, fontWeight:900, fontFamily:"monospace" }}>GOAL</text>
      </g>
    );
  }

  if (obstacle.type === "ramp") {
    return (
      <g transform={`translate(${ox},${oy})`}>
        <polygon points={`${-w/2},${h/2} ${w/2},${h/2} ${w/2},${-h/2}`}
          fill={`${type.color}33`} stroke={type.color} strokeWidth={2}/>
        <text x={2} y={h/2-4} textAnchor="middle"
          style={{ fontSize:7, fill:type.color, fontWeight:900, fontFamily:"monospace" }}>RAMP</text>
      </g>
    );
  }

  return null;
}

// ─── SVG Robot renderers ──────────────────────────────────────────────────────

function RobotTopDown({ frame, config, size = ROBOT_PX }) {
  if (!frame) return null;
  const s = size;
  const h = s * 0.6;
  const hasClaw = config?.ports && Object.values(config.ports).some(p => p.role === "claw");
  const hasArm  = config?.ports && Object.values(config.ports).some(p => p.role === "arm");
  const clawOpen = frame.clawOpen;
  const isCarrying = !!frame.carrying;
  const robotColor = config?.color ?? "#4fc3f7";

  return (
    <g transform={`translate(${frame.x},${frame.y}) rotate(${frame.heading + 90})`}>
      {/* Shadow */}
      <ellipse cx={2} cy={2} rx={s/2+2} ry={h/2+2} fill="#00000022"/>

      {/* Body */}
      <rect x={-s/2} y={-h/2} width={s} height={h} rx={s*0.15}
        fill="#0d1b2e" stroke={robotColor} strokeWidth={2}/>

      {/* Inner detail lines */}
      <rect x={-s/2+4} y={-h/2+4} width={s-8} height={h-8} rx={s*0.08}
        fill="none" stroke={`${robotColor}33`} strokeWidth={0.5}/>

      {/* Wheels */}
      {[[-1, -0.6], [-1, 0.3], [1, -0.6], [1, 0.3]].map(([sx, sy], i) => (
        <rect key={i}
          x={sx > 0 ? s/2-1 : -s/2-4} y={sy * h/2}
          width={5} height={h*0.28} rx={2}
          fill={robotColor} opacity={0.8}/>
      ))}

      {/* Direction arrow */}
      <polygon points={`0,${-h/2-7} -6,${-h/2+1} 6,${-h/2+1}`}
        fill={robotColor} opacity={0.9}/>

      {/* Sensor dot */}
      <circle cx={0} cy={-h/2+4} r={3} fill="#fff176" opacity={0.9}>
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite"/>
      </circle>

      {/* Claw */}
      {hasClaw && (
        <g transform={`translate(0,${-h/2-2})`}>
          <line x1={0} y1={0} x2={clawOpen ? -10 : -5} y2={-10}
            stroke="#ffb74d" strokeWidth={2.5} strokeLinecap="round"/>
          <line x1={0} y1={0} x2={clawOpen ? 10 : 5} y2={-10}
            stroke="#ffb74d" strokeWidth={2.5} strokeLinecap="round"/>
          {isCarrying && <circle cx={0} cy={-8} r={4} fill="#ffb74d" opacity={0.6}>
            <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite"/>
          </circle>}
        </g>
      )}

      {/* Arm indicator */}
      {hasArm && (
        <g>
          <rect x={-3} y={-h/2-8} width={6} height={8} rx={2}
            fill="#81c784" opacity={0.8}/>
          {frame.armAngle > 0 && (
            <rect x={-2} y={-h/2-8-Math.min(frame.armAngle/5, 12)} width={4}
              height={Math.min(frame.armAngle/5, 12)} rx={1}
              fill="#81c784" opacity={0.6}/>
          )}
        </g>
      )}

      {/* Hub center */}
      <circle cx={0} cy={0} r={6} fill="none" stroke={`${robotColor}88`} strokeWidth={1.5}/>
      <circle cx={0} cy={0} r={2.5} fill={robotColor}/>
    </g>
  );
}

function RobotSideView({ frame, config, width = 300, height = 200 }) {
  if (!frame) return null;
  const armAngle = frame?.armAngle ?? 0;
  const clawOpen = frame?.clawOpen ?? true;
  const hasArm   = config?.ports && Object.values(config.ports).some(p => p.role === "arm");
  const hasClaw  = config?.ports && Object.values(config.ports).some(p => p.role === "claw");
  const hasDrive = config?.hasDrive ?? true;
  const isCarrying = !!frame?.carrying;
  const robotColor = config?.color ?? "#4fc3f7";

  const cx     = width / 2;
  const ground = height - 40;
  const bodyW  = 80;
  const bodyH  = 50;
  const bodyTop = ground - bodyH - 16;

  const armPivotX = cx + bodyW / 2 - 8;
  const armPivotY = bodyTop + 10;
  const armLen    = 70;
  const armRad    = ((armAngle - 90) * Math.PI) / 180;
  const armTipX   = armPivotX + Math.cos(armRad) * armLen;
  const armTipY   = armPivotY + Math.sin(armRad) * armLen;

  return (
    <svg width={width} height={height} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#0a1525" stopOpacity="0"/>
        </linearGradient>
        <filter id="sideGlow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="2"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Ground with gradient */}
      <rect x={0} y={ground} width={width} height={height-ground} fill="url(#groundGrad)"/>
      <line x1={0} y1={ground} x2={width} y2={ground} stroke="#1e3a5f" strokeWidth={2}/>

      <g filter="url(#sideGlow)">
        {/* Wheels */}
        {hasDrive && (<>
          <circle cx={cx - 28} cy={ground} r={16} fill="#0d1b2e" stroke={robotColor} strokeWidth={2}/>
          <circle cx={cx + 28} cy={ground} r={16} fill="#0d1b2e" stroke={robotColor} strokeWidth={2}/>
          <circle cx={cx - 28} cy={ground} r={6} fill={`${robotColor}33`}/>
          <circle cx={cx + 28} cy={ground} r={6} fill={`${robotColor}33`}/>
          {/* Spokes */}
          {[-28, 28].map(wx => [0, 60, 120].map(a => (
            <line key={`${wx}-${a}`}
              x1={cx + wx} y1={ground}
              x2={cx + wx + Math.cos(a*Math.PI/180)*10}
              y2={ground + Math.sin(a*Math.PI/180)*10}
              stroke={`${robotColor}44`} strokeWidth={1}/>
          )))}
        </>)}

        {/* Body */}
        <rect x={cx - bodyW/2} y={bodyTop} width={bodyW} height={bodyH}
          rx={8} fill="#0d1b2e" stroke={robotColor} strokeWidth={2}/>

        {/* Hub screen */}
        <rect x={cx - 16} y={bodyTop + 12} width={32} height={20}
          rx={4} fill="#060d1a" stroke={`${robotColor}44`} strokeWidth={1}/>
        <rect x={cx - 12} y={bodyTop + 15} width={8} height={4} rx={1} fill={`${robotColor}66`}/>
        <rect x={cx - 2} y={bodyTop + 15} width={14} height={4} rx={1} fill={`${robotColor}66`}/>
        <rect x={cx - 12} y={bodyTop + 21} width={22} height={3} rx={1} fill={`${robotColor}33`}/>

        {/* Arm */}
        {hasArm && (
          <g>
            <line x1={armPivotX} y1={armPivotY}
              x2={armTipX} y2={armTipY}
              stroke="#81c784" strokeWidth={5} strokeLinecap="round"/>
            <circle cx={armPivotX} cy={armPivotY} r={5} fill="#81c784"/>
            {hasClaw && (
              <g transform={`translate(${armTipX},${armTipY})`}>
                <line x1={0} y1={0}
                  x2={clawOpen ? -12 : -6} y2={clawOpen ? 10 : 8}
                  stroke="#ffb74d" strokeWidth={3} strokeLinecap="round"/>
                <line x1={0} y1={0}
                  x2={clawOpen ? 12 : 6} y2={clawOpen ? 10 : 8}
                  stroke="#ffb74d" strokeWidth={3} strokeLinecap="round"/>
                <circle cx={0} cy={0} r={3} fill="#ffb74d"/>
                {isCarrying && <circle cx={0} cy={8} r={5}
                  fill="#ffb74d" opacity={0.5} stroke="#ffb74d" strokeWidth={1}/>}
              </g>
            )}
            {!hasClaw && <circle cx={armTipX} cy={armTipY} r={4} fill="#81c784"/>}
          </g>
        )}

        {/* Sensor */}
        <circle cx={cx + bodyW/2 - 4} cy={bodyTop + bodyH/2}
          r={5} fill="#fff176" opacity={0.8}>
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>

      {/* Action label */}
      {frame?.label && (
        <text x={cx} y={24} textAnchor="middle"
          style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, fill:robotColor, fontWeight:700 }}>
          {frame.label}
        </text>
      )}
    </svg>
  );
}

// ─── World canvas ─────────────────────────────────────────────────────────────

function WorldCanvas({ frames, frameIdx, robotConfig, obstacles, placingObstacle, onPlaceObstacle, trailData }) {
  const frame = frames[frameIdx] ?? frames[frames.length - 1];
  // Build trail slice from shared trailData array when available, fallback to frame.trail for legacy
  const trail = useMemo(() => {
    if (trailData && frame?.trailLen != null) {
      return trailData.slice(0, frame.trailLen);
    }
    return frame?.trail ?? [];
  }, [trailData, frame]);
  const svgRef = useRef(null);
  const [hoverPos, setHoverPos] = useState(null);

  const handleClick = useCallback((e) => {
    if (!placingObstacle || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = WORLD_PX / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    onPlaceObstacle(Math.round(x), Math.round(y));
  }, [placingObstacle, onPlaceObstacle]);

  const handleMouseMove = useCallback((e) => {
    if (!placingObstacle || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = WORLD_PX / rect.width;
    setHoverPos({
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top) * scale,
    });
  }, [placingObstacle]);

  const handleMouseLeave = useCallback(() => setHoverPos(null), []);

  const displayObstacles = frame?.obstacles ?? obstacles.map(o => ({ ...o, ...OBSTACLE_TYPES[o.type] }));

  return (
    <svg ref={svgRef}
      viewBox={`0 0 ${WORLD_PX} ${WORLD_PX}`}
      preserveAspectRatio="xMidYMid meet"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: "100%", maxWidth: WORLD_PX, height: "auto", aspectRatio: "1 / 1",
        borderRadius:12, display:"block",
        cursor: placingObstacle ? "crosshair" : "default",
      }}>
      <defs>
        <radialGradient id="gridCenter" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0d1b2e" stopOpacity="1"/>
          <stop offset="100%" stopColor="#060d1a" stopOpacity="1"/>
        </radialGradient>
        <filter id="trailGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
        </filter>
      </defs>

      {/* Background */}
      <rect width={WORLD_PX} height={WORLD_PX} fill="url(#gridCenter)"/>

      {/* Grid lines */}
      {Array.from({ length: WORLD_M + 1 }, (_, i) => (
        <g key={i}>
          <line x1={i*PX_PER_M} y1={0} x2={i*PX_PER_M} y2={WORLD_PX}
            stroke="#1a2744" strokeWidth={i === 0 || i === WORLD_M ? 1.5 : 0.8}/>
          <line x1={0} y1={i*PX_PER_M} x2={WORLD_PX} y2={i*PX_PER_M}
            stroke="#1a2744" strokeWidth={i === 0 || i === WORLD_M ? 1.5 : 0.8}/>
        </g>
      ))}

      {/* Sub-grid */}
      {Array.from({ length: WORLD_M * 4 + 1 }, (_, i) => (
        <g key={`sub${i}`}>
          <line x1={i*PX_PER_M/4} y1={0} x2={i*PX_PER_M/4} y2={WORLD_PX}
            stroke="#0e1a2e" strokeWidth={0.3}/>
          <line x1={0} y1={i*PX_PER_M/4} x2={WORLD_PX} y2={i*PX_PER_M/4}
            stroke="#0e1a2e" strokeWidth={0.3}/>
        </g>
      ))}

      {/* Scale labels */}
      {Array.from({ length: WORLD_M + 1 }, (_, i) => (
        <text key={`lbl${i}`} x={i*PX_PER_M + 4} y={WORLD_PX - 4}
          style={{ fontSize:9, fill:"#1e3a5f88", fontFamily:"'JetBrains Mono',monospace" }}>
          {i}m
        </text>
      ))}

      {/* Obstacles */}
      {displayObstacles.map(ob => (
        <ObstacleSVG key={ob.id} obstacle={ob} animated={true}/>
      ))}

      {/* Trail glow layer */}
      {frame && trail.length > 1 && (
        <polyline filter="url(#trailGlow)"
          points={trail.map(p => `${p.x},${p.y}`).join(" ")}
          fill="none" stroke={robotConfig?.color ?? "#4fc3f7"} strokeWidth={3}
          strokeOpacity={0.2} strokeLinecap="round" strokeLinejoin="round"/>
      )}

      {/* Trail */}
      {frame && trail.length > 1 && (
        <polyline
          points={trail.map(p => `${p.x},${p.y}`).join(" ")}
          fill="none" stroke={robotConfig?.color ?? "#4fc3f7"} strokeWidth={1.5}
          strokeOpacity={0.4} strokeLinecap="round" strokeLinejoin="round"/>
      )}

      {/* Trail bright tip */}
      {frame && trail.slice(-15).map((p, i, arr) => i === 0 ? null : (
        <line key={i}
          x1={arr[i-1].x} y1={arr[i-1].y} x2={p.x} y2={p.y}
          stroke={robotConfig?.color ?? "#4fc3f7"} strokeWidth={2.5}
          strokeOpacity={0.1 + (i / arr.length) * 0.7}
          strokeLinecap="round"/>
      ))}

      {/* Start marker */}
      <circle cx={WORLD_PX/2} cy={WORLD_PX/2} r={6}
        fill="none" stroke={`${robotConfig?.color ?? "#4fc3f7"}44`} strokeWidth={1.5}/>
      <circle cx={WORLD_PX/2} cy={WORLD_PX/2} r={2} fill={`${robotConfig?.color ?? "#4fc3f7"}55`}/>
      <text x={WORLD_PX/2} y={WORLD_PX/2+16}
        textAnchor="middle"
        style={{ fontSize:7, fill:"#1e3a5f", fontFamily:"'JetBrains Mono',monospace" }}>START</text>

      {/* Robot */}
      {frame && <RobotTopDown frame={frame} config={robotConfig}/>}

      {/* Action effect overlays */}
      {frame?.effect && (() => {
        const fx = frame.effect;
        const rx = frame.x;
        const ry = frame.y;
        const robotColor = robotConfig?.color ?? "#4fc3f7";
        if (fx.type === "beep") {
          return (
            <g transform={`translate(${rx},${ry})`}>
              {[1, 2, 3].map(i => (
                <circle key={i} cx={0} cy={0} r={15 + i * 10}
                  fill="none" stroke="#fff176" strokeWidth={2}
                  opacity={0.6 - i * 0.15}>
                  <animate attributeName="r" values={`${15 + i * 10};${25 + i * 12}`} dur="0.4s" fill="freeze"/>
                  <animate attributeName="opacity" values={`${0.6 - i * 0.15};0`} dur="0.4s" fill="freeze"/>
                </circle>
              ))}
            </g>
          );
        }
        if (fx.type === "say") {
          const phrase = (fx.phrase || "hello").slice(0, 20);
          return (
            <g transform={`translate(${rx},${ry - 45})`}>
              <path d="M -35 -8 Q -40 -18 -30 -18 L 30 -18 Q 40 -18 35 -8 L 8 18 Q 0 22 -8 18 Z"
                fill="#1a2744" stroke={robotColor} strokeWidth={1.5}/>
              <text x={0} y={2} textAnchor="middle"
                style={{ fontSize:10, fill:"#c8d6e5", fontFamily:"'Nunito',sans-serif", fontWeight:700 }}>
                "{phrase}"
              </text>
            </g>
          );
        }
        if (fx.type === "light") {
          const colors = { red:"#ef5350", blue:"#4fc3f7", green:"#81c784", yellow:"#fff176",
            orange:"#ffb74d", white:"#ffffff", purple:"#ce93d8", pink:"#f48fb1" };
          const c = colors[fx.color] || colors.blue;
          if (fx.hasColorLightMatrix) {
            const cell = 8;
            const gap = 2;
            const total = cell * 3 + gap * 2;
            const pad = 4;
            return (
              <g transform={`translate(${rx},${ry - 55})`}>
                <rect x={-total/2-pad} y={-pad} width={total+pad*2} height={total+pad*2} rx={6}
                  fill="#1a2744" stroke={c} strokeWidth={1.5}/>
                {[0,1,2].flatMap(row => [0,1,2].map(col => (
                  <rect key={`${row}-${col}`}
                    x={-total/2 + gap/2 + col*(cell+gap)}
                    y={-total/2 + gap/2 + row*(cell+gap)}
                    width={cell} height={cell} rx={1}
                    fill={c} opacity={0.9}/>
                )))}
              </g>
            );
          }
          return (
            <g transform={`translate(${rx},${ry})`}>
              <defs>
                <radialGradient id={`lightGlow-${fx.color}`}>
                  <stop offset="0%" stopColor={c} stopOpacity="0.6"/>
                  <stop offset="50%" stopColor={c} stopOpacity="0.2"/>
                  <stop offset="100%" stopColor={c} stopOpacity="0"/>
                </radialGradient>
              </defs>
              <circle cx={0} cy={0} r={50} fill={`url(#lightGlow-${fx.color})`}/>
              <circle cx={0} cy={0} r={25} fill="none" stroke={c} strokeWidth={2} opacity={0.5}/>
            </g>
          );
        }
        if (fx.type === "light_off") {
          return (
            <g transform={`translate(${rx},${ry - 40})`}>
              <rect x={-28} y={-8} width={56} height={20} rx={6}
                fill="#1a2744" stroke="#546e7a" strokeWidth={1.5}/>
              <text x={0} y={4} textAnchor="middle"
                style={{ fontSize:10, fill:"#546e7a", fontFamily:"'Nunito',sans-serif", fontWeight:800 }}>
                OFF
              </text>
            </g>
          );
        }
        if (fx.type === "sensor") {
          const beamLen = 60;
          const headRad = degToRad(frame.heading);
          const bx = rx + Math.cos(headRad) * beamLen;
          const by = ry + Math.sin(headRad) * beamLen;
          const coneAngle = 30;
          const c1 = degToRad(frame.heading - coneAngle / 2);
          const c2 = degToRad(frame.heading + coneAngle / 2);
          const x1 = rx + Math.cos(c1) * beamLen;
          const y1 = ry + Math.sin(c1) * beamLen;
          const x2 = rx + Math.cos(c2) * beamLen;
          const y2 = ry + Math.sin(c2) * beamLen;
          const sensorColors = { color: "#f48fb1", distance: "#80cbc4", button: "#a5d6a7", force: "#ff8a65", touched: "#b39ddb" };
          const sensorColor = sensorColors[fx.sensor] ?? "#a5d6a7";
          if (fx.sensor === "force") {
            const force = fx.force ?? 3;
            const pct = Math.min(100, (force / 10) * 100);
            return (
              <g transform={`translate(${rx},${ry - 50})`}>
                <rect x={-12} y={0} width={24} height={40} rx={4}
                  fill="#1a2744" stroke={sensorColor} strokeWidth={1.5}/>
                <rect x={-8} y={40 - (pct/100)*36} width={16} height={(pct/100)*36} rx={2}
                  fill={sensorColor} fillOpacity={0.8}/>
                <text x={0} y={52} textAnchor="middle"
                  style={{ fontSize:8, fill:sensorColor, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
                  &gt;{force} N
                </text>
              </g>
            );
          }
          if (fx.sensor === "touched") {
            return (
              <g transform={`translate(${rx},${ry})`}>
                {[1, 2, 3].map(i => (
                  <circle key={i} cx={0} cy={0} r={12 + i * 8}
                    fill="none" stroke={sensorColor} strokeWidth={1.5}
                    opacity={0.5 - i * 0.12}>
                    <animate attributeName="r" values={`${12 + i * 8};${18 + i * 10}`} dur="0.5s" fill="freeze"/>
                    <animate attributeName="opacity" values={`${0.5 - i * 0.12};0`} dur="0.5s" fill="freeze"/>
                  </circle>
                ))}
                <circle cx={0} cy={0} r={8} fill={sensorColor} fillOpacity={0.4}>
                  <animate attributeName="opacity" values="0.4;0.8;0.4" dur="0.6s" repeatCount="indefinite"/>
                </circle>
              </g>
            );
          }
          if (fx.sensor === "button") {
            return (
              <g transform={`translate(${rx},${ry - 35})`}>
                <circle cx={0} cy={0} r={14} fill="#1a2744" stroke={sensorColor} strokeWidth={2}/>
                <circle cx={0} cy={0} r={10} fill={sensorColor} fillOpacity={0.3}>
                  <animate attributeName="r" values="10;8;10" dur="0.3s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="0.3s" repeatCount="indefinite"/>
                </circle>
                <text x={0} y={22} textAnchor="middle"
                  style={{ fontSize:7, fill:sensorColor, fontFamily:"'Nunito',sans-serif", fontWeight:800 }}>
                  PRESS?
                </text>
              </g>
            );
          }
          if (fx.sensor === "reflection") {
            const val = fx.value ?? 50;
            const comp = fx.comparison || "greater";
            const pct = Math.min(100, Math.max(0, val));
            return (
              <g transform={`translate(${rx},${ry - 45})`}>
                <rect x={-25} y={0} width={50} height={24} rx={4}
                  fill="#1a2744" stroke="#ffeb3b" strokeWidth={1.5}/>
                <rect x={-21} y={4} width={(pct/100)*42} height={16} rx={2}
                  fill="#ffeb3b" fillOpacity={0.8}/>
                <text x={0} y={38} textAnchor="middle"
                  style={{ fontSize:7, fill:"#ffeb3b", fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
                  {comp === "less" ? "<" : ">"}{val}%
                </text>
              </g>
            );
          }
          if (fx.sensor === "ambient") {
            const val = fx.value ?? 50;
            const comp = fx.comparison || "dark";
            const isDark = comp === "dark" || comp === "less";
            return (
              <g transform={`translate(${rx},${ry - 45})`}>
                <circle cx={0} cy={0} r={18} fill="#1a2744" stroke="#ffb74d" strokeWidth={1.5}/>
                {isDark ? (
                  <g>
                    <circle cx={0} cy={0} r={8} fill="#5c6bc0" opacity={0.8}/>
                    <text x={0} y={28} textAnchor="middle"
                      style={{ fontSize:7, fill:"#5c6bc0", fontFamily:"'Nunito',sans-serif", fontWeight:800 }}>
                      DARK &lt;{val}%
                    </text>
                  </g>
                ) : (
                  <g>
                    <circle cx={0} cy={0} r={10} fill="#ffb74d" opacity={0.9}/>
                    <line x1={0} y1={-14} x2={0} y2={14} stroke="#ffb74d" strokeWidth={1.5} opacity={0.8}/>
                    <line x1={-14} y1={0} x2={14} y2={0} stroke="#ffb74d" strokeWidth={1.5} opacity={0.8}/>
                    <line x1={-10} y1={-10} x2={10} y2={10} stroke="#ffb74d" strokeWidth={1} opacity={0.6}/>
                    <line x1={10} y1={-10} x2={-10} y2={10} stroke="#ffb74d" strokeWidth={1} opacity={0.6}/>
                    <text x={0} y={28} textAnchor="middle"
                      style={{ fontSize:7, fill:"#ffb74d", fontFamily:"'Nunito',sans-serif", fontWeight:800 }}>
                      BRIGHT &gt;{val}%
                    </text>
                  </g>
                )}
              </g>
            );
          }
          const colorMap = { red:"#ef5350", blue:"#4fc3f7", green:"#66bb6a", yellow:"#ffeb3b",
            orange:"#ff9800", white:"#eceff1", purple:"#ab47bc", pink:"#ec407a", black:"#37474f" };
          const beamColor = (fx.sensor === "color" && fx.color)
            ? (colorMap[fx.color.toLowerCase()] ?? "#f48fb1")
            : sensorColor;
          return (
            <g>
              <path d={`M ${rx} ${ry} L ${x1} ${y1} L ${x2} ${y2} Z`}
                fill={beamColor} fillOpacity={0.25}
                stroke={beamColor} strokeWidth={1} strokeOpacity={0.7}/>
              <line x1={rx} y1={ry} x2={bx} y2={by}
                stroke={beamColor} strokeWidth={1.5} opacity={0.8}/>
            </g>
          );
        }
        if (fx.type === "motor_run") {
          const power = fx.power ?? 50;
          return (
            <g transform={`translate(${rx},${ry + 25})`}>
              <g>
                <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.4s" repeatCount="indefinite"/>
                <circle cx={0} cy={0} r={10} fill="none" stroke="#ffb74d" strokeWidth={2} opacity={0.8}/>
                <line x1={0} y1={-8} x2={0} y2={8} stroke="#ffb74d" strokeWidth={2}/>
                <line x1={-8} y1={0} x2={8} y2={0} stroke="#ffb74d" strokeWidth={2}/>
              </g>
              <text x={0} y={22} textAnchor="middle"
                style={{ fontSize:8, fill:"#ffb74d", fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
                {power}%
              </text>
            </g>
          );
        }
        return null;
      })()}

      {/* Heading arc indicator */}
      {frame && (() => {
        const r = 30;
        const startAngle = -90;
        const endAngle = frame.heading;
        const normEnd = normalizeDeg(endAngle);
        const sa = degToRad(startAngle);
        const ea = degToRad(endAngle);
        const arcX1 = frame.x + r * Math.cos(ea);
        const arcY1 = frame.y + r * Math.sin(ea);
        return (
          <g opacity={0.5}>
            <line x1={frame.x} y1={frame.y}
              x2={frame.x + r * Math.cos(ea)} y2={frame.y + r * Math.sin(ea)}
              stroke={robotConfig?.color ?? "#4fc3f7"} strokeWidth={0.8}
              strokeDasharray="3 2"/>
            <text x={arcX1 + 8} y={arcY1 - 4}
              style={{ fontSize: 8, fill: robotConfig?.color ?? "#4fc3f7",
                fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
              {Math.round(normEnd)}°
            </text>
          </g>
        );
      })()}

      {/* Placement preview */}
      {placingObstacle && hoverPos && (() => {
        const t = OBSTACLE_TYPES[placingObstacle];
        return (
          <g transform={`translate(${hoverPos.x},${hoverPos.y})`} opacity={0.5}>
            <rect x={-t.width/2} y={-t.height/2} width={t.width} height={t.height}
              rx={4} fill={`${t.color}33`} stroke={t.color} strokeWidth={2} strokeDasharray="4 2"/>
          </g>
        );
      })()}

      {/* Event overlay */}
      {frame?.event && (
        <g>
          <rect x={WORLD_PX/2-80} y={12} width={160} height={24} rx={12}
            fill={frame.event.type === "success" ? "#66bb6a33" :
                  frame.event.type === "warning" ? "#ffb74d33" : "#ef535033"}
            stroke={frame.event.type === "success" ? "#66bb6a" :
                    frame.event.type === "warning" ? "#ffb74d" : "#ef5350"}
            strokeWidth={1}/>
          <text x={WORLD_PX/2} y={28} textAnchor="middle"
            style={{
              fontSize:10, fontWeight:800, fontFamily:"'Nunito',sans-serif",
              fill: frame.event.type === "success" ? "#66bb6a" :
                    frame.event.type === "warning" ? "#ffb74d" : "#ef5350",
            }}>
            {frame.event.msg}
          </text>
        </g>
      )}
    </svg>
  );
}

// ─── Validation panel ─────────────────────────────────────────────────────────

function ValidationPanel({ frame, robotConfig, obstacles }) {
  if (!frame) return null;

  const checks = [];

  const hasArm  = robotConfig?.hasArm;
  const hasClaw = robotConfig?.hasClaw;
  const hasDrive = robotConfig?.hasDrive;

  if (hasDrive) {
    checks.push({
      label: "Drive System",
      status: "ok",
      detail: "Active",
      icon: "🚗",
    });
  }

  if (hasArm) {
    const angle = Math.round(frame.armAngle);
    const posLabel = angle === 0 ? "Down" : angle < 45 ? "Low" : angle < 90 ? "Mid" : "High";
    checks.push({
      label: "Arm Position",
      status: angle > 0 ? "active" : "idle",
      detail: `${angle}° (${posLabel})`,
      icon: "🦾",
    });
  }

  if (hasClaw) {
    checks.push({
      label: "Claw State",
      status: frame.clawOpen ? "idle" : "active",
      detail: frame.clawOpen ? "Open" : "Closed",
      icon: "🤏",
    });
  }

  if (frame.carrying) {
    checks.push({
      label: "Carrying",
      status: "active",
      detail: "Object held",
      icon: "📦",
    });
  }

  const displayObs = frame.obstacles ?? obstacles;
  const nearbyObs = displayObs?.filter(o => {
    const ox = o.ox ?? o.x;
    const oy = o.oy ?? o.y;
    return distBetween(frame.x, frame.y, ox, oy) < INTERACT_DIST * 1.5;
  }) ?? [];

  if (nearbyObs.length > 0) {
    for (const ob of nearbyObs) {
      const t = OBSTACLE_TYPES[ob.type];
      if (!t) continue;
      const ox = ob.ox ?? ob.x;
      const oy = ob.oy ?? ob.y;
      const dist = Math.round(distBetween(frame.x, frame.y, ox, oy));
      const canInteract = dist < INTERACT_DIST;

      if (t.interactable) {
        const req = t.requires || {};
        let status = "ok";
        let reasons = [];

        if (req.arm && !hasArm) { status = "fail"; reasons.push("Need arm"); }
        if (req.claw && !hasClaw) { status = "fail"; reasons.push("Need claw"); }
        if (req.armAngleMin != null && frame.armAngle < req.armAngleMin) {
          status = "warn"; reasons.push(`Arm ≥${req.armAngleMin}°`);
        }
        if (req.armAngleMax != null && frame.armAngle > req.armAngleMax) {
          status = "warn"; reasons.push(`Arm ≤${req.armAngleMax}°`);
        }
        if (req.clawOpen === false && frame.clawOpen) {
          status = "warn"; reasons.push("Close claw");
        }

        checks.push({
          label: `${t.label} (${dist}px)`,
          status: canInteract ? status : "far",
          detail: canInteract
            ? (reasons.length > 0 ? reasons.join(", ") : "Ready!")
            : "Too far",
          icon: t.icon,
        });
      }
    }
  }

  const statusColors = {
    ok: "#66bb6a",
    active: "#4fc3f7",
    idle: "#546e7a",
    warn: "#ffb74d",
    fail: "#ef5350",
    far: "#37474f",
  };

  return (
    <div>
      {checks.map((c, i) => (
        <div key={i} style={{
          display:"flex", alignItems:"center", gap:"8px",
          padding:"6px 8px", marginBottom:"4px",
          background: `${statusColors[c.status]}11`,
          border: `1px solid ${statusColors[c.status]}33`,
          borderRadius: "8px",
          transition: "all 0.15s",
        }}>
          <span style={{ fontSize:"14px", flexShrink:0 }}>{c.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:"10px", fontWeight:800, color: statusColors[c.status] }}>
              {c.label}
            </div>
            <div style={{ fontSize:"9px", color: `${statusColors[c.status]}aa`,
              fontFamily:"'JetBrains Mono',monospace" }}>
              {c.detail}
            </div>
          </div>
          <div style={{
            width:8, height:8, borderRadius:"50%",
            background: statusColors[c.status],
            boxShadow: `0 0 4px ${statusColors[c.status]}`,
          }}/>
        </div>
      ))}
    </div>
  );
}

// ─── Robot Configurator ───────────────────────────────────────────────────────

function RobotConfigurator({ onComplete }) {
  const [chassisKey, setChassisKey] = useState("arm_bot");
  const [ports, setPorts] = useState({ ...CHASSIS_PRESETS.arm_bot.ports });
  const [activePort, setActivePort] = useState(null);
  const [step, setStep] = useState(0);

  const preset = CHASSIS_PRESETS[chassisKey];

  const selectChassis = (key) => {
    setChassisKey(key);
    setPorts({ ...CHASSIS_PRESETS[key].ports });
    setActivePort(null);
  };

  const setPortRole = (port, roleId) => {
    setPorts(prev => ({
      ...prev,
      [port]: { ...prev[port], role: roleId, label: PORT_ROLES.find(r=>r.id===roleId)?.label ?? roleId },
    }));
    setActivePort(null);
  };

  const hasDrive = Object.values(ports).some(p => p.role === "wheel_left") &&
                   Object.values(ports).some(p => p.role === "wheel_right");
  const hasClaw  = Object.values(ports).some(p => p.role === "claw");
  const hasArm   = Object.values(ports).some(p => p.role === "arm");

  const robotConfig = { chassisKey, ports, hasDrive, hasClaw, hasArm, color: preset.color };
  const portList = ["A","B","C","D","E","F"];

  return (
    <div style={{
      minHeight:"100vh", background:"#060d1a",
      fontFamily:"'Nunito',system-ui,sans-serif", color:"#e0e8f0",
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"32px 16px 48px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fredoka+One&family=JetBrains+Mono:wght@500&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 8px #4fc3f733}50%{box-shadow:0 0 20px #4fc3f766}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
      `}</style>

      {/* Logo */}
      <div style={{ textAlign:"center", marginBottom:"32px" }}>
        <div style={{ fontFamily:"'Fredoka One'", fontSize:"42px",
          background:"linear-gradient(120deg,#4fc3f7,#81c784,#ffb74d)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1 }}>
          codespeak
        </div>
        <div style={{ fontSize:"11px", color:"#1e3a5f", fontWeight:900,
          letterSpacing:"3px", textTransform:"uppercase", marginTop:"4px" }}>
          robot builder
        </div>
      </div>

      {/* Steps */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"32px", alignItems:"center" }}>
        {["Choose Chassis","Configure Ports","Ready!"].map((label,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{
              padding:"6px 14px", borderRadius:"20px", fontSize:"12px", fontWeight:800,
              background: step===i ? preset.color : step>i ? "#1e3a5f" : "#0a1525",
              color: step===i ? "#060d1a" : step>i ? "#4fc3f7" : "#1e3a5f",
              border: `1.5px solid ${step>=i ? preset.color : "#0d2035"}`,
              cursor: step>i ? "pointer" : "default", transition:"all 0.2s",
            }} onClick={() => step>i && setStep(i)}>
              {step>i ? "✓ " : `${i+1}. `}{label}
            </div>
            {i<2 && <div style={{ width:20, height:1, background:"#0d2035" }}/>}
          </div>
        ))}
      </div>

      <div style={{ width:"100%", maxWidth:560 }}>

        {/* Step 0 */}
        {step===0 && (
          <div style={{ animation:"fadeUp 0.2s ease" }}>
            <h2 style={{ fontFamily:"'Fredoka One'", fontSize:"24px", color:"#4fc3f7",
              textAlign:"center", marginBottom:"20px" }}>
              What kind of robot did you build?
            </h2>
            {Object.entries(CHASSIS_PRESETS).map(([key, p]) => (
              <div key={key} onClick={() => selectChassis(key)} style={{
                padding:"16px 20px", borderRadius:"16px", cursor:"pointer",
                marginBottom:"10px", transition:"all 0.15s",
                border:`2px solid ${chassisKey===key ? p.color : "#0d2035"}`,
                background: chassisKey===key ? `${p.color}18` : "#080f1c",
                display:"flex", alignItems:"center", gap:"16px",
              }}>
                <div style={{ fontSize:"32px", width:44, textAlign:"center" }}>{p.emoji}</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:"16px", color:p.color }}>{p.label}</div>
                  <div style={{ fontSize:"12px", color:"#2a4a6a", marginTop:"2px" }}>{p.desc}</div>
                </div>
                {chassisKey===key && (
                  <div style={{ marginLeft:"auto", width:10, height:10, borderRadius:"50%",
                    background:p.color, boxShadow:`0 0 8px ${p.color}` }}/>
                )}
              </div>
            ))}
            <button onClick={() => setStep(1)} style={cfgBtn(preset.color)}>Configure Ports →</button>
          </div>
        )}

        {/* Step 1 */}
        {step===1 && (
          <div style={{ animation:"fadeUp 0.2s ease" }}>
            <h2 style={{ fontFamily:"'Fredoka One'", fontSize:"24px", color:"#4fc3f7",
              textAlign:"center", marginBottom:"6px" }}>
              What's plugged in where?
            </h2>
            <p style={{ textAlign:"center", color:"#1e3a5f", marginBottom:"20px", fontSize:"13px" }}>
              Tap a port to change what it does
            </p>
            <div style={{ background:"#080f1c", border:`2px solid ${preset.color}33`,
              borderRadius:"20px", padding:"18px", marginBottom:"14px" }}>
              <div style={{ fontSize:"10px", fontWeight:900, color:preset.color,
                letterSpacing:"2px", textTransform:"uppercase",
                textAlign:"center", marginBottom:"16px" }}>
                SPIKE Prime Ports
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
                {portList.map(port => {
                  const pData = ports[port];
                  const role  = PORT_ROLES.find(r => r.id === pData?.role);
                  const active = activePort === port;
                  return (
                    <div key={port} onClick={() => setActivePort(active ? null : port)} style={{
                      padding:"12px 8px", borderRadius:"12px", cursor:"pointer",
                      textAlign:"center", transition:"all 0.15s",
                      border:`2px solid ${active ? preset.color : role?.id==="empty" ? "#0d2035" : role?.color+"55"}`,
                      background: active ? `${preset.color}22`
                        : role?.id==="empty" ? "#060d1a" : `${role?.color}11`,
                    }}>
                      <div style={{ fontSize:"20px", marginBottom:"4px" }}>{role?.icon}</div>
                      <div style={{ fontSize:"9px", fontWeight:900, color:preset.color,
                        letterSpacing:"1px", marginBottom:"3px" }}>PORT {port}</div>
                      <div style={{ fontSize:"10px", color:role?.id==="empty" ? "#1e3a5f" : role?.color,
                        fontWeight:700 }}>
                        {role?.id==="empty" ? "empty" : role?.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {activePort && (
              <div style={{ background:"#080f1c", border:"2px solid #4fc3f733",
                borderRadius:"14px", padding:"14px", marginBottom:"12px",
                animation:"fadeUp 0.15s ease" }}>
                <div style={{ fontWeight:800, color:"#4fc3f7", fontSize:"12px",
                  marginBottom:"10px" }}>Port {activePort}:</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"6px" }}>
                  {PORT_ROLES.map(role => (
                    <div key={role.id} onClick={() => setPortRole(activePort, role.id)}
                      style={{
                        padding:"10px 4px", borderRadius:"10px", cursor:"pointer",
                        textAlign:"center", transition:"all 0.12s",
                        background: ports[activePort]?.role===role.id ? `${role.color}22` : "#060d1a",
                        border:`1.5px solid ${ports[activePort]?.role===role.id ? role.color : "#0d2035"}`,
                      }}>
                      <div style={{ fontSize:"16px" }}>{role.icon}</div>
                      <div style={{ fontSize:"9px", fontWeight:700, color:role.color,
                        marginTop:"3px", lineHeight:1.2 }}>{role.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"14px" }}>
              {hasDrive && <Cap color="#4fc3f7">🚗 Can drive</Cap>}
              {hasArm   && <Cap color="#81c784">🦾 Has arm</Cap>}
              {hasClaw  && <Cap color="#ffb74d">🤏 Has claw</Cap>}
              {!hasDrive && <Cap color="#ff6b6b">⚠️ No drivetrain</Cap>}
            </div>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setStep(0)}
                style={{ flex:1, padding:"12px", background:"#080f1c",
                  border:"2px solid #0d2035", borderRadius:"14px", color:"#2a4a6a",
                  cursor:"pointer", fontFamily:"inherit", fontSize:"14px", fontWeight:800 }}>
                ← Back
              </button>
              <button onClick={() => setStep(2)} style={{...cfgBtn(preset.color), flex:2, marginTop:0}}>
                Looks good! →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step===2 && (
          <div style={{ animation:"fadeUp 0.2s ease", textAlign:"center" }}>
            <div style={{ fontSize:"56px", marginBottom:"12px" }}>🤖</div>
            <h2 style={{ fontFamily:"'Fredoka One'", fontSize:"28px",
              color:preset.color, marginBottom:"8px" }}>
              {preset.emoji} {preset.label} is ready!
            </h2>
            <div style={{ display:"flex", justifyContent:"center", gap:"8px",
              marginBottom:"28px", flexWrap:"wrap" }}>
              {hasDrive && <Cap color="#4fc3f7">🚗 Drive</Cap>}
              {hasArm   && <Cap color="#81c784">🦾 Arm</Cap>}
              {hasClaw  && <Cap color="#ffb74d">🤏 Claw</Cap>}
            </div>
            <div style={{ display:"inline-block", background:"#080f1c",
              border:`2px solid ${preset.color}33`, borderRadius:"16px", padding:"16px",
              marginBottom:"28px" }}>
              <svg width={120} height={100}>
                <RobotSideView
                  frame={{ armAngle:45, clawOpen:true, label:"" }}
                  config={robotConfig} width={120} height={100}/>
              </svg>
            </div>
            <div><button onClick={() => onComplete(robotConfig)}
              style={cfgBtn(preset.color)}>
              🚀 Launch Simulator!
            </button></div>
          </div>
        )}
      </div>
    </div>
  );
}

function Cap({ color, children }) {
  return (
    <span style={{ fontSize:"11px", fontWeight:800, color, background:`${color}18`,
      border:`1px solid ${color}44`, padding:"3px 10px", borderRadius:"12px" }}>
      {children}
    </span>
  );
}

function cfgBtn(color) {
  return {
    width:"100%", padding:"14px", marginTop:"8px",
    background:`linear-gradient(135deg,${color},${color}99)`,
    border:"none", borderRadius:"14px", color:"#060d1a",
    fontSize:"16px", fontWeight:900, fontFamily:"inherit", cursor:"pointer",
  };
}

// ─── Obstacle toolbar ─────────────────────────────────────────────────────────

function ObstacleToolbar({ obstacles, setObstacles, placingObstacle, setPlacingObstacle }) {
  return (
    <div>
      <div style={{ fontSize:"10px", fontWeight:900, color:"#1e3a5f",
        letterSpacing:"2px", textTransform:"uppercase", marginBottom:"10px" }}>
        Obstacles
      </div>

      {/* Obstacle palette */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px", marginBottom:"10px" }}>
        {Object.entries(OBSTACLE_TYPES).map(([key, type]) => (
          <button key={key}
            onClick={() => setPlacingObstacle(placingObstacle === key ? null : key)}
            style={{
              padding:"6px 4px", borderRadius:"8px", cursor:"pointer",
              textAlign:"center", transition:"all 0.12s",
              border: `1.5px solid ${placingObstacle === key ? type.color : "#0d2035"}`,
              background: placingObstacle === key ? `${type.color}22` : "#080f1c",
              color: placingObstacle === key ? type.color : "#2a4a6a",
              fontFamily:"inherit", fontSize:"9px", fontWeight:700,
            }}>
            <div style={{ fontSize:"14px", marginBottom:"2px" }}>{type.icon}</div>
            {type.label}
          </button>
        ))}
      </div>

      {placingObstacle && (
        <div style={{
          padding:"6px 8px", borderRadius:"8px", marginBottom:"8px",
          background:"#ffb74d11", border:"1px solid #ffb74d33",
          fontSize:"10px", color:"#ffb74d", fontWeight:700, textAlign:"center",
        }}>
          Click on the grid to place
        </div>
      )}

      {/* Placed obstacles list */}
      {obstacles.length > 0 && (
        <div style={{ marginTop:"4px" }}>
          <div style={{ fontSize:"9px", fontWeight:900, color:"#1e3a5f",
            letterSpacing:"1px", textTransform:"uppercase", marginBottom:"6px" }}>
            Placed ({obstacles.length})
          </div>
          {obstacles.map(ob => {
            const t = OBSTACLE_TYPES[ob.type];
            return (
              <div key={ob.id} style={{
                display:"flex", alignItems:"center", gap:"6px",
                padding:"4px 6px", marginBottom:"3px",
                background:"#080f1c", borderRadius:"6px",
                border:`1px solid ${t.color}33`,
              }}>
                <span style={{ fontSize:"12px" }}>{t.icon}</span>
                <span style={{ fontSize:"9px", color:t.color, fontWeight:700, flex:1 }}>
                  {t.label}
                </span>
                <span style={{ fontSize:"8px", color:"#1e3a5f",
                  fontFamily:"'JetBrains Mono',monospace" }}>
                  {Math.round(ob.x)},{Math.round(ob.y)}
                </span>
                <button onClick={() => setObstacles(prev => prev.filter(o => o.id !== ob.id))}
                  style={{
                    background:"none", border:"none", color:"#1e3a5f",
                    cursor:"pointer", fontSize:"12px", padding:"0 2px",
                    lineHeight:1,
                  }}>×</button>
              </div>
            );
          })}
          <button onClick={() => setObstacles([])}
            style={{
              width:"100%", padding:"5px", marginTop:"6px",
              background:"#080f1c", border:"1px solid #1e3a5f33",
              borderRadius:"6px", color:"#1e3a5f",
              fontSize:"9px", fontWeight:700, cursor:"pointer",
              fontFamily:"inherit",
            }}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Simulator screen ─────────────────────────────────────────────────────────

function SimulatorScreen({ robotConfig, onBack }) {
  const [programKey, setProgramKey]               = useState("Square (90°)");
  const [view, setView]                           = useState("top");
  const [frameIdx, setFrameIdx]                   = useState(0);
  const [playing, setPlaying]                     = useState(false);
  const [speed, setSpeed]                         = useState(1);
  const [obstacles, setObstacles]                 = useState(DEMO_PROGRAMS["Square (90°)"].obstacles);
  const [placingObstacle, setPlacingObstacle]     = useState(null);
  const [customCommands, setCustomCommands]        = useState([]);
  const [customInput, setCustomInput]              = useState("");
  const [customCode, setCustomCode]                = useState("");
  const timerRef = useRef(null);
  const obstIdRef = useRef(100);
  const customIdRef = useRef(0);

  const isCustom = programKey === "__custom__";
  const isFromCode = programKey === "__code__";
  const commands = isCustom ? customCommands : DEMO_PROGRAMS[programKey]?.commands ?? [];

  const { primitives: codePrimitives, error: codeParseError } = useMemo(() => {
    if (isFromCode && customCode.trim()) return parseCodeToPrimitives(customCode);
    return { primitives: [], error: null };
  }, [isFromCode, customCode]);

  const { frames, trailData } = useMemo(() => {
    if (isFromCode) {
      if (codeParseError || !customCode.trim()) return { frames: [], trailData: [] };
      return buildFramesFromPrimitives(codePrimitives, robotConfig, obstacles);
    }
    return buildFrames(commands, robotConfig, obstacles);
  }, [isFromCode, customCode, codePrimitives, codeParseError, commands, robotConfig, obstacles]);
  const frame = frames[frameIdx] ?? frames[frames.length - 1];

  const voice = useVoiceInput({
    onResult: useCallback((text) => {
      const parsed = parseChallengeCommand(text);
      if (parsed) {
        sfx("add");
        setCustomCommands(prev => [...prev, { id: customIdRef.current++, ...parsed }]);
        if (programKey !== "__custom__") setProgramKey("__custom__");
      } else { sfx("fail"); }
    }, [programKey]),
  });

  const addCustomCommand = useCallback((raw) => {
    const parsed = parseChallengeCommand(raw);
    if (!parsed) { sfx("fail"); return; }
    sfx("add");
    setCustomCommands(prev => [...prev, { id: customIdRef.current++, ...parsed }]);
    if (programKey !== "__custom__") setProgramKey("__custom__");
  }, [programKey]);

  useEffect(() => {
    setFrameIdx(0); setPlaying(false);
    clearTimeout(timerRef.current);
  }, [programKey, obstacles, customCommands, customCode]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const tick = useCallback(() => {
    setFrameIdx(prev => {
      const next = prev + 1;
      if (next >= frames.length) { setPlaying(false); return prev; }
      const f = frames[next];
      if (f?.label?.startsWith("Moving")) sfx("move");
      else if (f?.label?.startsWith("Turning")) sfx("turn");
      else if (f?.label?.startsWith("Blocked") || f?.label?.startsWith("Turn blocked")) sfx("collision");
      else if (f?.label?.includes("Grabbed") || f?.label?.includes("Lifting")) sfx("grab");
      else if (f?.label?.includes("Released") || f?.label?.includes("Set down")) sfx("release");
      else if (f?.label?.startsWith("Raising") || f?.label?.startsWith("Lowering")) sfx("arm");
      else if (f?.label?.includes("Goal reached")) sfx("goal");
      timerRef.current = setTimeout(tick, 1000 / (FPS * speed));
      return next;
    });
  }, [frames.length, speed, frames]);

  const play = useCallback(() => {
    if (frameIdx >= frames.length - 1) setFrameIdx(0);
    setPlaying(true);
    sfx("start");
    timerRef.current = setTimeout(tick, 1000 / (FPS * speed));
  }, [frameIdx, frames.length, speed, tick]);

  const pause = useCallback(() => {
    clearTimeout(timerRef.current);
    setPlaying(false);
  }, []);

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    setPlaying(false);
    setFrameIdx(0);
  }, []);

  const scrub = useCallback((e) => {
    const pct = parseFloat(e.target.value) / 100;
    setFrameIdx(Math.round(pct * (frames.length - 1)));
  }, [frames.length]);

  const handlePlaceObstacle = useCallback((x, y) => {
    if (!placingObstacle) return;
    setObstacles(prev => [...prev, {
      id: `ob_${obstIdRef.current++}`,
      type: placingObstacle,
      x, y,
    }]);
    setPlacingObstacle(null);
  }, [placingObstacle]);

  const handleProgramChange = useCallback((key) => {
    setProgramKey(key);
    if (key !== "__custom__" && key !== "__code__") {
      setObstacles(DEMO_PROGRAMS[key]?.obstacles ?? []);
    }
  }, []);

  // Keyboard shortcuts for playback
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (frames.length > 0) {
          if (playing) { pause(); }
          else { play(); }
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        pause();
        setFrameIdx(prev => Math.min(frames.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        pause();
        setFrameIdx(prev => Math.max(0, prev - 1));
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [frames.length, playing, play, pause, reset]);

  const isDone    = frameIdx >= frames.length - 1;
  const progress  = frames.length > 1 ? frameIdx / (frames.length - 1) : 0;
  const elapsed   = (frameIdx / FPS).toFixed(1);
  const total     = ((frames.length - 1) / FPS).toFixed(1);
  const presetColor = robotConfig?.color ?? "#4fc3f7";

  return (
    <div style={{
      minHeight:"100vh", background:"#060d1a",
      fontFamily:"'Nunito',system-ui,sans-serif", color:"#e0e8f0",
      display:"flex", flexDirection:"column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fredoka+One&family=JetBrains+Mono:wght@500&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        input[type=range]{height:4px}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${presetColor};border:2px solid #060d1a;cursor:pointer}
        input[type=range]::-webkit-slider-runnable-track{height:4px;background:#0d2035;border-radius:2px}
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px",
        padding:"0 18px", height:52,
        background:"linear-gradient(180deg, #040a12, #060d1a)",
        borderBottom:"1px solid #0d2035" }}>
        <button onClick={onBack} style={{ background:"#0a1525", border:"1px solid #0d2035",
          borderRadius:"8px", color:"#2a4a6a", padding:"5px 11px",
          cursor:"pointer", fontFamily:"inherit", fontSize:"11px", fontWeight:800 }}>
          ← Config
        </button>
        <span style={{ fontFamily:"'Fredoka One'", fontSize:"22px",
          background:"linear-gradient(120deg,#4fc3f7,#81c784,#ffb74d)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          codespeak simulator
        </span>
        <div style={{ display:"flex", gap:"6px", marginLeft:"8px" }}>
          {robotConfig.hasDrive && <Cap color="#4fc3f7">🚗</Cap>}
          {robotConfig.hasArm   && <Cap color="#81c784">🦾</Cap>}
          {robotConfig.hasClaw  && <Cap color="#ffb74d">🤏</Cap>}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:"4px",
          background:"#0a1525", border:"1px solid #0d2035",
          borderRadius:"10px", padding:"3px" }}>
          {[["top","⬆️ Top"],["side","↔️ Side"]].map(([v,label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:"5px 12px", borderRadius:"8px", border:"none",
              background: view===v ? `${presetColor}33` : "none",
              color: view===v ? presetColor : "#2a4a6a",
              fontWeight:800, fontSize:"11px", cursor:"pointer",
              fontFamily:"inherit", transition:"all 0.15s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex:1, display:"flex", gap:0, overflow:"hidden" }}>

        {/* Left: programs + steps + command builder */}
        <div style={{ width:220, borderRight:"1px solid #0d2035",
          display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ flex:1, overflowY:"auto", padding:"14px 10px" }}>
            <div style={{ fontSize:"10px", fontWeight:900, color:"#1e3a5f",
              letterSpacing:"2px", textTransform:"uppercase", marginBottom:"10px" }}>
              Programs
            </div>
            {/* My Program option */}
            <div onClick={() => handleProgramChange("__custom__")} style={{
              padding:"8px 10px", borderRadius:"10px", cursor:"pointer",
              marginBottom:"4px", transition:"all 0.12s",
              background: isCustom ? `#81c78422` : "#080f1c",
              border:`1.5px solid ${isCustom ? "#81c784" : "#0d2035"}`,
              color: isCustom ? "#81c784" : "#2a4a6a",
              fontWeight:800, fontSize:"12px",
            }}>
              🎤 My Program
              {isCustom && (
                <span style={{ float:"right", fontSize:"9px", opacity:0.7 }}>
                  {customCommands.length} steps
                </span>
              )}
            </div>
            {/* From Code option */}
            <div onClick={() => handleProgramChange("__code__")} style={{
              padding:"8px 10px", borderRadius:"10px", cursor:"pointer",
              marginBottom:"4px", transition:"all 0.12s",
              background: isFromCode ? `#4fc3f722` : "#080f1c",
              border:`1.5px solid ${isFromCode ? "#4fc3f7" : "#0d2035"}`,
              color: isFromCode ? "#4fc3f7" : "#2a4a6a",
              fontWeight:800, fontSize:"12px",
            }}>
              📄 From Code
              {isFromCode && frames.length > 0 && (
                <span style={{ float:"right", fontSize:"9px", opacity:0.7 }}>
                  {frames.length}f
                </span>
              )}
            </div>
            {Object.keys(DEMO_PROGRAMS).map(key => (
              <div key={key} onClick={() => handleProgramChange(key)} style={{
                padding:"8px 10px", borderRadius:"10px", cursor:"pointer",
                marginBottom:"4px", transition:"all 0.12s",
                background: programKey===key ? `${presetColor}22` : "#080f1c",
                border:`1.5px solid ${programKey===key ? presetColor : "#0d2035"}`,
                color: programKey===key ? presetColor : "#2a4a6a",
                fontWeight:800, fontSize:"12px",
              }}>
                {key}
                {programKey===key && (
                  <span style={{ float:"right", fontSize:"9px", opacity:0.7 }}>
                    {frames.length}f
                  </span>
                )}
              </div>
            ))}

            {/* From Code: paste Python */}
            {isFromCode && (
              <div style={{ marginTop:"12px" }}>
                <div style={{ fontSize:"10px", fontWeight:900, color:"#1e3a5f",
                  letterSpacing:"2px", textTransform:"uppercase", marginBottom:"6px" }}>
                  Paste pybricks Python
                </div>
                <textarea value={customCode} onChange={e => setCustomCode(e.target.value)}
                  placeholder={`# Paste pybricks code — simulates from actual values
# Supports: .straight(mm), .turn(deg), .run_time(speed,ms), for _ in range(n)

for _ in range(4):
    robot.straight(400)
    robot.turn(90)`}
                  style={{
                    width:"100%", minHeight:140, padding:"10px",
                    background:"#080f1c", border:"1.5px solid #0d2035",
                    borderRadius:"10px", color:"#c8d6e5",
                    fontSize:"11px", fontFamily:"'JetBrains Mono',monospace",
                    resize:"vertical", outline:"none",
                  }}/>
                {codeParseError && (
                  <div style={{ marginTop:"6px", fontSize:"10px", color:"#ef5350", fontWeight:700 }}>
                    {codeParseError}
                  </div>
                )}
                {isFromCode && customCode.trim() && !codeParseError && codePrimitives.length === 0 && (
                  <div style={{ marginTop:"6px", fontSize:"10px", color:"#ffb74d", fontWeight:700 }}>
                    No straight/turn/run_target found
                  </div>
                )}
              </div>
            )}

            {/* Steps */}
            {!isFromCode && (
            <div style={{ marginTop:"16px" }}>
              <div style={{ fontSize:"10px", fontWeight:900, color:"#1e3a5f",
                letterSpacing:"2px", textTransform:"uppercase", marginBottom:"6px" }}>
                Steps
              </div>
              {commands.map((c, i) => {
                const intentColors = {
                  move: "#4fc3f7", turn: "#81c784", stop: "#ef5350",
                  arm_up: "#66bb6a", arm_down: "#66bb6a",
                  claw_open: "#ffb74d", claw_close: "#ffb74d",
                  repeat: "#ce93d8", stop_repeat: "#546e7a",
                  beep: "#fff176", say: "#ce93d8", light: "#ffb74d", light_off: "#546e7a",
                  rotate_base: "#ce93d8", run_motor: "#ffb74d", motor_angle: "#66bb6a",
                  if_color: "#f48fb1", if_distance: "#80cbc4", if_button: "#a5d6a7",
                  if_force: "#ff8a65", if_touched: "#b39ddb",
                  if_reflection: "#ffeb3b", if_ambient: "#ffb74d",
                };
                const color = intentColors[c.intent] ?? "#4fc3f7";
                return (
                  <div key={c.id ?? i} style={{
                    fontSize:"11px", padding:"3px 7px", borderRadius:"6px",
                    marginBottom:"2px", fontWeight:700,
                    background: `${color}11`,
                    color: color,
                    borderLeft: `2px solid ${color}66`,
                    transition:"all 0.1s",
                    display:"flex", alignItems:"center",
                  }}>
                    <span style={{ flex:1 }}>{c.raw}</span>
                    {isCustom && (
                      <button onClick={() => { sfx("remove");
                        setCustomCommands(prev => prev.filter(x => x.id !== c.id)); }}
                        style={{ background:"none", border:"none", color:`${color}66`,
                          cursor:"pointer", fontSize:"12px", padding:"0 2px", lineHeight:1 }}>×</button>
                    )}
                  </div>
                );
              })}
              {isCustom && commands.length === 0 && (
                <div style={{ fontSize:"11px", color:"#1e3a5f", padding:"8px",
                  textAlign:"center", fontStyle:"italic" }}>
                  Speak or type commands below
                </div>
              )}
            </div>
            )}
          </div>

          {/* Custom program input */}
          {isCustom && (
            <div style={{ padding:"10px", borderTop:"1px solid #0d2035" }}>
              {voice.hasSpeech && (
                <button
                  onMouseDown={voice.start} onMouseUp={voice.stop}
                  onTouchStart={voice.start} onTouchEnd={voice.stop}
                  style={{
                    width:"100%", padding:"10px", marginBottom:"6px",
                    background: voice.listening
                      ? "linear-gradient(135deg,#ef5350,#ffb74d)"
                      : "linear-gradient(135deg,#4fc3f7,#81c784)",
                    border:"none", borderRadius:"10px",
                    color: voice.listening ? "#fff" : "#060d1a",
                    fontSize:"13px", fontWeight:900, cursor:"pointer",
                    fontFamily:"inherit", display:"flex", alignItems:"center",
                    justifyContent:"center", gap:"8px",
                    animation: voice.listening ? "pulse 1s infinite" : "none",
                  }}>
                  <span>{voice.listening ? "🔴" : "🎤"}</span>
                  {voice.listening ? (voice.interim || "Listening...") : "Hold to Speak"}
                </button>
              )}
              <div style={{ display:"flex", gap:"4px", marginBottom:"6px" }}>
                <input value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { addCustomCommand(customInput); setCustomInput(""); }}}
                  placeholder="Type command..."
                  style={{
                    flex:1, padding:"8px 10px",
                    background:"#080f1c", border:"1.5px solid #0d2035",
                    borderRadius:"8px", color:"#fff",
                    fontSize:"12px", fontFamily:"inherit", outline:"none",
                  }}/>
                <button onClick={() => { addCustomCommand(customInput); setCustomInput(""); }}
                  style={{ padding:"8px 10px", background:"#0a1525",
                    border:"1.5px solid #0d2035", borderRadius:"8px",
                    color:"#4fc3f7", fontSize:"11px", fontWeight:800,
                    cursor:"pointer", fontFamily:"inherit" }}>+</button>
              </div>
              <div style={{ display:"flex", gap:"3px", flexWrap:"wrap" }}>
                {["move forward","turn right 90","turn left 90","stop",
                  "raise arm","lower arm","close claw","open claw",
                  "beep","say hello","light blue","lights off","rotate base 90","run motor 50",
                  "if force 5","if touched","if the button",
                  "if reflection 50","if it's dark","if it's bright"].map(cmd => (
                  <button key={cmd} onClick={() => addCustomCommand(cmd)} style={{
                    padding:"3px 7px", background:"#080f1c",
                    border:"1px solid #0d2035", borderRadius:"6px",
                    color:"#4fc3f7", fontSize:"9px", fontWeight:800,
                    cursor:"pointer", fontFamily:"inherit",
                  }}>{cmd}</button>
                ))}
              </div>
              {customCommands.length > 0 && (
                <button onClick={() => { sfx("remove"); setCustomCommands([]); }}
                  style={{ width:"100%", marginTop:"6px", padding:"6px",
                    background:"#0a1525", border:"1px solid #0d2035",
                    borderRadius:"6px", color:"#ef5350", fontSize:"10px",
                    fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: canvas */}
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          padding:"16px", position:"relative", overflow:"hidden" }}>

          {/* Blueprint background */}
          <div style={{ position:"absolute", inset:0, opacity:0.02,
            backgroundImage:"linear-gradient(#4fc3f7 1px, transparent 1px), linear-gradient(90deg, #4fc3f7 1px, transparent 1px)",
            backgroundSize:"20px 20px" }}/>

          {view === "top" && (
            <div style={{ animation:"fadeUp 0.2s ease",
              boxShadow:`0 0 60px ${presetColor}15, 0 0 1px ${presetColor}44`,
              borderRadius:14, overflow:"hidden",
              border:"1px solid #0d2035" }}>
              <WorldCanvas frames={frames} frameIdx={frameIdx} robotConfig={robotConfig}
                obstacles={obstacles}
                placingObstacle={placingObstacle}
                onPlaceObstacle={handlePlaceObstacle}
                trailData={trailData}/>
            </div>
          )}

          {view === "side" && (
            <div style={{ animation:"fadeUp 0.2s ease", width:"100%", maxWidth:500,
              background:"#080f1c", borderRadius:16,
              border:"1px solid #0d2035",
              boxShadow:`0 0 40px ${presetColor}11` }}>
              <RobotSideView frame={frame} config={robotConfig} width={500} height={260}/>
            </div>
          )}

          {/* Action label */}
          <div style={{ marginTop:"12px", height:28, textAlign:"center" }}>
            <span style={{ fontSize:"13px", fontWeight:700,
              color: isDone ? "#81c784" : frame?.event
                ? (frame.event.type === "success" ? "#66bb6a" :
                   frame.event.type === "warning" ? "#ffb74d" : "#ef5350")
                : presetColor,
              background:"#080f1c", padding:"4px 16px",
              borderRadius:"14px",
              border:`1px solid ${isDone ? "#81c784" :
                frame?.event ? (frame.event.type === "success" ? "#66bb6a" :
                frame.event.type === "warning" ? "#ffb74d" : "#ef5350") : "#0d2035"}`,
            }}>
              {isDone ? "✓ Program complete" : (frame?.label ?? "Ready")}
            </span>
          </div>
        </div>

        {/* Right: state + obstacles + validation */}
        <div style={{ width:200, borderLeft:"1px solid #0d2035",
          padding:"14px 10px", flexShrink:0, overflowY:"auto" }}>

          {/* Telemetry */}
          <div style={{ fontSize:"10px", fontWeight:900, color:"#1e3a5f",
            letterSpacing:"2px", textTransform:"uppercase", marginBottom:"10px" }}>
            Robot State
          </div>
          {[
            ["Position", frame ? `${(frame.x/PX_PER_M - WORLD_M/2).toFixed(2)}, ${(frame.y/PX_PER_M - WORLD_M/2).toFixed(2)}` : "—", "m"],
            ["Heading",  frame ? `${Math.round(((frame.heading % 360) + 360) % 360)}` : "—", "°"],
            ["Arm",      frame ? `${Math.round(frame.armAngle)}` : "—", "°"],
            ["Claw",     frame ? (frame.clawOpen ? "Open" : "Closed") : "—", ""],
          ].map(([k, v, unit]) => (
            <div key={k} style={{ marginBottom:"5px",
              background:"#080f1c", padding:"6px 8px", borderRadius:"8px",
              border:"1px solid #0d2035", display:"flex", justifyContent:"space-between",
              alignItems:"center" }}>
              <div style={{ fontSize:"9px", fontWeight:900, color:"#1e3a5f",
                letterSpacing:"1px", textTransform:"uppercase" }}>{k}</div>
              <div style={{ fontSize:"11px", fontWeight:700, color:presetColor,
                fontFamily:"'JetBrains Mono',monospace" }}>{v}{unit}</div>
            </div>
          ))}

          {/* Validation */}
          <div style={{ marginTop:"14px", marginBottom:"14px" }}>
            <div style={{ fontSize:"10px", fontWeight:900, color:"#1e3a5f",
              letterSpacing:"2px", textTransform:"uppercase", marginBottom:"8px" }}>
              Validation
            </div>
            <ValidationPanel frame={frame} robotConfig={robotConfig} obstacles={obstacles}/>
          </div>

          {/* Obstacle toolbar */}
          <div style={{ marginTop:"8px" }}>
            <ObstacleToolbar
              obstacles={obstacles}
              setObstacles={setObstacles}
              placingObstacle={placingObstacle}
              setPlacingObstacle={setPlacingObstacle}/>
          </div>

          {/* Speed */}
          <div style={{ marginTop:"14px" }}>
            <div style={{ fontSize:"10px", fontWeight:900, color:"#1e3a5f",
              letterSpacing:"2px", textTransform:"uppercase", marginBottom:"6px" }}>Speed</div>
            <div style={{ display:"flex", gap:"4px" }}>
              {[1,2,4].map(s => (
                <button key={s} onClick={() => setSpeed(s)} style={{
                  flex:1, padding:"5px", borderRadius:"8px",
                  background: speed===s ? `${presetColor}22` : "#080f1c",
                  border:`1.5px solid ${speed===s ? presetColor : "#0d2035"}`,
                  color: speed===s ? presetColor : "#2a4a6a",
                  fontWeight:800, fontSize:"11px", cursor:"pointer",
                  fontFamily:"inherit", transition:"all 0.12s",
                }}>{s}×</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Playback bar */}
      <div style={{ borderTop:"1px solid #0d2035", padding:"10px 18px",
        background:"linear-gradient(180deg, #060d1a, #040a12)",
        display:"flex", flexDirection:"column", gap:"6px" }}>
        {/* Scrubber */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"11px", color:"#1e3a5f",
            fontFamily:"'JetBrains Mono',monospace", minWidth:38 }}>{elapsed}s</span>
          <input type="range" min={0} max={100}
            value={Math.round(progress * 100)} onChange={scrub}
            style={{ flex:1, accentColor:presetColor, cursor:"pointer",
              height:4, WebkitAppearance:"none", background:"#0d2035",
              borderRadius:2, outline:"none" }}/>
          <span style={{ fontSize:"11px", color:"#1e3a5f",
            fontFamily:"'JetBrains Mono',monospace", minWidth:38,
            textAlign:"right" }}>{total}s</span>
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:"6px", justifyContent:"center" }}>
          <PbBtn onClick={() => { clearTimeout(timerRef.current); setPlaying(false);
            setFrameIdx(p => Math.max(0, p-1)); }} disabled={frameIdx===0}>◀</PbBtn>
          <PbBtn onClick={playing ? pause : play} accent={presetColor}
            style={{ minWidth:90 }}>
            {playing ? "⏸ Pause" : isDone ? "↺ Replay" : "▶ Play"}
          </PbBtn>
          <PbBtn onClick={() => { clearTimeout(timerRef.current); setPlaying(false);
            setFrameIdx(p => Math.min(frames.length-1, p+1)); }} disabled={isDone}>▶</PbBtn>
          <PbBtn onClick={reset} disabled={frameIdx===0 && !playing}>■ Reset</PbBtn>
        </div>

        <div style={{ textAlign:"center", fontSize:"10px", color:"#1e3a5f",
          fontFamily:"'JetBrains Mono',monospace" }}>
          frame {frameIdx+1} / {frames.length}
          {obstacles.length > 0 && ` · ${obstacles.length} obstacle${obstacles.length!==1?"s":""}`}
        </div>
      </div>
    </div>
  );
}

function PbBtn({ onClick, disabled, accent, children, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:"7px 14px",
      background: accent ? `${accent}22` : "#0a1525",
      border:`1.5px solid ${accent ?? "#0d2035"}`,
      borderRadius:"9px",
      color: disabled ? "#1e3a5f" : (accent ?? "#4fc3f7"),
      fontWeight:800, fontSize:"13px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily:"inherit", transition:"all 0.12s",
      opacity: disabled ? 0.4 : 1,
      ...style,
    }}>{children}</button>
  );
}

// ─── Sound effects (Web Audio) ────────────────────────────────────────────────

const audioCtxRef = { current: null };
function getAudioCtx() {
  if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtxRef.current;
}

function playTone(freq, dur = 0.12, type = "square", vol = 0.15) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {}
}

function sfx(name) {
  const sounds = {
    move:      () => playTone(220, 0.08, "sine", 0.08),
    turn:      () => playTone(330, 0.1, "sine", 0.1),
    collision: () => { playTone(110, 0.15, "sawtooth", 0.2); playTone(90, 0.2, "sawtooth", 0.15); },
    grab:      () => { playTone(440, 0.06, "square", 0.1); setTimeout(() => playTone(660, 0.06, "square", 0.1), 70); },
    release:   () => { playTone(660, 0.06, "square", 0.1); setTimeout(() => playTone(440, 0.06, "square", 0.1), 70); },
    arm:       () => playTone(280, 0.15, "triangle", 0.08),
    goal:      () => { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f, 0.2, "sine", 0.15), i*120)); },
    fail:      () => { playTone(200, 0.2, "sawtooth", 0.12); setTimeout(() => playTone(150, 0.3, "sawtooth", 0.1), 200); },
    click:     () => playTone(800, 0.04, "sine", 0.08),
    start:     () => { playTone(440, 0.1, "sine", 0.1); setTimeout(() => playTone(660, 0.1, "sine", 0.1), 100); },
    add:       () => playTone(600, 0.08, "sine", 0.1),
    remove:    () => playTone(300, 0.08, "sine", 0.08),
  };
  sounds[name]?.();
}

// ─── Browser voice input (Web Speech API — no server) ─────────────────────────

function useVoiceInput({ onResult }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef(null);

  const start = useCallback(() => {
    if (listening) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const results = Array.from(e.results);
      const last = results[results.length - 1];
      const text = last[0].transcript;
      if (last.isFinal) {
        setInterim("");
        setListening(false);
        onResult(text);
      } else {
        setInterim(text);
      }
    };
    rec.onerror = () => { setListening(false); setInterim(""); };
    rec.onend = () => { setListening(false); setInterim(""); };
    recRef.current = rec;
    rec.start();
    setListening(true);
    sfx("click");
  }, [listening, onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const hasSpeech = typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return { listening, interim, start, stop, hasSpeech };
}

// ─── Kid challenges ───────────────────────────────────────────────────────────

const KID_CHALLENGES = [
  {
    title: "Drive to the Star!",
    hint: "Say: move forward",
    emoji: "⭐",
    obstacles: [
      { id:"g1", type:"goal", x:200, y:80 },
    ],
    startCommands: [],
    difficulty: 1,
  },
  {
    title: "Go Around the Wall!",
    hint: "Say: move forward, then turn right, then move forward",
    emoji: "🧱",
    obstacles: [
      { id:"w1", type:"wall_h", x:200, y:140 },
      { id:"g1", type:"goal", x:280, y:80 },
    ],
    startCommands: [],
    difficulty: 1,
  },
  {
    title: "Grab the Ball!",
    hint: "Move close, then say: close claw",
    emoji: "🔴",
    obstacles: [
      { id:"b1", type:"grabbable", x:200, y:150 },
      { id:"g1", type:"goal", x:200, y:80 },
    ],
    startCommands: [],
    difficulty: 2,
  },
  {
    title: "Lift the Box!",
    hint: "Move close, then say: raise arm",
    emoji: "📦",
    obstacles: [
      { id:"l1", type:"liftable", x:200, y:155 },
      { id:"g1", type:"goal", x:300, y:80 },
    ],
    startCommands: [],
    difficulty: 2,
  },
  {
    title: "Push it Through!",
    hint: "Drive into the block to push it to the star",
    emoji: "🟦",
    obstacles: [
      { id:"p1", type:"pushable", x:200, y:150 },
      { id:"w1", type:"wall_v", x:155, y:90 },
      { id:"w2", type:"wall_v", x:245, y:90 },
      { id:"g1", type:"goal", x:200, y:50 },
    ],
    startCommands: [],
    difficulty: 2,
  },
  {
    title: "Maze Runner!",
    hint: "Turn and move carefully through the walls",
    emoji: "🏆",
    obstacles: [
      { id:"w1", type:"wall_h", x:140, y:140 },
      { id:"w2", type:"wall_v", x:260, y:170 },
      { id:"w3", type:"wall_h", x:200, y:240 },
      { id:"b1", type:"barrier", x:120, y:200 },
      { id:"g1", type:"goal", x:320, y:80 },
    ],
    startCommands: [],
    difficulty: 3,
  },
];

// ─── Kid-friendly challenge mode ──────────────────────────────────────────────

function parseChallengeCommand(raw) {
  const text = raw.toLowerCase().trim().replace(/[,!?.;:]/g, " ").replace(/\s+/g, " ").trim();
  const fillers = ["please","um","uh","like","okay","ok","now","just","can you",
    "i want you to","i want to","robot","lego","hey","alright","lets","let's","and then","next"];
  let t = text;
  for (const f of fillers.sort((a,b)=>b.length-a.length))
    t = t.replace(new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,"g")," ");
  t = t.replace(/\s+/g," ").trim();

  const numWords = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
  function getNum() {
    const m = t.match(/\b(\d+(?:\.\d+)?)\b/);
    if (m) return parseFloat(m[1]);
    for (const [w,v] of Object.entries(numWords)) if (new RegExp(`\\b${w}\\b`).test(t)) return v;
    return null;
  }
  function getDir() {
    if (/\b(forward|forwards|ahead|straight)\b/.test(t)) return "forward";
    if (/\b(backward|backwards|back|reverse)\b/.test(t)) return "backward";
    if (/\bleft\b/.test(t)) return "left";
    if (/\bright\b/.test(t)) return "right";
    return null;
  }

  if (/\b(stop repeating|end loop)\b/.test(t)) return { intent:"stop_repeat", slots:{}, raw };
  if (/\b(stop|halt|freeze)\b/.test(t)) return { intent:"stop", slots:{}, raw };
  if (/\b(raise arm|arm up|lift arm)\b/.test(t)) return { intent:"arm_up", slots:{ angle: getNum() ?? 90 }, raw };
  if (/\b(lower arm|arm down|put arm)\b/.test(t)) return { intent:"arm_down", slots:{ angle: getNum() ?? 0 }, raw };
  if (/\b(close claw|grab|clamp)\b/.test(t)) return { intent:"claw_close", slots:{}, raw };
  if (/\b(open claw|release|let go)\b/.test(t)) return { intent:"claw_open", slots:{}, raw };
  // ── Reactive / sensor commands ──
  if (/\b(move until wall|drive until wall|go until wall|until blocked|until you hit|forward until wall|move until obstacle)\b/.test(t))
    return { intent:"move_until_wall", slots:{ direction: getDir() || "forward" }, raw };
  if (/\b(move until clear|drive until clear|go until clear|until nothing ahead)\b/.test(t))
    return { intent:"move_until_clear", slots:{ direction: getDir() || "forward" }, raw };
  if (/\b(if wall ahead|if wall in front|if blocked ahead|if something ahead)\b/.test(t))
    return { intent:"if_wall_ahead", slots:{}, raw };
  if (/\b(if wall left|if wall on left|if wall to the left|if blocked left)\b/.test(t))
    return { intent:"if_wall_left", slots:{}, raw };
  if (/\b(if wall right|if wall on right|if wall to the right|if blocked right)\b/.test(t))
    return { intent:"if_wall_right", slots:{}, raw };
  if (/\b(if touching|if bumped|if contact|if colliding)\b/.test(t))
    return { intent:"if_touching", slots:{}, raw };
  if (/\b(scan|look around|check surroundings|sense around)\b/.test(t))
    return { intent:"scan", slots:{}, raw };
  if (/\b(turn|rotate|spin)\b/.test(t)) {
    const deg = getNum();
    const dir = getDir() || "right";
    if (deg && deg > 10) return { intent:"turn", slots:{ direction:dir, degrees:deg }, raw };
    return { intent:"turn", slots:{ direction:dir, duration: deg || 0.5 }, raw };
  }
  if (/\b(move|go|drive|walk|run)\b/.test(t)) {
    return { intent:"move", slots:{ direction: getDir() || "forward", duration: getNum() || 1 }, raw };
  }
  if (/\b(repeat|loop)\b/.test(t)) {
    if (/\b(forever|always)\b/.test(t)) return { intent:"repeat_forever", slots:{}, raw };
    return { intent:"repeat", slots:{ times: Math.round(getNum() || 3) }, raw };
  }
  if (/\b(beep|honk|sound)\b/.test(t)) return { intent:"beep", slots:{}, raw };
  if (/\b(say|speak|announce)\b/.test(t)) {
    const m = t.match(/(?:say|speak|announce)\s+(.+)/);
    return { intent:"say", slots:{ phrase: m ? m[1].trim() : "hello" }, raw };
  }
  if (/\b(lights off|light off|turn off lights|lights out)\b/.test(t))
    return { intent:"light_off", slots:{}, raw };
  if (/\b(light up|light|glow)\b/.test(t)) {
    const col = t.match(/\b(red|blue|green|yellow|orange|white|purple|pink)\b/);
    return { intent:"light", slots:{ color: col ? col[1] : "blue" }, raw };
  }
  if (/\b(rotate base|spin base|turn base)\b/.test(t)) {
    const deg = getNum();
    const dir = getDir() || "right";
    return { intent:"rotate_base", slots:{ direction: dir, degrees: deg ?? 90 }, raw };
  }
  if (/\b(run motor|motor at|spin motor)\b/.test(t)) {
    const pct = getNum();
    return { intent:"run_motor", slots:{ power: pct ?? 50 }, raw };
  }
  if (/\b(move arm to|arm to|set arm)\b/.test(t)) {
    const ang = getNum();
    return { intent:"motor_angle", slots:{ angle: ang ?? 90 }, raw };
  }
  if (/\b(if you see|when you see|see)\b/.test(t)) {
    const col = t.match(/\b(red|blue|green|yellow|orange|white|purple|pink|black)\b/);
    return { intent:"if_color", slots:{ color: col ? col[1] : "red" }, raw };
  }
  if (/\b(if something is|if closer|if farther)\b/.test(t)) {
    const comp = /\b(closer|less than|under)\b/.test(t) ? "closer than" : "farther than";
    return { intent:"if_distance", slots:{ comparison: comp, inches: getNum() ?? 6 }, raw };
  }
  if (/\b(if the button|when the button)\b/.test(t)) return { intent:"if_button", slots:{}, raw };
  if (/\b(if force|when force|force greater|force more than)\b/.test(t))
    return { intent:"if_force", slots:{ force: getNum() ?? 3 }, raw };
  if (/\b(if touched|when touched|if someone touches)\b/.test(t))
    return { intent:"if_touched", slots:{}, raw };
  if (/\b(if reflection|when reflection|reflection greater|reflection less|surface bright|surface dark)\b/.test(t)) {
    const comp = /\b(less|under|below)\b/.test(t) ? "less" : "greater";
    return { intent:"if_reflection", slots:{ comparison: comp, value: getNum() ?? 50 }, raw };
  }
  if (/\b(if it's dark|if dark|when dark|ambient less)\b/.test(t))
    return { intent:"if_ambient", slots:{ comparison: "dark", value: getNum() ?? 20 }, raw };
  if (/\b(if it's bright|if bright|when bright|ambient greater)\b/.test(t))
    return { intent:"if_ambient", slots:{ comparison: "bright", value: getNum() ?? 80 }, raw };

  return null;
}

function ChallengeMode({ onBack }) {
  const [challengeIdx, setChallengeIdx]     = useState(0);
  const [commands, setCommands]             = useState([]);
  const [frameIdx, setFrameIdx]             = useState(0);
  const [playing, setPlaying]               = useState(false);
  const [speed]                             = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [inputText, setInputText]           = useState("");
  const [stars, setStars]                   = useState(0);
  const [voiceError, setVoiceError]         = useState("");
  const timerRef = useRef(null);
  const cmdIdRef = useRef(0);

  const challenge = KID_CHALLENGES[challengeIdx];

  const voice = useVoiceInput({
    onResult: useCallback((text) => {
      const ok = parseChallengeCommand(text);
      if (ok) {
        sfx("add");
        setCommands(prev => [...prev, { id: cmdIdRef.current++, ...ok }]);
        setVoiceError("");
      } else {
        sfx("fail");
        setVoiceError(`Hmm, I didn't get "${text}". Try again!`);
        setTimeout(() => setVoiceError(""), 3000);
      }
    }, []),
  });
  const robotConfig = {
    chassisKey: "arm_bot", hasDrive: true, hasArm: true, hasClaw: true,
    color: "#4fc3f7",
    ports: CHASSIS_PRESETS.arm_bot.ports,
  };

  const { frames, trailData } = useMemo(
    () => buildFrames(commands, robotConfig, challenge.obstacles),
    [commands, challengeIdx]
  );
  const frame = frames[frameIdx] ?? frames[frames.length - 1];
  const isDone = frameIdx >= frames.length - 1;

  const goalReached = useMemo(() => {
    if (!isDone || frames.length < 2) return false;
    const last = frames[frames.length - 1];
    const goals = (last.obstacles ?? challenge.obstacles).filter(o => o.type === "goal");
    return goals.some(g => distBetween(last.x, last.y, g.ox ?? g.x, g.oy ?? g.y) < 45);
  }, [isDone, frames, challenge]);

  useEffect(() => {
    if (isDone && goalReached && !showCelebration) {
      setShowCelebration(true);
      setStars(s => s + 1);
      sfx("goal");
    }
  }, [isDone, goalReached]);

  useEffect(() => {
    setFrameIdx(0); setPlaying(false); setShowCelebration(false);
    clearTimeout(timerRef.current);
  }, [commands, challengeIdx]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const tick = useCallback(() => {
    setFrameIdx(prev => {
      const next = prev + 1;
      if (next >= frames.length) { setPlaying(false); return prev; }
      // Play sound effects based on frame label
      const f = frames[next];
      if (f?.label?.startsWith("Moving")) sfx("move");
      else if (f?.label?.startsWith("Turning")) sfx("turn");
      else if (f?.label?.startsWith("Blocked") || f?.label?.startsWith("Turn blocked")) sfx("collision");
      else if (f?.label?.includes("Grabbed") || f?.label?.includes("Lifting")) sfx("grab");
      else if (f?.label?.includes("Released") || f?.label?.includes("Set down")) sfx("release");
      else if (f?.label?.startsWith("Raising") || f?.label?.startsWith("Lowering")) sfx("arm");
      timerRef.current = setTimeout(tick, 1000 / (FPS * speed));
      return next;
    });
  }, [frames.length, speed, frames]);

  const play = useCallback(() => {
    if (commands.length === 0) return;
    if (frameIdx >= frames.length - 1) setFrameIdx(0);
    setPlaying(true);
    setShowCelebration(false);
    sfx("start");
    timerRef.current = setTimeout(tick, 1000 / (FPS * speed));
  }, [frameIdx, frames.length, speed, tick, commands]);

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    setPlaying(false); setFrameIdx(0); setShowCelebration(false);
  }, []);

  const addCommand = useCallback((raw) => {
    const parsed = parseChallengeCommand(raw);
    if (!parsed) return false;
    sfx("add");
    setCommands(prev => [...prev, { id: cmdIdRef.current++, ...parsed }]);
    return true;
  }, []);

  const removeLastCommand = useCallback(() => {
    sfx("remove");
    setCommands(prev => prev.slice(0, -1));
  }, []);

  const clearAll = useCallback(() => {
    sfx("remove");
    setCommands([]);
  }, []);

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    const ok = addCommand(inputText.trim());
    if (!ok) {
      sfx("fail");
    }
    setInputText("");
  };

  const nextChallenge = () => {
    sfx("click");
    setShowCelebration(false);
    setCommands([]);
    setChallengeIdx(i => Math.min(i + 1, KID_CHALLENGES.length - 1));
  };

  const prevChallenge = () => {
    sfx("click");
    setShowCelebration(false);
    setCommands([]);
    setChallengeIdx(i => Math.max(i - 1, 0));
  };

  const intentIcons = {
    move:"🚗", turn:"↩️", stop:"🛑", arm_up:"🦾", arm_down:"🦾",
    claw_close:"🤏", claw_open:"🤏", repeat:"🔁", repeat_forever:"♾️",
    stop_repeat:"⬛", beep:"🔔", say:"💬", light:"💡", light_off:"💡",
    rotate_base:"🔄", run_motor:"⚙️", motor_angle:"📐",
    if_color:"🎨", if_distance:"📡", if_button:"👆", if_force:"⚖️", if_touched:"✋",
    if_reflection:"📊", if_ambient:"🌙",
  };

  const presetColor = "#4fc3f7";

  return (
    <div style={{
      minHeight:"100vh", background:"#060d1a",
      fontFamily:"'Nunito',system-ui,sans-serif", color:"#e0e8f0",
      display:"flex", flexDirection:"column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fredoka+One&family=JetBrains+Mono:wght@500&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        @keyframes celebSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes confetti{0%{opacity:1;transform:translateY(0) rotate(0deg)}100%{opacity:0;transform:translateY(120px) rotate(360deg)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px",
        padding:"12px 20px",
        background:"linear-gradient(180deg, #040a12, #060d1a)",
        borderBottom:"1px solid #0d2035" }}>
        <button onClick={onBack} style={{ background:"#0a1525", border:"1px solid #0d2035",
          borderRadius:"10px", color:"#2a4a6a", padding:"8px 14px",
          cursor:"pointer", fontFamily:"inherit", fontSize:"13px", fontWeight:800 }}>
          ← Menu
        </button>
        <span style={{ fontFamily:"'Fredoka One'", fontSize:"24px",
          background:"linear-gradient(120deg,#4fc3f7,#81c784,#ffb74d)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          codespeak
        </span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"6px",
          background:"#ffb74d18", border:"1px solid #ffb74d44",
          padding:"6px 14px", borderRadius:"12px" }}>
          <span style={{ fontSize:"18px" }}>⭐</span>
          <span style={{ fontSize:"16px", fontWeight:900, color:"#ffb74d" }}>{stars}</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", gap:0, overflow:"hidden" }}>

        {/* Left: commands */}
        <div style={{ width:280, borderRight:"1px solid #0d2035",
          display:"flex", flexDirection:"column", flexShrink:0 }}>

          {/* Challenge info */}
          <div style={{ padding:"16px", borderBottom:"1px solid #0d2035",
            textAlign:"center" }}>
            <div style={{ fontSize:"40px", marginBottom:"6px",
              animation:"bounce 2s ease infinite" }}>{challenge.emoji}</div>
            <div style={{ fontFamily:"'Fredoka One'", fontSize:"20px", color:"#fff",
              marginBottom:"4px" }}>{challenge.title}</div>
            <div style={{ fontSize:"13px", color:"#4fc3f7", fontWeight:700,
              background:"#4fc3f711", padding:"6px 12px", borderRadius:"10px",
              border:"1px solid #4fc3f733" }}>
              {challenge.hint}
            </div>
            <div style={{ display:"flex", gap:"6px", justifyContent:"center", marginTop:"10px" }}>
              <button onClick={prevChallenge} disabled={challengeIdx === 0}
                style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid #0d2035",
                  background:"#0a1525", color: challengeIdx===0 ? "#1e3a5f" : "#4fc3f7",
                  fontSize:"13px", fontWeight:800, cursor: challengeIdx===0 ? "not-allowed" : "pointer",
                  fontFamily:"inherit", opacity: challengeIdx===0 ? 0.4 : 1 }}>
                ← Prev
              </button>
              <span style={{ padding:"6px 10px", fontSize:"12px", fontWeight:800, color:"#1e3a5f" }}>
                {challengeIdx + 1} / {KID_CHALLENGES.length}
              </span>
              <button onClick={nextChallenge} disabled={challengeIdx === KID_CHALLENGES.length - 1}
                style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid #0d2035",
                  background:"#0a1525",
                  color: challengeIdx===KID_CHALLENGES.length-1 ? "#1e3a5f" : "#4fc3f7",
                  fontSize:"13px", fontWeight:800,
                  cursor: challengeIdx===KID_CHALLENGES.length-1 ? "not-allowed" : "pointer",
                  fontFamily:"inherit",
                  opacity: challengeIdx===KID_CHALLENGES.length-1 ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          </div>

          {/* My steps */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
            <div style={{ fontSize:"11px", fontWeight:900, color:"#1e3a5f",
              letterSpacing:"2px", textTransform:"uppercase", marginBottom:"10px" }}>
              My Steps {commands.length > 0 && `(${commands.length})`}
            </div>
            {commands.length === 0 && (
              <div style={{ textAlign:"center", padding:"24px 12px", color:"#1e3a5f",
                fontSize:"13px", fontWeight:700 }}>
                Type or say a command below!
              </div>
            )}
            {commands.map((c, i) => (
              <div key={c.id} style={{
                display:"flex", alignItems:"center", gap:"8px",
                padding:"8px 10px", marginBottom:"4px",
                background:"#080f1c", borderRadius:"10px",
                border:"1px solid #0d2035",
                animation:"fadeUp 0.15s ease",
              }}>
                <span style={{ fontSize:"18px" }}>{intentIcons[c.intent] ?? "❓"}</span>
                <span style={{ fontSize:"13px", fontWeight:800, color:"#e0e8f0", flex:1 }}>
                  {c.raw}
                </span>
                <button onClick={() => { sfx("remove"); setCommands(prev => prev.filter(x=>x.id!==c.id)); }}
                  style={{ background:"none", border:"none", color:"#1e3a5f",
                    cursor:"pointer", fontSize:"16px", padding:"0 4px" }}>×</button>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding:"12px", borderTop:"1px solid #0d2035" }}>
            {/* Mic button */}
            {voice.hasSpeech && (
              <button
                onMouseDown={voice.start}
                onMouseUp={voice.stop}
                onTouchStart={voice.start}
                onTouchEnd={voice.stop}
                style={{
                  width:"100%", padding:"14px",
                  background: voice.listening
                    ? "linear-gradient(135deg,#ef5350,#ffb74d)"
                    : "linear-gradient(135deg,#4fc3f7,#81c784)",
                  border:"none", borderRadius:"14px", color: voice.listening ? "#fff" : "#060d1a",
                  fontSize:"17px", fontWeight:900, cursor:"pointer",
                  fontFamily:"inherit", display:"flex", alignItems:"center",
                  justifyContent:"center", gap:"10px",
                  marginBottom:"8px",
                  animation: voice.listening ? "pulse 1s infinite" : "none",
                  transition:"background 0.2s",
                }}>
                <span style={{ fontSize:"22px" }}>{voice.listening ? "🔴" : "🎤"}</span>
                {voice.listening
                  ? (voice.interim || "Listening...")
                  : "Hold to Speak"}
              </button>
            )}

            {voiceError && (
              <div style={{
                padding:"8px 12px", marginBottom:"8px",
                background:"#ef535018", border:"1px solid #ef535044",
                borderRadius:"10px", fontSize:"13px", color:"#ef5350",
                fontWeight:700, textAlign:"center",
              }}>{voiceError}</div>
            )}

            <div style={{ display:"flex", gap:"6px", marginBottom:"8px" }}>
              <input value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Or type a command..."
                style={{
                  flex:1, padding:"10px 14px",
                  background:"#080f1c", border:"2px solid #0d2035",
                  borderRadius:"12px", color:"#fff",
                  fontSize:"14px", fontFamily:"inherit", outline:"none",
                }}/>
              <button onClick={handleSubmit} style={{
                padding:"10px 14px", background:"#0a1525",
                border:"1.5px solid #0d2035", borderRadius:"12px", color:"#4fc3f7",
                fontSize:"13px", fontWeight:900, cursor:"pointer", fontFamily:"inherit",
              }}>Add</button>
            </div>

            {/* Quick commands */}
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
              {["move forward","turn right 90","turn left 90","stop",
                "raise arm","lower arm","close claw","open claw"].map(cmd => (
                <button key={cmd} onClick={() => { addCommand(cmd); }} style={{
                  padding:"5px 10px", background:"#080f1c",
                  border:"1.5px solid #0d2035", borderRadius:"8px",
                  color:"#4fc3f7", fontSize:"11px", fontWeight:800,
                  cursor:"pointer", fontFamily:"inherit", transition:"all 0.1s",
                }}>{cmd}</button>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display:"flex", gap:"6px", marginTop:"10px" }}>
              <button onClick={removeLastCommand} disabled={commands.length===0}
                style={{ flex:1, padding:"10px", background:"#0a1525",
                  border:"1.5px solid #0d2035", borderRadius:"10px",
                  color: commands.length===0 ? "#1e3a5f" : "#ffb74d",
                  fontSize:"13px", fontWeight:800, cursor: commands.length===0 ? "not-allowed" : "pointer",
                  fontFamily:"inherit", opacity: commands.length===0 ? 0.4 : 1 }}>
                ↩ Undo
              </button>
              <button onClick={clearAll} disabled={commands.length===0}
                style={{ flex:1, padding:"10px", background:"#0a1525",
                  border:"1.5px solid #0d2035", borderRadius:"10px",
                  color: commands.length===0 ? "#1e3a5f" : "#ef5350",
                  fontSize:"13px", fontWeight:800, cursor: commands.length===0 ? "not-allowed" : "pointer",
                  fontFamily:"inherit", opacity: commands.length===0 ? 0.4 : 1 }}>
                ✕ Clear
              </button>
            </div>
          </div>
        </div>

        {/* Center: canvas */}
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          padding:"16px", position:"relative" }}>

          <div style={{ position:"absolute", inset:0, opacity:0.02,
            backgroundImage:"linear-gradient(#4fc3f7 1px, transparent 1px), linear-gradient(90deg, #4fc3f7 1px, transparent 1px)",
            backgroundSize:"20px 20px" }}/>

          <div style={{
            boxShadow:`0 0 60px ${presetColor}15`,
            borderRadius:14, overflow:"hidden",
            border:"1px solid #0d2035", position:"relative",
          }}>
            <WorldCanvas frames={frames} frameIdx={frameIdx} robotConfig={robotConfig}
              obstacles={challenge.obstacles} placingObstacle={null} onPlaceObstacle={() => {}}
              trailData={trailData}/>

            {/* Celebration overlay */}
            {showCelebration && (
              <div style={{ position:"absolute", inset:0, display:"flex",
                flexDirection:"column", alignItems:"center", justifyContent:"center",
                background:"rgba(6,13,26,0.8)", zIndex:10 }}>
                <div style={{ fontSize:"64px", animation:"bounce 0.6s ease infinite" }}>🎉</div>
                <div style={{ fontFamily:"'Fredoka One'", fontSize:"32px",
                  color:"#66bb6a", marginTop:"8px" }}>You did it!</div>
                <div style={{ fontSize:"18px", color:"#ffb74d", fontWeight:800,
                  marginTop:"4px" }}>⭐ +1 Star</div>
                {challengeIdx < KID_CHALLENGES.length - 1 && (
                  <button onClick={nextChallenge} style={{
                    marginTop:"16px", padding:"14px 32px",
                    background:"linear-gradient(135deg,#66bb6a,#4fc3f7)",
                    border:"none", borderRadius:"14px", color:"#060d1a",
                    fontSize:"18px", fontWeight:900, cursor:"pointer",
                    fontFamily:"inherit", animation:"pulse 1.5s ease infinite",
                  }}>Next Challenge →</button>
                )}
              </div>
            )}
          </div>

          {/* Status label */}
          <div style={{ marginTop:"12px", textAlign:"center" }}>
            {isDone && !goalReached && commands.length > 0 && (
              <div style={{
                fontSize:"15px", fontWeight:800, color:"#ffb74d",
                background:"#ffb74d18", padding:"8px 20px",
                borderRadius:"14px", border:"1px solid #ffb74d44",
                animation:"shake 0.4s ease",
              }}>
                Almost! Try different commands 💪
              </div>
            )}
            {!isDone && playing && (
              <div style={{ fontSize:"13px", fontWeight:700, color:presetColor,
                background:"#080f1c", padding:"4px 16px", borderRadius:"14px",
                border:"1px solid #0d2035" }}>
                {frame?.label ?? "Running..."}
              </div>
            )}
            {!playing && commands.length > 0 && !isDone && (
              <div style={{ fontSize:"13px", fontWeight:700, color:"#1e3a5f" }}>
                Press the big Play button!
              </div>
            )}
          </div>

          {/* Big play/reset */}
          <div style={{ display:"flex", gap:"10px", marginTop:"12px" }}>
            {!playing && !isDone && (
              <button onClick={play} disabled={commands.length===0}
                style={{
                  padding:"16px 48px", borderRadius:"16px",
                  background: commands.length===0
                    ? "#0a1525"
                    : "linear-gradient(135deg,#4fc3f7,#81c784)",
                  border: commands.length===0 ? "2px solid #0d2035" : "none",
                  color: commands.length===0 ? "#1e3a5f" : "#060d1a",
                  fontSize:"20px", fontWeight:900, cursor: commands.length===0 ? "not-allowed" : "pointer",
                  fontFamily:"inherit",
                  animation: commands.length > 0 ? "pulse 2s ease infinite" : "none",
                  opacity: commands.length===0 ? 0.5 : 1,
                }}>
                ▶ Play!
              </button>
            )}
            {playing && (
              <button onClick={() => { clearTimeout(timerRef.current); setPlaying(false); }}
                style={{
                  padding:"16px 48px", borderRadius:"16px",
                  background:"linear-gradient(135deg,#ef5350,#ffb74d)",
                  border:"none", color:"#060d1a",
                  fontSize:"20px", fontWeight:900, cursor:"pointer", fontFamily:"inherit",
                }}>
                ⏸ Pause
              </button>
            )}
            {(isDone || (!playing && frameIdx > 0)) && (
              <button onClick={reset}
                style={{
                  padding:"16px 32px", borderRadius:"16px",
                  background:"#0a1525", border:"2px solid #0d2035",
                  color:"#4fc3f7",
                  fontSize:"20px", fontWeight:900, cursor:"pointer", fontFamily:"inherit",
                }}>
                ↺ Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phaser Program Selector ─────────────────────────────────────────────────

function PhaserProgramSelect({ onSelect, onBack }) {
  const programs = Object.entries(DEMO_PROGRAMS);

  return (
    <div style={{
      minHeight:"100vh", background:"#060d1a",
      fontFamily:"'Nunito',system-ui,sans-serif", color:"#e0e8f0",
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"32px 16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fredoka+One&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <button onClick={onBack} style={{
        padding:"8px 14px", borderRadius:10,
        background:"#080f1c", border:"1px solid #0d2035",
        color:"#4fc3f7", fontSize:13, fontWeight:800,
        cursor:"pointer", fontFamily:"inherit",
        alignSelf:"flex-start", marginBottom:16,
      }}>← Back to Menu</button>

      <div style={{ fontSize:"36px", marginBottom:8 }}>🎮</div>
      <div style={{
        fontFamily:"'Fredoka One'", fontSize:32,
        background:"linear-gradient(120deg,#4fc3f7,#81c784,#ffb74d)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        marginBottom:4,
      }}>Phaser Playback</div>
      <div style={{ fontSize:13, color:"#1e3a5f", fontWeight:700, marginBottom:32 }}>
        Choose a program to play with the Phaser engine
      </div>

      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:12,
        width:"100%", maxWidth:520, animation:"fadeUp 0.3s ease",
      }}>
        {programs.map(([name, prog]) => (
          <button key={name} onClick={() => onSelect({ name, commands: prog.commands, obstacles: prog.obstacles })}
            style={{
              padding:"16px", borderRadius:14,
              background:"#080f1c", border:"1px solid #112240",
              color:"#e0e8f0", cursor:"pointer", fontFamily:"inherit",
              textAlign:"left", transition:"border-color 0.15s, transform 0.1s",
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor="#4fc3f7"; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor="#112240"; e.currentTarget.style.transform="translateY(0)"; }}
          >
            <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>{name}</div>
            <div style={{ fontSize:11, color:"#1e3a5f", fontWeight:700 }}>
              {prog.commands.length} commands
              {prog.obstacles.length > 0 ? ` · ${prog.obstacles.length} obstacles` : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RobotSimulatorDemo({ onExit }) {
  const [screen, setScreen]           = useState("menu");
  const [robotConfig, setRobotConfig] = useState(null);
  const [phaserProgram, setPhaserProgram] = useState(null); // selected demo for Phaser game
  const phaserGameRef = useRef(null);

  if (screen === "menu") {
    return (
      <div style={{
        minHeight:"100vh", background:"#060d1a",
        fontFamily:"'Nunito',system-ui,sans-serif", color:"#e0e8f0",
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", padding:"32px 16px",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fredoka+One&display=swap');
          *{box-sizing:border-box}
          @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        `}</style>
        <div style={{ fontSize:"72px", marginBottom:"16px",
          animation:"float 3s ease infinite" }}>🤖</div>
        <div style={{ fontFamily:"'Fredoka One'", fontSize:"52px",
          background:"linear-gradient(120deg,#4fc3f7,#81c784,#ffb74d)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          lineHeight:1, marginBottom:"8px" }}>
          codespeak
        </div>
        <div style={{ fontSize:"16px", color:"#1e3a5f", fontWeight:800,
          letterSpacing:"2px", textTransform:"uppercase", marginBottom:"48px" }}>
          talk to your robot
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"14px",
          width:"100%", maxWidth:400, animation:"fadeUp 0.3s ease" }}>
          {/* Back to app */}
          {onExit && (
            <button onClick={onExit}
              style={{
                padding:"10px 16px", borderRadius:"12px",
                background:"#080f1c", border:"1px solid #0d2035",
                color:"#2a4a6a", fontSize:"13px", fontWeight:800,
                cursor:"pointer", fontFamily:"inherit",
                alignSelf:"flex-start", marginBottom:"8px",
              }}>
              ← Back to Code
            </button>
          )}
          {/* Challenge mode — big and inviting */}
          <button onClick={() => { sfx("start"); setScreen("challenge"); }}
            style={{
              padding:"24px", borderRadius:"20px",
              background:"linear-gradient(135deg,#4fc3f7,#81c784)",
              border:"none", color:"#060d1a",
              fontSize:"22px", fontWeight:900, cursor:"pointer",
              fontFamily:"inherit", textAlign:"left",
              display:"flex", alignItems:"center", gap:"16px",
            }}>
            <span style={{ fontSize:"36px" }}>⭐</span>
            <div>
              <div>Play Challenges!</div>
              <div style={{ fontSize:"13px", fontWeight:700, opacity:0.7 }}>
                Guided missions for beginners
              </div>
            </div>
          </button>

          {/* Sandbox mode */}
          <button onClick={() => setScreen("config")}
            style={{
              padding:"20px", borderRadius:"20px",
              background:"#080f1c", border:"2px solid #0d2035",
              color:"#e0e8f0",
              fontSize:"18px", fontWeight:900, cursor:"pointer",
              fontFamily:"inherit", textAlign:"left",
              display:"flex", alignItems:"center", gap:"16px",
              transition:"border-color 0.15s",
            }}>
            <span style={{ fontSize:"28px" }}>🔧</span>
            <div>
              <div>Build &amp; Simulate</div>
              <div style={{ fontSize:"12px", fontWeight:700, color:"#1e3a5f" }}>
                Configure your robot, place obstacles, run programs
              </div>
            </div>
          </button>

          {/* Phaser Robot Game */}
          <button onClick={() => { sfx("start"); setScreen("phaser_game"); }}
            style={{
              padding:"20px", borderRadius:"20px",
              background:"#080f1c", border:"2px solid #1a3a5c",
              color:"#e0e8f0",
              fontSize:"18px", fontWeight:900, cursor:"pointer",
              fontFamily:"inherit", textAlign:"left",
              display:"flex", alignItems:"center", gap:"16px",
              transition:"border-color 0.15s",
            }}>
            <span style={{ fontSize:"28px" }}>🎮</span>
            <div>
              <div>Robot Game</div>
              <div style={{ fontSize:"12px", fontWeight:700, color:"#1e3a5f" }}>
                Drive, build worlds, and solve challenges with Phaser
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (screen === "challenge") {
    return <ChallengeMode onBack={() => setScreen("menu")} />;
  }

  if (screen === "phaser_game") {
    const prog = phaserProgram ? DEMO_PROGRAMS[phaserProgram] : null;
    const phaserCommands = prog ? prog.commands : [];
    const phaserObstacles = prog ? (prog.obstacles || []) : [];
    const phaserRobotConfig = robotConfig
      ? { chassisKey: robotConfig.chassisKey || "rover", color: robotConfig.color || "#4fc3f7" }
      : { chassisKey: "rover", color: "#4fc3f7" };

    return (
      <div style={{ minHeight:"100vh", background:"#060d1a", fontFamily:"'Nunito',system-ui,sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fredoka+One&display=swap');
          *{box-sizing:border-box}
        `}</style>
        <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
          <button onClick={() => { setPhaserProgram(null); setScreen("menu"); }}
            style={{ background:"#080f1c", border:"1px solid #0d2035", color:"#2a4a6a",
              padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:800,
              cursor:"pointer", fontFamily:"inherit" }}>
            ← Back to Menu
          </button>

          {/* Demo program selector */}
          <select
            value={phaserProgram || ""}
            onChange={e => setPhaserProgram(e.target.value || null)}
            style={{
              background:"#0c1a2e", border:"1px solid #1a3a5c", color:"#8ab4f8",
              padding:"6px 10px", borderRadius:8, fontSize:12, fontWeight:800,
              cursor:"pointer", fontFamily:"inherit",
            }}>
            <option value="">-- Select Demo --</option>
            {Object.keys(DEMO_PROGRAMS).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {phaserProgram && (
            <span style={{ fontSize:11, color:"#3a5a7a", fontWeight:700 }}>
              {phaserCommands.length} commands · {phaserObstacles.length} obstacles
            </span>
          )}
        </div>
        <PhaserGame
          ref={phaserGameRef}
          commands={phaserCommands}
          obstacles={phaserObstacles}
          robotConfig={phaserRobotConfig}
          worldSize={400}
          onEvent={(event) => {
            // Forward events to console for debugging
            if (event.type === "ROBOT_GOAL_REACHED") {
              console.log("🏁 Goal reached!");
            }
          }}
        />
      </div>
    );
  }

  if (screen === "config" || !robotConfig) {
    return <RobotConfigurator onComplete={cfg => { setRobotConfig(cfg); setScreen("sim"); }} />;
  }
  return <SimulatorScreen robotConfig={robotConfig} onBack={() => setScreen("config")} />;
}

// ─── Named exports for embedding in other apps ───────────────────────────────

export {
  // Core simulation functions
  buildFrames,
  buildFramesFromPrimitives,
  parseCodeToPrimitives,
  unrollCommands,

  // Rendering components
  WorldCanvas,
  RobotTopDown,
  RobotSideView,
  ObstacleSVG,
  ObstacleToolbar,
  ValidationPanel,

  // Constants
  OBSTACLE_TYPES,
  CHASSIS_PRESETS,
  PORT_ROLES,
  WORLD_PX,
  PX_PER_M,
  FPS,

  // Utilities
  parseChallengeCommand,
};