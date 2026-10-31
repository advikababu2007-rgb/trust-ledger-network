import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Trust Ledger",
  description: "Verified order settlement and 1% trust allocation ledger",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#09090b", color: "#fafafa", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
