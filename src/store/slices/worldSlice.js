import { buildMazeByArena, buildWorldDebugSnapshot, generateLabybulle, getArenaIdForLevel, getArenaLevelFromId, getPortalArrivalPosition, validateWorldGraph } from "../../core/labybulleWorld.js";
import { saveState } from "../../core/storage.js";
import { DEFAULT_ARENA_RADIUS } from "../soonInitialState.js";

export const createWorldSlice=(set,get)=>({
regenerateWorld:(seed=1)=>{const nextWorld=generateLabybulle(seed);const errors=validateWorldGraph(nextWorld);if(errors.length)console.warn("[labybulle] invalid regenerated world",errors);set({labybulleSeed:seed,worldGraph:nextWorld,mazeByArena:buildMazeByArena(nextWorld),currentArenaId:nextWorld.startArenaId,fish:{...get().fish,x:0,y:0,targetX:0,targetY:-120,arenaLevel:getArenaLevelFromId(nextWorld.startArenaId)}});saveState(get());},
travelToArena:({nextArenaId,fromArenaId,arenaRadius=DEFAULT_ARENA_RADIUS,entryPositionHint=null}={})=>{set((state)=>{const world=state.worldGraph;if(!world?.nodes?.some((n)=>n.id===nextArenaId))return{};const arrival=getPortalArrivalPosition({world,fromArenaId:fromArenaId||state.currentArenaId,toArenaId:nextArenaId,radius:arenaRadius,entryPositionHint});return{currentArenaId:nextArenaId,fish:{...state.fish,targetX:arrival.x,targetY:arrival.y,vx:state.fish.vx*0.2,vy:state.fish.vy*0.2,arenaLevel:getArenaLevelFromId(nextArenaId)}}});saveState(get());},
getWorldDebugSnapshot:()=>buildWorldDebugSnapshot(get().worldGraph),
toggleMembraneSide:()=>{set((state)=>{const membraneSide=state.fish?.membraneSide==="outside"?"outside":"inside";const next=membraneSide==="inside"?"outside":"inside";const lvl=Number.isFinite(state.fish?.arenaLevel)?state.fish.arenaLevel:0;const nextLvl=next==="outside"?Math.min(2,lvl+1):Math.max(0,lvl-1);return{currentArenaId:getArenaIdForLevel(nextLvl),fish:{...state.fish,membraneSide:next,arenaLevel:nextLvl,wallHitCount:0,breachOpen:false,breachState:"closed",breachAngle:null,breachOpenedAt:null,breachExpiresAt:null,vx:0,vy:0}}});saveState(get());}
});
