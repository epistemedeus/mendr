const assert = require('node:assert/strict');
(async () => {
  await assert.rejects(() => fetch('https://offline-control.invalid/'), { name: 'OfflineViolation' });
  for (const [mod,op,args] of [
    ['node:http','get',['http://offline-control.invalid/']],
    ['node:https','request',['https://offline-control.invalid/']],
    ['node:net','connect',[{host:'offline-control.invalid',port:443}]],
    ['node:tls','connect',[{host:'offline-control.invalid',port:443}]],
    ['node:dns','lookup',['offline-control.invalid',()=>{}]],
  ]) assert.throws(()=>require(mod)[op](...args),{name:'OfflineViolation'});
  console.log('PASS six attempted outbound primitives blocked before network I/O');
})();
