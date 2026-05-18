import { saveState } from "../../core/storage.js";
import { tickFishEngine } from "../../core/fishNavigationEngine.js";
import { clampDepth } from "../../core/fishBubblePhysics.js";
import { startFishTrailAt, addFishTrailPoint } from "../../core/fishPathTrail.js";
import { DEFAULT_ARENA_RADIUS } from "../soonInitialState.js";

export const createFishSlice=(set,get)=>({
setFishTarget:(x,y)=>{if(get().circuitAutopilot)return;set((s)=>({fish:{...s.fish,targetX:x,targetY:y}}));},
recenterFish:()=>set((s)=>{const f=s.fish||{};const dx=-(f.x||0),dy=-(f.y||0),d=Math.hypot(dx,dy)||1,slow=Math.min(1,d/280)*0.85;return{circuitAutopilot:false,fish:{...f,targetX:0,targetY:0,vx:(dx/d)*slow,vy:(dy/d)*slow},circuitSegmentIndex:0,circuitSegmentT:0};}),
setFishDepth:(depth)=>{set((s)=>s.circuitAutopilot?s:{fish:{...s.fish,depth:clampDepth(depth)}});saveState(get());},
tickFish:({swimSpeed=1,arenaRadius=DEFAULT_ARENA_RADIUS}={})=>set((s)=>{const next=tickFishEngine(s,{swimSpeed,arenaRadius});const prevArena=s.currentArenaId;const nextArena=next?.currentArenaId||prevArena;if(nextArena===prevArena)return next;const prevBubbles=s.bubbles||[];const byArena={...(s.arenaBubblesById||{})};byArena[prevArena]=prevBubbles.map((b)=>({...b}));const loaded=(byArena[nextArena]||[]).map((b)=>({...b}));return{...next,bubbles:loaded,arenaBubblesById:byArena,selectedBubbleId:null,selectedBeaconId:null};}),
startFishTrailAt:(x,y)=>set(()=>({fishTrail:startFishTrailAt(x,y)})),
addFishTrailPoint:(x,y)=>set((s)=>({fishTrail:addFishTrailPoint(s.fishTrail||[],x,y)})),
});
