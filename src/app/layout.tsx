import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
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
    <html lang="he" dir="rtl" className={assistant.variable} suppressHydrationWarning>
      <body className={`${assistant.className} font-sans bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-gray-100 antialiased min-h-screen transition-colors`}>
        <ThemeProvider>
          {children}
          <Toaster dir="rtl" position="top-center" richColors duration={3000} />
        </ThemeProvider>
      </body>
    </html>
  );
}
