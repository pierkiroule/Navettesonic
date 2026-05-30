import { updateSnakeFishToTarget, createInitialSpine } from "./fishSnakeMotion.js";
import { clampToCircle } from "./geometry.js";
import { getCircuitSpeedValue, smoothLoopPoint } from "./traceCircuit.js";
import { getFishNavigableRadius, MEMBRANE_LEVEL_MULTIPLIERS } from "./constants.js";
import { getArenaIdForLevel, getArenaLevelFromId, getDestinationEntryHint, getPortalArrivalPosition, getPortalOpeningAngle, getPortalOpeningHalfSpan, resolveMembraneContact } from "./labybulleWorld.js";
import { DEFAULT_FISH_NAV_RADIUS, MAX_ARENA_LEVEL, DEFAULT_ARENA_RADIUS, labybulleWorld } from "../store/soonInitialState.js";
import { clampDepth, pushBubblesFromFish, separateBubblesByDepth } from "./fishBubblePhysics.js";
import { getBlobRadiusAtAngle, updateBlobPhysics } from "./blobArena.js";

export const FISH_CONTROL_TUNING={
  autopilot:{mouthOffset:32,maxSpeedFactor:1.05,accel:0.16,arrivalRadius:180,stopRadius:10},
  touch:{mouthOffset:24,maxSpeedFactor:1.2,accel:0.22,arrivalRadius:220,stopRadius:8},
  freeSwim:{mouthOffset:34,maxSpeedFactor:0.96,accel:0.09,arrivalRadius:360,stopRadius:18},
};
const FISH_MEMBRANE_PADDING = 86;
const BUBBLE_MEMBRANE_MARGIN = 20;
export const angleDistance=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const lerpAngle=(c,t,a)=>{let d=t-c;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return c+d*a;};
export const isNearOpening=(angle,openingAngle,openingHalfSpan)=>Number.isFinite(openingAngle)&&Math.abs(angleDistance(angle,openingAngle))<=openingHalfSpan;
export const getRuntimeFishNavRadius=(arenaRadius)=>Number.isFinite(arenaRadius)&&arenaRadius>0?getFishNavigableRadius(arenaRadius):DEFAULT_FISH_NAV_RADIUS;
export const getFishMovementRadius=(arenaRadius)=>getRuntimeFishNavRadius(arenaRadius);
export const getMembraneRadiusForLevel=(arenaRadius,arenaLevel=0)=>{const base=getRuntimeFishNavRadius(arenaRadius);const level=Math.max(0,Math.min(MAX_ARENA_LEVEL,Number.isFinite(arenaLevel)?arenaLevel:0));const mul=MEMBRANE_LEVEL_MULTIPLIERS[level]??MEMBRANE_LEVEL_MULTIPLIERS[0];return base*mul;};


const ARENA_TRANSITION_COOLDOWN_MS = 220;
const ARENA_PASSAGE_OPEN_MS = 1400;
const RESONANT_RIPPLE_MAX_FORCE = 0.18;
const FREE_SWIM_FLOW_MIN_MS = 9000;
const FREE_SWIM_FLOW_MAX_MS = 18000;
const FREE_SWIM_MIN_RADIUS_RATIO = 0.3;
const FREE_SWIM_EDGE_RADIUS_RATIO = 0.84;

function getNow() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function normalizeVector(x, y, fallbackAngle = -Math.PI / 2) {
  const d = Math.hypot(x, y);
  if (d > 0.0001) return { x: x / d, y: y / d };
  return { x: Math.cos(fallbackAngle), y: Math.sin(fallbackAngle) };
}

function getFishHeading(fish = {}) {
  const speed = Math.hypot(fish.vx || 0, fish.vy || 0);
  if (speed > 0.08) return Math.atan2(fish.vy || 0, fish.vx || 0);
  return Number.isFinite(fish.angle) ? fish.angle : -Math.PI / 2;
}

function getReadableStars(echostory = {}) {
  return (echostory.stars || []).filter((star) => (
    star &&
    !star.expired &&
    !star.expiring &&
    Number.isFinite(star.x) &&
    Number.isFinite(star.y)
  ));
}

function pickFreeSwimStar(stars = []) {
  if (!stars.length) return null;
  const unread = stars.filter((star) => !star.previewPlayed && !star.previewPlaying);
  const source = unread.length ? unread : stars;
  return source[Math.floor(Math.random() * source.length)] || null;
}

function clampFreeSwimTarget(point, navRadius) {
  const safeRadius = Math.max(120, navRadius);
  const d = Math.hypot(point.x, point.y);
  if (d <= safeRadius) return point;
  const clamped = clampToCircle(point, safeRadius);
  return { x: clamped.x, y: clamped.y };
}

