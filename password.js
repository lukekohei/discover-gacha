/* Local staff-screen password: salted PBKDF2, no plaintext password stored. */
window.StaffPassword=(()=>{
 const rounds=150000;
 const hex=a=>Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
 async function derive(password,salt,iterations){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256)));
 }
 function valid(r){return r&&r.v===1&&r.iterations===rounds&&/^[0-9a-f]{32}$/.test(r.salt)&&/^[0-9a-f]{64}$/.test(r.hash)}
 return {valid,async create(password){if(password.length<6)throw Error('6文字以上で設定してください。');const salt=crypto.getRandomValues(new Uint8Array(16));return {v:1,iterations:rounds,salt:hex(salt),hash:await derive(password,salt,rounds)}},async verify(password,r){if(!valid(r))throw Error('パスワードの保存データを読み取れません。');const salt=Uint8Array.from(r.salt.match(/../g),v=>parseInt(v,16));const h=await derive(password,salt,r.iterations);let diff=0;for(let i=0;i<h.length;i++)diff|=h.charCodeAt(i)^r.hash.charCodeAt(i);return diff===0}};
})();
