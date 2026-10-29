(function(root){
 'use strict';
 const KEY='toyama-trip-saved-v1';
 function create(validIds,storage){
  const valid=new Set(validIds);let ids=[],persistent=true;
  const clean=value=>Array.isArray(value)?[...new Set(value.filter(id=>Number.isInteger(id)&&valid.has(id)))]:[];
  try{ids=clean(JSON.parse(storage.getItem(KEY)||'[]'));}catch{persistent=false;}
  return {
   list:()=>[...ids],has:id=>ids.includes(id),isPersistent:()=>persistent,
   toggle(id){
    if(!valid.has(id))return false;
    ids=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];
    try{storage.setItem(KEY,JSON.stringify(ids));persistent=true;}catch{persistent=false;}
    return ids.includes(id);
   }
  };
 }
 root.TripSaved={create};
 if(typeof module!=='undefined')module.exports=root.TripSaved;
})(typeof window!=='undefined'?window:globalThis);
