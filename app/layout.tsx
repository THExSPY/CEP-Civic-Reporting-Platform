import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ReportFab from "@/components/ReportFab";
import { getSessionContext } from "@/lib/auth";
import { getFirstName } from "@/lib/names";

export const metadata: Metadata = {
  title: "Pune Civic Reporting Platform",
  description:
    "Report waste dumping and environmental hazards across Pune, and connect with volunteers and recycling partners.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e7490",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getSessionContext();

  return (
    <html lang="en">
      <body>
        <Navbar
          signedIn={!!user}
          firstName={getFirstName(user, profile)}
          role={profile?.role ?? null}
        />
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8">
          {children}
        </main>
        <ReportFab />
      </body>
    </html>
  );
}
