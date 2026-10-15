import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ProgressProvider } from "@/components/providers/ProgressProvider";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Practical Systems Lab",
  description:
    "A hands-on learning project for software engineers who want to improve their ability to debug real-world systems across networking, cloud infrastructure, containers, authentication, CI/CD, and production environments.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProgressProvider>
          <div className="shell">
            <SiteHeader />
            <main className="main">
              <div className="container">{children}</div>
            </main>
            <footer className="site-footer">
              <div className="container">
                Progress is stored in this browser only. Curriculum content
                lives in source control under <code>curriculum/</code>.
              </div>
            </footer>
          </div>
        </ProgressProvider>
      </body>
    </html>
  );
}
