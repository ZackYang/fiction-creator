import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fiction Creator",
  description: "Create and manage your fiction projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body className={`${inter.className} h-full`}>
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
