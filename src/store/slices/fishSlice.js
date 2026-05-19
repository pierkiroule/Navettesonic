import { saveState } from "../../core/storage.js";
import { tickFishEngine } from "../../core/fishNavigationEngine.js";
import { clampDepth } from "../../core/fishBubblePhysics.js";
import { startFishTrailAt, addFishTrailPoint } from "../../core/fishPathTrail.js";
import { DEFAULT_ARENA_RADIUS } from "../soonInitialState.js";
import { applyBlobAction } from "../../core/blobArena.js";

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
applyBlobAction:(type,angle)=>set((s)=>({arenaBlob:applyBlobAction(s.arenaBlob,type,angle),gamePaused:false,pendingBlobAction:null})),
});