function createFreeSwimFlow(state, arenaRadius, now) {
  const navRadius = Math.max(180, getFishMovementRadius(arenaRadius) - FISH_MEMBRANE_PADDING);
  const fish = state.fish || {};
  const stars = getReadableStars(state.echostory);
  const focus = Math.random() < 0.45 ? pickFreeSwimStar(stars) : null;
  const centerDistance = Math.hypot(fish.x || 0, fish.y || 0);
  const isCentered = centerDistance < navRadius * FREE_SWIM_MIN_RADIUS_RATIO * 0.75;
  const direction = Math.random() < 0.5 ? -1 : 1;
  const mode = focus ? "star" : (isCentered ? "outward" : (Math.random() < 0.56 ? "orbit" : "drift"));

  return {
    kind: "flow",
    mode,
    bornAt: now,
    duration: FREE_SWIM_FLOW_MIN_MS + Math.random() * (FREE_SWIM_FLOW_MAX_MS - FREE_SWIM_FLOW_MIN_MS),
    direction,
    phase: Math.random() * Math.PI * 2,
    preferredRadius: navRadius * (0.42 + Math.random() * 0.28),
    focusId: focus?.id || null,
    focusX: focus ? focus.x : null,
    focusY: focus ? focus.y : null,
    x: Number.isFinite(fish.targetX) ? fish.targetX : 0,
    y: Number.isFinite(fish.targetY) ? fish.targetY : 0,
  };
}

function resolveFreeSwimTarget(state, arenaRadius, now) {
  const fish = state.fish || {};
  const navRadius = Math.max(180, getFishMovementRadius(arenaRadius) - FISH_MEMBRANE_PADDING);
  const current = fish.freeSwimTarget || null;
  const expired = current && now - (current.bornAt || 0) >= (current.duration || FREE_SWIM_FLOW_MIN_MS);
  const needsFlow = !current || current.kind !== "flow" || expired;
  const flow = needsFlow ? createFreeSwimFlow(state, arenaRadius, now) : current;

  const x = Number.isFinite(fish.x) ? fish.x : 0;
  const y = Number.isFinite(fish.y) ? fish.y : 0;
  const heading = getFishHeading(fish);
  const centerDistance = Math.hypot(x, y);
  const minRadius = navRadius * FREE_SWIM_MIN_RADIUS_RATIO;
  const edgeRadius = navRadius * FREE_SWIM_EDGE_RADIUS_RATIO;
  const radial = centerDistance > 0.0001
    ? { x: x / centerDistance, y: y / centerDistance }
    : { x: Math.cos(heading), y: Math.sin(heading) };
  const tangent = { x: -radial.y * flow.direction, y: radial.x * flow.direction };

  let desiredX = tangent.x * 0.82;
  let desiredY = tangent.y * 0.82;

  if (centerDistance < minRadius) {
    const outward = 1.35 - clamp01(centerDistance / Math.max(1, minRadius));
    desiredX = radial.x * (1.05 + outward) + tangent.x * 0.34;
    desiredY = radial.y * (1.05 + outward) + tangent.y * 0.34;
  } else if (centerDistance > edgeRadius) {
    const inward = clamp01((centerDistance - edgeRadius) / Math.max(1, navRadius - edgeRadius));
    desiredX += -radial.x * (0.65 + inward * 1.25);
    desiredY += -radial.y * (0.65 + inward * 1.25);
  } else if (flow.mode === "star" && Number.isFinite(flow.focusX) && Number.isFinite(flow.focusY)) {
    const toStar = normalizeVector(flow.focusX - x, flow.focusY - y, heading);
    desiredX += toStar.x * 0.46;
    desiredY += toStar.y * 0.46;
  } else if (flow.mode === "drift") {
    desiredX += Math.cos(heading) * 0.5;
    desiredY += Math.sin(heading) * 0.5;
  } else {
    const radiusError = (flow.preferredRadius - centerDistance) / Math.max(1, navRadius);
    desiredX += radial.x * Math.max(-0.55, Math.min(0.55, radiusError * 1.8));
    desiredY += radial.y * Math.max(-0.55, Math.min(0.55, radiusError * 1.8));
  }

  const desired = normalizeVector(desiredX, desiredY, heading);
  const progress = clamp01((now - flow.bornAt) / Math.max(1, flow.duration || FREE_SWIM_FLOW_MIN_MS));
  const breath = 0.76 + Math.sin(progress * Math.PI * 2 + (flow.phase || 0)) * 0.14;
  const speedScale = Math.max(0.56, Math.min(0.98, breath));
  const lookahead = centerDistance < minRadius
    ? navRadius * 0.46
    : navRadius * (0.22 + speedScale * 0.08);
  const target = clampFreeSwimTarget({ x: x + desired.x * lookahead, y: y + desired.y * lookahead }, navRadius);

  return {
    ...flow,
    x: target.x,
    y: target.y,
    speedScale,
    progress,
  };
}

