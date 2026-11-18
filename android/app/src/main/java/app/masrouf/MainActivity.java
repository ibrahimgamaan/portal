package app.masrouf;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Base64;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.webkit.*;
import android.widget.Toast;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    WebView wv;
    ValueCallback<Uri[]> fileCb;
    String launchAction = "";

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setStatusBarColor(0xFF0F766E);
        wv = new WebView(this);
        setContentView(wv);
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setLoadWithOverviewMode(false);
        s.setUseWideViewPort(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        wv.setOverScrollMode(View.OVER_SCROLL_NEVER);
        wv.setVerticalScrollBarEnabled(false);
        wv.setHorizontalScrollBarEnabled(false);
        wv.setBackgroundColor(0xFFF3F6F6);
        wv.setLongClickable(false);
        wv.setOnLongClickListener(v -> true);
        wv.setHapticFeedbackEnabled(false);
        wv.addJavascriptInterface(new Bridge(), "AndroidBridge");
        wv.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                if (r.getUrl().getScheme().equals("file")) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl()));
                return true;
            }
        });
        wv.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsConfirm(WebView v, String url, String msg, JsResult r) {
                new AlertDialog.Builder(MainActivity.this).setMessage(msg)
                    .setPositiveButton("موافق", (d, w) -> r.confirm())
                    .setNegativeButton("إلغاء", (d, w) -> r.cancel())
                    .setOnCancelListener(d -> r.cancel()).show();
                return true;
            }
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try { startActivityForResult(p.createIntent(), 1); } catch (Exception e) { fileCb = null; return false; }
                return true;
            }
        });
        wv.loadUrl("file:///android_asset/index.html");
        handleShare(getIntent());
    }

    @Override protected void onNewIntent(Intent i) { super.onNewIntent(i); handleShare(i); }

    void handleShare(Intent i) {
        if (i != null && ("app.masrouf.ADD".equals(i.getAction()) || "app.masrouf.INBOX".equals(i.getAction()))) {
            launchAction = "app.masrouf.INBOX".equals(i.getAction()) ? "inbox" : "add";
            i.setAction(null);
            wv.postDelayed(() -> wv.evaluateJavascript("window.smsStatusChanged&&smsStatusChanged()", null), 700);
            return;
        }
        if (i == null || !Intent.ACTION_SEND.equals(i.getAction())) return;
        String t = i.getStringExtra(Intent.EXTRA_TEXT);
        if (t == null || t.trim().isEmpty()) return;
        try { SmsReceiver.push(this, "مشاركة", t, System.currentTimeMillis(), SmsClassifier.of(t)); } catch (Exception e) { return; }
        i.setAction(null);
        wv.postDelayed(() -> wv.evaluateJavascript("window.smsStatusChanged&&smsStatusChanged()", null), 700);
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        if (req == 1 && fileCb != null) {
            fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            fileCb = null;
        }
    }

    @Override public void onBackPressed() {
        wv.evaluateJavascript("(function(){var l=document.getElementById('layer');if(l&&l.innerHTML){closeSheet();return 1}return 0})()",
            r -> { if (!"1".equals(r)) finish(); });
    }

    @Override public void onRequestPermissionsResult(int req, String[] p, int[] r) {
        wv.evaluateJavascript("window.smsStatusChanged&&smsStatusChanged()", null);
    }

    class Bridge {
        @JavascriptInterface public String takeAction() { String a = launchAction; launchAction = ""; return a; }
        @JavascriptInterface public void openSettings() {
            runOnUiThread(() -> startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))));
        }
        @JavascriptInterface public void haptic(int ms) {
            Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) v.vibrate(VibrationEffect.createOneShot(Math.max(5, Math.min(ms, 60)), VibrationEffect.DEFAULT_AMPLITUDE));
        }
        @JavascriptInterface public void shareImage(String name, String b64) {
            try {
                byte[] data = Base64.decode(b64, Base64.DEFAULT);
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Images.Media.DISPLAY_NAME, name);
                cv.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                cv.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Masrouf");
                Uri u = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                try (OutputStream o = getContentResolver().openOutputStream(u)) { o.write(data); }
                Intent s = new Intent(Intent.ACTION_SEND).setType("image/png").putExtra(Intent.EXTRA_STREAM, u).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(Intent.createChooser(s, "مشاركة الملخص"));
            } catch (Exception e) { toast("تعذّرت المشاركة"); }
        }
        @JavascriptInterface public boolean smsSupported() {
            try { String[] p = getPackageManager().getPackageInfo(getPackageName(), PackageManager.GET_PERMISSIONS).requestedPermissions;
                if (p != null) for (String x : p) if (Manifest.permission.RECEIVE_SMS.equals(x)) return true; } catch (Exception e) {}
            return false;
        }
        @JavascriptInterface public boolean hasSms() {
            return checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        }
        @JavascriptInterface public void requestSms() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{Manifest.permission.RECEIVE_SMS, Manifest.permission.POST_NOTIFICATIONS}, 2);
                else requestPermissions(new String[]{Manifest.permission.RECEIVE_SMS}, 2);
            });
        }
        @JavascriptInterface public String takeSms() { return SmsReceiver.take(MainActivity.this); }
        @JavascriptInterface public void save(String name, String mime, String text) {
            try {
                ContentValues v = new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME, name);
                v.put(MediaStore.Downloads.MIME_TYPE, mime.split(";")[0]);
                Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                try (OutputStream o = getContentResolver().openOutputStream(u)) { o.write(text.getBytes(StandardCharsets.UTF_8)); }
                toast("تم حفظ الملف في مجلد التنزيلات: " + name);
            } catch (Exception e) { toast("تعذّر حفظ الملف"); }
        }
        @JavascriptInterface public void print() {
            runOnUiThread(() -> ((PrintManager) getSystemService(PRINT_SERVICE))
                .print("تقرير مصروفي", wv.createPrintDocumentAdapter("masrouf-report"), null));
        }
        void toast(String m) { runOnUiThread(() -> Toast.makeText(MainActivity.this, m, Toast.LENGTH_LONG).show()); }
    }
}
