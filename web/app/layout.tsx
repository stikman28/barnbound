import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/components/user-context";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: "BarnBound — Connecting the Horse Community in One Place",
  description:
    "Buy and sell horses, tack, trailers, and gear. Find verified equine and farm businesses across Northern Colorado.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </UserProvider>
      </body>
    </html>
  );
}
