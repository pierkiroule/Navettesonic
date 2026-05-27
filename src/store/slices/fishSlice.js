import { saveState } from "../../core/storage.js";
import { tickFishEngine } from "../../core/fishNavigationEngine.js";
import { clampDepth } from "../../core/fishBubblePhysics.js";
import { startFishTrailAt, addFishTrailPoint } from "../../core/fishPathTrail.js";
import { DEFAULT_ARENA_RADIUS } from "../soonInitialState.js";

export const createFishSlice=(set,get)=>({
setFishTarget:(x,y)=>{if(get().circuitAutopilot)return;set((s)=>({gamePaused:false,pendingBlobAction:null,fish:{...s.fish,targetX:x,targetY:y,vx:(s.fish?.vx||0)*0.35,vy:(s.fish?.vy||0)*0.35}}));},
recenterFish:()=>set((s)=>{const f=s.fish||{};const dx=-(f.x||0),dy=-(f.y||0),d=Math.hypot(dx,dy)||1,slow=Math.min(1,d/280)*0.85;return{circuitAutopilot:false,fish:{...f,targetX:0,targetY:0,vx:(dx/d)*slow,vy:(dy/d)*slow},circuitSegmentIndex:0,circuitSegmentT:0};}),
setFishDepth:(depth)=>{set((s)=>s.circuitAutopilot?s:{fish:{...s.fish,depth:clampDepth(depth)}});saveState(get());},
tickFish:({swimSpeed=1,arenaRadius=DEFAULT_ARENA_RADIUS}={})=>set((s)=>{const next=tickFishEngine(s,{swimSpeed,arenaRadius});const prevArena=s.currentArenaId;const nextArena=next?.currentArenaId||prevArena;const transitionProgress=Number.isFinite(s.bubbleTransitionProgress)?s.bubbleTransitionProgress:1;
const orbitRadius=Math.max(84,arenaRadius-34);
const ORBIT_SECONDS_PER_TURN=30;
const ASSUMED_TICKS_PER_SECOND=60;
const orbitStep=(Math.PI*2)/(ORBIT_SECONDS_PER_TURN*ASSUMED_TICKS_PER_SECOND);
const updateOrbitingStars=(echostory)=>{
if(!echostory||!Array.isArray(echostory.stars))return echostory;
let changed=false;
const stars=echostory.stars.map((star)=>{
  if(!star||!star.attachedToContour)return star;
  changed=true;
  const angle=(Number.isFinite(star.contourAngle)?star.contourAngle:Math.atan2(star.y||0,star.x||0))+orbitStep;
  return {...star,contourAngle:angle,x:Math.cos(angle)*orbitRadius,y:Math.sin(angle)*orbitRadius};
});
return changed?{...echostory,stars}:echostory;
};
if(nextArena===prevArena){
if(transitionProgress>=1||!Array.isArray(s.bubbleTransitionTarget))return{...next,echostory:updateOrbitingStars(next.echostory||s.echostory)};
const step=Math.min(1,transitionProgress+0.2);
const curr=s.bubbles||[];const target=s.bubbleTransitionTarget||[];
const blended=target.map((tb,i)=>{const cb=curr[i]||tb;return{...tb,x:(cb.x??tb.x)+((tb.x??0)-(cb.x??tb.x))*0.35,y:(cb.y??tb.y)+((tb.y??0)-(cb.y??tb.y))*0.35};});
return{...next,bubbles:blended,bubbleTransitionProgress:step,bubbleTransitionTarget:step>=1?null:target,echostory:updateOrbitingStars(next.echostory||s.echostory)};
}
const prevBubbles=s.bubbles||[];const byArena={...(s.arenaBubblesById||{})};byArena[prevArena]=prevBubbles.map((b)=>({...b}));const loaded=(byArena[nextArena]||[]).map((b)=>({...b}));
const staged=loaded.map((b)=>({...b,x:(next?.fish?.x||0)+(b.x||0)*0.12,y:(next?.fish?.y||0)+(b.y||0)*0.12}));
return{...next,bubbles:staged,arenaBubblesById:byArena,bubbleTransitionProgress:0,bubbleTransitionTarget:loaded,selectedBubbleId:null,selectedBeaconId:null,echostory:updateOrbitingStars(next.echostory||s.echostory)};}),
startFishTrailAt:(x,y)=>set(()=>({fishTrail:startFishTrailAt(x,y)})),
addFishTrailPoint:(x,y)=>set((s)=>({fishTrail:addFishTrailPoint(s.fishTrail||[],x,y)})),
applyBlobAction:(type,angle)=>set((s)=>{
const arenaRadius=s.arenaRadius||1200;
const outerTrackRadius=Math.max(120,arenaRadius+26);
const innerReleaseRadius=Math.max(120,arenaRadius-220);
const stars=s.echostory?.stars||[];
let selectedId=null;
let selectedDistance=Infinity;
stars.forEach((star)=>{
  if(!star)return;
  const isAttached=Boolean(star.attachedToContour);
  if(type==="expi"&&isAttached)return;
  if(type==="inspi"&&!isAttached)return;
  const d=Math.hypot((star.x||0)-(s.fish?.x||0),(star.y||0)-(s.fish?.y||0));
  if(d<selectedDistance){selectedDistance=d;selectedId=star.id;}
});
const nextEchostory=s.echostory?{...s.echostory,stars:stars.map((star)=>{
  if(!star||star.id!==selectedId)return star;
  if(type==="expi"){
    const starAngle=Math.atan2(star.y||0,star.x||0);
    return {...star,attachedToContour:true,contourAngle:starAngle,x:Math.cos(starAngle)*outerTrackRadius,y:Math.sin(starAngle)*outerTrackRadius};
  }
  const starAngle=Number.isFinite(star.contourAngle)?star.contourAngle:Math.atan2(star.y||0,star.x||0);
  return {...star,attachedToContour:false,x:Math.cos(starAngle)*innerReleaseRadius,y:Math.sin(starAngle)*innerReleaseRadius};
})}:s.echostory;
return{gamePaused:false,pendingBlobAction:null,eyesClosed:false,echostory:nextEchostory,fish:{...(s.fish||{}),targetX:s.fish?.x||0,targetY:s.fish?.y||0}};
}),
});
