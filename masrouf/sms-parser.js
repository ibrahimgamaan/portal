/* محلل رسائل البنوك (السعودية غالباً) - يعمل في المتصفح وفي Node للاختبار */
(function (root) {
  const AR = '٠١٢٣٤٥٦٧٨٩';
  const norm = s => String(s || '').replace(/[٠-٩]/g, d => AR.indexOf(d)).replace(/٫/g, '.').replace(/٬/g, ',').replace(/‏|‎/g, '');
  const CUR = '(?:SAR|SR|S\\.R|ر\\.?\\s?س|ريال)';
  const NUM = '(\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)';
  const SKIP = /(رمز|OTP|كلمة\s*(?:السر|المرور)|verification|one.?time|رمز التحقق|لا تشارك|تم رفض|رفض|declined|فشل)/i;
  const EXP = /(شراء|مشتريات|سحب|خصم|دفع|سداد|حوالة\s*صادرة|تحويل\s*صادر|حوالة\s*محلية|فاتورة|اشتراك|purchase|pos|withdraw|debit|paid|payment|sent|transfer|outgoing|bill\s*pay|atm|online|sadad)/i;
  const INC = /(إيداع|ايداع|حوالة\s*واردة|تحويل\s*وارد|راتب|استلام|استرداد|credited|deposit|received|refund|salary|incoming)/i;
  const CATS = [
    ['gov', /(أبشر|ابشر|مرور|جوازات|وزارة|بلدية|مخالفة|absher|traffic|moi\b|passport|municipal|توثيق|ناجز|najiz|قوى|muqeem|مقيم)/i],
    ['tech', /(إكسترا|اكسترا|extra\b|جرير|jarir|apple\s*store|samsung|الكترونيات|إلكترونيات|electronics|xcite|اكس سايت|stc\s*shop|جوال|mobile\s*shop)/i],
    ['furn', /(ايكيا|ikea|هوم سنتر|home\s*cent|أثاث|اثاث|مفروشات|furniture|danube\s*home|ساكو|saco|safco|home\s*box)/i],
    ['sport', /(جيم|نادي|gym|fitness|decathlon|ديكاثلون|سن اند ساند|sun\s*&\s*sand|لياقة|رياضة|sport|padel|بادل)/i],
    ['pet', /(\bpet\b|petshop|بيطري|veterinary|حيوانات|vet\b|pets)/i],
    ['maid', /(عمالة|خادمة|مساند|musaned|استقدام|تنظيف|cleaning|maid)/i],
    ['ins', /(تأمين|تامين|التعاونية|بوبا|ميدغلف|insurance|tawuniya|bupa|medgulf|malath|ملاذ)/i],
    ['charity', /(زكاة|زكاه|صدقة|صدقه|تبرع|جمعية|إحسان|احسان|وقف|ehsan|charity|donat|zakat|sadaqah|waqf)/i],
    ['loan', /(قسط|أقساط|اقساط|تمويل|قرض|تابي|تمارا|installment|loan|finance|tabby|tamara|tasheel|تسهيل)/i],
    ['subs', /(اشتراك|netflix|نتفلكس|شاهد|shahid|spotify|youtube\s*premium|anghami|osn|icloud|google\s*one|apple\.com\/bill|subscription|disney|prime video|chatgpt|openai)/i],
    ['car', /(ورشة|ورشه|صيانة|صيانه|زيت|إطارات|اطارات|مغسلة|غسيل سيارات|فحص دوري|مركز خدمة|workshop|garage|tire|tyre|car\s*wash|auto\s*service|oil change|lube|motor|وكالة)/i],
    ['travel', /(طيران|الخطوط|تذاكر|تذكرة|فندق|حجز|سياحة|تأشيرة|flynas|flyadeal|saudia|airlines|airline|booking\.com|hotel|airbnb|agoda|flight|tourism|visa fee|trip)/i],
    ['care', /(صالون|حلاق|حلاقة|عطور|عطر|عناية|مستحضرات|salon|barber|spa\b|perfume|beauty|sephora|nice\s*one|نايس ون|cosmetic)/i],
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
  /* محلات حدّدتَ فئتها بنفسك (لها الأولوية على التخمين) */
  const KNOWN = [
    ['shawerma house', 'food'],
    ['shabyat almualem', 'food'],
    ['folwat albahrain', 'groc'],
    ['dawar alsaada', 'food']
  ];
  const guessCat = m => { const l = String(m || '').toLowerCase(); for (const [k, c] of KNOWN) if (l.includes(k)) return c; return guessRule(m); };
  const guessRule = m => { for (const [id, re] of CATS) if (re.test(m || '')) return id; return 'other'; };

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
    const mm = main.match(/(?:لدى|عند|من\s*متجر|التاجر|\bmerchant\b|\bat\b|\bto\b|\bfrom\b|\bbiller\b|المستفيد|الجهة|الى|إلى|(?<=^|\s)من)\s*:?\s*([^\n]+?)(?=\s*(?:في\s*\d|بتاريخ|التاريخ|on\s|date|\d{1,2}[\/-]\d{1,2}|بطاقة|card|مدى|mada|رصيد|\n|$))/i);
    if (mm) merchant = mm[1].replace(/[*:]+$/g, '').replace(/^[\s:*-]+|[\s:*-]+$/g, '').slice(0, 40);
    return {type, amount, merchant, date: parseDate(t, ts), cat: type === 'inc' ? (/(راتب|salary)/i.test(main) ? 'salary' : 'extra') : guessCat(merchant + ' ' + main)};
  }
  const api = {parseSms, guessCat};
  if (typeof module !== 'undefined') module.exports = api; else root.SmsParser = api;
})(this);
