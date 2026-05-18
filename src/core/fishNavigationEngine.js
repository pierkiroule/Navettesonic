import { updateSnakeFishToTarget, createInitialSpine } from "./fishSnakeMotion.js";
import { clampToCircle } from "./geometry.js";
import { getCircuitSpeedValue, smoothLoopPoint } from "./traceCircuit.js";
import { getFishNavigableRadius, MEMBRANE_LEVEL_MULTIPLIERS } from "./constants.js";
import { getArenaIdForLevel, getArenaLevelFromId, getPortalArrivalPosition, getPortalOpeningAngle, getPortalOpeningHalfSpan, resolveMembraneContact } from "./labybulleWorld.js";
import { DEFAULT_FISH_NAV_RADIUS, MAX_ARENA_LEVEL, DEFAULT_ARENA_RADIUS, labybulleWorld } from "../store/soonInitialState.js";
import { clampDepth, pushBubblesFromFish, separateBubblesByDepth } from "./fishBubblePhysics.js";

export const FISH_CONTROL_TUNING={autopilot:{mouthOffset:32,maxSpeedFactor:1.05,accel:0.16,arrivalRadius:180,stopRadius:10},touch:{mouthOffset:24,maxSpeedFactor:1.2,accel:0.22,arrivalRadius:220,stopRadius:8}};
export const angleDistance=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const lerpAngle=(c,t,a)=>{let d=t-c;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return c+d*a;};
export const isNearOpening=(angle,openingAngle,openingHalfSpan)=>Number.isFinite(openingAngle)&&Math.abs(angleDistance(angle,openingAngle))<=openingHalfSpan;
export const getRuntimeFishNavRadius=(arenaRadius)=>Number.isFinite(arenaRadius)&&arenaRadius>0?getFishNavigableRadius(arenaRadius):DEFAULT_FISH_NAV_RADIUS;
export const getFishMovementRadius=(arenaRadius)=>getRuntimeFishNavRadius(arenaRadius);
export const getMembraneRadiusForLevel=(arenaRadius,arenaLevel=0)=>{const base=getRuntimeFishNavRadius(arenaRadius);const level=Math.max(0,Math.min(MAX_ARENA_LEVEL,Number.isFinite(arenaLevel)?arenaLevel:0));const mul=MEMBRANE_LEVEL_MULTIPLIERS[level]??MEMBRANE_LEVEL_MULTIPLIERS[0];return base*mul;};


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
  entryPositionHint = null,
  inwardOffset = 140,
}) {
  const nextLevel = Math.max(0, Math.min(MAX_ARENA_LEVEL, getArenaLevelFromId(nextArenaId)));
  const arrival = getPortalArrivalPosition({
    world: activeWorld,
    fromArenaId: runtimeArenaId,
    toArenaId: nextArenaId,
    radius: getMembraneRadiusForLevel(arenaRadius, nextLevel),
    inwardOffset,
    entryPositionHint,
  });
  const nextFishX = arrival.x;
  const nextFishY = arrival.y;
  const settledTargetX = nextFishX + Math.cos(radialAngle) * 12;
  const settledTargetY = nextFishY + Math.sin(radialAngle) * 12;
  return {
    circuitAutopilot,
    circuitSegmentIndex,
    circuitSegmentT,
    bubbles: separateBubblesByDepth(pushBubblesFromFish(state.bubbles, { x: nextFishX, y: nextFishY }, fishDepth)),
    currentArenaId: nextArenaId,
    fish: { ...state.fish, x: nextFishX, y: nextFishY, vx: nextVx * 0.92, vy: nextVy * 0.92, targetX: settledTargetX, targetY: settledTargetY, arenaRadius, arenaLevel: nextLevel, membraneSide: "inside", wallHitCount, lastWallHitAt, breachOpen: false, breachAngle: null, breachOpenedAt: null, breachState: "closed", breachExpiresAt: null, breachUsed: false, hasQuill: Boolean(state.fish.hasQuill) },
  };
}

