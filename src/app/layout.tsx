import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { LatihanProvider } from "@/lib/latihan-context";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "siKuis - Generator Soal UTS/UAS Otomatis",
  description:
    "Ubah materi PDF atau PPT kuliahmu menjadi 30 soal esai UTS/UAS beserta kunci jawaban secara otomatis. Cepat, pintar, dan siap diunduh.",
  keywords: [
    "generator soal",
    "latihan uts uas",
    "kuis mahasiswa",
    "pdf to quiz",
    "ppt to quiz",
  ],
  openGraph: {
    title: "siKuis - Generator Soal UTS/UAS Otomatis",
    description:
      "Ubah materi PDF atau PPT kuliahmu menjadi 30 soal esai UTS/UAS beserta kunci jawaban secara otomatis. Cepat, pintar, dan siap diunduh.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
      <body>
        <LatihanProvider>{children}</LatihanProvider>
      </body>
    </html>
  );
}
