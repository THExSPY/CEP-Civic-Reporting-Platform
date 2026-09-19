# Pune Civic Reporting Platform — Next.js + Supabase

A skeleton rebuild of the original Streamlit prototype (`App.py`), matching
the updated CEP proposal: JavaScript/Next.js frontend, Supabase for
auth + Postgres/PostGIS + file storage, deployed free on Vercel.

## What's here

| Feature (from App.py / proposal) | Where |
|---|---|
| Report form (name, location, description, photo) | `app/report/page.tsx`, `components/ReportForm.tsx` |
| Geolocation capture | `ReportForm.tsx` → `navigator.geolocation` |
| Photo upload | `ReportForm.tsx` → Supabase Storage bucket `report-photos` |
| Hotspot map (was folium/st_folium) | `app/map/page.tsx`, `components/MapView.tsx` (Leaflet, live via Supabase Realtime) |
| User accounts / login | `app/login`, `app/signup` |
| Recycling partners & volunteers | `app/partners`, `components/PartnerRegisterForm.tsx` |
| Claim / collect workflow | `app/dashboard`, `components/Dashboard.tsx` |
| Report detail page | `app/report/[id]/page.tsx`, `components/ReportDetail.tsx` |
| Email confirmation flow | `app/auth/callback/route.ts` |
| DB schema, RLS, PostGIS, auto-profile trigger | `supabase/schema.sql` |
| Android APK wrapper | `capacitor.config.ts`, native geo/camera in `ReportForm.tsx` |

## Setup

1. **Create a Supabase project** at supabase.com (free tier).
2. In the SQL Editor, run `supabase/schema.sql` — it creates the
   `profiles`, `reports`, `recycling_partners` tables, PostGIS geography
   column, RLS policies, and the `report-photos` storage bucket.
3. Copy `.env.local.example` to `.env.local` and fill in your project's
   URL and anon key (Project Settings → API).
4. Install and run:
   ```bash
   npm install
   npm run dev
   ```
5. Deploy free on Vercel: connect the GitHub repo, add the same two env
   vars in the Vercel dashboard, deploy.

## Still to build out (left as a skeleton on purpose)

- **Notifications** — e.g. email/SMS to a resident when their report is
  claimed or resolved (Supabase Edge Functions + a provider like Resend).
- **Photo compression** before upload for slow connections.
- **Admin/NGO view** — `ngo_admin` role exists in the schema but has no
  dedicated screen yet; today it behaves like a responder.
- **Geofencing to Pune** — GPS capture works anywhere; add a bounding-box
  check if you want to hard-restrict submissions to city limits.

## Building the Android APK

The native app is a thin **Capacitor** shell: it opens a WebView pointed
at your deployed Next.js app (`capacitor.config.ts` → `server.url`), so
auth, the map, and file uploads all work exactly like the website —
there's no separate mobile codebase to maintain. `ReportForm.tsx` also
uses the native Geolocation and Camera plugins automatically when running
inside the packaged app, for a proper permission prompt instead of the
browser's.

**Requirements:** Android Studio (includes the Android SDK) and a JDK —
install Android Studio and let its setup wizard handle both.

1. **Deploy first.** The APK loads your live site, so it needs a real
   URL — deploy to Vercel (see above) before packaging.

2. **Point Capacitor at that URL.** Edit `capacitor.config.ts`:
   ```ts
   server: {
     url: "https://your-actual-app.vercel.app",
     cleartext: false,
   },
   ```

3. **Install deps and add the Android platform:**
   ```bash
   npm install
   npx cap add android
   ```
   This generates an `android/` folder — a real Android Studio project.

4. **Add permissions** for GPS and camera. Open
   `android/app/src/main/AndroidManifest.xml` and add, just above
   `<application`:
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.CAMERA" />
   ```

5. **Sync and open in Android Studio:**
   ```bash
   npx cap sync android
   npx cap open android
   ```

6. **Build the APK.** In Android Studio: **Build → Build Bundle(s) / APK(s)
   → Build APK(s)**. It lands in
   `android/app/build/outputs/apk/debug/app-debug.apk` — install that
   directly on a device, or share it as-is for testing.

   For a release build (needed to publish anywhere, or for a smaller/
   optimized APK), use **Build → Generate Signed Bundle / APK** instead,
   which walks you through creating a signing key.

7. **Whenever you change frontend code**, redeploy to Vercel — the app
   updates itself the next time the APK opens (it's loading a live URL,
   not bundled files), so you don't need to rebuild the APK for normal
   changes. Only rebuild the APK if you change `capacitor.config.ts`,
   app icon/name, or native permissions.

**App icon / splash screen:** Capacitor uses defaults until you customize
them. Easiest path: put a 1024×1024 `icon.png` and a 2732×2732
`splash.png` in a `resources/` folder, then run
`npx @capacitor/assets generate` to produce all the Android sizes.

## Why this stack (recap)

- **Next.js** — one JS codebase for frontend + auth flows, free hosting on Vercel.
- **Supabase** — Postgres with PostGIS (proper geospatial queries for
  hotspot clustering, unlike Firebase's geohashing), built-in auth with
  row-level security, and file storage — all free tier, all in one place.
