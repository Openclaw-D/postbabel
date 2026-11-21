(function(root){
  "use strict";
  const offers=[
    {key:'resale-a',id:'PB-L-01',name:'Resale A',channel:'Resale',price:220,days:3,code:'DEMO-0308',stamp:'DEMO-R2',seller:'Cedar Lane',identity:'Unverified',photo:'Re-release stamp',ship:0,duty:null,source:'POP MART LABUBU · THE MONSTERS 心动马卡龙 Green Grape 绿葡萄。初版确认款，拆盒未拆袋，批次 DEMO-R2，刮刮码 DEMO-0308。卖家自称官方授权。USD 220 包邮，关税另计，预计3天。'},
    {key:'resale-b',id:'PB-L-02',name:'Resale B',channel:'Resale',price:260,days:3,code:'DEMO-0317',stamp:'MC23-01',seller:'North Archive',identity:'Sample registry match',photo:'First-edition stamp',ship:0,duty:0,source:'LABUBU THE MONSTERS Exciting Macaron · Green Grape 绿葡萄 初版确认款，拆盒未拆袋。批次 MC23-01，刮刮码 DEMO-0317。USD 260 包邮含税，3天送达。'},
    {key:'official',id:'PB-L-03',name:'Official channel',channel:'Official',price:180,days:42,code:'DEMO-0321',stamp:'DEMO-R2',seller:'Official channel (simulated)',identity:'Official sample',photo:'Disclosed restock',ship:0,duty:0,source:'LABUBU Green Grape, Exciting Macaron series. Later restock preorder. Sealed. Stamp DEMO-R2, code DEMO-0321. USD 180 delivered, tax included. Preorder: dispatch and delivery in six weeks.'},
    {key:'amazon',id:'PB-L-04',name:'Amazon third party',channel:'Marketplace',price:240,days:2,code:'DEMO-0399',stamp:'MC23-01',seller:'Orbit Cart',identity:'Unverified',photo:'Listing photo only',ship:8,duty:null,source:'LABUBU Green Grape, THE MONSTERS Exciting Macaron, confirmed figure. Third-party listing. Code DEMO-0399, stamp MC23-01. USD 240, shipping USD 8, duties extra. Estimated arrival: 2 days.'}
  ];
  const registry={'DEMO-0308':'used','DEMO-0317':'unused','DEMO-0321':'unused'};
  const glossary=[
    ['端盒','full case','Multiple boxes from one case.'],['确认款','opened to confirm the character','The character is known. The outer box may have been opened.'],
    ['拆盒未拆袋','box opened, inner bag sealed','The outer carton and inner bag have different seal states.'],['散货','loose item, origin uncertain','Packaging or provenance may be missing.'],
    ['预售','preorder','A deposit or soft date needs a written commitment.'],['初版','first edition','Verify the physical batch mark.'],['再版','re-release','A later production run.'],
    ['包邮','shipping included','Duties and taxes require separate evidence.'],['月底','end of the month','Ask for a dated delivery commitment.'],['大概','approximately','An estimate, with no firm cutoff.']
  ];
  const questions={
    en:['Could you photograph the scratch-code panel and its status in the registry?','Could you show the batch stamp beside the Exciting Macaron box label?','Could you show the inner bag seal and confirm the delivered total and arrival date?'],
    zh:['请拍下盒底防伪码区和核验状态。','请把批次钢印和 心动马卡龙盒标放在同一张照片里。','请拍内袋封口，并确认含运费税费的总价和到货日期。']
  };
  const categories=['edition','code','jargon','number','pragmatics'];
  const cases=[
    ['First-edition stamp','Re-release date','Reissue prefix','Batch/box conflict','Serial suffix','Missing edition'],
    ['Used token','Unused token','Unknown token','Whitespace in code','Character variant','Reused scan'],
    ['Full case','Confirmed character','Sealed inner bag','Loose figure','Preorder','Edition jargon'],
    ['Currency suffix','Tax exclusion','Shipping extra','Deposit vs total','Units per case','Quoted range'],
    ['Soft month-end','Estimated date','Delivery promise','Shipping window','Seller assertion','Conditional offer']
  ];
  const versions=[41,61,78,86];
  // Captured fixture scores. Symmetric offsets preserve each published column mean.
  const matrix=Array.from({length:30},(_,i)=>({name:cases[i%5][Math.floor(i/5)],category:categories[i%5],heldOut:i>=10,scores:versions.map((v,j)=>v+([-4,2,0,4,-2][i%5])*(j===0?2:1))}));
  const data={product:{name:"LABUBU · Green Grape",series:"THE MONSTERS · Exciting Macaron",officialUrl:"https://www.popmart.com/us/products/675/THE-MONSTERS---Exciting-Macaron-Vinyl-Face-Blind-Box"},offers,registry,glossary,questions,categories,versions,matrix};
  root.PBData=data;if(typeof module!=='undefined')module.exports=data;
})(globalThis);
