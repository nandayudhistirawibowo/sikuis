export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import AdmZip from "adm-zip";

function extractPptxText(buffer: Buffer): string {
  const zip = new AdmZip(buffer);
  const slideEntries = zip.getEntries()
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.entryName))
    .sort((first, second) => {
      const firstNumber = Number(first.entryName.match(/slide(\d+)\.xml$/i)?.[1] ?? 0);
      const secondNumber = Number(second.entryName.match(/slide(\d+)\.xml$/i)?.[1] ?? 0);
      return firstNumber - secondNumber;
    });

  return slideEntries
    .map((entry) => zip.readAsText(entry).replace(/<[^>]+>/g, " "))
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (files.length < 1) {
      return NextResponse.json(
        { error: "Minimal 1 file PDF atau PPTX harus diunggah." },
        { status: 400 },
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "Maksimal 10 file PDF atau PPTX" },
        { status: 400 },
      );
    }

    const extractedFiles = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const lowerName = file.name.toLowerCase();
      const isPdf = lowerName.endsWith(".pdf") || file.type === "application/pdf";
      const isPptx = lowerName.endsWith(".pptx") || file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation";

      if (!isPdf && !isPptx) {
        return NextResponse.json(
          { error: "Format file tidak didukung" },
          { status: 400 },
        );
      }

      const buffer = await file.arrayBuffer();
      let text = "";

      try {
        if (isPdf) {
          const pdf = await getDocumentProxy(new Uint8Array(buffer));
          const result = await extractText(pdf, { mergePages: true });
          text = result.text as string;
        } else {
          text = extractPptxText(Buffer.from(buffer));

          if (!text.trim()) {
            console.warn(`PPTX extracted text is empty: ${file.name}`);
          }
        }

        extractedFiles.push({ fileName: file.name, text });
      } catch (error) {
        console.error(`Gagal mengekstrak file: ${file.name}`, error);
        return NextResponse.json(
          { error: `Gagal mengekstrak file: ${file.name}` },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({
      files: extractedFiles,
      combinedText: extractedFiles.map((file) => file.text).join("\n\n"),
    });
  } catch (error) {
    console.error("File extraction request failed:", error);
    return NextResponse.json(
      { error: "Permintaan ekstraksi file gagal diproses." },
      { status: 500 },
    );
  }
}
