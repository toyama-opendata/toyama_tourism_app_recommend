'use strict';
const D=window.TRIP_DATA;
D.experienceLabels=window.TRIP_EXPERIENCES.labels;
D.spots=D.spots.map(s=>({...s,...window.TRIP_EXPERIENCES.spots[s.name],photo:window.TRIP_PHOTOS[s.name],info:window.TRIP_DETAILS[s.id]}));
const fields=[
 {key:'party',label:'誰と行きますか？',sub:'一緒に旅をする人を教えてください。',options:[['','まだ決めていない'],['4','夫婦'],['5','カップル'],['1','子ども連れ（未就学児）'],['2','子ども連れ（小〜高校生）'],['3','大人の家族'],['6','友人・知人'],['8','ひとり'],['7','団体・ツアー']]},
 {key:'experiences',label:'楽しみたい体験は？（複数選択可）',sub:'いずれかができる場所を候補にし、複数の希望を満たす場所を優先します。',options:Object.entries(D.experienceLabels)},
 {key:'transport',label:'富山では、どう移動しますか？',sub:'県内で使う予定の交通手段を選んでください。',options:[['','まだ決めていない'],['car','車・レンタカー'],['public','鉄道・バス中心（車なし）']]},
 {key:'nights',label:'旅の日数はどれくらい？',sub:'富山県外での宿泊も含む、旅行全体の泊数です。',options:[['','まだ決めていない'],['0','日帰り'],['1','1泊2日'],['2','2泊以上']]},
 {key:'season',label:'いつごろの旅ですか？',sub:'秋・冬の回答は今回の集計にないため、時期を順位に反映しません。',options:[['','まだ決めていない'],['1','春（3〜5月）'],['2','夏（6〜8月）'],['3','秋（9〜11月）'],['4','冬（12〜2月）']]},
 {key:'age',label:'年代を教えてください',sub:'任意の質問です。「回答しない」でもおすすめできます。',options:[['','回答しない'],['young','10〜30代'],['middle','40〜50代'],['senior','60代以上']]}
];
const prefs=Object.fromEntries(fields.map(f=>[f.key,f.key==='experiences'?[]:'']));
let mode=new URLSearchParams(location.search).get('mode')==='quiz'?'quiz':'filter',step=0,lastRanked=[],shown=false;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function label(key,value){return fields.find(f=>f.key===key)?.options.find(o=>o[0]===value)?.[1]||value;}
function groupLabel(key){if(key==='first')return '初めて富山を訪れた';const [k,v]=key.split(':');return label(k,v);}
function renderPanel(){
 for(const m of ['filter','quiz']){const b=$('#tab-'+m);b.setAttribute('aria-selected',String(mode===m));b.tabIndex=mode===m?0:-1;}
 $('#panel').setAttribute('aria-labelledby','tab-'+mode);
 if(mode==='filter'){
  $('#panel').innerHTML=`<form id="filters"><div class="form-grid">${[fields[1],fields[0],...fields.slice(2)].map(f=>f.key==='experiences'?`<fieldset class="experience-field"><legend>${f.label}</legend><p>${f.sub}</p><div class="experience-options">${f.options.map(([v,t])=>`<label><input type="checkbox" name="experiences" value="${v}" ${prefs.experiences.includes(v)?'checked':''}> ${esc(t)}</label>`).join('')}</div></fieldset>`:`<label for="${f.key}">${f.label}${f.key==='age'?'<small>任意</small>':''}<select id="${f.key}" name="${f.key}">${f.options.map(([v,t])=>`<option value="${v}" ${prefs[f.key]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`).join('')}</div><div class="actions"><p>すべて未定でも探せます。<br>泊数は旅行全体。春は4〜5月、夏は6〜8月の回答を参考にします。</p><button type="button" class="text-button" id="reset">条件をリセット</button><button class="primary" type="submit">おすすめを見る →</button></div></form>`;
  $('#filters').addEventListener('change',e=>{if(e.target.name==='experiences')prefs.experiences=[...document.querySelectorAll('[name=experiences]:checked')].map(x=>x.value);else prefs[e.target.name]=e.target.value;invalidate();});
  $('#filters').addEventListener('submit',e=>{e.preventDefault();showResults();});
  $('#reset').onclick=()=>{for(const f of fields)prefs[f.key]=f.key==='experiences'?[]:'';step=0;invalidate();renderPanel();};
 }else{
  const f=fields[step];
  $('#panel').innerHTML=`<div class="quiz-head"><span>あなたの旅を見つける6つの質問</span><span>${step+1} / 6</span></div><div class="progress" aria-hidden="true"><span style="width:${(step+1)/6*100}%"></span></div><h3 class="quiz-title" tabindex="-1">${f.label}</h3><p class="quiz-sub">${f.sub}</p><div class="choices" role="group" aria-label="${f.label}">${f.options.map(([v,t])=>`<button class="choice" data-value="${v}" aria-pressed="${f.key==='experiences'?prefs.experiences.includes(v):prefs[f.key]===v}">${esc(t)}</button>`).join('')}</div><div class="actions"><button class="secondary" id="back" ${step===0?'disabled':''}>← 戻る</button><button class="primary" id="next">${step===5?'おすすめを見る →':'次へ →'}</button></div>`;
  document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{if(f.key==='experiences'){const v=b.dataset.value;prefs.experiences=prefs.experiences.includes(v)?prefs.experiences.filter(x=>x!==v):[...prefs.experiences,v];}else prefs[f.key]=b.dataset.value;invalidate();document.querySelectorAll('.choice').forEach(c=>c.setAttribute('aria-pressed',String(f.key==='experiences'?prefs.experiences.includes(c.dataset.value):c===b)));});
  $('#back').onclick=()=>{step--;renderPanel();$('.quiz-title').focus();};
  $('#next').onclick=()=>{if(step<5){step++;renderPanel();$('.quiz-title').focus();}else showResults();};
 }
}
function invalidate(){shown=false;lastRanked=[];$('#results').hidden=true;}
function changeMode(m){mode=m;renderPanel();}
for(const m of ['filter','quiz']){
 $('#tab-'+m).onclick=()=>changeMode(m);
 $('#tab-'+m).onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'filter':e.key==='End'?'quiz':mode==='filter'?'quiz':'filter';changeMode(next);$('#tab-'+next).focus();}};
}
function photoMarkup(s,detail=false){
 const p=s.photo;if(!p)return detail?'':`<div class="art ${s.kind==='art'?'artwork':s.kind||'town'}" aria-hidden="true"><span class="rank">おすすめ候補</span></div>`;
 const img=detail?p.detail:p.card;
 return `<figure class="spot-photo ${detail?'detail-photo':''}"><img src="${esc(img.src)}" alt="${esc(p.alt)}" width="${img.width}" height="${img.height}" loading="lazy" decoding="async">${p.credit?`<figcaption>${esc(p.credit)}</figcaption>`:''}</figure>`;
}
function description(s){return s.info?.summary||s.description||`${s.area}で訪問実績のある旅先です。紹介文・アクセス情報は確認中のため、地図や公式観光案内で詳細をご確認ください。`;}
function evidence(s){
 const e=s.evidence;
 if(!e)return `訪問者全体 ${s.baseN.toLocaleString()}件の回答を参考にしています。条件別の根拠が少ない場合は全体傾向で補います。`;
 return `「${esc(groupLabel(e.key))}」の訪問者 ${e.n.toLocaleString()}件のうち、旅行全体に満足した回答は <strong>${Math.round(e.good/e.n*100)}%</strong>。`;
}
function showResults(){
 lastRanked=TripEngine.recommend(D,prefs);shown=true;
 const chosen=fields.flatMap(f=>f.key==='experiences'?prefs.experiences.map(v=>label(f.key,v)):prefs[f.key]?[label(f.key,prefs[f.key])]:[]);
 $('#summary').textContent=(chosen.length?chosen.join(' / '):'条件未定：初来訪者を少し重視した全体の傾向')+'。選んだ体験が結果全体で揃うように候補を選んでいます。表示順は、あなたへの適合度の順位ではありません。交通条件は順位の参考であり、到達可否・移動時間は未検証です。';
 $('#season-note').hidden=!['3','4'].includes(prefs.season);
 $('#season-note').textContent='秋・冬の回答を含まない試作データです。春・夏の統計から候補を表示しています。確認できた一部の季節限定スポットは候補から除きますが、営業期間・運行状況は必ず公式情報で確認してください。';
 const recommendations=TripEngine.selectRecommendations(lastRanked);
 $('#results-title').textContent=recommendations.length?`あなたの旅先候補 ${recommendations.length}件`:'条件に合う旅先を探しましょう';
 const covered=new Set(recommendations.flatMap(s=>s.matchedExperiences));
 const missing=prefs.experiences.filter(k=>!covered.has(k));
 if(missing.length)$('#summary').textContent+=' 現在の分類・条件では主候補がない体験：'+missing.map(k=>D.experienceLabels[k]).join(' ／ ')+'。';
 $('#cards').innerHTML=recommendations.map(s=>`<article class="card">${photoMarkup(s)}<div class="card-content"><span class="area">${esc(s.area)}</span><h3>${esc(s.name)}</h3><p>${esc(description(s))}</p>${s.matchedExperiences.length?`<ul class="experience-chips" aria-label="希望に合う体験">${s.matchedExperiences.map(k=>`<li>${esc(D.experienceLabels[k])}</li>`).join('')}</ul>`:''}${s.info?.note?`<p class="planning-note">${esc(s.info.note)}</p>`:''}<div class="card-actions"><button class="card-button" data-detail="${s.id}">詳しく見る →</button>${saveButton(s)}</div></div></article>`).join('')||'<p class="notice">選んだ体験・条件に合う主候補がありません。体験や季節の条件を変えてお試しください。</p>';
 $('#results').hidden=false;$('#results').focus();$('#results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
function sourceLinks(s){return (s.info?.sources||[]).map((url,i)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">とやま観光ナビ${i?'（関連施設）':''} ↗</a>`).join('');}
function basicInfo(s){
 const info=s.info||{};
 return `<dl class="basic-info">${[['所在地',info.address],['時間',info.hours],['休業日',info.closed],['料金の目安',info.fee],['アクセス',info.access]].map(([key,value])=>`<div><dt>${key}</dt><dd>${esc(value||'掲載情報では未確認。公式案内をご確認ください。')}</dd></div>`).join('')}</dl><p class="fine">情報参照日：${esc(info.checked||'未確認')}（${esc(info.verification||'未確認')}）。料金は通常の個人料金の目安です。減免・特別営業等は公式案内でご確認ください。</p>`;
}
function openDetail(id){
 const s=lastRanked.find(s=>s.id===id)||D.spots.find(s=>s.id===id);if(!s)return;
 const r=TripEngine.together(D,id,prefs);
 $('#detail-body').innerHTML=`<p class="eyebrow">${esc(s.area)}</p><h2 class="dialog-title">${esc(s.name)}</h2>${saveButton(s)}${photoMarkup(s,true)}<p>${esc(description(s))}</p>${s.info?.note?`<p class="notice">${esc(s.info.note)}</p>`:''}<h3>旅行前に知っておきたいこと</h3>${basicInfo(s)}<div class="links">${sourceLinks(s)}${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">施設・地域の公式案内 ↗</a>`:''}<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((s.info?.address||'富山県')+' '+s.name)}" target="_blank" rel="noopener noreferrer">地図を見る ↗</a></div><details><summary>この旅先を提案した根拠</summary><p>${s.baseN?evidence(s):'この場所は訪問者アンケートの対象地点です。現在の検索条件で選ばれた主候補とは限りません。'}</p><p>満足度は旅行全体の評価です。この地点そのものの評価や、あなたの満足確率ではありません。各条件は別々の集計で、全条件に同時に一致する訪問者の割合ではありません。</p></details><h3>一緒に検討したい場所</h3><p class="fine">同じ回答で訪問が記録された場所です。近さや訪問順を示すルートではありません。</p>${r.length?`<ul>${r.map(x=>`<li><button class="text-button" data-detail="${x.id}">${esc(x.name)}</button></li>`).join('')}</ul>`:'<p>十分な回答数の組み合わせがありません。</p>'}`;
 if(!$('#detail').open)$('#detail').showModal();
 $('#detail').scrollTop=0;
}
$('#close-detail').onclick=()=>$('#detail').close();
$('#edit').onclick=()=>{$('#panel').scrollIntoView({behavior:'smooth'});$('#panel').querySelector('input,select,button').focus();};
$('#method-text').innerHTML=`<p>${D.period}の県外在住者 ${D.n.toLocaleString()}件（初来訪 ${D.first.toLocaleString()}件）を使用しています。調査に含まれる47地点・エリアが対象で、富山のすべての観光地を網羅するものではありません。</p><ol><li>希望する体験が○の地点を主候補にし、選んだ体験を結果全体でカバーするよう選びます。まだ含まれていない体験を多く補う候補から選び、同数なら体験の一致数、統計スコアの順に比較します。通常5件までですが、希望のカバーに必要なら増やします。表示順は適合度ランキングではありません。△は原則として主候補の判定に使いません。ただし春の四重奏は、春を選んだ場合に景色・自然の候補に含めます。体験未選択なら全体から探します。同数の場合は同行者・交通手段・旅行全体の泊数・季節・年代の条件別集計を組み合わせます。初来訪者を少し重視します。</li><li>同じ体験一致数の候補について、条件に合う人に訪問されやすい傾向、回答数、旅行全体の満足度を合わせて順位を付けます。各条件は別々の集計で、全条件一致の集計ではありません。</li><li>10件未満の条件別データは使いません。満足割合を表示する条件別集計には30件以上を必要とします。少数回答の順位への影響は全体傾向で緩和します。</li></ol><p>任意回答のアンケートなので、回答場所や回答者の偏りがあります。満足度から訪問先の効果は断定できません。秋・冬の推薦精度、施設の営業可否、交通経路はこの試作では検証していません。</p><p>入力はブラウザー内だけで処理します。個票や自由記述の原文は配信せず、集計値だけを使用しています。入力履歴やアクセス解析は送信しません。「気になる場所」はこのブラウザーに保存します。別の端末とは同期せず、ブラウザーのデータを消去すると保存も消えます。</p>`;
renderPanel();