export function updateResonantRipples(ripples = [], fish = {}, now = getNow()) {
  const nextRipples = [];
  let forceX = 0;
  let forceY = 0;

  ripples.forEach((ripple) => {
    if (!ripple || !Number.isFinite(ripple.x) || !Number.isFinite(ripple.y)) return;
    const bornAt = Number.isFinite(ripple.bornAt) ? ripple.bornAt : now;
    const life = Number.isFinite(ripple.life) ? ripple.life : 1700;
    const age = Math.max(0, now - bornAt);
    if (age > life) return;

    const speed = Number.isFinite(ripple.speed) ? ripple.speed : 0.58;
    const radius = age * speed;
    const dx = (fish.x || 0) - ripple.x;
    const dy = (fish.y || 0) - ripple.y;
    const dist = Math.hypot(dx, dy);
    const band = 72;
    const front = 1 - Math.min(1, Math.abs(dist - radius) / band);
    const fade = 1 - age / life;
    const amplitude = Math.max(0, front) * Math.max(0, fade) * (Number.isFinite(ripple.strength) ? ripple.strength : 1);

    if (amplitude > 0 && dist > 0.0001) {
      const ux = dx / dist;
      const uy = dy / dist;
      const swirl = Math.sin((age / Math.max(1, life)) * Math.PI * 2 + (ripple.x + ripple.y) * 0.01) * 0.55;
      forceX += (ux + -uy * swirl) * amplitude * RESONANT_RIPPLE_MAX_FORCE;
      forceY += (uy + ux * swirl) * amplitude * RESONANT_RIPPLE_MAX_FORCE;
    }

    nextRipples.push({ ...ripple, age, radius });
  });

  return { ripples: nextRipples, forceX, forceY };
}

export function shouldTraverseOpenPassage({
  radialDistance,
  radialDot,
  radialAngle,
  outerNavRadius,
  innerNavRadius,
  activePortal,
  activePortalAligned,
  inwardPortal,
  breachOpen,
  breachAngle,
  breachExpiresAt,
  now,
}) {
  const nearOuter = Math.abs(radialDistance - outerNavRadius) <= 120;
  const nearInner = innerNavRadius > 0 && Math.abs(radialDistance - innerNavRadius) <= 120;
  const openWindowActive = breachOpen && Number.isFinite(breachExpiresAt) && now < breachExpiresAt;
  const outwardThreshold = openWindowActive ? 0.02 : 0.1;
  const inwardThreshold = -0.1;

  if (nearOuter && activePortal && activePortalAligned && radialDot > outwardThreshold) {
    return { portal: activePortal, direction: "out" };
  }
  if (nearInner && inwardPortal && radialDot < inwardThreshold) {
    return { portal: inwardPortal, direction: "in" };
  }
  if (openWindowActive && nearOuter && activePortal && activePortalAligned && Number.isFinite(breachAngle) && isNearOpening(radialAngle, breachAngle, getPortalOpeningHalfSpan({ radius: outerNavRadius }) * 1.9) && radialDot > 0.01) {
    return { portal: activePortal, direction: "out" };
  }
  return null;
}

function buildArenaTransitionPatch({
  state,
  activeWorld,
  runtimeArenaId,
  nextArenaId,
  radialAngle,
  nextVx,
  nextVy,
  fishDepth,
  arenaRadius,
  wallHitCount,
  lastWallHitAt,
  circuitAutopilot,
  circuitSegmentIndex,
  circuitSegmentT,
  fallbackExitHint = null,
  inwardOffset = 84,
}) {
  const nextLevel = Math.max(0, Math.min(MAX_ARENA_LEVEL, getArenaLevelFromId(nextArenaId)));
  const destinationEntryHint = getDestinationEntryHint({
    world: activeWorld,
    fromArenaId: runtimeArenaId,
    toArenaId: nextArenaId,
    fallbackExitHint,
  });
  const arrival = getPortalArrivalPosition({
    world: activeWorld,
    fromArenaId: runtimeArenaId,
    toArenaId: nextArenaId,
    radius: getMembraneRadiusForLevel(arenaRadius, nextLevel),
    inwardOffset,
    entryPositionHint: destinationEntryHint,
  });
  const nextFishX = arrival.x;
  const nextFishY = arrival.y;
  const transitionAt = performance.now();
  const settleStep = 10;
  const settledTargetX = nextFishX + Math.cos(radialAngle) * settleStep;
  const settledTargetY = nextFishY + Math.sin(radialAngle) * settleStep;
  const returnOpeningAngle = getPortalOpeningAngle(activeWorld, nextArenaId, runtimeArenaId);
  return {
    circuitAutopilot,
    circuitSegmentIndex,
    circuitSegmentT,
    // Important: ne pas pousser/résoudre les bulles sur la frame de transition
    // d'arène pour éviter l'émergence brusque d'une bulle (ex: "Drill") dans le passage.
    bubbles: state.bubbles,
    currentArenaId: nextArenaId,
    fish: { ...state.fish, x: nextFishX, y: nextFishY, vx: nextVx * 0.25, vy: nextVy * 0.25, targetX: settledTargetX, targetY: settledTargetY, arenaRadius, arenaLevel: nextLevel, membraneSide: "inside", wallHitCount, lastWallHitAt, lastArenaTransitionAt: transitionAt, arenaTransitionCooldownUntil: transitionAt + ARENA_TRANSITION_COOLDOWN_MS, previousArenaId: runtimeArenaId, breachOpen: Number.isFinite(returnOpeningAngle), breachAngle: Number.isFinite(returnOpeningAngle) ? returnOpeningAngle : null, breachOpenedAt: transitionAt, breachState: Number.isFinite(returnOpeningAngle) ? "open" : "closed", breachExpiresAt: transitionAt + ARENA_PASSAGE_OPEN_MS, breachUsed: false, hasQuill: Boolean(state.fish.hasQuill) },
  };
}

