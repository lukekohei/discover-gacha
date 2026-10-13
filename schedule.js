window.GachaSchedule=(()=>{
 const min=t=>{if(!/^\d{2}:\d{2}$/.test(t))return NaN;const [h,m]=t.split(':').map(Number);return h<24&&m<60?h*60+m:NaN};
 const clone=x=>JSON.parse(JSON.stringify(x));
 function draft(db){
  if(db.scheduleConfig)return clone(db.scheduleConfig);
  const data=[['11:30','12:30','抑制',1,5,'三等〜五等を中心に排出。上位賞は低め。'],['12:30','14:00','通常',3,8,'全体の状況を見ながら上位賞を少しずつ。'],['14:00','16:00','ピーク',12,30,'メインの来場時間帯。上位賞を重点的に。'],['16:00','18:00','在庫調整',4,7,'残在庫を確認し、必要に応じてC賞の比率を調整。']];
  return {baseWeights:[...db.weights[0]],manual:'base',rules:data.map((a,i)=>({id:'r'+i,start:a[0],end:a[1],name:a[2],goalA:a[3],goalB:a[4],note:a[5],weights:[...db.weights[0]]}))};
 }
 function validate(c){
  const weights=w=>Array.isArray(w)&&w.length===5&&w.every(n=>Number.isFinite(n)&&n>=0&&n<=100000)&&w.some(n=>n>0);
  if(!weights(c.baseWeights))throw Error('通常設定の比率は0以上で、少なくとも1賞を0より大きくしてください。');
  const ids=new Set();
  for(const r of c.rules){if(!r.id||ids.has(r.id))throw Error('時間帯の識別情報が重複しています。');ids.add(r.id);if(!Number.isFinite(min(r.start))||!Number.isFinite(min(r.end))||min(r.start)>=min(r.end))throw Error('開始時刻は終了時刻より前にしてください。日をまたぐ設定はできません。');if(!r.name.trim())throw Error('区分名を入力してください。');if(!weights(r.weights))throw Error(r.name+'の比率を確認してください。');if(![r.goalA,r.goalB].every(n=>Number.isInteger(n)&&n>=0&&n<=1000000))throw Error('目安個数は0以上の整数で入力してください。')}
  const sorted=[...c.rules].sort((a,b)=>min(a.start)-min(b.start));for(let i=1;i<sorted.length;i++)if(min(sorted[i].start)<min(sorted[i-1].end))throw Error('時間帯が重複しています。開始・終了時刻を確認してください。');
  if(c.manual!=='base'&&!ids.has(c.manual))throw Error('手動で適用する時間帯を選択してください。');return c;
 }
 function active(db,date=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);const n=+parts.find(p=>p.type==='hour').value*60+ +parts.find(p=>p.type==='minute').value;
  if(!db.scheduleConfig){const s=db.auto?(n>=600&&n<720?1:n>=720&&n<900?2:n>=900&&n<1080?3:0):db.slot;return {weights:db.weights[s],id:s,label:['通常','午前','午後','夕方'][s]}}
  const c=db.scheduleConfig,r=db.auto?c.rules.find(r=>n>=min(r.start)&&n<min(r.end)):c.rules.find(r=>r.id===c.manual);
  return r?{weights:r.weights,id:r.id,label:r.name+' '+r.start+'–'+r.end}:{weights:c.baseWeights,id:'base',label:'通常（時間外）'};
 }
 return {draft,validate,active};
})();