export function tickFishEngine(state,{swimSpeed=1,arenaRadius=DEFAULT_ARENA_RADIUS}={}) { /* trimmed by keeping exact logic moved */
  const fish = state.fish; let fishNavRadius=getFishMovementRadius(arenaRadius);
  if (state.fishTrail?.length) { const result=updateSnakeFishToTarget({fish:{...state.fish,spine:state.fish.spine||createInitialSpine(state.fish.x||0,state.fish.y||0)},trail:state.fishTrail,arenaRadius:fishNavRadius,swimSpeed}); return { fish:result.fish, fishTrail:result.trail, bubbles:separateBubblesByDepth(pushBubblesFromFish(state.bubbles,result.fish,result.fish.depth))}; }
  let targetX=state.fish.targetX,targetY=state.fish.targetY,fishDepth=clampDepth(state.fish.depth||1),circuitSegmentIndex=state.circuitSegmentIndex||0,circuitSegmentT=state.circuitSegmentT||0; const circuitAutopilot=Boolean(state.circuitAutopilot);
  if (circuitAutopilot && state.traceCircuit?.length>1){const currentBeacon=state.traceCircuit[circuitSegmentIndex%state.traceCircuit.length]; const speedStep=getCircuitSpeedValue(currentBeacon?.speed||2)*Math.max(0,swimSpeed); circuitSegmentT+=speedStep; while(circuitSegmentT>=1){circuitSegmentT-=1;circuitSegmentIndex=(circuitSegmentIndex+1)%state.traceCircuit.length;} const p=smoothLoopPoint(state.traceCircuit,circuitSegmentIndex,circuitSegmentT); targetX=p.x; targetY=p.y; fishDepth=clampDepth(p.depth||fishDepth);}
  const currentAngle=Number.isFinite(state.fish.angle)?state.fish.angle:-Math.PI/2; const control=circuitAutopilot?FISH_CONTROL_TUNING.autopilot:FISH_CONTROL_TUNING.touch; const mouthX=state.fish.x+Math.cos(currentAngle)*control.mouthOffset, mouthY=state.fish.y+Math.sin(currentAngle)*control.mouthOffset; const pullX=targetX-mouthX,pullY=targetY-mouthY,pullDistance=Math.hypot(pullX,pullY); const pullNorm=Math.min(1,pullDistance/Math.max(1,control.arrivalRadius)); const speedLimit=(state.fish.maxSpeed||3.1)*control.maxSpeedFactor*Math.max(0,swimSpeed); const desiredSpeed=pullDistance<=control.stopRadius?0:Math.min(speedLimit,speedLimit*pullNorm); const dirX=pullDistance>0.0001?pullX/pullDistance:0,dirY=pullDistance>0.0001?pullY/pullDistance:0; const vx=state.fish.vx+((dirX*desiredSpeed)-state.fish.vx)*control.accel, vy=state.fish.vy+((dirY*desiredSpeed)-state.fish.vy)*control.accel; const speedRaw=Math.hypot(vx,vy); const limitedVx=speedRaw>speedLimit?(vx/speedRaw)*speedLimit:vx,limitedVy=speedRaw>speedLimit?(vy/speedRaw)*speedLimit:vy;
  const arenaLevel=Math.max(0,Math.min(MAX_ARENA_LEVEL,Number.isFinite(state.fish.arenaLevel)?state.fish.arenaLevel:0)); const outerNavRadius=getMembraneRadiusForLevel(arenaRadius,arenaLevel); const innerNavRadius=arenaLevel>0?getMembraneRadiusForLevel(arenaRadius,arenaLevel-1):0;
  let nextFishX=state.fish.x+limitedVx,nextFishY=state.fish.y+limitedVy,nextVx=limitedVx,nextVy=limitedVy; let wallHitCount=state.fish.wallHitCount||0,lastWallHitAt=state.fish.lastWallHitAt||0; const now=performance.now(), hitDelayPassed=now-lastWallHitAt>450;
  const rawDistance=Math.hypot(nextFishX,nextFishY); const hitOuterBoundary=rawDistance>outerNavRadius; if(hitOuterBoundary){const sc=clampToCircle({x:nextFishX,y:nextFishY},outerNavRadius);nextFishX=sc.x;nextFishY=sc.y;if(rawDistance>outerNavRadius+0.5&&hitDelayPassed){wallHitCount=Math.min(3,wallHitCount+1);lastWallHitAt=now;}} else if(innerNavRadius>0&&rawDistance<innerNavRadius){const d=rawDistance||0.0001; nextFishX=(nextFishX/d)*(innerNavRadius+2); nextFishY=(nextFishY/d)*(innerNavRadius+2); if(hitDelayPassed){wallHitCount=Math.min(3,wallHitCount+1);lastWallHitAt=now;}}
  const radialDistance=Math.hypot(nextFishX,nextFishY), radialAngle=Math.atan2(nextFishY,nextFishX), radialX=Math.cos(radialAngle), radialY=Math.sin(radialAngle), radialDot=(radialX*nextVx+radialY*nextVy)/(Math.hypot(nextVx,nextVy)||0.0001); const activeWorld=state.worldGraph||labybulleWorld; const runtimeArenaId=state.currentArenaId||getArenaIdForLevel(arenaLevel); const outerHalfSpan=getPortalOpeningHalfSpan({radius:outerNavRadius}); const innerHalfSpan=innerNavRadius>0?getPortalOpeningHalfSpan({radius:innerNavRadius}):0;
  const availablePortals=(activeWorld?.portals||[]).filter((p)=>p.fromArenaId===runtimeArenaId); let activePortal=availablePortals.find((p)=>isNearOpening(radialAngle,getPortalOpeningAngle(activeWorld,p.fromArenaId,p.toArenaId),outerHalfSpan))||null;
  const inwardPortal=innerNavRadius>0?availablePortals.find((p)=>isNearOpening(radialAngle,getPortalOpeningAngle(activeWorld,p.fromArenaId,p.toArenaId),innerHalfSpan))||null:null;
  const nearOuter=Math.abs(radialDistance-outerNavRadius)<=120, nearInner=innerNavRadius>0&&Math.abs(radialDistance-innerNavRadius)<=120, nearOut=Boolean(activePortal), nearIn=Boolean(inwardPortal);
  const pushingOutward=radialDot>0.02;
  const membraneContact=nearOuter?resolveMembraneContact({world:activeWorld,arenaId:runtimeArenaId,x:nextFishX,y:nextFishY,radius:outerNavRadius,angularToleranceDeg:20}):null;
  const contactPortal=membraneContact?.action==="transition"?membraneContact?.portal||null:null;

  // Priorité absolue: si le contact membrane résout une transition, on traverse
  // immédiatement (évite les boucles de rejet/glisse au bord).
  if (contactPortal?.toArenaId) {
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
      entryPositionHint: contactPortal.positionHint || null,
      inwardOffset: 140,
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

  const canTransitionOutward=nearOuter&&activePortal&&nearOut&&radialDot>0.1;
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
      entryPositionHint: activePortal.positionHint || null,
      inwardOffset: 140,
    });
  }

  if (nearInner && nearIn && radialDot < -0.1 && inwardPortal) {
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
      entryPositionHint: inwardPortal.positionHint || null,
      inwardOffset: 140,
    });
  }
  const basePatch={circuitAutopilot,circuitSegmentIndex,circuitSegmentT,bubbles:separateBubblesByDepth(pushBubblesFromFish(state.bubbles,{x:nextFishX,y:nextFishY},fishDepth))};
  const speed=Math.hypot(limitedVx,limitedVy),moveAngle=speed>0.035?Math.atan2(limitedVy,limitedVx):currentAngle,angle=speed>0.035?lerpAngle(currentAngle,moveAngle,0.055+Math.min(0.055,speed*0.006)):currentAngle;
  const turnStrengthSigned=Math.max(-1,Math.min(1,((()=>{let d=moveAngle-currentAngle;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;})())/1.15)); const nextMouthPull=(state.fish.mouthPull||0)+(pullNorm-(state.fish.mouthPull||0))*0.12; const targetTurnVelocity=turnStrengthSigned*(0.55+Math.min(0.45,speed*0.08)); const nextTurnVelocity=(state.fish.turnVelocity||0)+(targetTurnVelocity-(state.fish.turnVelocity||0))*0.18; const nextTurnAmount=(state.fish.turnAmount||0)+(nextTurnVelocity-(state.fish.turnAmount||0))*0.16;
  return {...basePatch,currentArenaId:runtimeArenaId,fish:{...state.fish,x:nextFishX,y:nextFishY,vx:nextVx,vy:nextVy,targetX,targetY,angle,swimPhase:(state.fish.swimPhase||0)+0.045+Math.min(0.16,speed*0.011)+nextTurnAmount*0.025,depth:clampDepth(fishDepth),mouthPull:nextMouthPull,turnAmount:nextTurnAmount,turnVelocity:nextTurnVelocity,maxSpeed:state.fish.maxSpeed||3.1,arenaRadius,arenaLevel,wallHitCount,lastWallHitAt,breachOpen:false,breachAngle:null,breachOpenedAt:null,breachState:"closed",breachExpiresAt:null,breachUsed:false,hasQuill:Boolean(state.fish.hasQuill),membraneSide:"inside"}};
}
