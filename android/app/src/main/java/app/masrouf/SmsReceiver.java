package app.masrouf;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.regex.Pattern;

/** يستقبل الرسائل ويحفظ المالية منها فقط في طابور محلي؛ التحليل يتم داخل التطبيق. */
public class SmsReceiver extends BroadcastReceiver {
    static final String PREFS = "sms", KEY = "q";
    static final Pattern FIN = Pattern.compile("(شراء|سحب|خصم|دفع|سداد|حوالة|تحويل|إيداع|ايداع|راتب|مبلغ|فاتورة|purchase|withdraw|debit|credit|payment|SAR|ريال|ر\\.?س)", Pattern.CASE_INSENSITIVE);

    @Override public void onReceive(Context c, Intent i) {
        if (!Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(i.getAction())) return;
        SmsMessage[] parts = Telephony.Sms.Intents.getMessagesFromIntent(i);
        if (parts == null || parts.length == 0) return;
        StringBuilder body = new StringBuilder();
        for (SmsMessage m : parts) body.append(m.getMessageBody());
        String text = body.toString();
        if (!FIN.matcher(text).find()) return;
        try {
            push(c, parts[0].getOriginatingAddress(), text, parts[0].getTimestampMillis());
            notifyUser(c);
        } catch (Exception ignored) {}
    }

    static void push(Context c, String sender, String text, long ts) throws Exception {
        JSONObject o = new JSONObject();
        o.put("sender", sender);
        o.put("body", text);
        o.put("ts", ts);
        synchronized (SmsReceiver.class) {
            SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            JSONArray a = new JSONArray(sp.getString(KEY, "[]"));
            a.put(o);
            sp.edit().putString(KEY, a.toString()).apply();
        }
    }

    static String take(Context c) {
        synchronized (SmsReceiver.class) {
            SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String v = sp.getString(KEY, "[]");
            sp.edit().remove(KEY).apply();
            return v;
        }
    }

    static void notifyUser(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.createNotificationChannel(new NotificationChannel("tx", "عمليات جديدة", NotificationManager.IMPORTANCE_DEFAULT));
        PendingIntent pi = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n = new Notification.Builder(c, "tx").setSmallIcon(android.R.drawable.ic_menu_agenda)
            .setContentTitle("مصروفي").setContentText("وصلت عملية جديدة من رسالة البنك، اضغط للمراجعة")
            .setContentIntent(pi).setAutoCancel(true).build();
        nm.notify((int) (System.currentTimeMillis() % 100000), n);
    }
}
