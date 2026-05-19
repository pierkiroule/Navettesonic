import { updateSnakeFishToTarget, createInitialSpine } from "./fishSnakeMotion.js";
import { clampToCircle } from "./geometry.js";
import { getCircuitSpeedValue, smoothLoopPoint } from "./traceCircuit.js";
import { getFishNavigableRadius, MEMBRANE_LEVEL_MULTIPLIERS } from "./constants.js";
import { getArenaIdForLevel, getArenaLevelFromId, getDestinationEntryHint, getPortalArrivalPosition, getPortalOpeningAngle, getPortalOpeningHalfSpan, resolveMembraneContact } from "./labybulleWorld.js";
import { DEFAULT_FISH_NAV_RADIUS, MAX_ARENA_LEVEL, DEFAULT_ARENA_RADIUS, labybulleWorld } from "../store/soonInitialState.js";
import { clampDepth, pushBubblesFromFish, separateBubblesByDepth } from "./fishBubblePhysics.js";
import { getBlobRadiusAtAngle, updateBlobPhysics } from "./blobArena.js";

export const FISH_CONTROL_TUNING={autopilot:{mouthOffset:32,maxSpeedFactor:1.05,accel:0.16,arrivalRadius:180,stopRadius:10},touch:{mouthOffset:24,maxSpeedFactor:1.2,accel:0.22,arrivalRadius:220,stopRadius:8}};
export const angleDistance=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const lerpAngle=(c,t,a)=>{let d=t-c;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return c+d*a;};
export const isNearOpening=(angle,openingAngle,openingHalfSpan)=>Number.isFinite(openingAngle)&&Math.abs(angleDistance(angle,openingAngle))<=openingHalfSpan;
export const getRuntimeFishNavRadius=(arenaRadius)=>Number.isFinite(arenaRadius)&&arenaRadius>0?getFishNavigableRadius(arenaRadius):DEFAULT_FISH_NAV_RADIUS;
export const getFishMovementRadius=(arenaRadius)=>getRuntimeFishNavRadius(arenaRadius);
export const getMembraneRadiusForLevel=(arenaRadius,arenaLevel=0)=>{const base=getRuntimeFishNavRadius(arenaRadius);const level=Math.max(0,Math.min(MAX_ARENA_LEVEL,Number.isFinite(arenaLevel)?arenaLevel:0));const mul=MEMBRANE_LEVEL_MULTIPLIERS[level]??MEMBRANE_LEVEL_MULTIPLIERS[0];return base*mul;};


