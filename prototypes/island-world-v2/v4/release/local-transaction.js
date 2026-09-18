/* Local release verification only. No network, no real accounts. */
if(typeof __DB!=='object'||!document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content.includes("connect-src 'none'"))throw Error('Isolated preview required');
const v4PreviewRef=dbRef,v4PreviewTransactions=new Map();
dbRef=function(path){
 const ref=v4PreviewRef(path);
 ref.transaction=function(update){
  const previous=v4PreviewTransactions.get(path)||Promise.resolve();
  const next=previous.catch(()=>{}).then(async()=>{const current=(await ref.once('value')).val(),nextValue=update(current);if(nextValue===undefined)return{committed:false,snapshot:{val:()=>current}};await ref.set(nextValue);return{committed:true,snapshot:{val:()=>JSON.parse(JSON.stringify(nextValue))}};});
  v4PreviewTransactions.set(path,next);return next;
 };
 return ref;
};
