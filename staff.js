window.staff=(()=>{
 const KEY='discover-gacha-staff-auth-v1';let unlocked=false,mode='login',record=null,page=0,idleTimer,working=false,epoch=0;
 const $=s=>document.querySelector(s);
 function load(){const raw=localStorage.getItem(KEY);if(raw===null)return null;const data=JSON.parse(raw);if(!StaffPassword.valid(data))throw Error();return data}
 function resetFields(){for(const id of ['#auth-current','#auth-password','#auth-confirm'])$(id).value='';$('#auth-error').textContent=''}
 function lock(){epoch++;unlocked=false;clearTimeout(idleTimer);if($('#settings').open)$('#settings').close();if($('#auth').open)$('#auth').close();resetFields()}
 function refreshIdle(){clearTimeout(idleTimer);if(unlocked)idleTimer=setTimeout(lock,120000)}
 function promptAuth(change=false){
  resetFields();
  try{record=load()}catch{$('#status').textContent='パスワードの保存データを読み取れません。担当者へ確認してください。';return}
  mode=change?'change':record?'login':'setup';
  $('#auth-title').textContent=mode==='setup'?'スタッフ用パスワードを設定':mode==='change'?'パスワードを変更':'スタッフ設定を開く';
  $('#auth-description').textContent=mode==='setup'?'初回のみ、6文字以上のパスワードを設定してください。このiPadに保存します。':mode==='change'?'現在のパスワードと、新しいパスワードを入力してください。':'スタッフ用パスワードを入力してください。';
  $('#current-wrap').hidden=mode!=='change';$('#confirm-wrap').hidden=mode==='login';
  $('#password-label').textContent=mode==='login'?'パスワード':'新しいパスワード（6文字以上）';
  $('#auth-password').autocomplete=mode==='login'?'current-password':'new-password';
  $('#auth-submit').textContent=mode==='login'?'開く':'設定する';
  $('#auth').showModal();setTimeout(()=>$(mode==='change'?'#auth-current':'#auth-password').focus(),50);
 }
 function showSettings(){unlocked=true;refreshIdle();$('#slot').value=db.slot;$('#auto').checked=db.auto;renderRows();$('#notice').textContent='';page=0;renderHistory();$('#settings').showModal()}
 function open(){if(busy)return;if(unlocked)showSettings();else promptAuth()}
 async function submit(e){
  e.preventDefault();if(working)return;const token=epoch;working=true;$('#auth-submit').disabled=true;$('#auth-error').textContent='';
  try{
   const pass=$('#auth-password').value;
   if(mode==='login'){if(!await StaffPassword.verify(pass,record))throw Error('パスワードが違います。')}
   else{
    if(mode==='change'&&!await StaffPassword.verify($('#auth-current').value,record))throw Error('現在のパスワードが違います。');
    if(pass.length<6)throw Error('新しいパスワードは6文字以上にしてください。');
    if(pass!==$('#auth-confirm').value)throw Error('確認用のパスワードが一致しません。');
    const next=await StaffPassword.create(pass);localStorage.setItem(KEY,JSON.stringify(next));record=next;
   }
   if(token!==epoch)return;$('#auth').close();resetFields();showSettings();
  }catch(e){$('#auth-error').textContent=e.message||'保存できませんでした。'}finally{working=false;$('#auth-submit').disabled=false}
 }
 function renderHistory(){
  const history=db.history||[],counts=Object.fromEntries(letters.map(l=>[l,0]));for(const h of history)if(h.prize in counts)counts[h.prize]++;
  $('#history-count').textContent='抽選合計 '+history.length+'回';$('#history-summary').textContent=letters.map(l=>l+'賞 '+counts[l]+'回').join('　');
  const totalPages=Math.max(1,Math.ceil(history.length/50));page=Math.min(page,totalPages-1);$('#history-page').textContent=(page+1)+' / '+totalPages+'ページ';$('#history-prev').disabled=page===0;$('#history-next').disabled=page===totalPages-1;
  const body=$('#history-rows');body.replaceChildren();const items=history.slice().reverse().slice(page*50,(page+1)*50);
  if(!items.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=3;td.textContent='まだ抽選履歴はありません。';tr.append(td);body.append(tr)}
  for(const h of items){const tr=document.createElement('tr');let date='日時不明';try{date=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(h.time))}catch{}for(const value of [date,letters.includes(h.prize)?h.prize+'賞':'不明',['通常','午前','午後','夕方'][h.slot]||'通常']){const td=document.createElement('td');td.textContent=value;tr.append(td)}body.append(tr)}
 }
 $('#auth-form').onsubmit=submit;$('#auth-cancel').onclick=()=>{if(!working)lock()};$('#auth').addEventListener('cancel',e=>{e.preventDefault();if(!working)lock()});
 $('#close').onclick=lock;$('#settings').addEventListener('cancel',e=>{e.preventDefault();lock()});
 $('#change-password').onclick=()=>{unlocked=false;clearTimeout(idleTimer);$('#settings').close();promptAuth(true)};
 $('#history-prev').onclick=()=>{page--;renderHistory()};$('#history-next').onclick=()=>{page++;renderHistory()};
 $('#settings').addEventListener('pointerdown',refreshIdle);$('#settings').addEventListener('keydown',refreshIdle);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)lock()});
 return {open,lock,isUnlocked:()=>unlocked};
})();
