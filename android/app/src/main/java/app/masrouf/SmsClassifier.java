package app.masrouf;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * يقرر هل الرسالة عملية مالية فعلية. نسخة حرفية من classify في sms-parser.js،
 * ويتحقق tests/sms-corpus.txt من تطابقهما. بلا اعتماد على أندرويد لسهولة الاختبار.
 */
final class SmsClassifier {
    static final String TXN = "txn", MAYBE = "maybe", IGNORE = "ignore";
    private static final int F = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;
    private static final String L = "(?<![\\p{L}\\p{N}])", R = "(?![\\p{L}\\p{N}])";
    private static final Pattern SKIP = Pattern.compile("(?:رمز|otp|كلمة\\s*(?:السر|المرور)|verification|one.?time|لا\\s*تشارك|do\\s*not\\s*share|تم\\s*رفض|رفض|declined|فشل|failed|unsuccessful|insufficient|غير\\s*كاف|تعذر|تم\\s*إيقاف)", F);
    private static final Pattern PROMO = Pattern.compile("(?:\\d\\s*(?:%|٪)|(?<![\\p{L}])(?:عرض|عروض|احصل|استمتع|وفر|وفّر|تخفيض|تخفيضات|خصومات|تهانينا|مبروك|فزت|جائزة|جوائز|مسابقة|اربح|سارع|فرصتك|للمزيد|لمعرفة|اضغط|قدم\\s*الآن|قدّم\\s*الآن|حمّل|حمل\\s*التطبيق)|خصم\\s*(?:يصل|حتى|على)|كود\\s*(?:الخصم|خصم)|promo|offer|discount|coupon|congratulations|apply\\s*now|download|click|https?:|www\\.)", F);
    private static final Pattern STRONG = Pattern.compile(L + "(?:شراء|مشتريات|سحب\\s*(?:نقدي|من)|حوالة\\s*(?:صادرة|واردة|محلية|دولية)|تحويل\\s*(?:صادر|وارد)|إيداع|ايداع|سداد|استرداد|راتب|تم\\s*(?:خصم|تحويل|دفع|إيداع|ايداع|سحب|شراء)|خصم\\s*(?:مبلغ|رسوم|فاتورة)|purchase|pos|withdrawal|withdraw|atm|debited|debit|credited|transfer|bill\\s*payment|payment|refund|paid|received|salary)" + R, F);
    private static final Pattern WEAK = Pattern.compile("(?:خصم|مبلغ|دفع|حوالة|تحويل|amount|amt|deducted)", F);

    final String kind;
    final String amount, merchant;

    private SmsClassifier(String k, SmsPreview p) { kind = k; amount = p.amount; merchant = p.merchant; }

    static SmsClassifier of(String body) {
        SmsPreview p = SmsPreview.of(body);
        return new SmsClassifier(classify(body, p), p);
    }

    private static String classify(String body, SmsPreview p) {
        String main = SmsPreview.mainText(body);
        if (main.trim().isEmpty() || SKIP.matcher(main).find()) return IGNORE;
        if (p.amount == null) return IGNORE;
        boolean strong = STRONG.matcher(main).find();
        int promoN = 0;
        Matcher m = PROMO.matcher(main);
        while (m.find()) promoN++;
        if (promoN >= 2 || (promoN > 0 && !strong)) return IGNORE;
        if (strong) return promoN > 0 ? MAYBE : TXN;
        return WEAK.matcher(main).find() ? MAYBE : IGNORE;
    }

    /** اختبار على المجموعة المشتركة: java SmsClassifier path/to/sms-corpus.txt */
    public static void main(String[] a) throws Exception {
        String txt = new String(Files.readAllBytes(Paths.get(a[0])), StandardCharsets.UTF_8);
        Matcher m = Pattern.compile("#expect (\\w+)\\n([\\s\\S]*?)\\n#end").matcher(txt);
        int ok = 0, bad = 0;
        while (m.find()) {
            String got = of(m.group(2)).kind;
            if (got.equals(m.group(1))) ok++;
            else { bad++; System.out.println("FAIL expected=" + m.group(1) + " got=" + got + "\n  " + m.group(2).replace("\n", " | ")); }
        }
        System.out.println("Java: " + ok + " passed, " + bad + " failed");
        System.exit(bad == 0 ? 0 : 1);
    }
}
