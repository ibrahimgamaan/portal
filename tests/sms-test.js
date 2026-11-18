// تشغيل: node tests/sms-test.js
const fs = require('fs'), path = require('path');
const {classify} = require(path.join(__dirname, '..', 'masrouf', 'sms-parser.js'));
const txt = fs.readFileSync(path.join(__dirname, 'sms-corpus.txt'), 'utf8');
let ok = 0, bad = 0;
for (const m of txt.matchAll(/#expect (\w+)\n([\s\S]*?)\n#end/g)) {
  const got = classify(m[2]);
  if (got === m[1]) ok++; else { bad++; console.log(`FAIL expected=${m[1]} got=${got}\n  ${m[2].replace(/\n/g, ' | ').slice(0, 110)}`); }
}
console.log(`JS: ${ok} passed, ${bad} failed`); process.exit(bad ? 1 : 0);
