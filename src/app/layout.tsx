import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מונופול כרטיס אשראי - בנק אלקטרוני",
  description: "יחידת הבנקאות האלקטרונית למשחק מונופול כרטיס אשראי",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body className={`${assistant.className} font-sans`}>{children}</body>
    </html>
  );
}
