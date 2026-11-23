package app.masrouf;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** استخراج مبسّط (مبلغ + تاجر) لعرضه في الإشعار فقط؛ التحليل الكامل يتم داخل التطبيق. بلا اعتماد على أندرويد لسهولة الاختبار. */
final class SmsPreview {
    private static final String CUR = "(?:SAR|SR|S\\.R|ر\\.?\\s?س|ريال)";
    private static final String NUM = "(\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)";
    private static final Pattern BAL = Pattern.compile("(?:الرصيد|رصيدك|رصيد|balance|bal|avl|remaining\\s*limit|available)[^\\n]*", Pattern.CASE_INSENSITIVE);
    private static final Pattern[] AMT = {
        Pattern.compile("(?:مبلغ|بمبلغ|amount|amt|value)\\s*:?\\s*" + CUR + "?\\s*" + NUM, Pattern.CASE_INSENSITIVE),
        Pattern.compile(CUR + "\\s*:?\\s*" + NUM, Pattern.CASE_INSENSITIVE),
        Pattern.compile(NUM + "\\s*" + CUR, Pattern.CASE_INSENSITIVE)};
    private static final Pattern FEE = Pattern.compile("(?:الرسوم|رسوم(?:\\s*(?:التحويل|الخدمة|الحوالة))?|العمولة|عمولة|fees?|commission|charges?)\\s*:?\\s*" + CUR + "?\\s*" + NUM, Pattern.CASE_INSENSITIVE);
    private static final Pattern TOTAL = Pattern.compile("(?:الإجمالي|الاجمالي|المجموع|الإجمالى|total(?:\\s*amount)?)\\s*:?\\s*" + CUR + "?\\s*" + NUM, Pattern.CASE_INSENSITIVE);
    private static final Pattern MER_FIRST = Pattern.compile("(?:المستفيد|اسم\\s*المستفيد|beneficiary|لدى|عند|التاجر|\\bmerchant\\b|\\bat\\b|\\bto\\b|\\bbiller\\b|الجهة)\\s*:?\\s*([^\\n]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern MER = Pattern.compile("(?:لدى|عند|\\bat\\b|\\bto\\b|\\bfrom\\b|الى|إلى)\\s*:?\\s*([^\\n]+)", Pattern.CASE_INSENSITIVE);

    final String amount, merchant;

    private SmsPreview(String a, String m) { amount = a; merchant = m; }

    /** النص بعد توحيد الأرقام وإزالة سطر الرصيد (مطابق لـ norm و BAL في sms-parser.js) */
    static String mainText(String body) {
        String t = body == null ? "" : body;
        StringBuilder n = new StringBuilder();
        for (char c : t.toCharArray()) { if (c == '\u200f' || c == '\u200e') continue; n.append(c >= '٠' && c <= '٩' ? (char) ('0' + (c - '٠')) : c == '٫' ? '.' : c == '٬' ? ',' : c); }
        return BAL.matcher(n).replaceAll(" ");
    }

    private static String findBase(String main) {
        for (Pattern p : AMT) { Matcher m = p.matcher(main); if (m.find()) { String v = m.group(1).replace(",", ""); if (Double.parseDouble(v) > 0) return v; } }
        return null;
    }

    /** نفس منطق money في sms-parser.js: الإجمالي إن وُجد، وإلا المبلغ + الرسوم. */
    static SmsPreview of(String body) {
        String main = mainText(body);
        Matcher tm = TOTAL.matcher(main), fm = FEE.matcher(main);
        String total = tm.find() ? tm.group(1).replace(",", "") : null;
        String fee = fm.find() ? fm.group(1).replace(",", "") : null;
        String rest = FEE.matcher(TOTAL.matcher(main).replaceAll(" ")).replaceAll(" ");
        String base = findBase(rest), amount = null;
        if (total != null && Double.parseDouble(total) > 0) amount = total;
        else if (base != null) {
            BigDecimal s = new BigDecimal(base);
            if (fee != null && Double.parseDouble(fee) > 0) s = s.add(new BigDecimal(fee)).setScale(2, RoundingMode.HALF_UP).stripTrailingZeros();
            amount = s.toPlainString();
        }
        String merchant = null;
        Matcher mm = MER_FIRST.matcher(main);
        if (!mm.find()) { mm = MER.matcher(main); if (!mm.find()) mm = null; }
        if (mm != null) { merchant = mm.group(1).trim(); if (merchant.length() > 40) merchant = merchant.substring(0, 40); }
        return new SmsPreview(amount, merchant);
    }

    public static void main(String[] a) {
        String[] tests = {
            "POS Purchase (Contactless)\nBy: XX7483;Visa Credit\nAmount: SAR 21.00\nAt: Shawerma House\nIn SAUDI ARABIA\nRemaining limit SAR: 14,829.18\nOn: 2026-11-13 17:39:35",
            "POS Purchase (Contactless)\nBy: XX7483;Visa Credit\nAmount: SAR 10.60\nAt: FOLWAT ALBAHRAIN CO\nIn SAUDI ARABIA\nRemaining limit SAR: 14,414.61\nOn: 2026-11-14 18:35:13",
            "شراء بمبلغ ٤٥٫٥ ريال لدى بنده\nالرصيد 3,200 ريال"};
        for (String t : tests) { SmsPreview p = of(t); System.out.println(p.amount + " | " + p.merchant); }
    }
}
