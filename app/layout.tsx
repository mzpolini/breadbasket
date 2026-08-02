import type { Metadata } from "next";
import { Caprasimo, Figtree } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ServiceWorkerRegister } from "@/app/_components/service-worker-register";
import "./globals.css";

// Organic's pairing: Caprasimo for display, Figtree for everything else.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const caprasimo = Caprasimo({
  variable: "--font-caprasimo",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "BreadBasket",
  description: "What a farmer has, right now, and never anything stale.",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BreadBasket",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${caprasimo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <ServiceWorkerRegister />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
