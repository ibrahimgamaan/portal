// تشغيل: node tests/sms-parse-test.js  (يتحقق من المبلغ والتاجر والتاريخ والوقت والفئة)
const fs = require('fs'), path = require('path');
const {parseLoose} = require(path.join(__dirname, '..', 'masrouf', 'sms-parser.js'));
const txt = fs.readFileSync(path.join(__dirname, 'sms-parse.txt'), 'utf8');
let ok = 0, bad = 0;
for (const m of txt.matchAll(/#parse ([^\n]*)\n([\s\S]*?)\n#end/g)) {
  const exp = Object.fromEntries(m[1].split('|').map(x => { const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1)]; }));
  const r = parseLoose(m[2], new Date(exp.ts).getTime()) || {};
  const errs = [];
  for (const k of ['amount', 'merchant', 'date', 'time', 'cat']) if (exp[k] !== undefined && String(r[k]) !== exp[k]) errs.push(`${k}: expected "${exp[k]}" got "${r[k]}"`);
  if (errs.length) { bad++; console.log('FAIL', m[2].split('\n')[0], '\n  ' + errs.join('\n  ')); } else ok++;
}
console.log(`JS parse: ${ok} passed, ${bad} failed`); process.exit(bad ? 1 : 0);
