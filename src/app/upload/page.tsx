"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useLatihan } from "@/lib/latihan-context";
import type { LatihanQuestion } from "@/types/latihan";

const MIN_FILE_COUNT = 1;
const MAX_FILE_COUNT = 10;

function getErrorMessage(value: unknown, fallback: string): string {
  if (
    value &&
    typeof value === "object" &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }
  return fallback;
}

function isLatihanQuestion(value: unknown): value is LatihanQuestion {
  return (
    value !== null &&
    typeof value === "object" &&
    "nomor" in value &&
    Number.isInteger(value.nomor) &&
    "pertanyaan" in value &&
    typeof value.pertanyaan === "string" &&
    "kunciJawaban" in value &&
    typeof value.kunciJawaban === "string"
  );
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setQuestions } = useLatihan();

  const addFiles = (incomingFiles: File[]) => {
    const invalidFiles = incomingFiles.filter((file) => {
      const lowerName = file.name.toLowerCase();
      return !lowerName.endsWith(".pdf") &&
        !lowerName.endsWith(".pptx") &&
        file.type !== "application/pdf" &&
        file.type !== "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    });

    if (invalidFiles.length > 0) {
      setError("Format file tidak didukung");
      return;
    }

    setError("");
    setFiles((currentFiles) => {
      const mergedFiles = [...currentFiles];

      incomingFiles.forEach((file) => {
        const isDuplicate = mergedFiles.some(
          (existing) => existing.name === file.name && existing.size === file.size,
        );
        if (!isDuplicate) mergedFiles.push(file);
      });

      if (mergedFiles.length > MAX_FILE_COUNT) {
        setError("Maksimal 10 file PDF atau PPTX");
        return mergedFiles.slice(0, MAX_FILE_COUNT);
      }

      return mergedFiles;
    });
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove),
    );
    setError("");
  };

  const processFiles = async () => {
    if (files.length < MIN_FILE_COUNT || files.length > MAX_FILE_COUNT || isProcessing) return;

    setIsProcessing(true);
    setError("");
    setQuestions([]);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });
      const extractionResult: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(extractionResult, "Gagal mengekstrak file."));
      }

      if (
        !extractionResult ||
        typeof extractionResult !== "object" ||
        !("combinedText" in extractionResult) ||
        typeof extractionResult.combinedText !== "string" ||
        !extractionResult.combinedText.trim()
      ) {
        throw new Error("Tidak ada teks yang dapat dibaca dari file yang diunggah.");
      }

      const combinedText = extractionResult.combinedText;
      const generationResponse = await fetch("/api/generate-latihan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ combinedText }),
      });
      const questions: unknown = await generationResponse.json();

      if (!generationResponse.ok) {
        throw new Error(getErrorMessage(questions, "Gagal membuat soal latihan."));
      }

      if (
        !Array.isArray(questions) ||
        questions.length !== 30 ||
        !questions.every(isLatihanQuestion)
      ) {
        throw new Error("Respons AI tidak berisi tepat 30 soal.");
      }

      setQuestions(questions);
      router.push("/latihan");
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : "Terjadi kesalahan saat memproses file.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-5 py-10 text-[#17211b] sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-sm font-bold text-[#397a5a]">
          ← Kembali
        </Link>

        <header className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#397a5a]">
            Persiapan UTS/UAS
          </p>
          <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">
            Upload Materi
          </h1>
          <p className="mt-3 text-[#4d5851]">
            Unggah PDF atau PPTX, lalu AI akan menyusun 30 soal esai latihan beserta kunci jawabannya.
          </p>
        </header>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-8 flex min-h-52 cursor-pointer flex-col items-center justify-center border-2 border-dashed px-5 text-center transition-colors ${
            isDragging
              ? "border-[#397a5a] bg-[#397a5a] text-white"
              : "border-[#17211b] bg-white"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.pptx"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <span className="text-lg font-bold">Seret PDF atau PPTX ke sini</span>
          <span className="mt-2 text-sm opacity-70">atau pilih dari perangkat</span>
        </div>

        {error && (
          <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {isProcessing && (
          <p role="status" className="mt-4 border-l-4 border-[#397a5a] bg-[#eaf3ed] px-4 py-3 text-sm font-bold text-[#397a5a]">
            AI sedang menganalisis materi dan menyusun 30 soal UTS/UAS...
          </p>
        )}

        <section className="mt-6" aria-label="Daftar file materi">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">File terpilih</h2>
            <span className="text-sm font-bold text-[#397a5a]">
              {files.length} file terpilih
            </span>
          </div>

          {files.length === 0 ? (
            <p className="border border-[#17211b]/15 bg-white px-4 py-5 text-sm text-[#697069]">
              Belum ada file PDF atau PPTX.
            </p>
          ) : (
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between gap-4 border border-[#17211b]/15 bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{file.name}</p>
                    <p className="text-xs text-[#697069]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={isProcessing}
                    className="shrink-0 text-sm font-bold text-red-700 disabled:opacity-40"
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button
          type="button"
          onClick={processFiles}
          disabled={files.length < MIN_FILE_COUNT || files.length > MAX_FILE_COUNT || isProcessing}
          className="mt-8 flex h-14 w-full items-center justify-center rounded-md bg-[#17211b] px-8 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isProcessing ? "Memproses materi..." : "Proses"}
        </button>
      </div>
    </main>
  );
}
