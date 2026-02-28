// app/layout.tsx
import { AuthProvider } from "./providers/auth-provider";
import { FacultyDataProvider } from "./providers/faculty-data-provider";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IMS",
  description: "Information Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <FacultyDataProvider>
              {children}
            </FacultyDataProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster
          position="top-right"
          expand={true}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
