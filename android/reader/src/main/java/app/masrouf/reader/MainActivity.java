package app.masrouf.reader;

import android.Manifest;
import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/** شاشة بسيطة: حالة الإذن، وزر التفعيل، وخطوات "الإعدادات المقيّدة"، وزر الرجوع إلى مصروفي. */
public class MainActivity extends Activity {
    TextView status;
    Button grant;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setStatusBarColor(0xFF0F766E);
        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(0xFFF3F6F6);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        int p = dp(20);
        root.setPadding(p, dp(28), p, p);
        sv.addView(root);
        setContentView(sv);

        root.addView(text("قارئ مصروفي", 24, true, 0xFF0F1F1E));
        root.addView(text("يقرأ رسائل البنك ويمرّرها إلى تطبيق مصروفي فقط، ولا يتصل بالإنترنت ولا يحفظ شيئاً. ثبّته مرة واحدة ولا يحتاج تحديثاً بعد ذلك، فيتحدث مصروفي وحده بلا أي حظر.", 15, false, 0xFF5B6A79));

        status = text("", 18, true, 0xFF0F1F1E);
        status.setPadding(dp(16), dp(14), dp(16), dp(14));
        GradientDrawable g = new GradientDrawable(); g.setColor(Color.WHITE); g.setCornerRadius(dp(14)); status.setBackground(g);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2); lp.topMargin = dp(18); lp.bottomMargin = dp(14);
        root.addView(status, lp);

        grant = button("تفعيل إذن قراءة الرسائل", true);
        grant.setOnClickListener(v -> requestPermissions(new String[]{Manifest.permission.RECEIVE_SMS}, 1));
        root.addView(grant);
        Button settings = button("فتح إعدادات التطبيق", false);
        settings.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))));
        root.addView(settings);
        Button open = button("الرجوع إلى مصروفي", false);
        open.setOnClickListener(v -> { Intent i = getPackageManager().getLaunchIntentForPackage("app.masrouf"); if (i != null) startActivity(i); });
        root.addView(open);

        TextView help = text("إن لم تظهر نافذة الإذن أو رُفض:\n١. اضغط \"فتح إعدادات التطبيق\".\n٢. اضغط النقاط الثلاث في أعلى الشاشة واختر \"السماح بالإعدادات المقيّدة\".\n٣. ادخل إلى \"الأذونات\" ثم \"الرسائل SMS\" واختر \"السماح\".\n٤. عُد إلى هنا وتأكد أن الحالة صارت \"مفعّل\".", 14, false, 0xFF5B6A79);
        help.setLineSpacing(0, 1.5f);
        LinearLayout.LayoutParams hp = new LinearLayout.LayoutParams(-1, -2); hp.topMargin = dp(18);
        root.addView(help, hp);
    }

    @Override protected void onResume() {
        super.onResume();
        boolean ok = checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        status.setText(ok ? "الحالة: مفعّل ✓ يقرأ رسائل البنك ويمرّرها" : "الحالة: غير مفعّل، لا يقرأ الرسائل بعد");
        status.setTextColor(ok ? 0xFF0F766E : 0xFFE11D48);
        grant.setVisibility(ok ? View.GONE : View.VISIBLE);
        // إبلاغ مصروفي بحالة الإذن ليعرضها
        sendBroadcast(new Intent("app.masrouf.READER_STATUS")
            .setComponent(new ComponentName("app.masrouf", "app.masrouf.ReaderReceiver")).putExtra("granted", ok));
    }

    @Override public void onRequestPermissionsResult(int r, String[] p, int[] g) { onResume(); }

    int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    TextView text(String s, int sp, boolean bold, int color) {
        TextView t = new TextView(this);
        t.setText(s); t.setTextSize(sp); t.setTextColor(color); t.setGravity(Gravity.START);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setLineSpacing(0, 1.35f);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2); lp.topMargin = dp(10);
        t.setLayoutParams(lp);
        return t;
    }

    Button button(String s, boolean primary) {
        Button bt = new Button(this);
        bt.setText(s); bt.setAllCaps(false); bt.setTextSize(16);
        bt.setTextColor(primary ? Color.WHITE : 0xFF0F766E);
        GradientDrawable g = new GradientDrawable(); g.setCornerRadius(dp(14));
        g.setColor(primary ? 0xFF0F766E : Color.WHITE); if (!primary) g.setStroke(dp(1), 0xFF0F766E);
        bt.setBackground(g);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, dp(52)); lp.topMargin = dp(10);
        bt.setLayoutParams(lp);
        return bt;
    }
}
