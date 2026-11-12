import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mie Gacoan KDS • PT Pesta Pora Abadi",
  description:
    "Real-Time Kitchen Display System (KDS) dengan isolasi render DOM, Optimistic UI & Rollback, dan sinkronisasi URL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F5F7FA] text-slate-800 flex flex-col">
        {children}
      </body>
    </html>
  );
}
