(function(root){
  'use strict';
  const setting='postbabel-language';
  const originals=new WeakMap();
  const attributes=new WeakMap();
  const preserved='script,style,code,pre,textarea,.source,[data-keep-language]';
  const buttons=[...document.querySelectorAll('[data-language]')];
  let current='en',pending,sequence=0;

  function preferred(){
    const query=new URL(location.href).searchParams.get('lang');
    if(query==='en'||query==='zh')return query;
    try{return localStorage.getItem(setting)==='zh'?'zh':'en';}catch{return 'en';}
  }
  function translate(text){
    if(current!=='zh'||!text.trim())return text;
    const core=text.trim(),result=root.PBChinese(core);
    return result===core?text:text.replace(core,()=>result);
  }
  function patch(node){
    const previous=originals.get(node);
    const value=node.nodeValue;
    const source=previous&&previous.rendered===value?previous.source:value;
    const translated=translate(source);
    if(translated!==value)node.nodeValue=translated;
    if(translated!==source)originals.set(node,{source,rendered:translated});
    else originals.delete(node);
  }
  function apply(container,restore=false){
    if(!container||(current==='en'&&!restore))return;
    const tree=document.createTreeWalker(container,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        if(node.nodeType===Node.ELEMENT_NODE)return node.matches(preserved)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_SKIP;
        return node.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;
      }
    });
    while(tree.nextNode())patch(tree.currentNode);
    for(const el of container.querySelectorAll('[aria-label],[alt],[placeholder]')){
      if(el.closest('[data-keep-language]'))continue;
      let map=attributes.get(el);
      if(!map){map={};attributes.set(el,map);}
      for(const name of ['aria-label','alt','placeholder']){
        if(!el.hasAttribute(name))continue;
        const value=el.getAttribute(name),old=map[name];
        const source=old?.rendered===value?old.source:value;
        const rendered=translate(source);
        if(value!==rendered)el.setAttribute(name,rendered);
        map[name]={source,rendered};
      }
    }
  }
  function loadChinese(){
    if(root.PBChinese)return Promise.resolve();
    if(pending)return pending;
    pending=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='zh.js';
      script.onload=()=>root.PBChinese?resolve():reject(Error('Chinese catalog unavailable'));
      script.onerror=()=>{pending=null;script.remove();reject(Error('Chinese catalog unavailable'));};
      document.head.append(script);
    });
    return pending;
  }
  async function select(lang,remember){
    if(!['en','zh'].includes(lang))return;
    const change=++sequence;
    if(lang==='zh')await loadChinese();
    if(change!==sequence)return;
    current=lang;
    document.documentElement.lang=lang==='zh'?'zh-CN':'en';
    document.title=lang==='zh'?'PostBabel · 证据记录':'PostBabel · Claim Tape';
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===lang)));
    apply(document.body,true);
    if(remember){
      try{localStorage.setItem(setting,lang);}catch{}
      try{const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(history.state,'',url);}catch{}
    }
  }
  function failed(){const notice=document.getElementById('notice');notice.textContent='中文语言包暂时无法加载，请重试。';notice.classList.add('visible');setTimeout(()=>notice.classList.remove('visible'),3500);}
  for(const b of buttons)b.addEventListener('click',()=>select(b.dataset.language,true).catch(failed));
  const ready=select(preferred(),false).catch(failed);
  root.PBLocale={apply,ready,text:translate};
})(globalThis);
