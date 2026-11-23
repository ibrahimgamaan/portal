package app.masrouf.reader;

import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import java.util.regex.Pattern;

/**
 * مهمته الوحيدة: تمرير رسائل البنك المالية إلى تطبيق مصروفي.
 * لا يصنّف ولا يخزّن ولا يتصل بالإنترنت، ولذلك لا يحتاج تحديثاً أبداً تقريباً.
 * التصنيف الحقيقي يتم داخل مصروفي فتتحدث قواعده بدون المساس بهذا التطبيق.
 */
public class SmsForwarder extends BroadcastReceiver {
    // فلتر واسع وثابت: يمنع تمرير رسائلك الشخصية غير المالية
    static final Pattern FIN = Pattern.compile("(شراء|سحب|خصم|دفع|سداد|حوالة|تحويل|إيداع|ايداع|راتب|مبلغ|فاتورة|purchase|withdraw|debit|credit|payment|SAR|ريال|ر\\.?\\s?س|transfer|refund|amount)", Pattern.CASE_INSENSITIVE);

    @Override public void onReceive(Context c, Intent i) {
        if (!Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(i.getAction())) return;
        SmsMessage[] parts = Telephony.Sms.Intents.getMessagesFromIntent(i);
        if (parts == null || parts.length == 0) return;
        StringBuilder body = new StringBuilder();
        for (SmsMessage m : parts) body.append(m.getMessageBody());
        String text = body.toString();
        if (!FIN.matcher(text).find()) return;
        Intent f = new Intent("app.masrouf.SMS_FORWARD")
            .setComponent(new ComponentName("app.masrouf", "app.masrouf.ReaderReceiver"))
            .putExtra("sender", parts[0].getOriginatingAddress())
            .putExtra("body", text)
            .putExtra("ts", parts[0].getTimestampMillis());
        c.sendBroadcast(f);
    }
}
