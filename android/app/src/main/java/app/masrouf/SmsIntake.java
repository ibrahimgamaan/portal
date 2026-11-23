package app.masrouf;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.regex.Pattern;

/** طابور الرسائل المالية المحوَّلة من تطبيق القارئ، وإشعار العمليات المؤكدة. التحليل الكامل داخل التطبيق. */
final class SmsIntake {
    static final String PREFS = "sms", KEY = "q";
    static final Pattern FIN = Pattern.compile("(شراء|سحب|خصم|دفع|سداد|حوالة|تحويل|إيداع|ايداع|راتب|مبلغ|فاتورة|purchase|withdraw|debit|credit|payment|SAR|ريال|ر\\.?س)", Pattern.CASE_INSENSITIVE);

    /** تستدعيها ReaderReceiver عند وصول رسالة محوَّلة من تطبيق "قارئ مصروفي". */
    static void intake(Context c, String sender, String text, long ts) {
        if (text == null || !FIN.matcher(text).find()) return;   // رسائل غير مالية لا تُخزَّن إطلاقاً
        try {
            SmsClassifier k = SmsClassifier.of(text);
            push(c, sender, text, ts, k);
            if (SmsClassifier.TXN.equals(k.kind)) notifyUser(c, k);   // إشعار للعمليات المؤكدة فقط
        } catch (Exception ignored) {}
    }

    static void push(Context c, String sender, String text, long ts, SmsClassifier k) throws Exception {
        JSONObject o = new JSONObject();
        if (k != null) { o.put("k", k.kind); if (k.amount != null) o.put("amt", k.amount); if (k.merchant != null) o.put("mer", k.merchant); }
        o.put("sender", sender);
        o.put("body", text);
        o.put("ts", ts);
        synchronized (SmsIntake.class) {
            SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            JSONArray a = new JSONArray(sp.getString(KEY, "[]"));
            a.put(o);
            SharedPreferences.Editor ed = sp.edit().putString(KEY, a.toString());
            if (k != null && SmsClassifier.TXN.equals(k.kind)) ed.putInt("n", sp.getInt("n", 0) + 1);
            ed.apply();
        }
    }

    static String take(Context c) {
        synchronized (SmsIntake.class) {
            SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String v = sp.getString(KEY, "[]");
            sp.edit().remove(KEY).putInt("n", 0).apply();
            return v;
        }
    }

    static void notifyUser(Context c, SmsClassifier p) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.createNotificationChannel(new NotificationChannel("tx", "عمليات جديدة", NotificationManager.IMPORTANCE_HIGH));
        int n = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt("n", 1);
        Intent open = new Intent(c, MainActivity.class).setAction("app.masrouf.INBOX").addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        String title = n > 1 ? n + " عمليات جديدة بانتظار مراجعتك" : (p.amount != null ? "عملية جديدة: " + p.amount + " ر.س" : "عملية جديدة من رسالة البنك");
        String text = n > 1 ? "اضغط لمراجعتها وتأكيدها" : (p.merchant != null ? p.merchant + " — " : "") + "اضغط للمراجعة والتأكيد";
        Notification nt = new Notification.Builder(c, "tx").setSmallIcon(android.R.drawable.ic_menu_agenda)
            .setContentTitle(title).setContentText(text).setStyle(new Notification.BigTextStyle().bigText(text))
            .setContentIntent(pi).setAutoCancel(true).build();
        nm.notify(1001, nt);   // إشعار واحد يتحدّث بدل تكدّس عدة إشعارات
    }
}
