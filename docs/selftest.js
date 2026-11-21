(function(root){
"use strict";
const E=root.PB||(typeof require!=='undefined'&&require('./engine.js'));
const expected=['af909d7b371eba1fdb01b398a6c6be50bd838f4ad2d70d49e9e0c5135851c443','374fe27b1d6871572c9a09d9fd7610a576728915d9a38d71165964f685045e14','6fdca6e74f424810476361c12cfe88b3046a77d3f31bd1be288babf05e2486d3','2d2bd690ca3de4dc0d75f7207c19bc6d144d934405e6bfbbabda1ea633350a04'];
async function selftest(){
 const tests=[],record=(name,ok)=>tests.push({name,ok:Boolean(ok)});
 const tape=[];for(const body of E.fixedBodies())tape.push(await E.seal(body,tape.at(-1)?.hash||E.zero));
 tape.forEach((row,i)=>record('Independent SHA-256 vector '+(i+1),row.hash===expected[i]));
 record('Canonical key order',E.canonical({b:2,a:1})==='{"a":1,"b":2}');
 record('Fallback SHA-256 · UTF-8',root.pbSHA256('芽')===await E.hash('芽')&&root.pbSHA256('abc')==='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 record('Four linked claims',(await E.verifyTape(tape)).checked===4&&(await E.verifyTape(tape)).ok);
 tape[1].facts.note='Ferm';record('One-byte change detected at record 2',(await E.verifyTape(tape)).brokenAt===1);tape[1].facts.note='Fern';
 record('Restored chain verifies',(await E.verifyTape(tape)).ok);
 const offer=E.lineup(),win=offer.winner;record('Used-code sample rejected',!offer.rows[0].qualified);record('Fastest qualified sample is Resale B',win.key==='resale-b'&&win.days===3);
 record('Official budget alternative',offer.alternative.price===180);record('Unverified marketplace gated',!offer.rows.find(x=>x.key==='amazon').qualified);
 record('All-fail returns no purchase',E.lineup(true).winner===null);record('Unknown pasted code stays unknown',E.evaluate(E.customOffer('USD 2 code FA-0000 stamp MC23-01')).qualified===false);
 const text='中文拆盒未拆袋确认款';record('Chinese source offsets',E.getGloss(text).every(x=>text.slice(x.start,x.end)===x.term));
 const testTape=new E.Tape();await Promise.all([testTape.add(E.claim('A','check','system',{price:220})),testTape.add(E.claim('A','check','system',{price:220})),testTape.add(E.claim('B','check','system',{}))]);const check=await testTape.check();
 record('Concurrent append, idempotent ID and actor proofs',testTape.rows.length===2&&check.ok&&(!root.crypto?.subtle||check.signed));
 return tests;
}
root.pbSelftest=selftest;if(typeof module!=='undefined')module.exports=selftest;
})(globalThis);
