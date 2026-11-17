const fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const L=[
['أ','ألف','Alif','أسد','1f981'],['ب','باء','Baa','بيت','1f3e0'],['ت','تاء','Taa','تفاح','1f34e'],['ث','ثاء','Thaa','ثعلب','1f98a'],
['ج','جيم','Jeem','جمل','1f42a'],['ح','حاء','Haa','حصان','1f40e'],['خ','خاء','Khaa','خروف','1f411'],['د','دال','Daal','دجاجة','1f414'],
['ذ','ذال','Dhaal','ذرة','1f33d'],['ر','راء','Raa','ريشة','1fab6'],['ز','زاي','Zay','زرافة','1f992'],['س','سين','Seen','سمكة','1f41f'],
['ش','شين','Sheen','شجرة','1f333'],['ص','صاد','Saad','صاروخ','1f680'],['ض','ضاد','Daad','ضفدع','1f438'],['ط','طاء','Taa','طائرة','2708'],
['ظ','ظاء','Dhaa','ظرف','2709'],['ع','عين','Ayn','عنب','1f347'],['غ','غين','Ghayn','غيمة','2601'],['ف','فاء','Faa','فراشة','1f98b'],
['ق','قاف','Qaaf','قمر','1f319'],['ك','كاف','Kaaf','كتاب','1f4d6'],['ل','لام','Laam','ليمون','1f34b'],['م','ميم','Meem','موز','1f34c'],
['ن','نون','Noon','نجمة','2b50'],['ه','هاء','Ha','هدية','1f381'],['و','واو','Waaw','وردة','1f339'],['ي','ياء','Yaa','يد','270b'],
];
const cols=['#e53935','#f2a900','#f57c00','#2e9e44','#1e88e5','#8e24aa','#d81b60','#00897b'];
const W=path.resolve('node_modules');
const css=`
@font-face{font-family:C;font-weight:800;src:url(file://${W}/@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-800-normal.woff2)}
@font-face{font-family:C;font-weight:900;src:url(file://${W}/@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-900-normal.woff2)}
@font-face{font-family:C;font-weight:700;src:url(file://${W}/@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-700-normal.woff2)}
@font-face{font-family:S;font-style:italic;src:url(file://${W}/@fontsource/roboto-slab/files/roboto-slab-latin-400-normal.woff2)}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm}
body{font-family:C,sans-serif;background:#fff;direction:rtl}
.page{width:210mm;height:297mm;padding:12mm;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:7mm;page-break-after:always;break-after:page;overflow:hidden}
.card{border:1mm solid #e9ac90;border-radius:9mm;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:9mm}
.pic{position:absolute;top:6mm;left:6mm;width:27mm;text-align:center}
.pic img{width:25mm;height:25mm;display:block;margin:0 auto}
.w{font-weight:800;font-size:17pt;line-height:1.2;margin-top:1.5mm;white-space:nowrap}
.g{position:absolute;top:0;left:0;right:0;bottom:44mm;top:34mm;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:122pt;line-height:1.6;color:#000}
.n{font-weight:800;font-size:33pt;line-height:1.1}
.e{font-family:S,serif;font-style:italic;font-size:19pt;margin-top:1.5mm;direction:ltr;color:#111}
`;
function card(c,i){const col=cols[i%cols.length];const w=c[3];
 return `<div class="card"><div class="pic"><img src="file://${W}/@twemoji/svg/${c[4]}.svg"><div class="w"><span style="color:${col}">${w[0]}</span>${w.slice(1)}</div></div><div class="g">${c[0]}</div><div class="n">${c[1]}</div><div class="e">${c[2]}</div></div>`;}
async function make(list,out,startIdx){
 for(const c of list) if(!fs.existsSync(`${W}/@twemoji/svg/${c[4]}.svg`)) throw new Error('missing '+c[4]);
 let h=`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><style>${css}</style><body>`;
 for(let p=0;p<list.length;p+=4) h+=`<div class="page">${list.slice(p,p+4).map((c,j)=>card(c,startIdx+p+j)).join('')}</div>`;
 fs.writeFileSync('tmp.html',h);
 const b=await chromium.launch();const pg=await b.newPage();
 await pg.goto('file://'+path.resolve('tmp.html'));await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(500);
 await pg.pdf({path:out,format:'A4',printBackground:true,preferCSSPageSize:true});await b.close();
}
(async()=>{
 await make(L,'full.pdf',0);
 await make(L.slice(4),'rest.pdf',4);
})();
