package app.masrouf;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** يستقبل رسائل البنك من تطبيق "قارئ مصروفي" (الوحيد الذي يملك صلاحية الرسائل) وحالته. */
public class ReaderReceiver extends BroadcastReceiver {
    static final String READER_PKG = "app.masrouf.reader";
    static final String ACTION_SMS = "app.masrouf.SMS_FORWARD", ACTION_STATUS = "app.masrouf.READER_STATUS";

    @Override public void onReceive(Context c, Intent i) {
        if (i == null || i.getAction() == null) return;
        // حماية من الانتحال: على أندرويد 14+ نتحقق أن المرسل هو تطبيق القارئ
        if (Build.VERSION.SDK_INT >= 34) {
            String from = getSentFromPackage();
            if (from != null && !READER_PKG.equals(from)) return;
        }
        if (ACTION_SMS.equals(i.getAction())) {
            c.getSharedPreferences(SmsIntake.PREFS, Context.MODE_PRIVATE).edit().putBoolean("granted", true).apply();
            SmsIntake.intake(c, i.getStringExtra("sender"), i.getStringExtra("body"), i.getLongExtra("ts", System.currentTimeMillis()));
        } else if (ACTION_STATUS.equals(i.getAction())) {
            c.getSharedPreferences(SmsIntake.PREFS, Context.MODE_PRIVATE).edit().putBoolean("granted", i.getBooleanExtra("granted", false)).apply();
        }
    }
}
