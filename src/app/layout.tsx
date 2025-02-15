import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Providers } from "./providers";
import { Toaster } from "~/components/ui/toaster";
import Header from "~/components/header/header";
import Footer from "~/components/footer/footer";
import OnboardingDialog from "~/components/onboarding-dialog";

export const metadata: Metadata = {
  title: "punchline/quiz",
  description: "Test your knowledge of punchlines",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <Providers>
          <main className="flex min-h-screen flex-col items-center px-6 py-12">
            <Header />
            <div className="w-full flex-1">
              {children}
              <OnboardingDialog />
            </div>
            <Footer />
            <Toaster />
          </main>
        </Providers>
      </body>
    </html>
  );
}
