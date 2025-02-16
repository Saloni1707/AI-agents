"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { NavigationProvider } from "@/lib/NavigationProvider";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Hide Sidebar on Homepage and Dashboard
  const hideSidebarOnPaths = ["/", "/dashboard"];

  const showSidebar = !hideSidebarOnPaths.includes(pathname);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <NavigationProvider>
            <div className="flex min-h-screen">
              {showSidebar && <Sidebar />}
              <main className="flex-1">{children}</main>
            </div>
          </NavigationProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
