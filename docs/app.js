(function(){
'use strict';
const E=PB,D=PBData,V=PBViews,$=id=>document.getElementById(id);
const requestId='ava-green-grape';
const newComparison=()=>({picked:[],submitted:false,activeId:null});
const state={localBackend:localBackend(),supplier:'A',brief:D.brief,comparisons:{sourcing:newComparison(),collector:newComparison()},view:'Tape',stage:0,built:0,primary:'resale-a',inspect:'resale-a',custom:null,allFail:false,tape:new E.Tape(),
  evals:E.lineup(),integrity:null,tampered:false,filters:{kind:'',actor:'',severity:''},version:0,cycle:0,options:loadOptions(),tests:[]};
const optionsKey='postbabel-optional-v1'; // keys are kept only for this tab session
function loadOptions(){try{return JSON.parse(sessionStorage.getItem('postbabel-optional-v1')||'{}');}catch{return {};}}
function storeOptions(){sessionStorage.setItem(optionsKey,JSON.stringify(state.options));}
let active=Promise.resolve(),cycleTimer=null,noticeTimer=null;
function enqueue(fn){active=active.then(fn).catch(err=>{notice(err?.message||'Action failed');console.error('PostBabel action failed:',err?.name||'Error');});return active;}
function notice(text){$('notice').textContent=text;PBLocale.apply($('notice'));$('notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('visible'),3200);}
function openDialog(title,html){$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;PBLocale.apply($('dialog'));if(!$('dialog').open)$('dialog').showModal();}
function closeDialog(){if($('dialog').open)$('dialog').close();}
async function copy(text){try{await navigator.clipboard.writeText(text);notice('Copied to clipboard');}catch{openDialog('Copy text','<textarea readonly aria-label="Text to copy">'+V.esc(text)+'</textarea>');$('dialogBody').querySelector('textarea').select();}}
function render(){
 document.body.dataset.view=state.view;document.body.dataset.stage=String(state.stage);
 const story=state.view==='Tape'&&state.stage===0;
 document.body.dataset.layout=story?'story':'workspace';
 const about=document.querySelector('.footerTools [data-act="settings"]');
 if(about){about.textContent=state.localBackend?'Integration settings':'About PostBabel';PBLocale.apply(about);}
 $('views').hidden=story;$('sectionNav').hidden=!story;$('rail').hidden=story;
 $('views').innerHTML=story?'':['Tape','Audit','Network','Evolve'].map(n=>V.btn('view',n,n===state.view?'on':'',n)).join('');
 const draw={Tape:()=>state.stage?V.stage(state):PBStory.home(state),Audit:()=>V.audit(state),Network:()=>V.network(state),Evolve:()=>V.evolve(state),
  Selftest:()=>V.cap('Diagnostics','Protocol self-test.','Fixed synthetic records, independent expected digests, deterministic decisions and reversible integrity checks.')+'<div class="panel" id="selftests">'+state.tests.map(t=>'<div class="test"><span>'+V.esc(t.name)+'</span>'+V.tag(t.ok?'PASS':'FAIL',t.ok?'pass':'fail')+'</div>').join('')+'</div>'};
 $('work').innerHTML=draw[state.view]();$('rail').innerHTML=story?'':V.trace(state);
 for(const id of ['views','work','rail'])PBLocale.apply($(id));
 const step=$('work').querySelector('.stepbar button.current');
 if(step){
  const bar=step.parentElement;
  if(bar.scrollWidth>bar.clientWidth){
   const offset=step.getBoundingClientRect().left-bar.getBoundingClientRect().left;
   bar.scrollLeft+=offset-(bar.clientWidth-step.offsetWidth)/2;
  }
 }
}
function add(id,kind,role,facts,extra){return state.tape.add(E.claim(id,kind,role,facts,extra));}
function priceFacts(o){return {offer:o.key,price:o.price,currency:'USD',channel:o.channel,source:o.source,etaDays:o.days,code:o.code,batch:o.stamp,seller:o.seller};}
async function reset(seed=state.primary,custom=state.custom,allFail=state.allFail){
 clearInterval(cycleTimer);state.cycle=0;state.version=0;state.primary=seed;state.custom=custom;state.allFail=allFail;state.built=0;state.tampered=false;state.integrity=null;state.tape=new E.Tape();state.stage=0;state.inspect=custom?'custom':seed;
 state.evals=E.lineup(allFail,custom);const source=custom||D.offers.find(x=>x.key===seed);
 await add(source.id,'listing','seller',priceFacts(source),{lang:E.parse(source.source).language});
}
function requireClean(){if(state.tampered)throw Error('Restore the audit copy before adding new evidence.');}
async function appendFor(stage){
 const text=V.source(state),src=state.custom||D.offers.find(o=>o.key===state.primary),p=E.parse(text);
 if(stage===1)return;
 if(stage===2){
  for(const o of state.evals.rows)await add(o.id,'listing','seller',priceFacts(o),{lang:E.parse(o.source).language});
  await add('PB-T-00','translation','translator',{source:src.id,fields:p,mode:'local extraction'}, {lang:'en',span:{doc:src.id,start:0,end:text.length},confidence:.90});
 }else if(stage===3){
  const terms=p.terms.length?p.terms:[{term:text,meaning:'Source is retained as supplied',start:0,end:text.length}];
  for(let i=0;i<terms.length;i++){const x=terms[i];await add('PB-T-'+String(i+1).padStart(2,'0'),'translation','translator',{source:src.id,term:x.term,meaning:x.meaning},{span:{doc:src.id,start:x.start,end:x.end},confidence:p.terms.length ? 0.96 : 0.80});}
 }else if(stage===4){
  const [a,b,,am]=state.evals.rows;
  const ordered=[[a,0],[a,1],[b,0],[b,1],[am,2],[am,4]];
  for(const o of state.evals.rows)for(let i=0;i<o.checks.length;i++)if(!ordered.some(x=>x[0]===o&&x[1]===i))ordered.push([o,i]);
  for(const [i,[offer,index]] of ordered.entries()){
    const c=offer.checks[index];await add('PB-C-'+String(i+1).padStart(2,'0'),'check','verifier',{offer:offer.id,check:c.label,result:c.value,status:c.level,registry:'SIMULATED'},{severity:c.level==='pass'?'info':c.level,confidence:offer.score});
  }
 }else if(stage===5){
  const win=state.evals.winner;await add('PB-V-01','verdict','system',{winner:win?.id||null,action:win?'fastest verified':'hold off',rule:'code unused AND batch matches AND seller attested, then ascending ETA',ranking:state.evals.rows.map(o=>({offer:o.id,eligible:o.qualified,days:o.days,score:o.score}))},{severity:win?'info':'warn'});
 }else if(stage===6){
  const rows=state.tape.rows,root=rows.at(-1).hash;await add('PB-A-01','anchor','system',{mode:'DRY-RUN',chainId:84532,root,count:rows.length,requestId,calldata:E.calldata(root,requestId),txHash:null});
 }else if(stage===7){await add('PB-DR-01','draft','buyer',{en:D.questions.en,zh:D.questions.zh,delivered:false});}
}
async function go(n){
 requireClean();if(!Number.isInteger(n)||n<1||n>7)return;
 if(state.view==='Tape'&&state.stage===1&&n>1&&$('sourceText')){
  const raw=$('sourceText').value.trim();
  if(!raw)throw Error('Paste a listing first.');
  if(raw!==V.source(state)){const known=D.offers.find(o=>o.source===raw);await reset(known?.key||'resale-a',known?null:E.customOffer(raw),state.allFail);}
 }
 for(let k=state.built+1;k<=n;k++){await appendFor(k);state.built=k;}
 state.view='Tape';state.stage=n;state.integrity=null;render();
}
async function claimDetails(id){
 const c=state.tape.rows.find(x=>x.id===id);if(!c)return;
 const proof=state.tape.proofs.get(c.hash);
 const evidence=proof?{algorithm:'ECDSA P-256 / SHA-256',scope:'Locally generated sample actor identity',signature:E.hex(proof.signature),publicKey:await crypto.subtle.exportKey('jwk',proof.publicKey)}:null;
 openDialog(c.id+' / '+c.kind,'<span class="subcap">Canonical claim</span><pre>'+V.esc(JSON.stringify(c,null,2))+'</pre>'+(evidence?'<details><summary>Actor signature and public key</summary><pre>'+V.esc(JSON.stringify(evidence,null,2))+'</pre></details>':'<p class="note">SHA-256 fallback active. Signatures require Web Crypto.</p>'));
}
async function dispute(){
 requireClean();if(state.tape.rows.some(c=>c.id==='PB-D-01'))return claimDetails('PB-D-01');
 const target=D.offers[0];await add(target.id,'listing','seller',priceFacts(target),{lang:'zh'});
 await add('PB-D-01','dispute','challenger',{event:'Collector challenged “officially authorized” on Resale A.',subject:'PB-L-01',stake:'Illustrative only'},{severity:'warn'});
 await add('PB-AT-01','attestation','verifier',{event:'SIMULATED registry lookup found no seller authorization.',dispute:'PB-D-01',window:'Illustrative 48 hours'},{severity:'warn'});
 await add('PB-D-02','dispute','seller',{event:'Seller status corrected to third party; original claim stays visible.',parent:'PB-D-01'});
 await add('PB-AT-02','attestation','verifier',{event:'Dispute upheld. Illustrative stake reduced by one unit.',parent:'PB-D-02',stakeDelta:-1});
 state.integrity=null;render();
}
function runCycle(){
 requireClean();if(state.cycle||state.version>=3)return;state.cycle=1;render();const tape=state.tape;
 cycleTimer=setInterval(()=>enqueue(async()=>{
  if(tape!==state.tape||!state.cycle)return;
  if(state.cycle<6){state.cycle++;render();return;}
  clearInterval(cycleTimer);const from=state.version,to=from+1,held=D.matrix.filter(c=>c.heldOut);
  if(state.tampered||!held.every(c=>c.scores[to]>=c.scores[from])){state.cycle=0;render();return notice('Version withheld by the integrity or held-out guard.');}
  const candidate=tape.rows.at(-1).hash;
  await add('PB-R-'+String(to).padStart(2,'0'),'version','verifier',{version:to,before:D.versions[from],after:D.versions[to],mode:'RECORDED CYCLE',heldOut:held.length,guard:'no individual case regression',previousRoot:candidate,anchorCandidate:true});
  state.version=to;state.cycle=0;state.integrity=null;render();notice('Version accepted · added to claim tape');
 }),2000);
}
function settings(){
 if(!localBackend())return openDialog('About PostBabel','<p>The workspace runs in your browser with simulated quotes and listings. The product photo and series name are credited to <a class="sourceLink" target="_blank" rel="noreferrer" href="'+V.esc(D.product.officialUrl)+'">POP MART</a>.</p><p>Choose your requirements to compare each offer with its written terms.</p>');
 const o=state.options;openDialog('Optional integrations','<p class="muted">The workspace works offline. Enable an integration only when you intend to use your own service.</p>'+
 '<label class="formrow"><input type="checkbox" id="chainOn" '+(o.chainOn?'checked':'')+'> Optional Base Sepolia live anchor · testnet only</label>'+
 '<label class="formrow">Testnet burner key · this tab only<input autocomplete="off" type="password" id="burner" value="'+V.esc(o.burner||'')+'"></label>'+
 '<p class="note">A live anchor requires test ETH for gas. No payment or marketplace order is placed.</p><div class="actions">'+V.btn('saveSettings','Save for this tab','primary')+V.btn('clearSettings','Clear saved settings','secondary')+'</div>');
}
function loadSigner(){
 if(window.ethers)return Promise.resolve();return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='lib/ethers.umd.min.js';s.onload=resolve;s.onerror=()=>reject(Error('Optional signing library unavailable.'));document.head.appendChild(s);});
}
async function anchorReview(){
 requireClean();const o=state.options;if(!o.chainOn||!o.burner)throw Error('Configure a Base Sepolia testnet burner in Settings.');
 await loadSigner();const addr=new ethers.Wallet(o.burner).address,a=state.tape.rows.find(c=>c.id==='PB-A-01');if(!a)throw Error('Create the dry-run checkpoint first.');
 openDialog('Review Base Sepolia transaction','<p>Zero-value self-transfer on testnet chain 84532. Test ETH gas applies. Public sender and recipient: <code>'+V.esc(addr)+'</code>.</p><code class="hex">'+V.esc(a.facts.calldata)+'</code><div class="actions">'+V.btn('confirmAnchor','Broadcast this testnet transaction','primary')+'</div>');
}
async function broadcast(){
 requireClean();const o=state.options;if(!o.chainOn||!o.burner)throw Error('Testnet is disabled.');
 const a=state.tape.rows.find(c=>c.id==='PB-A-01');if(state.tape.rows.some(c=>c.id==='PB-A-02'))return claimDetails('PB-A-02');
 $('dialogBody').innerHTML='<p>Submitting to Base Sepolia…</p>';PBLocale.apply($('dialogBody'));const provider=new ethers.JsonRpcProvider('https://sepolia.base.org');
 try{if(BigInt(await provider.send('eth_chainId',[]))!==84532n)throw Error('Unexpected chain ID.');
  const wallet=new ethers.Wallet(o.burner,provider),tx=await wallet.sendTransaction({to:wallet.address,value:0n,chainId:84532n,data:ethers.hexlify(ethers.toUtf8Bytes(a.facts.calldata))});
  await add('PB-A-02','anchor','system',{mode:'LIVE TESTNET · submitted',root:a.facts.root,calldata:a.facts.calldata,chainId:84532,txHash:tx.hash});
  openDialog('Testnet submission','<a rel="noopener noreferrer" target="_blank" href="https://sepolia.basescan.org/tx/'+encodeURIComponent(tx.hash)+'">View submitted transaction</a>');render();
 }catch{openDialog('Testnet submission','<p>Submission failed. Check the testnet balance and RPC connection. The dry-run record remains available.</p>');}finally{provider.destroy();}
}
function localBackend(){return document.documentElement.dataset.backend==='simulation'&&['127.0.0.1','localhost'].includes(location.hostname);}
async function loadCatalog(){
 if(location.protocol==='file:')return;
 try{
  const endpoint=localBackend()?'/api/v1/catalog.json':'api/v1/catalog.json';
  const res=await fetch(endpoint,{signal:AbortSignal.timeout(1800)});
  if(!res.ok)return;
  const data=await res.json();
  if(data.mode==='SIMULATED WEB DATA'&&Array.isArray(data.offers)&&data.offers.length===D.offers.length&&data.offers.every((o,i)=>o.key===D.offers[i].key&&typeof o.source==='string'))D.offers.splice(0,D.offers.length,...data.offers);
  if(data.brief?.id===D.brief.id&&Array.isArray(data.brief.offers)&&data.brief.offers.length===3&&data.brief.offers.every(o=>o.evidence&&o.logistics&&typeof o.source==='string'&&typeof o.translation==='string'))state.brief=data.brief;
 }catch{/* The bundled catalog also supports offline replay. */}
}
function comparisonMode(value){
 return value==='sourcing'||value==='collector';
}
function updateFlow(mode,focus){
 const slot=$(mode+'Flow');
 if(!slot)return;
 slot.innerHTML=PBStory.flow(mode,state);
 PBLocale.apply(slot);
 if(focus==='offer'){
  const current=slot.querySelector('[data-act="pickOffer"][aria-pressed="true"]');
  if(current)current.focus({preventScroll:true});
  return;
 }
 const target=focus==='result'?slot.querySelector('.comparisonResult'):slot.querySelector('input[name="criteria"]');
 if(target)target.focus({preventScroll:true});
 slot.scrollIntoView({block:'start',behavior:'instant'});
}
function syncPicks(form){
 const mode=form.dataset.compare;
 if(!comparisonMode(mode))return [];
 const valid=new Set(PBCompare.axes(mode).map(axis=>axis.id));
 const picked=[...form.querySelectorAll('input[name="criteria"]:checked')].map(el=>el.value).filter(id=>valid.has(id));
 state.comparisons[mode].picked=picked;
 const submit=form.querySelector('[type="submit"]');
 if(submit)submit.disabled=!picked.length;
 return picked;
}
async function logSupplier(id){
 requireClean();
 const offer=state.brief.offers.find(o=>o.id===id);
 if(!offer)return;
 const review=E.assessQuote(offer,state.brief);
 await add(offer.ref,'listing','seller',{
  source:offer.ref,unitPrice:offer.unitPrice,currency:state.brief.currency,quantity:state.brief.quantity,
  ruleResult:review,sourceQuote:offer.source,logisticsQuote:offer.logistics?.source,...(offer.briefDocument?{briefDocument:offer.briefDocument}:{})
 },{lang:'zh',span:review.span});
 state.integrity=null;
}
async function compare(mode,form){
 if(!comparisonMode(mode)||!form.isConnected)return;
 const picked=syncPicks(form);
 if(!picked.length)return;
 const comparison=state.comparisons[mode],ranked=PBCompare.rank(mode,picked,state.brief);
 if(!ranked.length)return;
 const first=ranked[0].id;
 if(mode==='sourcing'){await logSupplier(first);state.supplier=first;}
 comparison.activeId=first;comparison.submitted=true;
 updateFlow(mode,'result');
}
async function pickOffer(mode,id){
 if(!comparisonMode(mode))return;
 const comparison=state.comparisons[mode];
 if(!comparison.submitted||!comparison.picked.length)return;
 const rows=PBCompare.rank(mode,comparison.picked,state.brief);
 if(!rows.some(row=>row.id===id))return;
 if(mode==='sourcing'){await logSupplier(id);state.supplier=id;}
 comparison.activeId=id;
 updateFlow(mode,'offer');
}
function editCriteria(mode){
 if(!comparisonMode(mode))return;
 state.comparisons[mode].submitted=false;
 updateFlow(mode,'criteria');
}
function sourceExcerpt(text,span){
 if(!span)return V.esc(text);
 return V.esc(text.slice(0,span.start))+'<mark>'+V.esc(text.slice(span.start,span.end))+'</mark>'+V.esc(text.slice(span.end));
}
function sourceDialog(id){
 const offer=state.brief.offers.find(o=>o.id===id);
 if(!offer)return;
 const reviewed=state.comparisons.sourcing.submitted;
 const span=reviewed?E.assessQuote(offer,state.brief).span:null;
 const extra=offer.logistics;
 openDialog('Supplier '+id,'<div class="evidenceDialog"><h3>Original quote</h3><blockquote lang="zh-CN" data-keep-language>'+sourceExcerpt(offer.source,span)+'</blockquote>'+
  '<p class="englishGloss" lang="en" data-keep-language>'+V.esc(offer.translation)+'</p>'+
  (extra?'<h3>Delivery terms</h3><blockquote lang="zh-CN" data-keep-language>'+V.esc(extra.source)+'</blockquote><p class="englishGloss" lang="en" data-keep-language>'+V.esc(extra.translation)+'</p>':'')+
  (offer.briefDocument==='invoice'?'<p class="note">The purchase brief includes an invoice. Supply authorisation is still pending.</p>':'')+
  (reviewed?'<div class="controls">'+V.btn('claim','View signed record','mini',offer.ref)+'</div>':'')+'</div>');
}
function listingDialog(id){
 const row=D.offers.find(o=>o.key===id);
 if(!row)return;
 openDialog(row.name,'<div class="evidenceDialog"><h3>Original listing</h3><blockquote class="source" data-keep-language>'+V.esc(row.source)+'</blockquote>'+
  (state.comparisons.collector.submitted?'<div class="controls">'+V.btn('inspectOffer','Open detailed checks','mini',id)+'</div>':'')+'</div>');
}
function followUp(id){
 const row=state.brief.offers.find(o=>o.id===id);
 if(!row)return;
 openDialog('Question for the supplier','<div class="evidenceDialog"><p data-keep-language lang="zh-CN">'+V.esc(row.zh)+'</p><p data-keep-language lang="en">'+V.esc(row.en)+'</p><div class="controls">'+V.btn('copySupplier','Copy both languages','mini',id)+'</div></div>');
}
let callCache;
async function callNotes(id){
 if(!state.brief.offers.some(o=>o.id===id))return;
 if(!callCache){
  try{
   const response=await fetch('api/v1/call-review.json',{signal:AbortSignal.timeout(4000)});
   if(!response.ok)throw Error();
   const data=await response.json();
   if(data.sample===true&&data.mode==='recorded-rules')callCache=data.supplier;
  }catch{}
 }
 const row=callCache?.[id];
 if(!row||!['en','zh'].every(lang=>row.cards?.[lang]?.evidence?.includes(row.id)))return openDialog('Call follow-up','<p>The sample call note could not be loaded. Reopen this note to try again.</p>');
 const stamp=Math.floor(row.atSeconds/60)+':'+String(row.atSeconds%60).padStart(2,'0');
 // Both recorded questions stay in the DOM so a language switch works with the dialog open.
 const question=['en','zh'].map(lang=>'<p class="only-'+lang+'" data-keep-language lang="'+lang+'">'+V.esc(row.cards[lang].question)+'</p>').join('');
 openDialog('Call follow-up','<div class="evidenceDialog"><p class="note">Sample call · Duixi Core</p><h3>What the supplier said</h3><blockquote data-keep-language lang="zh-CN"><small>'+V.esc(stamp)+'</small> '+V.esc(row.quote)+'</blockquote><p class="englishGloss" lang="en" data-keep-language>'+V.esc(row.gloss)+'</p><h3>A question to ask next</h3>'+question+'</div>');
}
async function act(a,v,mode){
 switch(a){
 case 'close':return closeDialog();
 case 'home':state.view='Tape';state.stage=0;render();window.scrollTo({top:0,behavior:'instant'});return;
 case 'editCriteria':return editCriteria(v);
 case 'pickOffer':return pickOffer(mode,v);
 case 'quoteSource':if(state.comparisons.sourcing.submitted)await logSupplier(v);return sourceDialog(v);
 case 'listingSource':return listingDialog(v);
 case 'followUp':return followUp(v);
 case 'callNotes':return callNotes(v);
 case 'copySupplier':{const o=state.brief.offers.find(x=>x.id===(v||state.supplier));return o&&copy(o.en+'\n'+o.zh);}
 case 'begin':closeDialog();await go(1);window.scrollTo({top:0,behavior:'instant'});return;
 case 'stage':return go(Number(v));
 case 'view':state.view=v;return render();
 case 'claim':return claimDetails(v);
 case 'inspect':state.inspect=v;return render();
 case 'inspectOffer':closeDialog();state.inspect=v;await go(4);window.scrollTo({top:0,behavior:'instant'});return;
 case 'sample':await reset(v,null,state.allFail);return go(1);
 case 'useText':{const raw=$('sourceText').value.trim();if(!raw)throw Error('Paste a listing first.');if(raw!==V.source(state)){const known=D.offers.find(o=>o.source===raw);await reset(known?.key||'resale-a',known?null:E.customOffer(raw),state.allFail);}return go(2);}
 case 'glossary':return openDialog('Collector glossary',D.glossary.map(([zh,en,n])=>'<div class="gloss"><b>'+V.esc(zh)+' / '+V.esc(en)+'</b><p>'+V.esc(n)+'</p></div>').join(''));
 case 'scenario':await reset(state.primary,state.custom,!state.allFail);return go(5);
 case 'verify':state.integrity=await state.tape.check();return render();
 case 'tamper':state.tape.tamper();state.tampered=true;state.integrity=await state.tape.check();return render();
 case 'restore':state.tape.restore();state.tampered=false;state.integrity=await state.tape.check();return render();
 case 'dispute':return dispute();
 case 'cycle':return runCycle();
 case 'copyAnchor':return copy(state.tape.rows.find(c=>c.id==='PB-A-01').facts.calldata);
 case 'copyDraft':return copy(D.questions[v].join('\n'));
 case 'settings':return settings();
 case 'clearSettings':state.options={};sessionStorage.removeItem(optionsKey);closeDialog();render();return notice('Optional settings cleared');
 case 'saveSettings':{const options={...state.options,chainOn:$('chainOn').checked,burner:$('burner').value.trim()};
  if(options.chainOn&&!/^(0x)?[a-f\d]{64}$/i.test(options.burner))throw Error('Supply a valid testnet burner key.');
  state.options=options;storeOptions();closeDialog();render();return notice('Settings saved for this tab');}
 case 'anchorLive':return anchorReview();case 'confirmAnchor':return broadcast();
 }
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&!b.disabled)enqueue(()=>act(b.dataset.act,b.dataset.value,b.dataset.mode));});
document.addEventListener('submit',e=>{const form=e.target;if(!form.matches('form[data-compare]'))return;e.preventDefault();enqueue(()=>compare(form.dataset.compare,form));});
document.addEventListener('change',e=>{const form=e.target.closest('form[data-compare]');if(form&&e.target.name==='criteria'){syncPicks(form);return;}if(e.target.dataset.filter){state.filters[e.target.dataset.filter]=e.target.value;render();}});
active=(async()=>{
 await PBLocale.ready;
 const diagnostics=new URLSearchParams(location.search).get('selftest')==='1';
 if(!diagnostics)render();
 await loadCatalog();
 await reset();
 if(diagnostics){
  await new Promise((yes,no)=>{const script=document.createElement('script');script.src='selftest.js';script.onload=yes;script.onerror=no;document.head.append(script);});
  state.tests=await pbSelftest();state.view='Selftest';render();
 }else if(location.hash==='#sourcing'||location.hash==='#collector'){
  document.getElementById(location.hash.slice(1))?.scrollIntoView();
 }
})().catch(e=>{$('work').textContent='Unable to open PostBabel: '+e.message;});
})();
