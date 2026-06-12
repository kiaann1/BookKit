import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { CookieNotice } from "@/components/layout/cookie-notice";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ComposePostSheet } from "@/components/social/compose-post-sheet";
import { ComposeProvider } from "@/components/social/compose-context";
import { ComposeFab } from "@/components/social/compose-fab";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { getSession } from "@/lib/session";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#121018" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "BookKit",
    template: "%s | BookKit",
  },
  description:
    "A social reading platform — build your bookshelf, discover books, and connect with readers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body
        className={`${jakarta.variable} ${fraunces.variable} font-sans antialiased`}
      >
        <AuthSessionProvider>
          <ComposeProvider>
            <div className="mesh-background flex min-h-dvh flex-col">
              <NavigationProgress />
              <SiteHeader />
              <main className="main-with-mobile-nav flex-1">{children}</main>
              {session ? (
                <>
                  <MobileBottomNav />
                  <ComposeFab className="hidden md:flex" variant="floating" />
                  <ComposePostSheet />
                </>
              ) : null}
              <SiteFooter />
              <CookieNotice />
            </div>
          </ComposeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
