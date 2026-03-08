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
      <body className={`${assistant.className} font-sans bg-monopoly-light-bg dark:bg-monopoly-dark text-gray-900 dark:text-white antialiased min-h-screen transition-colors`}>
        <ThemeProvider>
          {children}
          <Toaster dir="rtl" position="top-center" richColors duration={3000} />
        </ThemeProvider>
      </body>
    </html>
  );
}
