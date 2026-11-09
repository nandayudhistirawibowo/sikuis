"use client";

import Link from "next/link";
import { jsPDF } from "jspdf";
import { useLatihan } from "@/lib/latihan-context";

export default function LatihanPage() {
  const { questions } = useLatihan();

  const downloadPdf = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;
    const lineHeight = 5;
    let y = 18;

    const addText = (text: string, fontSize: number, bold: boolean, gapAfter: number) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, pageWidth - margin * 2) as string[];

      for (const line of lines) {
        if (y + lineHeight > pageHeight - margin) {
          pdf.addPage();
          y = 18;
        }
        pdf.text(line, margin, y);
        y += lineHeight;
      }
      y += gapAfter;
    };

    addText("Latihan Soal UTS/UAS siKuis", 18, true, 6);
    questions.forEach((question) => {
      addText(`${question.nomor}. ${question.pertanyaan}`, 12, true, 1);
      addText(`Kunci Jawaban: ${question.kunciJawaban}`, 10, false, 5);
    });

    pdf.save("soal-latihan-uts-uas-sikuis.pdf");
  };

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-5 py-10 text-[#17211b] sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/upload" className="text-sm font-bold text-[#397a5a]">
          ← Kembali ke Upload
        </Link>

        <header className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#397a5a]">
            Latihan UTS/UAS
          </p>
          <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">
            30 Soal Esai
          </h1>
          <p className="mt-3 text-[#4d5851]">
            Buka kunci jawaban untuk memeriksa pemahamanmu setelah menjawab.
          </p>
        </header>

        {questions.length === 0 ? (
          <section className="mt-8 border border-[#17211b]/15 bg-white p-6">
            <p className="font-bold">Soal latihan belum tersedia.</p>
            <Link
              href="/upload"
              className="mt-4 inline-flex h-12 items-center justify-center bg-[#17211b] px-6 text-sm font-bold text-white"
            >
              Upload Materi
            </Link>
          </section>
        ) : (
          <>
            <button
              type="button"
              onClick={downloadPdf}
              className="mt-8 h-14 w-full bg-[#ffb000] px-6 text-base font-black text-[#17211b] sm:text-lg"
            >
              Download PDF Soal UTS/UAS
            </button>

            <ol className="mt-6 space-y-3">
              {questions.map((question) => (
                <li
                  key={question.nomor}
                  className="border border-[#17211b]/15 bg-white p-5 sm:p-6"
                >
                  <h2 className="font-bold leading-7">
                    <span className="mr-2 text-[#397a5a]">{question.nomor}.</span>
                    {question.pertanyaan}
                  </h2>
                  <details className="mt-4 border-t border-[#17211b]/10 pt-3">
                    <summary className="cursor-pointer text-sm font-bold text-[#397a5a]">
                      Buka kunci jawaban
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-[#4d5851]">
                      {question.kunciJawaban}
                    </p>
                  </details>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </main>
  );
}