export function tickFishEngine(state,{swimSpeed=1,arenaRadius=DEFAULT_ARENA_RADIUS}={}) { /* trimmed by keeping exact logic moved */
  const arenaBlob = state.arenaBlob || null;
  if (arenaBlob) updateBlobPhysics(arenaBlob);
  const clampEntityInsideBlob = (entity, padding = 0) => {
    if (!arenaBlob || !entity) return entity;
    const ex = Number.isFinite(entity.x) ? entity.x : 0;
    const ey = Number.isFinite(entity.y) ? entity.y : 0;
    const a = Math.atan2(ey, ex);
    const boundary = getBlobRadiusAtAngle(arenaBlob, a);
    const safe = Math.max(16, boundary - Math.max(0, padding));
    const d = Math.hypot(ex, ey);
    if (d <= safe) return entity;
    const clamped = clampToCircle({ x: ex, y: ey }, safe);
    return { ...entity, x: clamped.x, y: clamped.y };
  };
  const clampBubblesInsideBlob = (bubbles = []) =>
    bubbles.map((bubble) => {
      const bubbleRadius = Math.max(24, Number.isFinite(bubble?.r) ? bubble.r : 70);
      return clampEntityInsideBlob(bubble, bubbleRadius + BUBBLE_MEMBRANE_MARGIN);
    });
  const ensureInsideBlob = (fishLike) => {
    if (!arenaBlob) return fishLike;
    const fx = Number.isFinite(fishLike?.x) ? fishLike.x : 0;
    const fy = Number.isFinite(fishLike?.y) ? fishLike.y : 0;
    const a = Math.atan2(fy, fx);
    const r = getBlobRadiusAtAngle(arenaBlob, a);
    const safe = Math.max(26, r - FISH_MEMBRANE_PADDING);
    const d = Math.hypot(fx, fy);
    if (d <= safe) return fishLike;
    const c = clampToCircle({ x: fx, y: fy }, safe);
    return { ...fishLike, x: c.x, y: c.y, targetX: c.x, targetY: c.y };
  };
  if (state.gamePaused) {
    const safeFish = ensureInsideBlob(state.fish);
    return {
      fish: {
        ...safeFish,
        vx: (safeFish.vx || 0) * 0.7,
        vy: (safeFish.vy || 0) * 0.7,
      },
      arenaBlob,
    };
  }
  const fish = state.fish; let fishNavRadius=getFishMovementRadius(arenaRadius);
  if (state.fishTrail?.length) { const result=updateSnakeFishToTarget({fish:{...state.fish,spine:state.fish.spine||createInitialSpine(state.fish.x||0,state.fish.y||0)},trail:state.fishTrail,arenaRadius:fishNavRadius,swimSpeed}); return { fish:result.fish, fishTrail:result.trail, bubbles:separateBubblesByDepth(pushBubblesFromFish(state.bubbles,result.fish,result.fish.depth))}; }
  const now = getNow();
  const resonance = updateResonantRipples(state.resonantRipples || [], state.fish, now);
  let targetX=state.fish.targetX,targetY=state.fish.targetY,fishDepth=clampDepth(state.fish.depth||1),circuitSegmentIndex=state.circuitSegmentIndex||0,circuitSegmentT=state.circuitSegmentT||0; const circuitAutopilot=Boolean(state.circuitAutopilot);
  let freeSwimTarget = state.fish.freeSwimTarget || null;
  const shouldFreeSwim = !circuitAutopilot && (state.mode === "echostory" || state.mode === "reso") && !state.contourRide?.active;
  if (circuitAutopilot && state.traceCircuit?.length>1){const currentBeacon=state.traceCircuit[circuitSegmentIndex%state.traceCircuit.length]; const speedStep=getCircuitSpeedValue(currentBeacon?.speed||2)*Math.max(0,swimSpeed); circuitSegmentT+=speedStep; while(circuitSegmentT>=1){circuitSegmentT-=1;circuitSegmentIndex=(circuitSegmentIndex+1)%state.traceCircuit.length;} const p=smoothLoopPoint(state.traceCircuit,circuitSegmentIndex,circuitSegmentT); targetX=p.x; targetY=p.y; fishDepth=clampDepth(p.depth||fishDepth);}
  else if (shouldFreeSwim) {freeSwimTarget = resolveFreeSwimTarget(state, arenaRadius, now); targetX = freeSwimTarget.x + resonance.forceX * 240; targetY = freeSwimTarget.y + resonance.forceY * 240;}
  const currentAngle=Number.isFinite(state.fish.angle)?state.fish.angle:-Math.PI/2; const control=circuitAutopilot?FISH_CONTROL_TUNING.autopilot:(shouldFreeSwim?FISH_CONTROL_TUNING.freeSwim:FISH_CONTROL_TUNING.touch); const mouthX=state.fish.x+Math.cos(currentAngle)*control.mouthOffset, mouthY=state.fish.y+Math.sin(currentAngle)*control.mouthOffset; const pullX=targetX-mouthX,pullY=targetY-mouthY,pullDistance=Math.hypot(pullX,pullY); const pullNorm=Math.min(1,pullDistance/Math.max(1,control.arrivalRadius)); const freeSwimSpeedScale=shouldFreeSwim&&Number.isFinite(freeSwimTarget?.speedScale)?freeSwimTarget.speedScale:1; const speedLimit=(state.fish.maxSpeed||3.1)*control.maxSpeedFactor*freeSwimSpeedScale*Math.max(0,swimSpeed); const desiredSpeed=pullDistance<=control.stopRadius?0:Math.min(speedLimit,speedLimit*pullNorm); const dirX=pullDistance>0.0001?pullX/pullDistance:0,dirY=pullDistance>0.0001?pullY/pullDistance:0; const vx=state.fish.vx+((dirX*desiredSpeed)-state.fish.vx)*control.accel+resonance.forceX, vy=state.fish.vy+((dirY*desiredSpeed)-state.fish.vy)*control.accel+resonance.forceY; const speedRaw=Math.hypot(vx,vy); const resonanceSpeedLimit=speedLimit+Math.hypot(resonance.forceX,resonance.forceY); const limitedVx=speedRaw>resonanceSpeedLimit?(vx/speedRaw)*resonanceSpeedLimit:vx,limitedVy=speedRaw>resonanceSpeedLimit?(vy/speedRaw)*resonanceSpeedLimit:vy;
  if (arenaBlob) {
    let nextFishX = state.fish.x + limitedVx;
    let nextFishY = state.fish.y + limitedVy;
    const radialAngle = Math.atan2(nextFishY, nextFishX);
    const localRadius = getBlobRadiusAtAngle(arenaBlob, radialAngle);
    const fishRadius = FISH_MEMBRANE_PADDING;
    const maxDistance = Math.max(40, localRadius - fishRadius);
    const rawDistance = Math.hypot(nextFishX, nextFishY);
    if (rawDistance >= maxDistance) {
      const clamped = clampToCircle({ x: nextFishX, y: nextFishY }, maxDistance);
      nextFishX = clamped.x;
      nextFishY = clamped.y;
      const wasPendingAtSameAngle =
        Boolean(state.pendingBlobAction) &&
        Math.abs(angleDistance(state.pendingBlobAction.angle || 0, radialAngle)) < 0.08;
      if (wasPendingAtSameAngle) {
        return {
          arenaBlob,
          fish: { ...state.fish, x: nextFishX, y: nextFishY, vx: limitedVx * 0.08, vy: limitedVy * 0.08, targetX: nextFishX, targetY: nextFishY, freeSwimTarget: shouldFreeSwim ? freeSwimTarget : null },
          resonantRipples: resonance.ripples,
          bubbles: clampBubblesInsideBlob(separateBubblesByDepth(pushBubblesFromFish(state.bubbles,{x:nextFishX,y:nextFishY},fishDepth))),
        };
      }
      return {
        arenaBlob,
        gamePaused: true,
        pendingBlobAction: { angle: radialAngle, worldX: nextFishX, worldY: nextFishY },
        fish: { ...state.fish, x: nextFishX, y: nextFishY, vx: limitedVx * 0.16, vy: limitedVy * 0.16, targetX: nextFishX, targetY: nextFishY, freeSwimTarget: shouldFreeSwim ? freeSwimTarget : null },
        resonantRipples: resonance.ripples,
      };
    }
    const speed=Math.hypot(limitedVx,limitedVy),moveAngle=speed>0.035?Math.atan2(limitedVy,limitedVx):currentAngle,angleEase=shouldFreeSwim?0.04+Math.min(0.035,speed*0.004):0.055+Math.min(0.055,speed*0.006),angle=speed>0.035?lerpAngle(currentAngle,moveAngle,angleEase):currentAngle;
    const turnStrengthSigned=Math.max(-1,Math.min(1,((()=>{let d=moveAngle-currentAngle;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;})())/1.15)); const nextMouthPull=(state.fish.mouthPull||0)+(pullNorm-(state.fish.mouthPull||0))*0.12; const targetTurnVelocity=turnStrengthSigned*(0.55+Math.min(0.45,speed*0.08)); const nextTurnVelocity=(state.fish.turnVelocity||0)+(targetTurnVelocity-(state.fish.turnVelocity||0))*0.18; const nextTurnAmount=(state.fish.turnAmount||0)+(nextTurnVelocity-(state.fish.turnAmount||0))*0.16;
    return { arenaBlob, resonantRipples: resonance.ripples, fish:{...state.fish,x:nextFishX,y:nextFishY,vx:limitedVx,vy:limitedVy,targetX,targetY,freeSwimTarget: shouldFreeSwim ? freeSwimTarget : null,angle,swimPhase:(state.fish.swimPhase||0)+0.045+Math.min(0.16,speed*0.011)+nextTurnAmount*0.025,depth:clampDepth(fishDepth),mouthPull:nextMouthPull,turnAmount:nextTurnAmount,turnVelocity:nextTurnVelocity,maxSpeed:state.fish.maxSpeed||3.1,arenaRadius,membraneSide:"inside"}, bubbles:clampBubblesInsideBlob(separateBubblesByDepth(pushBubblesFromFish(state.bubbles,{x:nextFishX,y:nextFishY},fishDepth))) };
  }
  const arenaLevel=Math.max(0,Math.min(MAX_ARENA_LEVEL,Number.isFinite(state.fish.arenaLevel)?state.fish.arenaLevel:0)); const outerNavRadius=getMembraneRadiusForLevel(arenaRadius,arenaLevel); const innerNavRadius=arenaLevel>0?getMembraneRadiusForLevel(arenaRadius,arenaLevel-1):0;
  let nextFishX=state.fish.x+limitedVx,nextFishY=state.fish.y+limitedVy,nextVx=limitedVx,nextVy=limitedVy; let wallHitCount=state.fish.wallHitCount||0,lastWallHitAt=state.fish.lastWallHitAt||0; const hitDelayPassed=now-lastWallHitAt>450;
  const rawDistance=Math.hypot(nextFishX,nextFishY); const rawAngle=Math.atan2(nextFishY,nextFishX); const localOuterRadius=arenaBlob?getBlobRadiusAtAngle(arenaBlob,rawAngle):outerNavRadius; const hitOuterBoundary=rawDistance>localOuterRadius; if(hitOuterBoundary){const sc=clampToCircle({x:nextFishX,y:nextFishY},Math.max(40,localOuterRadius));nextFishX=sc.x;nextFishY=sc.y;if(rawDistance>localOuterRadius+0.5&&hitDelayPassed){wallHitCount=Math.min(3,wallHitCount+1);lastWallHitAt=now;}} else if(innerNavRadius>0&&rawDistance<innerNavRadius){const d=rawDistance||0.0001; nextFishX=(nextFishX/d)*(innerNavRadius+2); nextFishY=(nextFishY/d)*(innerNavRadius+2); if(hitDelayPassed){wallHitCount=Math.min(3,wallHitCount+1);lastWallHitAt=now;}}
  const radialDistance=Math.hypot(nextFishX,nextFishY), radialAngle=Math.atan2(nextFishY,nextFishX), radialX=Math.cos(radialAngle), radialY=Math.sin(radialAngle), radialDot=(radialX*nextVx+radialY*nextVy)/(Math.hypot(nextVx,nextVy)||0.0001); const activeWorld=state.worldGraph||labybulleWorld; const runtimeArenaId=state.currentArenaId||getArenaIdForLevel(arenaLevel); const outerHalfSpan=getPortalOpeningHalfSpan({radius:outerNavRadius}); const innerHalfSpan=innerNavRadius>0?getPortalOpeningHalfSpan({radius:innerNavRadius}):0;
  const localRadiusAtFish = arenaBlob ? getBlobRadiusAtAngle(arenaBlob, radialAngle) : outerNavRadius;
  const transitionCooldownUntil = Number.isFinite(state?.fish?.arenaTransitionCooldownUntil) ? state.fish.arenaTransitionCooldownUntil : 0;
  const availablePortals=(activeWorld?.portals||[]).filter((p)=>p.fromArenaId===runtimeArenaId);
  const previousArenaId = state.fish?.previousArenaId || null;
  const isImmediateReturnBlocked = (nextArenaId) => {
    if (!nextArenaId) return false;
    if (!(now < transitionCooldownUntil)) return false;
    if (!(Boolean(previousArenaId) && nextArenaId === previousArenaId)) return false;
    const speedNow = Math.hypot(nextVx, nextVy);
    const explicitOpenBreachReturn =
      Boolean(state.fish?.breachOpen) &&
      Number.isFinite(state.fish?.breachExpiresAt) &&
      now < state.fish.breachExpiresAt &&
      speedNow >= 0.28;
    return !explicitOpenBreachReturn;
  };
  const blockImmediateReturn = now < transitionCooldownUntil && previousArenaId;
  const filteredPortals = blockImmediateReturn ? availablePortals.filter((p) => p.toArenaId !== previousArenaId) : availablePortals;
  let activePortal=filteredPortals.find((p)=>isNearOpening(radialAngle,getPortalOpeningAngle(activeWorld,p.fromArenaId,p.toArenaId),outerHalfSpan))||null;
  const breachOpen = Boolean(state.fish?.breachOpen) && Number.isFinite(state.fish?.breachAngle) && Number.isFinite(state.fish?.breachExpiresAt) && now < state.fish.breachExpiresAt;
  if (!activePortal && breachOpen) {
    const breachHalfSpan = outerHalfSpan * 1.9;
    activePortal = availablePortals.find((p) => isNearOpening(state.fish.breachAngle, getPortalOpeningAngle(activeWorld, p.fromArenaId, p.toArenaId), breachHalfSpan)) || activePortal;
  }
  const activePortalAligned = Boolean(activePortal) && isNearOpening(radialAngle, getPortalOpeningAngle(activeWorld, activePortal.fromArenaId, activePortal.toArenaId), outerHalfSpan * (breachOpen ? 1.9 : 1));

  const inwardPortal=innerNavRadius>0?filteredPortals.find((p)=>isNearOpening(radialAngle,getPortalOpeningAngle(activeWorld,p.fromArenaId,p.toArenaId),innerHalfSpan))||null:null;
  const nearOuter=Math.abs(radialDistance-localRadiusAtFish)<=120, nearInner=innerNavRadius>0&&Math.abs(radialDistance-innerNavRadius)<=120, nearOut=Boolean(activePortalAligned), nearIn=Boolean(inwardPortal);
  const pushingOutward=radialDot>0.02;
  const canUseOpenPassage = breachOpen && nearOut && Math.hypot(nextVx, nextVy) >= 0.18;
  const transitionLocked = now < transitionCooldownUntil && !canUseOpenPassage;
  const traverseOpenPassage = shouldTraverseOpenPassage({
    radialDistance,
    radialDot,
    radialAngle,
    outerNavRadius,
    innerNavRadius,
    activePortal,
    activePortalAligned,
    inwardPortal,
    breachOpen,
    breachAngle: state.fish?.breachAngle,
    breachExpiresAt: state.fish?.breachExpiresAt,
    now,
  });
  if (!transitionLocked && traverseOpenPassage?.portal?.toArenaId && !isImmediateReturnBlocked(traverseOpenPassage.portal.toArenaId)) {
    return buildArenaTransitionPatch({
      state,
      activeWorld,
      runtimeArenaId,
      nextArenaId: traverseOpenPassage.portal.toArenaId,
      radialAngle: traverseOpenPassage.direction === "in" ? radialAngle + Math.PI : radialAngle,
      nextVx,
      nextVy,
      fishDepth,
      arenaRadius,
      wallHitCount,
      lastWallHitAt,
      circuitAutopilot,
      circuitSegmentIndex,
      circuitSegmentT,
      fallbackExitHint: traverseOpenPassage.portal.positionHint || null,
      inwardOffset: 84,
    });
  }
  const shouldResolveMembraneContact=(hitOuterBoundary||nearOuter||radialDistance>=localRadiusAtFish-8)&&!transitionLocked; const membraneContact=shouldResolveMembraneContact?resolveMembraneContact({world:activeWorld,arenaId:runtimeArenaId,x:nextFishX,y:nextFishY,radius:outerNavRadius,angularToleranceDeg:20}):null;
  const contactPortal=membraneContact?.action==="transition"?membraneContact?.portal||null:null;

  // Priorité absolue: si le contact membrane résout une transition, on traverse
  // immédiatement (évite les boucles de rejet/glisse au bord).
  if (contactPortal?.toArenaId && !isImmediateReturnBlocked(contactPortal.toArenaId)) {
    return buildArenaTransitionPatch({
      state,
      activeWorld,
      runtimeArenaId,
      nextArenaId: contactPortal.toArenaId,
      radialAngle,
      nextVx,
      nextVy,
      fishDepth,
      arenaRadius,
      wallHitCount,
      lastWallHitAt,
      circuitAutopilot,
      circuitSegmentIndex,
      circuitSegmentT,
      fallbackExitHint: contactPortal.positionHint || null,
      inwardOffset: 84,
    });
  }

  if (nearOuter && !nearOut && pushingOutward) {
    const tx = -radialY;
    const ty = radialX;
    const ts = nextVx * tx + nextVy * ty;
    nextVx = tx * ts;
    nextVy = ty * ts;
    const c = clampToCircle({ x: nextFishX, y: nextFishY }, outerNavRadius - 4);
    nextFishX = c.x;
    nextFishY = c.y;
  }
  if (nearInner && !nearIn && radialDot < -0.02) {
    const tx = -radialY;
    const ty = radialX;
    const ts = nextVx * tx + nextVy * ty;
    nextVx = tx * ts;
    nextVy = ty * ts;
    const d = Math.hypot(nextFishX, nextFishY) || 0.0001;
    nextFishX = (nextFishX / d) * (innerNavRadius + 4);
    nextFishY = (nextFishY / d) * (innerNavRadius + 4);
  }

  const outwardThreshold = canUseOpenPassage ? 0.02 : 0.1;
  const canTransitionOutward=!transitionLocked&&nearOuter&&activePortal&&nearOut&&radialDot>outwardThreshold&&!isImmediateReturnBlocked(activePortal?.toArenaId);
  if (canTransitionOutward) {
    return buildArenaTransitionPatch({
      state,
      activeWorld,
      runtimeArenaId,
      nextArenaId: activePortal.toArenaId || runtimeArenaId,
      radialAngle,
      nextVx,
      nextVy,
      fishDepth,
      arenaRadius,
      wallHitCount,
      lastWallHitAt,
      circuitAutopilot,
      circuitSegmentIndex,
      circuitSegmentT,
      fallbackExitHint: activePortal.positionHint || null,
      inwardOffset: 84,
    });
  }

  if (!transitionLocked && nearInner && nearIn && radialDot < -0.1 && inwardPortal && !isImmediateReturnBlocked(inwardPortal.toArenaId)) {
    return buildArenaTransitionPatch({
      state,
      activeWorld,
      runtimeArenaId,
      nextArenaId: inwardPortal.toArenaId,
      radialAngle: radialAngle + Math.PI,
      nextVx,
      nextVy,
      fishDepth,
      arenaRadius,
      wallHitCount,
      lastWallHitAt,
      circuitAutopilot,
      circuitSegmentIndex,
      circuitSegmentT,
      fallbackExitHint: inwardPortal.positionHint || null,
      inwardOffset: 84,
    });
  }
  const fishRadius = FISH_MEMBRANE_PADDING;
  const membraneContactRadius = localRadiusAtFish - fishRadius;
  if (arenaBlob && radialDistance >= membraneContactRadius) {
    return {
      fish: { ...state.fish, x: nextFishX, y: nextFishY, vx: nextVx * 0.2, vy: nextVy * 0.2, targetX: nextFishX, targetY: nextFishY, freeSwimTarget: shouldFreeSwim ? freeSwimTarget : null },
      resonantRipples: resonance.ripples,
      arenaBlob,
      gamePaused: true,
      pendingBlobAction: { angle: radialAngle, worldX: nextFishX, worldY: nextFishY },
    };
  }
  const basePatch={circuitAutopilot,circuitSegmentIndex,circuitSegmentT,resonantRipples:resonance.ripples,bubbles:clampBubblesInsideBlob(separateBubblesByDepth(pushBubblesFromFish(state.bubbles,{x:nextFishX,y:nextFishY},fishDepth))),arenaBlob};
  const speed=Math.hypot(limitedVx,limitedVy),moveAngle=speed>0.035?Math.atan2(limitedVy,limitedVx):currentAngle,angleEase=shouldFreeSwim?0.04+Math.min(0.035,speed*0.004):0.055+Math.min(0.055,speed*0.006),angle=speed>0.035?lerpAngle(currentAngle,moveAngle,angleEase):currentAngle;
  const turnStrengthSigned=Math.max(-1,Math.min(1,((()=>{let d=moveAngle-currentAngle;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;})())/1.15)); const nextMouthPull=(state.fish.mouthPull||0)+(pullNorm-(state.fish.mouthPull||0))*0.12; const targetTurnVelocity=turnStrengthSigned*(0.55+Math.min(0.45,speed*0.08)); const nextTurnVelocity=(state.fish.turnVelocity||0)+(targetTurnVelocity-(state.fish.turnVelocity||0))*0.18; const nextTurnAmount=(state.fish.turnAmount||0)+(nextTurnVelocity-(state.fish.turnAmount||0))*0.16;
  const keepBreachOpen = breachOpen && (nearOut || (Number.isFinite(state.fish?.breachAngle) && isNearOpening(radialAngle, state.fish.breachAngle, outerHalfSpan * 1.7)));
  return {...basePatch,currentArenaId:runtimeArenaId,fish:{...state.fish,x:nextFishX,y:nextFishY,vx:nextVx,vy:nextVy,targetX,targetY,freeSwimTarget: shouldFreeSwim ? freeSwimTarget : null,angle,swimPhase:(state.fish.swimPhase||0)+0.045+Math.min(0.16,speed*0.011)+nextTurnAmount*0.025,depth:clampDepth(fishDepth),mouthPull:nextMouthPull,turnAmount:nextTurnAmount,turnVelocity:nextTurnVelocity,maxSpeed:state.fish.maxSpeed||3.1,arenaRadius,arenaLevel,wallHitCount,lastWallHitAt,breachOpen:keepBreachOpen,breachAngle:keepBreachOpen?state.fish.breachAngle:null,breachOpenedAt:keepBreachOpen?state.fish.breachOpenedAt:null,breachState:keepBreachOpen?"open":"closed",breachExpiresAt:keepBreachOpen?state.fish.breachExpiresAt:null,breachUsed:false,hasQuill:Boolean(state.fish.hasQuill),membraneSide:"inside"}};
}