const ARENA_TRANSITION_COOLDOWN_MS = 220;
const ARENA_PASSAGE_OPEN_MS = 1400;

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
  if (state.gamePaused) {
    return {
      fish: {
        ...state.fish,
        vx: (state.fish.vx || 0) * 0.78,
        vy: (state.fish.vy || 0) * 0.78,
      },
      arenaBlob,
    };
  }
  const fish = state.fish; let fishNavRadius=getFishMovementRadius(arenaRadius);
  if (state.fishTrail?.length) { const result=updateSnakeFishToTarget({fish:{...state.fish,spine:state.fish.spine||createInitialSpine(state.fish.x||0,state.fish.y||0)},trail:state.fishTrail,arenaRadius:fishNavRadius,swimSpeed}); return { fish:result.fish, fishTrail:result.trail, bubbles:separateBubblesByDepth(pushBubblesFromFish(state.bubbles,result.fish,result.fish.depth))}; }
  let targetX=state.fish.targetX,targetY=state.fish.targetY,fishDepth=clampDepth(state.fish.depth||1),circuitSegmentIndex=state.circuitSegmentIndex||0,circuitSegmentT=state.circuitSegmentT||0; const circuitAutopilot=Boolean(state.circuitAutopilot);
  if (circuitAutopilot && state.traceCircuit?.length>1){const currentBeacon=state.traceCircuit[circuitSegmentIndex%state.traceCircuit.length]; const speedStep=getCircuitSpeedValue(currentBeacon?.speed||2)*Math.max(0,swimSpeed); circuitSegmentT+=speedStep; while(circuitSegmentT>=1){circuitSegmentT-=1;circuitSegmentIndex=(circuitSegmentIndex+1)%state.traceCircuit.length;} const p=smoothLoopPoint(state.traceCircuit,circuitSegmentIndex,circuitSegmentT); targetX=p.x; targetY=p.y; fishDepth=clampDepth(p.depth||fishDepth);}
  const currentAngle=Number.isFinite(state.fish.angle)?state.fish.angle:-Math.PI/2; const control=circuitAutopilot?FISH_CONTROL_TUNING.autopilot:FISH_CONTROL_TUNING.touch; const mouthX=state.fish.x+Math.cos(currentAngle)*control.mouthOffset, mouthY=state.fish.y+Math.sin(currentAngle)*control.mouthOffset; const pullX=targetX-mouthX,pullY=targetY-mouthY,pullDistance=Math.hypot(pullX,pullY); const pullNorm=Math.min(1,pullDistance/Math.max(1,control.arrivalRadius)); const speedLimit=(state.fish.maxSpeed||3.1)*control.maxSpeedFactor*Math.max(0,swimSpeed); const desiredSpeed=pullDistance<=control.stopRadius?0:Math.min(speedLimit,speedLimit*pullNorm); const dirX=pullDistance>0.0001?pullX/pullDistance:0,dirY=pullDistance>0.0001?pullY/pullDistance:0; const vx=state.fish.vx+((dirX*desiredSpeed)-state.fish.vx)*control.accel, vy=state.fish.vy+((dirY*desiredSpeed)-state.fish.vy)*control.accel; const speedRaw=Math.hypot(vx,vy); const limitedVx=speedRaw>speedLimit?(vx/speedRaw)*speedLimit:vx,limitedVy=speedRaw>speedLimit?(vy/speedRaw)*speedLimit:vy;
  if (arenaBlob) {
    let nextFishX = state.fish.x + limitedVx;
    let nextFishY = state.fish.y + limitedVy;
    const radialAngle = Math.atan2(nextFishY, nextFishX);
    const localRadius = getBlobRadiusAtAngle(arenaBlob, radialAngle);
    const fishRadius = 38;
    const maxDistance = Math.max(40, localRadius - fishRadius);
    const rawDistance = Math.hypot(nextFishX, nextFishY);
    if (rawDistance >= maxDistance) {
      const clamped = clampToCircle({ x: nextFishX, y: nextFishY }, maxDistance);
      nextFishX = clamped.x;
      nextFishY = clamped.y;
      return {
        arenaBlob,
        gamePaused: true,
        pendingBlobAction: { angle: radialAngle, worldX: nextFishX, worldY: nextFishY },
        fish: { ...state.fish, x: nextFishX, y: nextFishY, vx: limitedVx * 0.16, vy: limitedVy * 0.16, targetX: nextFishX, targetY: nextFishY },
      };
    }
    const speed=Math.hypot(limitedVx,limitedVy),moveAngle=speed>0.035?Math.atan2(limitedVy,limitedVx):currentAngle,angle=speed>0.035?lerpAngle(currentAngle,moveAngle,0.055+Math.min(0.055,speed*0.006)):currentAngle;
    const turnStrengthSigned=Math.max(-1,Math.min(1,((()=>{let d=moveAngle-currentAngle;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;})())/1.15)); const nextMouthPull=(state.fish.mouthPull||0)+(pullNorm-(state.fish.mouthPull||0))*0.12; const targetTurnVelocity=turnStrengthSigned*(0.55+Math.min(0.45,speed*0.08)); const nextTurnVelocity=(state.fish.turnVelocity||0)+(targetTurnVelocity-(state.fish.turnVelocity||0))*0.18; const nextTurnAmount=(state.fish.turnAmount||0)+(nextTurnVelocity-(state.fish.turnAmount||0))*0.16;
    return { arenaBlob, fish:{...state.fish,x:nextFishX,y:nextFishY,vx:limitedVx,vy:limitedVy,targetX,targetY,angle,swimPhase:(state.fish.swimPhase||0)+0.045+Math.min(0.16,speed*0.011)+nextTurnAmount*0.025,depth:clampDepth(fishDepth),mouthPull:nextMouthPull,turnAmount:nextTurnAmount,turnVelocity:nextTurnVelocity,maxSpeed:state.fish.maxSpeed||3.1,arenaRadius,membraneSide:"inside"}, bubbles:separateBubblesByDepth(pushBubblesFromFish(state.bubbles,{x:nextFishX,y:nextFishY},fishDepth)) };
  }
  const arenaLevel=Math.max(0,Math.min(MAX_ARENA_LEVEL,Number.isFinite(state.fish.arenaLevel)?state.fish.arenaLevel:0)); const outerNavRadius=getMembraneRadiusForLevel(arenaRadius,arenaLevel); const innerNavRadius=arenaLevel>0?getMembraneRadiusForLevel(arenaRadius,arenaLevel-1):0;
  let nextFishX=state.fish.x+limitedVx,nextFishY=state.fish.y+limitedVy,nextVx=limitedVx,nextVy=limitedVy; let wallHitCount=state.fish.wallHitCount||0,lastWallHitAt=state.fish.lastWallHitAt||0; const now=performance.now(), hitDelayPassed=now-lastWallHitAt>450;
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
  const fishRadius = 38;
  const membraneContactRadius = localRadiusAtFish - fishRadius;
  if (arenaBlob && radialDistance >= membraneContactRadius) {
    return {
      fish: { ...state.fish, x: nextFishX, y: nextFishY, vx: nextVx * 0.2, vy: nextVy * 0.2, targetX: nextFishX, targetY: nextFishY },
      arenaBlob,
      gamePaused: true,
      pendingBlobAction: { angle: radialAngle, worldX: nextFishX, worldY: nextFishY },
    };
  }
  const basePatch={circuitAutopilot,circuitSegmentIndex,circuitSegmentT,bubbles:separateBubblesByDepth(pushBubblesFromFish(state.bubbles,{x:nextFishX,y:nextFishY},fishDepth)),arenaBlob};
  const speed=Math.hypot(limitedVx,limitedVy),moveAngle=speed>0.035?Math.atan2(limitedVy,limitedVx):currentAngle,angle=speed>0.035?lerpAngle(currentAngle,moveAngle,0.055+Math.min(0.055,speed*0.006)):currentAngle;
  const turnStrengthSigned=Math.max(-1,Math.min(1,((()=>{let d=moveAngle-currentAngle;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;})())/1.15)); const nextMouthPull=(state.fish.mouthPull||0)+(pullNorm-(state.fish.mouthPull||0))*0.12; const targetTurnVelocity=turnStrengthSigned*(0.55+Math.min(0.45,speed*0.08)); const nextTurnVelocity=(state.fish.turnVelocity||0)+(targetTurnVelocity-(state.fish.turnVelocity||0))*0.18; const nextTurnAmount=(state.fish.turnAmount||0)+(nextTurnVelocity-(state.fish.turnAmount||0))*0.16;
  const keepBreachOpen = breachOpen && (nearOut || (Number.isFinite(state.fish?.breachAngle) && isNearOpening(radialAngle, state.fish.breachAngle, outerHalfSpan * 1.7)));
  return {...basePatch,currentArenaId:runtimeArenaId,fish:{...state.fish,x:nextFishX,y:nextFishY,vx:nextVx,vy:nextVy,targetX,targetY,angle,swimPhase:(state.fish.swimPhase||0)+0.045+Math.min(0.16,speed*0.011)+nextTurnAmount*0.025,depth:clampDepth(fishDepth),mouthPull:nextMouthPull,turnAmount:nextTurnAmount,turnVelocity:nextTurnVelocity,maxSpeed:state.fish.maxSpeed||3.1,arenaRadius,arenaLevel,wallHitCount,lastWallHitAt,breachOpen:keepBreachOpen,breachAngle:keepBreachOpen?state.fish.breachAngle:null,breachOpenedAt:keepBreachOpen?state.fish.breachOpenedAt:null,breachState:keepBreachOpen?"open":"closed",breachExpiresAt:keepBreachOpen?state.fish.breachExpiresAt:null,breachUsed:false,hasQuill:Boolean(state.fish.hasQuill),membraneSide:"inside"}};
}
