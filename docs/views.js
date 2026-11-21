(function(root){
"use strict";
const E=root.PB,D=root.PBData;
function esc(v){return String(v??'—').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function btn(action,label,style='secondary',value='',disabled=false){return '<button class="'+style+'" data-act="'+esc(action)+'" data-value="'+esc(value)+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';}
function tag(value,level='info'){return '<span class="chip '+esc(level)+'">'+esc(value)+'</span>';}
function termReading(en,zh,element='span'){
 return `<${element} class="only-en" lang="en" data-keep-language>${esc(en)}</${element}><${element} class="only-zh" lang="zh-CN" data-keep-language>${esc(zh)}</${element}>`;
}
function field(k,v,zh){
 const value=zh===undefined?esc(v??'Ask seller'):termReading(v,zh);
 return '<div class="field"><small>'+esc(k)+'</small><div>'+value+'</div></div>';
}
function money(n){return Number.isFinite(n)?'$'+n:'Unknown';}
function dayCount(n){return n+(Number(n)===1?' day':' days');}
function eta(n){return n===42?'6 weeks':Number.isFinite(n)?dayCount(n):'Unknown';}
function cap(k,h,p){return '<header class="viewhead"><div class="kicker">'+esc(k)+'</div><h1>'+esc(h)+'</h1><p>'+esc(p)+'</p></header>';}
const steps=['Listing','Typed claims','Translation','Checks','Verdict','Anchor','Follow-up'];
const titles=['','Paste a listing.','Read the typed claims.','Translate the evidence.','Check the claims.','Verified first, fastest second.','Anchor the evidence.','Ask the seller.'];
const desc=['','Start with Ava’s sample or paste the original text.','Compare source fields and identify what the seller still needs to confirm.','Collector shorthand stays attached to the original words.','Compare the scratch code and batch to the simulated registry.','The original-run gate requires an unused code, a matching batch and seller attestation.','Prepare a hash-only record for Base Sepolia.','Use the record to draft specific questions in English and Chinese.'];
function trace(s){
 const rows=s.tape.rows, tail=rows.at(-1);let status=s.integrity?.ok===false?'Broken at '+rows[s.integrity.brokenAt]?.id:'Hash linked';
 return '<div class="railHead"><div class="railTop"><h2>Claim tape</h2><span class="count">'+rows.length+' records</span></div><div class="railMeta '+(s.integrity?.ok===false?'bad':'')+'">● '+esc(status)+' · SHA-256</div></div><div class="railList">'+rows.slice().reverse().map((c,i)=>'<button class="railrow '+esc(c.kind)+' '+(s.integrity?.ok===false&&rows.length-1-i>=s.integrity.brokenAt?'fail':'')+'" data-act="claim" data-value="'+esc(c.id)+'"><i></i><span><code>'+esc(c.id)+'</code><br><small>'+esc(c.kind)+'</small></span><em>'+esc(c.hash.slice(0,8))+'</em></button>').join('')+'</div><div class="railfoot"><strong>CURRENT ROOT</strong>'+esc(tail?.hash||E.zero)+'</div>';
}
function stage(s){
 let body=stages[s.stage](s);
 return '<div class="stepbar" aria-label="Journey">'+steps.map((n,i)=>btn('stage',String(i+1).padStart(2,'0')+' '+n,i+1===s.stage?'current':'',i+1)).join('')+'</div><div class="stagehead"><div><div class="kicker">Ava’s tape / Exciting Macaron</div><h1>'+titles[s.stage]+'</h1><p>'+desc[s.stage]+'</p></div>'+tag('Sample data')+'</div>'+body+
 '<div class="stageNav"><span class="stepCount">S'+s.stage+' / S7</span><div>'+btn(s.stage===1?'home':'stage',s.stage===1?'Overview':'Back','quiet',s.stage-1)+' '+(s.stage<7?btn('stage','Next · '+steps[s.stage],'primary',s.stage+1):btn('view','Open audit','primary','Audit'))+'</div></div>';
}
function source(s){return s.custom?.source||D.offers.find(o=>o.key===s.primary).source;}
function current(s){return s.evals.rows.find(o=>o.key===s.inspect)||s.evals.rows[0];}
function highlight(raw,terms){
 const spans=[...terms].sort((a,b)=>a.start-b.start);let cursor=0,html='';
 for(const {start,end} of spans){
  if(start<cursor)continue;
  html+=esc(raw.slice(cursor,start))+`<mark title="${start}–${end}">${esc(raw.slice(start,end))}</mark>`;
  cursor=end;
 }
 return html+esc(raw.slice(cursor));
}
function listingPassage(raw,parsed,editable=false){
 const chinese=parsed.language==='zh';
 const originalLang=chinese?'zh-CN':'en',other=chinese?'en':'zh';
 const original=`<div class="source" lang="${originalLang}">${highlight(raw,parsed.terms)}</div>`;
 const translation=D.listingText(raw)?.[other];
 const preview=`<div class="only-${parsed.language}"><span class="subcap">Source text</span>${original}</div>
  <div class="only-${other}"><span class="subcap">Translation</span>${translation
   ? `<div class="source" lang="${chinese?'en':'zh-CN'}">${esc(translation)}</div>`
   : '<p class="note">Only the original text is available for this listing.</p>'}</div>`;
 if(editable){
  const label=chinese?'View or edit original Chinese':'View or edit original English';
  return preview+`<details><summary>${label}</summary><textarea id="sourceText" lang="${originalLang}" maxlength="12000" aria-label="Listing text">${esc(raw)}</textarea></details>`;
 }
 const label=chinese?'Show original Chinese':'Show original English';
 return preview+`<details class="only-${other}"><summary>${label}</summary>${original}</details>`;
}
function listingStage(s){
 const raw=source(s),parsed=E.parse(raw);
 const samples=['resale-a','amazon','official'].map(key=>{
  const offer=D.offers.find(o=>o.key===key);
  return btn('sample',offer.name,'pill '+(s.primary===key&&!s.custom?'active':''),key);
 }).join('');
 return `<div class="panel"><h3>Choose the text to trace</h3><div class="chips">${samples}</div>
  ${listingPassage(raw,parsed,true)}
  <div class="controls">${btn('useText','Use this text','secondary')}<span class="note">Detected ${parsed.language==='zh'?'Chinese':'English'} · Local text only</span></div></div>`;
}
const fieldTerms=[...D.glossary,['绿葡萄','Green Grape'],['未拆封','sealed'],['散货','loose']];
function parsedField(label,value){
 if(typeof value==='string'&&['Character','Edition','Seal state','ETA'].includes(label)){
  const spelling=value.toLowerCase().replace(/^first-edition$/,'first edition');
  const term=fieldTerms.find(([zh,en])=>value===zh||spelling===en.toLowerCase());
  if(term)return field(label,term[1],term[0]);
  if(label==='ETA'){
   const days=spelling.match(/^(\d+)\s*(?:天|days?)$/);
   if(days)return field(label,dayCount(days[1]));
   if(spelling==='six weeks')return field(label,'6 weeks');
  }
 }
 return field(label,value);
}
function claimsStage(s){
 const raw=source(s),p=E.parse(raw),offer=s.custom||D.offers.find(o=>o.key===s.primary);
 const values=Object.entries({'Series':p.series,'Character':p.character,'Edition':p.edition,'Seal state':p.seal,'Batch stamp':p.batch,'Scratch code':p.code,'Seller':offer.seller,'Price · USD':p.price,'Shipping':p.shipping,'Duties':p.duty,'ETA':p.eta});
 const missing=values.filter(([,v])=>v==null).map(([label])=>label);
 const note=missing.length?'Ask the seller to confirm: '+missing.join(', ')+'.':'All listed fields have a source value. Verification follows.';
 return `<div class="split"><div class="panel"><span class="subcap">Extracted fields</span>
  <div class="fieldgrid">${values.map(([label,value])=>parsedField(label,value)).join('')}</div></div>
  <div class="panel">${listingPassage(raw,p)}<p class="note">${esc(note)}</p></div></div>`;
}
function translationStage(s){
 const raw=source(s),parsed=E.parse(raw);
 const glosses=parsed.terms.map(({term,meaning,note,start,end})=>
  `<div class="gloss">${termReading(meaning,term,'b')}<br><span>${esc(note)} · span ${start}–${end}</span></div>`
 ).join('');
 return `<div class="split"><div class="panel">${listingPassage(raw,parsed)}
  ${glosses?'<p class="note">Highlights point to character offsets in the source.</p>':''}</div>
  <div class="panel"><span class="subcap">Collector glossary</span>${glosses||'<p>No glossary terms matched this listing.</p>'}
  <div class="controls">${btn('glossary','Full glossary','mini')}</div></div></div>`;
}
// Keep each translatable part separate from identifiers and punctuation.
function parts(values,separator=' · '){return values.map(value=>'<span>'+esc(value)+'</span>').join(separator);}
function draftQuestions(language){
 const questions=D.questions[language].map(q=>'<li>'+esc(q)+'</li>').join('');
 return `<ol class="draft" lang="${language==='en'?'en':'zh-CN'}" data-keep-language>${questions}</ol>`;
}
function sellerDraft(language){
 return draftQuestions(language)+btn('copyDraft',language==='en'?'Copy English draft':'Copy Chinese draft','mini',language);
}
function followUpStage(){
 return '<div class="panel"><h3>Questions for the seller</h3>'+['en','zh'].map(language=>{
  const other=language==='en'?'zh':'en';
  return `<div class="only-${language}">${sellerDraft(language)}
   <details><summary>${other==='zh'?'Show Chinese draft':'Show English draft'}</summary>${sellerDraft(other)}</details></div>`;
 }).join('')+'</div>';
}
const stages={
 1:listingStage,
 2:claimsStage,
 3:translationStage,
 4:s=>{
  const o=current(s);
  const offers=s.evals.rows.map(x=>btn('inspect',x.name,'pill '+(o.key===x.key?'active':''),x.key)).join('');
  const checks=o.checks.map(c=>`<div class="check"><div>${esc(c.label)}<small>${esc(c.value)}</small></div>${tag(c.level,c.level)}</div>`).join('');
  return `<div class="panel"><div class="chips">${offers}</div>
   <div class="metaLine"><h2>${parts([o.name,money(o.price)])}</h2>${tag('SIMULATED registry')}</div>
   <div class="result ${o.qualified?'':'bad'}"><span class="subcap">Scratch-code registry</span>
   <h2>${parts([o.code||'Missing code',o.codeState.toUpperCase()])}</h2>
   <p>${o.qualified?'First-edition batch matches the sample registry.':'This offer cannot clear the first-edition gate.'}</p></div>
   <div class="checks">${checks}</div></div>`;
 },
 5:s=>{
  const win=s.evals.winner;
  const headline=win?parts([win.name,money(win.price),eta(win.days)]):'Hold off';
  const say=t=>'<span>'+esc(t)+'</span>';
  let verdict=say('No offer met all three conditions. Request code, batch and seal photos.')+' '+say('Recheck the official channel when verified stock is available.');
  if(win){
   const alt=s.evals.alternative,budget=220,notes=[];
   notes.push(say('Fastest verified sample: '+win.name+' at '+money(win.price)+', '+eta(win.days)+' to arrive.'));
   if(Number.isFinite(win.price)&&win.price>budget)notes.push(say('That is $'+(win.price-budget).toFixed(2)+' over Ava’s $'+budget+' savings.'));
   if(alt&&alt.key!==win.key)notes.push(say('The '+money(alt.price)+' '+alt.name+' is a later restock with a '+eta(alt.days)+' wait.'));
   verdict=notes.join(' ');
  }
  const rows=s.evals.rows.map(o=>{
   const gate=o.qualified?'Eligible':o.key==='official'&&o.codeState==='unused'?'Later restock':o.level==='warn'?'Review':'Rejected';
   return `<tr class="${win?.key===o.key?'selected':''}"><td><button data-act="inspectOffer" data-value="${esc(o.key)}">${esc(o.name)}</button></td>
    <td>${parts([money(o.price),eta(o.days)],' / ')}</td><td>${esc(o.codeState)}</td><td>${esc(o.stamp)}</td>
    <td>${Math.round(o.score*100)}%</td><td>${tag(gate,o.qualified?'pass':o.level)}</td></tr>`;
  }).join('');
  return `<div class="panel"><div class="result ${win?'':'bad'}"><span class="subcap">Cross-channel verdict</span><h2>${headline}</h2><p>${verdict}</p></div>
   <div class="tablewrap"><table class="datatable"><thead><tr><th>Offer</th><th>Price / ETA</th><th>Code</th><th>Batch</th><th>Claim confidence</th><th>Gate</th></tr></thead><tbody>${rows}</tbody></table></div>
   <div class="controls">${btn('scenario',s.allFail?'Restore sample offers':'Try all-fail scenario','mini')}</div>
   ${win?'':'<div class="only-en">'+draftQuestions('en')+'</div><div class="only-zh">'+draftQuestions('zh')+'</div>'}</div>`;
 },
 6:s=>{const a=s.tape.rows.find(c=>c.id==='PB-A-01');return '<div class="panel"><span class="subcap">Base Sepolia · chain 84532</span><h2>Anchor a tape checkpoint</h2><p>Only the hash of this prefix and its request ID leave the console in a live transaction.</p><div class="controls">'+tag('DRY-RUN','warn')+'</div><span class="subcap">Exact calldata · UTF-8</span><code class="hex">'+esc(a?.facts.calldata)+'</code><p class="note">Checkpoint covers '+esc(a?.facts.count)+' claims. New claims extend the tape after this anchor.</p><div class="controls">'+btn('copyAnchor','Copy calldata','mini')+(s.localBackend?btn('anchorLive','Review optional testnet transaction','mini','',!s.options?.chainOn)+(s.options.chainOn?'':'<span class="note">Enable testnet access in integration settings.</span>'):'')+'</div></div>';},
 7:followUpStage
};
function audit(s){
 const f=s.filters,rows=s.tape.rows.filter(c=>(!f.kind||c.kind===f.kind)&&(!f.actor||c.actor.role===f.actor)&&(!f.severity||c.severity===f.severity));
 const selector=(key,values)=>'<label>'+esc(key)+'<select data-filter="'+key+'"><option value="">All</option>'+values.map(v=>'<option value="'+esc(v)+'" '+(f[key]===v?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>';
 const r=s.integrity;return cap('Audit view','Inspect the chain.','Recompute every SHA-256 link and verify available actor signatures. Edit the sample copy to see exactly where the first mismatch occurs.')+
 '<div class="panel"><div class="result '+(r?.ok===false?'bad':'')+'"><span class="subcap">Integrity status</span><h2>'+esc(r?.ok===false?'Broken at '+s.tape.rows[r.brokenAt]?.id:r?.ok?'Verified · '+r.checked+' records':'Ready to verify')+'</h2><p>'+esc(r?.ok===false?'The stored digest and its content disagree. Subsequent records depend on this link.':r?.signed?'SHA-256 links and local sample actor signatures passed.':'Each row exposes its canonical content, source and parent hash.')+'</p></div><div class="controls">'+btn('verify','Verify chain','primary')+btn('tamper','Tamper one byte','secondary','',s.tampered)+btn('restore','Restore','secondary','',!s.tampered)+'</div><div class="controls">'+selector('kind',[...new Set(s.tape.rows.map(c=>c.kind))])+selector('actor',[...new Set(s.tape.rows.map(c=>c.actor.role))])+selector('severity',['info','warn','fail'])+'</div><div class="tablewrap"><table class="datatable"><thead><tr><th>ID</th><th>Kind</th><th>Actor</th><th>Severity</th><th>SHA-256</th></tr></thead><tbody>'+rows.map(c=>'<tr class="'+(r?.ok===false&&s.tape.rows.indexOf(c)===r.brokenAt?'broken':'')+'"><td>'+btn('claim',c.id,'quiet',c.id)+'</td><td>'+esc(c.kind)+'</td><td>'+esc(c.actor.role)+'</td><td>'+tag(c.severity,c.severity)+'</td><td><code>'+c.hash.slice(0,10)+'</code></td></tr>').join('')+'</tbody></table>'+(rows.length?'':'<div class="listempty">No records match these filters.</div>')+'</div></div>';
}
function network(s){
 const evidence=s.tape.rows.filter(c=>c.id.startsWith('PB-D-')||c.id.startsWith('PB-AT-'));
 return cap('Network view','Who can challenge a claim?','Three roles can contribute evidence to the same tape. Stakes and registry entries are illustrative.')+
 '<div class="rolegrid">'+[['Translator','Attaches field meanings to source spans.'],['Verifier','Checks codes, batch marks and seller status.'],['Challenger','Disputes an unsupported claim with evidence.']].map(([h,p])=>'<section class="panel"><h3>'+h+'</h3><p>'+p+'</p></section>').join('')+'</div><div class="panel"><span class="subcap">Sample dispute</span><h2>“Officially authorized”</h2><p>A resale seller claims an official relationship. A collector can challenge it and a verifier can record the simulated registry result.</p><div class="actions">'+btn('dispute',evidence.length?'View recorded challenge':'Run sample challenge','primary')+'</div>'+evidence.map(c=>'<div class="gloss">'+btn('claim',c.id,'mini',c.id)+' &nbsp;'+esc(c.facts.event)+'</div>').join('')+'<p class="note">Recorded attestations: '+evidence.filter(c=>c.kind==='attestation').length+' · Recorded disputes: '+evidence.filter(c=>c.kind==='dispute').length+' · Stakes are illustrative.</p></div>';
}
function evolve(s){
 const names=['Cluster errors','Generate probes','Update rubric','Rescore cases','Check held-out set','Append version'];
 return cap('Version evaluation','Replay a recorded improvement cycle.','Thirty fixture cases track five failure types. A version joins the tape only after the twenty held-out cases pass the regression guard.')+'<div class="panel"><span class="subcap">Recorded cycle · mean rubric score</span><div class="metrics">'+D.versions.map((v,i)=>'<div class="bar" style="height:'+v+'%"><span>v'+i+'</span><b>'+v+'</b></div>').join('')+'</div><div class="controls">'+btn('cycle',s.cycle?'Running…':s.version>=3?'All versions recorded':'Run improvement cycle','primary','',Boolean(s.cycle)||s.version>=3)+'<span class="note">'+esc(s.cycle?names[s.cycle-1]:'Accepted version v'+s.version)+'</span></div><div class="tablewrap"><table class="datatable matrix"><thead><tr><th>Case / taxonomy</th><th>Split</th>'+D.versions.map((v,i)=>'<th>v'+i+'</th>').join('')+'</tr></thead><tbody>'+D.matrix.map(x=>'<tr><td>'+esc(x.name)+' <small class="muted">/ '+x.category+'</small></td><td>'+esc(x.heldOut?'Held-out':'Development')+'</td>'+x.scores.map(n=>'<td class="cellscore">'+n+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></div>';
}
root.PBViews={esc,btn,tag,field,money,eta,cap,steps,stage,trace,audit,network,evolve,source};
})(globalThis);
