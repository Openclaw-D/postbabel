(function(root){
  "use strict";
  const data=root.PBData||(typeof require!=='undefined'&&require('./data.js'));
  const fallback=root.pbSHA256||(typeof require!=='undefined'&&require('./lib/sha256.js'));
  const zero='0'.repeat(64);
  function canonical(value){
    if(value===undefined)return 'null';
    if(Array.isArray(value))return '['+value.map(v=>v===undefined?'null':canonical(v)).join(',')+']';
    if(value!==null&&typeof value==='object')return '{'+Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
    return JSON.stringify(value);
  }
  const cnDigits={'零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
  function cnNumber(text){
    if(!text)return null;
    if(/^\d+$/.test(text))return Number(text);
    const tens=text.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);
    if(tens)return (tens[1]?cnDigits[tens[1]]:1)*10+(tens[2]?cnDigits[tens[2]]:0);
    const digits=text.split('').map(ch=>cnDigits[ch]);
    return digits.some(n=>n===undefined)?null:Number(digits.join(''));
  }
  function etaDays(value){
    if(!value)return null;
    const text=String(value);
    if(/^six weeks$/i.test(text))return 42;
    const cn=text.match(/^([一二两三四五六七八九十]+)\s*(天|日|周|星期|个?月)/);
    if(cn){const n=cnNumber(cn[1]);if(!n)return null;return /周|星期/.test(cn[2])?n*7:/月/.test(cn[2])?n*30:n;}
    const m=text.match(/(\d+)\s*(天|日|days?|周|星期|weeks?|个?月)?/i);
    if(!m)return null;
    const n=Number(m[1]),unit=m[2]||'days';
    if(/周|星期|weeks?/.test(unit))return n*7;
    if(/月/.test(unit))return n*30;
    return n;
  }
  function hex(bytes){return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');}
  async function hash(text){
    return root.crypto?.subtle?hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))):fallback(text);
  }
  async function seal(body, prevHash){
    const claim=Object.assign({},body,{prevHash});claim.hash=await hash(canonical(claim));return claim;
  }
  async function verifyTape(tape){
    let previous=zero;
    for(let i=0;i<tape.length;i++){
      const {hash:expected,...body}=tape[i];
      if(body.prevHash!==previous||await hash(canonical(body))!==expected)return {ok:false,brokenAt:i,checked:i+1};
      previous=expected;
    }
    return {ok:true,brokenAt:null,checked:tape.length};
  }
  class Tape {
    constructor(){this.rows=[];this.originals=[];this.proofs=new Map();this.keys=new Map();this.epoch=Date.now();this.tail=Promise.resolve();}
    add(body){
      const put=async()=>{
        const existing=this.rows.find(r=>r.id===body.id);
        if(existing){
          const same=Object.keys(body).every(k=>canonical(body[k])===canonical(existing[k]));
          if(!same)throw Error('Duplicate claim id '+body.id+' with different content.');
          return existing;
        }
        const claim=await seal(Object.assign({v:1,ts:this.epoch+this.rows.length,lang:'en',span:null,confidence:null,severity:'info'},body),this.rows.at(-1)?.hash||zero);
        if(root.crypto?.subtle){
          const params={name:'ECDSA',namedCurve:'P-256'},id=claim.actor.id;
          if(!this.keys.has(id))this.keys.set(id,await crypto.subtle.generateKey(params,false,['sign','verify']));
          const keys=this.keys.get(id);
          const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,new TextEncoder().encode(claim.hash));
          this.proofs.set(claim.hash,{signature:new Uint8Array(signature),publicKey:keys.publicKey});
        }
        this.rows.push(claim);this.originals.push(JSON.parse(JSON.stringify(claim)));return claim;
      };
      const result=this.tail.then(put);this.tail=result.catch(()=>{});return result;
    }
    async check(){
      const links=await verifyTape(this.rows);
      if(!links.ok||!root.crypto?.subtle)return links;
      for(let i=0;i<this.rows.length;i++){
        const c=this.rows[i],proof=this.proofs.get(c.hash);
        if(!proof||!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},proof.publicKey,proof.signature,new TextEncoder().encode(c.hash)))return {ok:false,brokenAt:i,checked:i+1};
      }
      return {...links,signed:true};
    }
    tamper(){
      const row=this.rows[0];if(!row)return;
      if(Number.isInteger(row.facts.price)&&row.facts.price>=0){
        const price=row.facts.price;row.facts={...row.facts,price:price%10===9?price-1:price+1};
      }else{
        row.lang=row.lang==='en'?'es':'zh'===row.lang?'za':'en';
      }
    }
    restore(){this.rows=this.originals.map(x=>JSON.parse(JSON.stringify(x)));}
  }
  function getGloss(text){
    return data.glossary.flatMap(([term,meaning,note])=>{
      const start=text.indexOf(term);return start<0?[]:[{term,meaning,note,start,end:start+term.length}];
    });
  }
  function parse(text){
    const find=re=>text.match(re)?.[1]||null;
    const num=s=>s===null?null:Number(s);
    const words=getGloss(text);
    return {language:/[\u3400-\u9fff]/.test(text)?'zh':'en',series:/Exciting Macaron|心动马卡龙/i.test(text)?'THE MONSTERS · Exciting Macaron':null,
      character:find(/(Green Grape|绿葡萄|LABUBU)/i),edition:find(/(初版|再版|first edition|first-edition|re-release)/i),
      seal:find(/(拆盒未拆袋|未拆封|散货|sealed|loose)/i),batch:find(/(?:批次(?:钢印)?|stamp|batch)\s*[:：]?\s*([A-Z]{2,5}[\w-]*\d[\w-]*)/i),
      code:find(/(?:刮刮码|防伪码|code)\s*[:：]?\s*([A-Z]{2,5}-\d+)/i),price:num(find(/(?:USD\s*|\$)(\d+(?:\.\d+)?)/i)),
      shipping:/包邮|shipping included|delivered/i.test(text)?'included':find(/shipping\s+(USD\s*\d+)/i),duty:/含税|tax included/i.test(text)?'included':/关税另计|duties extra/i.test(text)?'extra':null,
      eta:find(/((?:\d+|[一二两三四五六七八九十]+)\s*(?:天|日|周|星期|个?月|days?)|six weeks|月底|大概|尽快)/i),terms:words};
  }
  function evaluate(offer,allFail=false){
    const code=allFail?'not found':data.registry[offer.code]||'not found';
    const batch=offer.stamp==='MC23-01';const seller=['Sample registry match','Official sample'].includes(offer.identity);
    const checks=[
      {label:'Scratch code',value:code,level:code==='unused'?'pass':code==='used'?'fail':'warn'},
      {label:'Edition / batch',value:offer.stamp||'Missing',level:batch?'pass':offer.photo==='Disclosed restock'?'warn':'fail'},
      {label:'Seller identity',value:offer.identity,level:seller?'pass':'warn'},
      {label:'Photo evidence',value:offer.photo,level:offer.photo==='Re-release stamp'?'fail':['First-edition stamp','Disclosed restock'].includes(offer.photo)?'pass':'warn'},
      {label:'Delivered cost',value:offer.duty===null?'Duties unconfirmed':'Shipping and duty included',level:offer.duty===null?'warn':'pass'},
      {label:'Translation fidelity',value:offer.translationConfidence>=.9?'Source fields aligned':'Review source fields',level:offer.translationConfidence>=.9?'pass':'warn'}
    ];
    const coverage=[offer.price,offer.days,offer.code,offer.stamp,offer.seller,offer.duty,offer.photo].filter(v=>v!==null&&v!==undefined&&v!=='').length/7;
    const penalty=checks.some(c=>c.level==='fail') ? 0.40 : checks.some(c=>c.level==='warn') ? 0.15 : 0;
    const score=Math.max(0,Math.min(1,.30*coverage+.25*(code==='unused')+.20*batch+.15*seller+.10*offer.translationConfidence-penalty));
    return {...offer,codeState:code,batchMatch:batch,checks,score,qualified:code==='unused'&&batch&&seller,level:checks.some(c=>c.level==='fail')?'fail':checks.some(c=>c.level==='warn')?'warn':'pass'};
  }
  function lineup(allFail=false,custom=null){
    const rows=data.offers.map(o=>evaluate({...o,translationConfidence:.96},allFail));
    if(custom)rows.push(evaluate(custom,allFail));
    const eligible=rows.filter(o=>o.qualified&&Number.isFinite(o.days)).sort((a,b)=>a.days-b.days||a.price-b.price);
    return {rows,winner:eligible[0]||null,alternative:rows.find(x=>x.key==='official'&&x.codeState==='unused'&&x.identity==='Official sample')||null};
  }
  function assessQuote(offer,brief){
    const labels={supply:'Authorized supply evidence is missing.',edition:'The edition is unspecified.',stock:'Available stock is unconfirmed.'};
    const required=['edition','stock','supply'];
    const missing=required.filter(field=>offer.evidence[field]!=='documented');
    const source=offer.source||'';
    const openTerms={
      edition:/具体版次待确认/,
      stock:/等仓库确认库存/,
      supply:/授权供货凭证稍后提供/
    };
    const primary=missing.find(field=>openTerms[field].test(source))||missing[0];
    const match=primary&&source.match(openTerms[primary]);
    const span=match?{doc:offer.ref,start:match.index,end:match.index+match[0].length}:null;
    const price=source.match(/单价\s*(\d+(?:\.\d+)?)\s*美元/);
    const priceSpan=price?{doc:offer.ref,start:price.index,end:price.index+price[0].length}:null;
    const unitPrice=price?Number(price[1]):offer.unitPrice;
    const perUnitDelta=unitPrice-brief.unitBudget;
    return {perUnitDelta,subtotal:brief.quantity*unitPrice,missing,span,priceSpan,gap:labels[primary]||'All required fields have supporting evidence.',
      eligible:missing.length===0&&perUnitDelta<=0,commitment:/没问题|能安排/.test(source)?'acknowledgement only':'review source'};
  }
  function customOffer(text){
    const p=parse(text),days=etaDays(p.eta),soft=/月底|大概|尽快|差不多/.test(text);
    return {key:'custom',id:'PB-L-05',name:'Your listing',channel:'Pasted text',price:p.price,days,soft,
      code:p.code,stamp:p.batch,seller:null,identity:'Unverified',photo:'No photo supplied',ship:null,duty:null,source:text,translationConfidence:p.terms.length ? 0.85 : 0.65};
  }
  const actors={seller:'sample-listing',translator:'field-translator',verifier:'registry-simulator',challenger:'collector-circle',system:'postbabel-console',buyer:'ava'};
  function claim(id,kind,role,facts,extra={}){
    return {id,kind,actor:{role,id:actors[role]},facts,...extra};
  }
  function calldata(rootHash,id){return 'POSTBABEL|1|'+rootHash+'|'+id;}
  function fixedBodies(){return ['listing','translation','check','verdict'].map((kind,i)=>({v:1,id:'TEST-'+i,kind,actor:{role:'system',id:'selftest'},ts:1700000000000+i,lang:'en',span:null,facts:{i,note:'Fern'},confidence:null,severity:'info'}));}
  const api={zero,canonical,hash,seal,verifyTape,Tape,getGloss,parse,evaluate,lineup,assessQuote,customOffer,claim,calldata,fixedBodies,hex,etaDays,cnNumber};
  root.PB=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