let localStore;
try{localStore=window.localStorage;}catch{localStore=null;}
const saved=TripSaved.create(D.spots.map(s=>s.id),localStore);
let comparison=[];
function saveButton(s){return `<button class="save-button" data-save="${s.id}" aria-pressed="${saved.has(s.id)}" aria-label="${esc(s.name)}を気になる場所${saved.has(s.id)?'から削除':'に保存'}">${saved.has(s.id)?'✓ 保存済み':'＋ 気になる'}</button>`;}
function renderSaved(){
 const ids=saved.list();comparison=comparison.filter(id=>ids.includes(id));
 $('#saved-count').textContent=ids.length;
 $('#saved-list').innerHTML=ids.length?ids.map(id=>{
  const s=D.spots.find(s=>s.id===id);
  return `<li><label><input type="checkbox" data-compare="${id}" ${comparison.includes(id)?'checked':''}> 比較</label><button class="text-button" data-detail="${id}">${esc(s.name)}</button><button class="text-button" data-save="${id}" aria-label="${esc(s.name)}を保存から削除">削除</button></li>`;
 }).join(''):'<li class="empty-saved">候補の「＋ 気になる」で保存できます。条件を変えて探しても、ここに残ります。</li>';
 $('#compare-open').disabled=comparison.length<2;
 $('#compare-open').textContent=`選んだ${comparison.length}件を比較`;
 $('#storage-note').textContent=saved.isPersistent()?'このブラウザーに保存します。ログイン不要・他端末との同期はありません。':'ブラウザーへの保存が使えないため、この画面を開いている間だけ保持します。';
 document.querySelectorAll('.save-button').forEach(b=>{
  const id=Number(b.dataset.save),s=D.spots.find(s=>s.id===id),active=saved.has(id);
  b.textContent=active?'✓ 保存済み':'＋ 気になる';b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',s.name+'を気になる場所'+(active?'から削除':'に保存'));
 });
}
document.addEventListener('click',e=>{
 const save=e.target.closest('[data-save]'),detail=e.target.closest('[data-detail]');
 if(save){
  const id=Number(save.dataset.save),inShelf=!!save.closest('#saved-list'),active=saved.toggle(id);
  renderSaved();$('#saved-status').textContent=active?'気になる場所に保存しました。':'保存から削除しました。';
  if(inShelf)$('#saved-title').focus();
 }else if(detail){if($('#compare-dialog').open)$('#compare-dialog').close();openDetail(Number(detail.dataset.detail));}
});
$('#saved-list').addEventListener('change',e=>{
 const b=e.target.closest('[data-compare]');if(!b)return;const id=Number(b.dataset.compare);
 if(b.checked&&comparison.length===3){b.checked=false;$('#saved-status').textContent='比較は3件まで選べます。選択中の場所を外してから追加してください。';return;}
 comparison=b.checked?[...comparison,id]:comparison.filter(x=>x!==id);
 $('#compare-open').disabled=comparison.length<2;$('#compare-open').textContent=`選んだ${comparison.length}件を比較`;
 $('#saved-status').textContent=`比較する場所を${comparison.length}件選択しました。`;
});
$('#compare-open').onclick=()=>{
 const spots=comparison.map(id=>D.spots.find(s=>s.id===id));
 const rows=[['できること',s=>description(s)],['主な体験',s=>(s.confirmed||[]).map(k=>D.experienceLabels[k]).join(' ／ ')],['所在地',s=>s.info.address],['アクセス',s=>s.info.access],['時間',s=>s.info.hours],['休業日',s=>s.info.closed],['料金の目安',s=>s.info.fee],['計画のポイント',s=>s.info.note]];
 $('#comparison-body').innerHTML=`<p class="fine">保存した候補を同じ項目で比較します。表示順は保存した候補の選択順で、優劣を示しません。</p><div class="comparison-scroll" tabindex="0" role="region" aria-label="観光地の比較表。狭い画面では横にスクロールできます"><table class="comparison-table"><caption>気になる場所 ${spots.length}件の比較</caption><thead><tr><th scope="col">比べる項目</th>${spots.map(s=>`<th scope="col">${esc(s.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([title,value])=>`<tr><th scope="row">${title}</th>${spots.map(s=>`<td>${esc(value(s)||'公式案内で確認')}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">詳細・出典</th>${spots.map(s=>`<td><button class="text-button" data-detail="${s.id}">詳細を見る</button>${sourceLinks(s)}</td>`).join('')}</tr></tbody></table></div><p class="fine">情報参照日：2026-10-29。営業時間・料金・運行状況は予約前に公式情報で確認してください。</p>`;
 $('#compare-dialog').showModal();
};
$('#close-compare').onclick=()=>$('#compare-dialog').close();
renderSaved();
