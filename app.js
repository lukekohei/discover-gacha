const $=s=>document.querySelector(s),letters=['A','B','C','D','E'];let fallback=false,db;
try{db=JSON.parse(localStorage.getItem('discover-gacha-v1'))}catch{}
if(!db)db={weights:Array.from({length:4},()=>[2,8,20,30,40]),stock:[-1,-1,-1,-1,-1],auto:false,slot:0,history:[]};
let busy=false,preview=false,current=-1,scheduleDraft=null;
function persist(){try{localStorage.setItem('discover-gacha-v1',JSON.stringify(db));return true}catch{$('#status').textContent='保存できません。スタッフに確認してください。';return false}}
function random(){let a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}
function draw(){
 if(busy)return;const active=GachaSchedule.active(db),w=active.weights.map((v,i)=>db.stock[i]===0?0:v),total=w.reduce((a,b)=>a+b,0);
 if(!total){$('#status').textContent='抽選を停止しています。スタッフにお声がけください。';return}
 let n=random()*total,i=w.findIndex(v=>(n-=v)<0);if(i<0)i=w.findLastIndex(v=>v>0);
 const old=JSON.stringify(db);if(db.stock[i]>0)db.stock[i]--;
 db.history.push({id:Date.now()+'-'+Math.floor(random()*1e6),time:new Date().toISOString(),prize:letters[i],slot:active.id,slotLabel:active.label});
 if(!persist()){db=JSON.parse(old);return}$('#status').textContent='';play(i,false);
}
function play(i,test){if(busy||test&&!window.staff.isUnlocked())return;busy=true;preview=test;current=i;$('#settings').close();$('#ui').style.visibility='hidden';$('#movie').src='videos/'+letters[i]+'.mp4';$('#movie').style.display='block';$('#movie').onended=reveal;$('#movie').onerror=()=>{if(fallback)return;fallback=true;$('#movie').style.display='none';animStart=performance.now();setTimeout(()=>{fallback=false;animStart=0;reveal()},7000)};$('#movie').play().catch(()=>$('#movie').onerror())}
function reveal(){if(!busy)return;busy=false;$('#movie').pause();$('#movie').style.display='none';$('#ui').style.visibility='visible';$('#home').style.display='none';$('#result').style.display='flex';$('#prize').textContent=letters[current]+'賞';$('#result .eyebrow').textContent=preview?'PREVIEW / 演出確認':'CONGRATULATIONS';$('#next').textContent=preview?'設定に戻る':'次の抽選へ'}
$('#draw').onclick=draw;$('#next').onclick=()=>{$('#home').style.display='flex';$('#result').style.display='none';if(preview)openSettings()};
function openSettings(){window.staff.open()}$('#admin').onclick=openSettings;
function field(value,type,attrs={}){const e=document.createElement('input');e.type=type;e.value=value;for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e}
function cell(tr,e){const td=document.createElement('td');if(typeof e==='string')td.textContent=e;else td.append(e);tr.append(td);return td}
function weightField(value,label){return field(value,'number',{min:0,max:100000,step:'any','aria-label':label})}
function renderSettings(){
 scheduleDraft=GachaSchedule.draft(db);$('#auto').checked=db.auto;
 $('#schedule-hint').textContent=db.scheduleConfig?'各行を編集して「時間帯設定をまとめて保存」を押してください。':'画像の4区分を下書き表示しています。比率は従来の通常設定を仮入力。保存するまでは従来の時間帯設定を使います。';
 $('#current-rule').textContent='現在の適用設定：'+GachaSchedule.active(db).label;
 const stock=$('#stock-inputs');stock.replaceChildren();letters.forEach((l,i)=>{const label=document.createElement('label');label.textContent=l+'賞';const input=field(db.stock[i],'number',{min:-1,max:1000000,step:1,'data-stock':i,'aria-label':l+'賞の共通残数'});label.append(input);stock.append(label)});
 const rows=$('#schedule-rows');rows.replaceChildren();const select=$('#slot');select.replaceChildren();let op=document.createElement('option');op.value='base';op.textContent='通常（時間外）';select.append(op);
 scheduleDraft.rules.forEach((r,ri)=>{
  const tr=document.createElement('tr');const wrap=document.createElement('div');wrap.className='time-pair';
  for(const key of ['start','end']){const e=field(r[key],'time',{'data-rule':ri,'data-key':key,'aria-label':r.name+(key==='start'?'開始':'終了')});wrap.append(e)}cell(tr,wrap);
  cell(tr,field(r.name,'text',{'data-rule':ri,'data-key':'name',maxlength:30,'aria-label':'区分名'}));
  r.weights.forEach((v,i)=>{const e=weightField(v,r.name+' '+letters[i]+'賞の比率');e.dataset.rule=ri;e.dataset.weight=i;cell(tr,e)});
  for(const key of ['goalA','goalB'])cell(tr,field(r[key],'number',{min:0,max:1000000,step:1,'data-rule':ri,'data-key':key,'aria-label':r.name+' '+(key==='goalA'?'A':'B')+'賞の目安個数'}));
  const note=document.createElement('textarea');note.value=r.note;note.rows=3;note.maxLength=240;note.dataset.rule=ri;note.dataset.key='note';note.setAttribute('aria-label',r.name+'の運用メモ');cell(tr,note);rows.append(tr);
  op=document.createElement('option');op.value=r.id;op.textContent=r.name+' '+r.start+'–'+r.end;select.append(op);
 });select.value=scheduleDraft.manual;
 const base=$('#base-weights');base.replaceChildren();scheduleDraft.baseWeights.forEach((v,i)=>{const label=document.createElement('label');label.textContent=letters[i]+'賞';const e=weightField(v,'通常 '+letters[i]+'賞の比率');e.dataset.base=i;label.append(e);base.append(label)});
 const previews=$('#preview-buttons');previews.replaceChildren();letters.forEach((l,i)=>{const b=document.createElement('button');b.className='ghost';b.textContent=l+'賞を再生';b.onclick=()=>play(i,true);previews.append(b)});
 $('#stock-notice').textContent='';$('#schedule-notice').textContent='';
}
$('#save-stock').onclick=()=>{
 if(!window.staff.isUnlocked())return;
 const inputs=[...document.querySelectorAll('[data-stock]')],stock=inputs.map(e=>e.value.trim()===''?NaN:Number(e.value));
 if(stock.length!==5||stock.some(x=>!Number.isInteger(x)||x< -1||x>1000000)){$('#stock-notice').textContent='残数は−1、0、または正の整数で入力してください。';return}
 const old=db.stock;db.stock=stock;if(!persist()){db.stock=old;$('#stock-notice').textContent='保存できませんでした。在庫は変更していません。';return}
 window.staff.refreshStock();$('#stock-notice').textContent='全時間帯共通の在庫を保存しました。';
};
$('#save-schedule').onclick=()=>{
 if(!window.staff.isUnlocked())return;
 const next=JSON.parse(JSON.stringify(scheduleDraft));
 document.querySelectorAll('[data-rule]').forEach(e=>{const r=next.rules[Number(e.dataset.rule)];if(e.dataset.weight!==undefined)r.weights[Number(e.dataset.weight)]=e.value.trim()===''?NaN:Number(e.value);else{const key=e.dataset.key;r[key]=['goalA','goalB'].includes(key)?(e.value.trim()===''?NaN:Number(e.value)):e.value}});
 next.baseWeights=[...document.querySelectorAll('[data-base]')].map(e=>e.value.trim()===''?NaN:Number(e.value));next.manual=$('#slot').value;
 try{GachaSchedule.validate(next)}catch(e){$('#schedule-notice').textContent=e.message;return}
 const old=JSON.stringify(db);db.scheduleConfig=next;db.auto=$('#auto').checked;if(!persist()){db=JSON.parse(old);$('#schedule-notice').textContent='保存できませんでした。時間帯設定は変更していません。';return}
 scheduleDraft=next;$('#current-rule').textContent='現在の適用設定：'+GachaSchedule.active(db).label;$('#schedule-hint').textContent='保存済み。比率・時刻・目安・メモはまとめて保存します。';$('#schedule-notice').textContent=db.auto?'全時間帯を保存しました。日本時間で自動切替します。':'全時間帯を保存しました。選んだ手動設定を適用します。';
};
$('#export').onclick=()=>{if(!window.staff.isUnlocked())return;const b=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='gacha-history.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
