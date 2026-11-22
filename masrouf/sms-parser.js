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
    ['carwash', /(غسيل\s*سيارات|غسيل\s*السيارات|مغسلة\s*سيارات|تلميع|car\s*wash|carwash|كار\s*واش)/i],
    ['gov', /(أبشر|ابشر|جوازات|وزارة|بلدية|absher|moi\b|passport|municipal|توثيق|ناجز|najiz|قوى|muqeem|مقيم)/i],
    ['tech', /(إكسترا|اكسترا|extra\b|جرير|jarir|apple\s*store|samsung|الكترونيات|إلكترونيات|electronics|xcite|اكس سايت|stc\s*shop|جوال|mobile\s*shop)/i],
    ['furn', /(ايكيا|ikea|هوم سنتر|home\s*cent|أثاث|اثاث|مفروشات|furniture|danube\s*home|ساكو|saco|safco|home\s*box)/i],
    ['sport', /(جيم|نادي|gym|fitness|decathlon|ديكاثلون|سن اند ساند|sun\s*&\s*sand|لياقة|رياضة|sport|padel|بادل)/i],
    ['carins', /((?:تأمين|تامين|insurance).*(?:سيارة|سيارات|مركبات|مركبة|vehicle|motor|car\b|شامل|ضد الغير)|(?:سيارة|مركبات|vehicle|motor).*(?:تأمين|insurance))/i],
    ['medins', /(تأمين|تامين|التعاونية|بوبا|ميدغلف|insurance|tawuniya|bupa|medgulf|malath|ملاذ|وثيقة)/i],
    ['fines', /(مخالفة|مخالفات|violation|ساهر|saher|traffic\s*fine)/i],
    ['taxi', /(أجرة|اجره|تاكسي|اوبر|أوبر|كريم|uber|careem|taxi|bolt|jeeny|بولت)/i],
    ['laundry', /(مغسلة|غسيل ملابس|laundry|dry\s*clean|دراي كلين)/i],
    ['repair', /(سباك|سباكة|كهربائي|صيانة منزل|دهان|حداد|تكييف|plumb|handyman|electrician|ac\s*repair)/i],
    ['acc', /(إكسسوار|اكسسوار|accessor|ساعات|watch|نظارات|glasses|optic|بصريات|مجوهرات|jewel|ذهب|gold)/i],
    ['charity', /(زكاة|زكاه|صدقة|صدقه|تبرع|جمعية|إحسان|احسان|وقف|ehsan|charity|donat|zakat|sadaqah|waqf)/i],
    ['loan', /(قسط|أقساط|اقساط|تمويل|قرض|تابي|تمارا|installment|loan|finance|tabby|tamara|tasheel|تسهيل)/i],
    ['subs', /(اشتراك|netflix|نتفلكس|شاهد|shahid|spotify|youtube\s*premium|anghami|osn|icloud|google\s*one|apple\.com\/bill|subscription|disney|prime video|chatgpt|openai)/i],
    ['car', /(ورشة|ورشه|صيانة|صيانه|زيت|إطارات|اطارات|مغسلة|غسيل سيارات|فحص دوري|مركز خدمة|workshop|garage|tire|tyre|auto\s*service|oil change|lube|motor|وكالة)/i],
    ['travel', /(طيران|الخطوط|تذاكر|تذكرة|فندق|حجز|سياحة|تأشيرة|flynas|flyadeal|saudia|airlines|airline|booking\.com|hotel|airbnb|agoda|flight|tourism|visa fee|trip)/i],
    ['care', /(صالون|حلاق|حلاقة|عطور|عطر|عناية|مستحضرات|salon|barber|spa\b|perfume|beauty|sephora|nice\s*one|نايس ون|cosmetic)/i],
    ['food', /(شاورما|شعبيات|مخبز|حلويات|فلافل|مشاوي|عصير|shawerma|shawarma|shabyat|folwat|bakery|sweets|juice|grill|rest(?:au|u)r|falafel|مطعم|مطاعم|كافيه|كوفي|قهوة|ستاربكس|برجر|بيتزا|هنقرستيشن|جاهز|كودو|هرفي|البيك|دومينوز|ماكدونالد|coffee|cafe|restaurant|kudu|herfy|albaik|starbucks|hungerstation|jahez|mcdonald|burger|dunkin|tim hortons)/i],
    ['groc', /(بنده|الدانوب|التميمي|نستو|كارفور|بقالة|سوبرماركت|هايبر|لولو|العثيم|panda|danube|tamimi|nesto|carrefour|lulu|othaim|grocery|supermarket|hyper)/i],
    ['trans', /(ساسكو|أدنوك|ادنوك|وقود|بنزين|محطة|الدريس|petrol|sasco|aldrees|fuel|parking|مواقف|بولت|bolt)/i],
    ['elec', /(كهرباء|السعودية\s*للكهرباء|saudi\s*electricity|electric|\bsec\b)/i],
    ['water', /(مياه|المياه\s*الوطنية|\bnwc\b|water\s*bill|\bwater\b)/i],
    ['telecom', /(stc|زين|موبايلي|سلام|اتصالات|إنترنت|انترنت|فايبر|mobily|zain|salam|internet|fiber|fibre|telecom)/i],
    ['gas', /((?:^|\s)غاز(?=\s|$)|الغاز|اسطوانة|gas\s*bill|gas\s*cylinder)/i],
    ['bills', /(فاتورة|سداد|sadad|bill\s*payment)/i],
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

  function parseTime(t, ts) {
    const m = t.match(/(?:^|[\s:T])(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp]\.?[Mm]\.?|ص|م)?/);
    if (m) { let h = +m[1]; const mi = +m[2], ap = (m[3] || '').toLowerCase();
      if (h < 24 && mi < 60) { if (/^p|م/.test(ap) && h < 12) h += 12; if (/^a|ص/.test(ap) && h === 12) h = 0; return String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0'); } }
    const f = new Date(ts || Date.now()); return String(f.getHours()).padStart(2, '0') + ':' + String(f.getMinutes()).padStart(2, '0');
  }
  /* ===== التصنيف: txn = عملية مؤكدة، maybe = غير مؤكدة، ignore = ليست عملية =====
     تُنسخ هذه القواعد حرفياً في SmsClassifier.java؛ وملف tests/sms-corpus.txt يتحقق من تطابقهما. */
  const L = '(?<![\\p{L}\\p{N}])', R = '(?![\\p{L}\\p{N}])';
  const SKIP2 = new RegExp('(?:رمز|otp|كلمة\\s*(?:السر|المرور)|verification|one.?time|لا\\s*تشارك|do\\s*not\\s*share|تم\\s*رفض|رفض|declined|فشل|failed|unsuccessful|insufficient|غير\\s*كاف|تعذر|تم\\s*إيقاف)', 'iu');
  const PROMO = new RegExp('(?:\\d\\s*(?:%|٪)|(?<![\\p{L}])(?:عرض|عروض|احصل|استمتع|وفر|وفّر|تخفيض|تخفيضات|خصومات|تهانينا|مبروك|فزت|جائزة|جوائز|مسابقة|اربح|سارع|فرصتك|للمزيد|لمعرفة|اضغط|قدم\\s*الآن|قدّم\\s*الآن|حمّل|حمل\\s*التطبيق)|خصم\\s*(?:يصل|حتى|على)|كود\\s*(?:الخصم|خصم)|promo|offer|discount|coupon|congratulations|apply\\s*now|download|click|https?:|www\\.)', 'iu');
  const STRONG = new RegExp(L + '(?:شراء|مشتريات|سحب\\s*(?:نقدي|من)|حوالة\\s*(?:صادرة|واردة|محلية|دولية)|تحويل\\s*(?:صادر|وارد)|إيداع|ايداع|سداد|استرداد|راتب|تم\\s*(?:خصم|تحويل|دفع|إيداع|ايداع|سحب|شراء)|خصم\\s*(?:مبلغ|رسوم|فاتورة)|purchase|pos|withdrawal|withdraw|atm|debited|debit|credited|transfer|bill\\s*payment|payment|refund|paid|received|salary)' + R, 'iu');
  const WEAK = new RegExp('(?:خصم|مبلغ|دفع|حوالة|تحويل|amount|amt|deducted)', 'iu');
  const BAL = /(?:الرصيد|رصيدك|رصيد|balance|bal|avl|remaining\s*limit|available)[^\n]*/ig;
  const AMTP = [
    new RegExp('(?:مبلغ|بمبلغ|amount|amt|value)\\s*:?\\s*' + CUR + '?\\s*' + NUM, 'i'),
    new RegExp(CUR + '\\s*:?\\s*' + NUM, 'i'),
    new RegExp(NUM + '\\s*' + CUR, 'i')
  ];
  function findAmount(main) { for (const re of AMTP) { const m = main.match(re); if (m) { const v = parseFloat(m[1].replace(/,/g, '')); if (v > 0) return v; } } return 0; }
  function classify(body) {
    const t = norm(body), main = t.replace(BAL, ' ');
    if (!t.trim() || SKIP2.test(main)) return 'ignore';
    if (!(findAmount(main) > 0)) return 'ignore';
    const strong = STRONG.test(main), promoN = (main.match(new RegExp(PROMO.source, 'giu')) || []).length, promo = promoN > 0;
    if (promoN >= 2 || (promo && !strong)) return 'ignore';
    if (strong) return promo ? 'maybe' : 'txn';
    return WEAK.test(main) ? 'maybe' : 'ignore';
  }
  /* استخراج الحقول دون حكم على الرسالة (يُستعمل بعد التصنيف) */
  function parseLoose(body, ts) {
    const t = norm(body), main = t.replace(BAL, ' ');
    let type = 'exp';
    const e = main.search(EXP), i = main.search(INC);
    if (i >= 0 && (e < 0 || i < e)) type = 'inc';
    const amount = findAmount(main); if (!(amount > 0)) return null;
    let merchant = '';
    const mm = main.match(/(?:لدى|عند|من\s*متجر|التاجر|\bmerchant\b|\bat\b|\bto\b|\bfrom\b|\bbiller\b|المستفيد|الجهة|الى|إلى|(?<=^|\s)من)\s*:?\s*([^\n]+?)(?=\s*(?:في\s*\d|بتاريخ|التاريخ|on\s|date|\d{1,2}[\/-]\d{1,2}|بطاقة|card|مدى|mada|رصيد|\n|$))/i);
    if (mm) merchant = mm[1].replace(/[*:]+$/g, '').replace(/^[\s:*-]+|[\s:*-]+$/g, '').slice(0, 40);
    return {type, amount, merchant, date: parseDate(t, ts), time: parseTime(t, ts), cat: type === 'inc' ? (/(راتب|salary)/i.test(main) ? 'salary' : 'extra') : guessCat(merchant + ' ' + main)};
  }
  function parseSms(body, ts) { return classify(body) === 'txn' ? parseLoose(body, ts) : null; }
  const api = {parseSms, parseLoose, classify, guessCat};
  if (typeof module !== 'undefined') module.exports = api; else root.SmsParser = api;
})(this);
