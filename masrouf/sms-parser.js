/* محلل رسائل البنوك (السعودية غالباً) - يعمل في المتصفح وفي Node للاختبار */
(function (root) {
  const AR = '٠١٢٣٤٥٦٧٨٩';
  const norm = s => String(s || '').replace(/[٠-٩]/g, d => AR.indexOf(d)).replace(/٫/g, '.').replace(/٬/g, ',').replace(/‏|‎/g, '');
  const CUR = '(?:SAR|SR|S\\.R|ر\\.?\\s?س|ريال)';
  const NUM = '(\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)';
  const SKIP = /(رمز|OTP|كلمة\s*(?:السر|المرور)|verification|one.?time|رمز التحقق|لا تشارك|تم رفض|رفض|declined|فشل)/i;
  const EXP = /(شراء|مشتريات|سحب|خصم|دفع|سداد|حوالة\s*صادرة|تحويل\s*صادر|حوالة\s*محلية|فاتورة|اشتراك|purchase|pos|withdraw|debit|paid|payment|sent|transfer\s*to)/i;
  const INC = /(إيداع|ايداع|حوالة\s*واردة|تحويل\s*وارد|راتب|استلام|استرداد|credit|deposit|received|refund|salary)/i;
  const CATS = [
    ['food', /(شاورما|شعبيات|مخبز|حلويات|فلافل|مشاوي|عصير|shawerma|shawarma|shabyat|folwat|bakery|sweets|juice|grill|rest(?:au|u)r|falafel|مطعم|مطاعم|كافيه|كوفي|قهوة|ستاربكس|برجر|بيتزا|هنقرستيشن|جاهز|كودو|هرفي|البيك|دومينوز|ماكدونالد|coffee|cafe|restaurant|kudu|herfy|albaik|starbucks|hungerstation|jahez|mcdonald|burger|dunkin|tim hortons)/i],
    ['groc', /(بنده|الدانوب|التميمي|نستو|كارفور|بقالة|سوبرماركت|هايبر|لولو|العثيم|panda|danube|tamimi|nesto|carrefour|lulu|othaim|grocery|supermarket|hyper)/i],
    ['trans', /(ساسكو|أدنوك|ادنوك|وقود|بنزين|محطة|الدريس|اوبر|أوبر|كريم|uber|careem|petrol|sasco|aldrees|fuel|parking|مواقف|بولت|bolt)/i],
    ['bills', /(stc|زين|موبايلي|سلام|كهرباء|مياه|السعودية للكهرباء|فاتورة|سداد|اتصالات|mobily|zain|salam|electric|water|nwc|sec\b|sadad)/i],
    ['health', /(صيدلية|النهدي|الدواء|مستشفى|عيادة|مركز طبي|nahdi|pharmacy|clinic|hospital|dawaa|medical)/i],
    ['edu', /(مدرسة|جامعة|اكاديمية|أكاديمية|دورة|school|university|academy|course|udemy)/i],
    ['shop', /(امازون|أمازون|amazon|noon|نون|شي ان|shein|اكسترا|extra|ايكيا|ikea|زارا|zara|سنتربوينت|centrepoint|h&m|namshi|نمشي|mall|مول|جرير|jarir)/i],
    ['fun', /(سينما|نتفلكس|netflix|شاهد|shahid|playstation|steam|vox|muvi|spotify|youtube|apple\.com|itunes|ألعاب)/i],
    ['home', /(إيجار|ايجار|ejar)/i]
  ];
  const guessCat = m => { for (const [id, re] of CATS) if (re.test(m || '')) return id; return 'other'; };

  function parseDate(t, fallbackTs) {
    const d = t.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/) || null;
    let y, m, dd;
    if (d) { y = +d[1]; m = +d[2]; dd = +d[3]; }
    else {
      const e = t.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
      if (e) { dd = +e[1]; m = +e[2]; y = +e[3]; if (y < 100) y += 2000; }
    }
    if (y && m >= 1 && m <= 12 && dd >= 1 && dd <= 31) return `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const f = new Date(fallbackTs || Date.now());
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
  }

  function parseSms(body, ts) {
    const t = norm(body);
    if (!t || SKIP.test(t)) return null;
    // استبعاد جزء الرصيد حتى لا يُلتقط كمبلغ
    const main = t.replace(/(?:الرصيد|رصيدك|رصيد|balance|bal|avl|remaining\s*limit|available)[^\n]*/ig, ' ');
    let type = null;
    const e = main.search(EXP), i = main.search(INC);
    if (e >= 0 && (i < 0 || e <= i)) type = 'exp'; else if (i >= 0) type = 'inc';
    if (!type) return null;
    const pats = [
      new RegExp('(?:مبلغ|بمبلغ|amount|amt|value)\\s*:?\\s*' + CUR + '?\\s*' + NUM, 'i'),
      new RegExp(CUR + '\\s*:?\\s*' + NUM, 'i'),
      new RegExp(NUM + '\\s*' + CUR, 'i')
    ];
    let amount = 0;
    for (const re of pats) { const m = main.match(re); if (m) { amount = parseFloat(m[1].replace(/,/g, '')); break; } }
    if (!(amount > 0)) return null;
    let merchant = '';
    const mm = main.match(/(?:لدى|عند|من\s*متجر|التاجر|\bmerchant\b|\bat\b|\bto\b|الى|إلى|(?<=^|\s)من)\s*:?\s*([^\n]+?)(?=\s*(?:في\s*\d|بتاريخ|التاريخ|on\s|date|\d{1,2}[\/-]\d{1,2}|بطاقة|card|مدى|mada|رصيد|\n|$))/i);
    if (mm) merchant = mm[1].replace(/[*:]+$/g, '').replace(/^[\s:*-]+|[\s:*-]+$/g, '').slice(0, 40);
    return {type, amount, merchant, date: parseDate(t, ts), cat: type === 'inc' ? (/(راتب|salary)/i.test(main) ? 'salary' : 'extra') : guessCat(merchant + ' ' + main)};
  }
  const api = {parseSms, guessCat};
  if (typeof module !== 'undefined') module.exports = api; else root.SmsParser = api;
})(this);
