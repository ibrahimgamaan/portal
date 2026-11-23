#!/usr/bin/env bash
# يبني تطبيق مصروفي ويضع الملف في releases باسم يطابق رقم الإصدار، مثل: releases/Masrouf-2.3.apk
# الاستعمال:  scripts/release.sh            (يبني مصروفي)
#             scripts/release.sh reader      (يبني ويسمّي قارئ الرسائل أيضاً)
# يحتاج Android SDK (يُضبط في android/local.properties) وأدوات build-tools في ANDROID_BT.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/android"
APP_VER=$(grep -oP "versionName '\K[^']+" app/build.gradle)
READER_VER=$(grep -oP "versionName '\K[^']+" reader/build.gradle)
TASKS=":app:assembleDebug"; [ "${1:-}" = "reader" ] && TASKS="$TASKS :reader:assembleDebug"
gradle --no-daemon -q $TASKS
mkdir -p "$ROOT/releases"
cp app/build/outputs/apk/debug/app-debug.apk "$ROOT/releases/Masrouf-$APP_VER.apk"
echo "تم: releases/Masrouf-$APP_VER.apk"
if [ "${1:-}" = "reader" ]; then
  cp reader/build/outputs/apk/debug/reader-debug.apk "$ROOT/releases/Masrouf-Reader-$READER_VER.apk"
  echo "تم: releases/Masrouf-Reader-$READER_VER.apk"
fi
BT="${ANDROID_BT:-/opt/asdk/build-tools/34.0.0}"
if [ -x "$BT/apksigner" ]; then "$BT/apksigner" verify "$ROOT/releases/Masrouf-$APP_VER.apk" >/dev/null && echo "التوقيع سليم"; fi
