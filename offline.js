(async()=>{
 const label=document.getElementById('offline-state');
 if(!('serviceWorker' in navigator)||!window.isSecureContext){label.textContent='初回はHTTPSの公開URLで開いてください';return}
 label.textContent='動画を端末に保存中…';
 const timer=setTimeout(()=>{label.textContent='保存待ちです。通信接続と空き容量を確認してください'},45000);
 try{
  await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
  const reg=await navigator.serviceWorker.ready;
  const check=()=>new Promise(resolve=>{const ch=new MessageChannel();const timeout=setTimeout(()=>resolve(false),10000);ch.port1.onmessage=e=>{clearTimeout(timeout);resolve(e.data.ready)};reg.active.postMessage({type:'CHECK_OFFLINE'},[ch.port2])});
  const ready=await check();clearTimeout(timer);
  label.textContent=ready?'オフライン準備完了（スタッフ保護版）':'保存が未完了です。通信接続中に開き直してください';
  if(ready&&navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
 }catch(e){clearTimeout(timer);label.textContent='保存できませんでした。通信接続中に開き直してください'}
})();
