(function(root){
 'use strict';
 const weights={party:3,theme:4,transport:2,nights:1.5,season:1.5,age:1};
 function available(s,prefs){
  if(s.name==='あさひ舟川「春の四重奏」' && prefs.season!=='1')return false;
  return !(prefs.season && s.seasons && !s.seasons.includes(prefs.season)) && !(prefs.party && s.excludeParty?.includes(prefs.party));
 }
 function recommend(data, prefs){
  const experiences=[...new Set(prefs.experiences||[])].filter(k=>data.experienceLabels?.[k]);
  const selected=Object.entries(weights).filter(([k])=>prefs[k] && data.groups[k+':'+prefs[k]]).map(([k,w])=>[k+':'+prefs[k],w]);
  const groups=[['first',.5],...selected];
  const ranked=data.spots.map((s,i)=>{
   if(!available(s,prefs))return null;
   const matchedExperiences=experiences.filter(k=>s.confirmed?.includes(k)||(s.name==='あさひ舟川「春の四重奏」' && prefs.season==='1' && k==='1'));
   if(experiences.length && !matchedExperiences.length)return null;
   if(prefs.party && s.excludeParty?.includes(prefs.party))return null;
   const b=data.base.spots[i]; if(!b)return null;
   const prior=b[2]/b[1]; let n=b[0],valid=b[1],good=b[2],total=data.base.total;
   let evidence=null, evidenceValue=-Infinity, used=[];
   for(const [key,w] of groups){
    const group=data.groups[key],c=group.spots[i];
    // A suppressed marginal cell must not be treated as zero or added only to denominator.
    if(!c)continue;
    // Normalize cohorts so a small theme group is not drowned out by a large party group.
    // 100 pseudo respondents with overall rates shrink sparse visit estimates.
    const scale=data.base.total/(group.total+100);
    n+=w*(c[0]+100*b[0]/data.base.total)*scale;
    valid+=w*(c[1]+100*b[1]/data.base.total)*scale;
    good+=w*(c[2]+100*b[2]/data.base.total)*scale;
    total+=w*data.base.total;used.push(key);
    if(key!=='first' && c[1]>=30){
      const value=w*(c[0]/group.total)/(b[0]/data.base.total);
      if(value>evidenceValue){ evidenceValue=value;evidence={key,n:c[1],good:c[2]}; }
    }
   }
   const affinity=(n/total)/(b[0]/data.base.total);
   const satisfaction=(good+30*prior)/(valid+30);
   // Blend conditional affinity with support and trip satisfaction. No predicted probability shown.
   const seasonEvidence=historicalSeason(data,s.id,prefs.season);
   const score=.70*Math.log(Math.max(.01,affinity))+.10*Math.log(1+b[0]/100)+.20*(satisfaction-.8)+(seasonEvidence?.adjustment||0);
   return {...s,matchedExperiences,score,evidence,seasonEvidence,baseN:b[1],baseGood:b[2],used};
  }).filter(Boolean).sort((a,b)=>b.matchedExperiences.length-a.matchedExperiences.length||b.score-a.score||a.id-b.id);
  return ranked;
 }
 // Compare within the OLD questionnaire only. Unmeasured and suppressed cells
 // are neutral; never interpret newly added destinations as historical zeros.
 function historicalSeason(data,id,season){
  const h=data.seasonHistory,g=h?.groups?.[season];
  if(!g || !h.measuredIds.includes(id))return null;
  const i=data.spots.findIndex(s=>s.id===id),b=h.baseVisits[i],n=g.spots[i];
  if(!Number.isFinite(b)||!Number.isFinite(n)||b<10||n<10||h.total<=0||g.total<=0)return null;
  const prior=b/h.total;
  const ratio=((n+h.priorRespondents*prior)/(g.total+h.priorRespondents))/prior;
  const bounded=Math.max(h.ratioBounds[0],Math.min(h.ratioBounds[1],ratio));
  return {period:g.period,n,total:g.total,ratio,adjustment:h.scoreWeight*Math.log(bounded)};
 }
 function together(data,id,prefs={}){
  const base=data.base.spots[id][0];
  return data.spots.filter(s=>s.id!==id && available(s,prefs) && !(['黒部ダム','立山黒部アルペンルート'].includes(data.spots[id].name)&&['黒部ダム','立山黒部アルペンルート'].includes(s.name)))
   .map(s=>({...s,n:data.pairs[id][s.id]})).filter(s=>s.n>=30)
   .map(s=>({...s,association:s.n/Math.sqrt(base*data.base.spots[s.id][0])}))
   .sort((a,b)=>b.association-a.association||b.n-a.n).slice(0,2);
 }
 // Cover every available selected experience before filling the remaining slots.
 // Ties follow recommend(): total experience matches, survey score, then stable id.
 function selectRecommendations(ranked){
  const out=[],covered=new Set();
  const wanted=new Set(ranked.flatMap(s=>s.matchedExperiences||[]));
  const compatible=s=>!out.some(t=>t.id===s.id || (['黒部ダム','立山黒部アルペンルート'].includes(t.name)&&['黒部ダム','立山黒部アルペンルート'].includes(s.name)));
  while([...wanted].some(k=>!covered.has(k))){
   let best=null,gain=0;
   for(const s of ranked){if(!compatible(s))continue;const n=(s.matchedExperiences||[]).filter(k=>!covered.has(k)).length;if(n>gain){best=s;gain=n;}}
   if(!best)break;
   out.push(best);for(const k of best.matchedExperiences||[])covered.add(k);
  }
  for(const s of ranked){if(out.length>=5)break;if(compatible(s))out.push(s);}
  return out;
 }
 // Retain the old entry point for callers; result may exceed five to cover all wishes.
 const topFive=selectRecommendations;
 root.TripEngine={recommend,together,selectRecommendations,topFive,weights,historicalSeason};
 if(typeof module!=='undefined')module.exports=root.TripEngine;
})(typeof window!=='undefined'?window:globalThis);

