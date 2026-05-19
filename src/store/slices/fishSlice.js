import { saveState } from "../../core/storage.js";
import { tickFishEngine } from "../../core/fishNavigationEngine.js";
import { clampDepth } from "../../core/fishBubblePhysics.js";
import { startFishTrailAt, addFishTrailPoint } from "../../core/fishPathTrail.js";
import { DEFAULT_ARENA_RADIUS } from "../soonInitialState.js";
import { applyBlobAction } from "../../core/blobArena.js";
import { getBlobRadiusAtAngle } from "../../core/blobArena.js";
import { clampToCircle, makeId } from "../../core/geometry.js";
import { sampleLibrary } from "../../data/defaultPack.js";

function randomBucketSample() {
  const fileSamples = sampleLibrary.filter((sample) => sample?.kind === "file");
  const pool = fileSamples.length ? fileSamples : sampleLibrary;
  if (!pool.length) return { id: "tone-water", name: "Bulle sonore" };
  return pool[Math.floor(Math.random() * pool.length)];
}

export const createFishSlice=(set,get)=>({
setFishTarget:(x,y)=>{if(get().circuitAutopilot)return;set((s)=>({fish:{...s.fish,targetX:x,targetY:y}}));},
recenterFish:()=>set((s)=>{const f=s.fish||{};const dx=-(f.x||0),dy=-(f.y||0),d=Math.hypot(dx,dy)||1,slow=Math.min(1,d/280)*0.85;return{circuitAutopilot:false,fish:{...f,targetX:0,targetY:0,vx:(dx/d)*slow,vy:(dy/d)*slow},circuitSegmentIndex:0,circuitSegmentT:0};}),
setFishDepth:(depth)=>{set((s)=>s.circuitAutopilot?s:{fish:{...s.fish,depth:clampDepth(depth)}});saveState(get());},
tickFish:({swimSpeed=1,arenaRadius=DEFAULT_ARENA_RADIUS}={})=>set((s)=>{const next=tickFishEngine(s,{swimSpeed,arenaRadius});const prevArena=s.currentArenaId;const nextArena=next?.currentArenaId||prevArena;const transitionProgress=Number.isFinite(s.bubbleTransitionProgress)?s.bubbleTransitionProgress:1;
if(nextArena===prevArena){
if(transitionProgress>=1||!Array.isArray(s.bubbleTransitionTarget))return next;
const step=Math.min(1,transitionProgress+0.2);
const curr=s.bubbles||[];const target=s.bubbleTransitionTarget||[];
const blended=target.map((tb,i)=>{const cb=curr[i]||tb;return{...tb,x:(cb.x??tb.x)+((tb.x??0)-(cb.x??tb.x))*0.35,y:(cb.y??tb.y)+((tb.y??0)-(cb.y??tb.y))*0.35};});
return{...next,bubbles:blended,bubbleTransitionProgress:step,bubbleTransitionTarget:step>=1?null:target};
}
const prevBubbles=s.bubbles||[];const byArena={...(s.arenaBubblesById||{})};byArena[prevArena]=prevBubbles.map((b)=>({...b}));const loaded=(byArena[nextArena]||[]).map((b)=>({...b}));
const staged=loaded.map((b)=>({...b,x:(next?.fish?.x||0)+(b.x||0)*0.12,y:(next?.fish?.y||0)+(b.y||0)*0.12}));
return{...next,bubbles:staged,arenaBubblesById:byArena,bubbleTransitionProgress:0,bubbleTransitionTarget:loaded,selectedBubbleId:null,selectedBeaconId:null};}),
startFishTrailAt:(x,y)=>set(()=>({fishTrail:startFishTrailAt(x,y)})),
addFishTrailPoint:(x,y)=>set((s)=>({fishTrail:addFishTrailPoint(s.fishTrail||[],x,y)})),
applyBlobAction:(type,angle)=>set((s)=>{const nextBlob=applyBlobAction(s.arenaBlob,type,angle);const fishAngle=Number.isFinite(angle)?angle:Math.atan2(s.fish?.y||0,s.fish?.x||0);const basePush=Math.max(18,Math.min(46,(s.fish?.maxSpeed||3.1)*8));let nx=(s.fish?.x||0)-Math.cos(fishAngle)*basePush;let ny=(s.fish?.y||0)-Math.sin(fishAngle)*basePush;const newAngle=Math.atan2(ny,nx);const localRadius=getBlobRadiusAtAngle(nextBlob,newAngle);const fishRadius=46;const maxDistance=Math.max(28,localRadius-fishRadius-4);const distance=Math.hypot(nx,ny);if(distance>maxDistance){const clamped=clampToCircle({x:nx,y:ny},maxDistance);nx=clamped.x;ny=clamped.y;}
let nextBubbles=s.bubbles||[];
if(type==="inspi"){const centerRepulse=Math.max(140,basePush*3.2);nx-=Math.cos(fishAngle)*centerRepulse;ny-=Math.sin(fishAngle)*centerRepulse;const pushed=clampToCircle({x:nx,y:ny},Math.max(60,maxDistance-80));nx=pushed.x;ny=pushed.y;const spawnAngle=Number.isFinite(angle)?angle:Math.atan2(s.fish?.y||0,s.fish?.x||1);const detachFromMembrane=Math.max(230,(localRadius||DEFAULT_ARENA_RADIUS)*0.22);const spawnRadius=Math.max(80,localRadius-detachFromMembrane);const spawn=clampToCircle({x:Math.cos(spawnAngle)*spawnRadius,y:Math.sin(spawnAngle)*spawnRadius},Math.max(120,DEFAULT_ARENA_RADIUS*0.82));const picked=randomBucketSample();nextBubbles=[...nextBubbles,{id:makeId("bubble"),label:picked?.name||"Bulle sonore",x:spawn.x,y:spawn.y,r:70+Math.random()*16,hue:Math.floor(160+Math.random()*170),depth:clampDepth(s.fish?.depth||1),sampleId:picked?.id||"tone-water"}];}
if(type==="expi"&&nextBubbles.length){const fishX=s.fish?.x||0;const fishY=s.fish?.y||0;let nearestIndex=0;let nearestDistance=Infinity;nextBubbles.forEach((bubble,index)=>{const d=Math.hypot((bubble?.x||0)-fishX,(bubble?.y||0)-fishY);if(d<nearestDistance){nearestDistance=d;nearestIndex=index;}});nextBubbles=nextBubbles.filter((_,index)=>index!==nearestIndex);}
return{arenaBlob:nextBlob,gamePaused:false,pendingBlobAction:null,bubbles:nextBubbles,fish:{...(s.fish||{}),x:nx,y:ny,targetX:nx,targetY:ny,vx:(s.fish?.vx||0)*0.35,vy:(s.fish?.vy||0)*0.35}};}),
});
