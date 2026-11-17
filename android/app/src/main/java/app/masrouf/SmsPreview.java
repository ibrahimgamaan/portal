package app.masrouf;

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
    private static final Pattern MER = Pattern.compile("(?:لدى|عند|\\bat\\b|\\bto\\b|\\bfrom\\b|الى|إلى)\\s*:?\\s*([^\\n]+)", Pattern.CASE_INSENSITIVE);

    final String amount, merchant;

    private SmsPreview(String a, String m) { amount = a; merchant = m; }

    static SmsPreview of(String body) {
        String t = body == null ? "" : body;
        StringBuilder n = new StringBuilder();
        for (char c : t.toCharArray()) n.append(c >= '٠' && c <= '٩' ? (char) ('0' + (c - '٠')) : c == '٫' ? '.' : c == '٬' ? ',' : c);
        String main = BAL.matcher(n).replaceAll(" ");
        String amount = null;
        for (Pattern p : AMT) { Matcher m = p.matcher(main); if (m.find()) { amount = m.group(1).replace(",", ""); break; } }
        String merchant = null;
        Matcher mm = MER.matcher(main);
        if (mm.find()) { merchant = mm.group(1).trim(); if (merchant.length() > 40) merchant = merchant.substring(0, 40); }
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
