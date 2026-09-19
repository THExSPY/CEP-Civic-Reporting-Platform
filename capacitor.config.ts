import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.punecivic.reporting",
  appName: "Pune Civic Reporting",
  webDir: "www",
  // The native app is a thin shell that loads your deployed Next.js app.
  // Replace this with your real Vercel URL before building the APK —
  // see README.md > "Building the Android APK".
  server: {
    url: "https://your-app.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
