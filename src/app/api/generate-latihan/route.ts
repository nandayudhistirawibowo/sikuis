import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import type { LatihanQuestion } from "@/types/latihan";

export const runtime = "nodejs";

const GEMINI_MODEL_FALLBACKS = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

function isGeminiUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /503|Service Unavailable|High Demand/i.test(message);
}

async function generateWithModelFallback<T>(
  genAI: GoogleGenerativeAI,
  operation: (modelName: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (const modelName of GEMINI_MODEL_FALLBACKS) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await operation(modelName);
      } catch (error) {
        lastError = error;
        if (!isGeminiUnavailableError(error)) throw error;
        if (attempt === 3) {
          console.warn(`Model ${modelName} gagal setelah 3 percobaan 503. Mencoba model berikutnya.`, error);
          break;
        }
        console.warn(`Model ${modelName} mengalami 503. Retry ${attempt}/3 dalam 2 detik.`, error);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError;
}

function extractJsonArray(content: string): string {
  const cleanedContent = content.replace(/```(?:json)?/gi, "").trim();
  const start = cleanedContent.indexOf("[");
  if (start === -1) {
    throw new Error("Respons AI tidak mengandung JSON array.");
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < cleanedContent.length; index += 1) {
    const character = cleanedContent[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === "\\") {
        isEscaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") {
      inString = true;
    } else if (character === "[") {
      depth += 1;
    } else if (character === "]") {
      depth -= 1;
      if (depth === 0) return cleanedContent.slice(start, index + 1);
    }
  }

  throw new Error("Respons AI berisi JSON array yang tidak lengkap.");
}

function parseQuestions(content: string): LatihanQuestion[] {
  const parsed: unknown = JSON.parse(extractJsonArray(content));

  if (!Array.isArray(parsed) || parsed.length !== 30) {
    throw new Error("Respons AI harus berupa array dengan tepat 30 soal.");
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Format soal nomor ${index + 1} tidak valid.`);
    }

    const question = item as Record<string, unknown>;
    if (!Number.isInteger(question.nomor) || question.nomor !== index + 1) {
      throw new Error(`Nomor soal ${index + 1} tidak valid.`);
    }
    if (typeof question.pertanyaan !== "string" || !question.pertanyaan.trim()) {
      throw new Error(`Pertanyaan nomor ${index + 1} tidak valid.`);
    }
    if (typeof question.kunciJawaban !== "string" || !question.kunciJawaban.trim()) {
      throw new Error(`Kunci jawaban nomor ${index + 1} tidak valid.`);
    }
    if ((question.kunciJawaban.trim().match(/[.!?](?:\s|$)/g) ?? []).length > 3) {
      throw new Error(`Kunci jawaban nomor ${index + 1} melebihi 3 kalimat.`);
    }

    return {
      nomor: question.nomor,
      pertanyaan: question.pertanyaan.trim(),
      kunciJawaban: question.kunciJawaban.trim(),
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const combinedText = typeof body.combinedText === "string" ? body.combinedText.trim() : "";

    if (!combinedText) {
      return NextResponse.json(
        { error: "Teks materi gabungan tidak boleh kosong." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!apiKey && !groqApiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY dan GROQ_API_KEY belum dikonfigurasi." },
        { status: 500 },
      );
    }

    const prompt = `
Kamu adalah seorang Dosen ahli yang sedang membuat soal Ujian Tengah Semester (UTS) dan Ujian Akhir Semester (UAS).
Tugasmu: Berdasarkan HANYA teks materi berikut, buatkan tepat 30 pertanyaan esai/uraian yang paling berpotensi keluar di UTS/UAS.

ATURAN KETAT:
1. JANGAN mengarang pertanyaan atau jawaban yang tidak ada di dalam teks materi.
2. Setiap pertanyaan HARUS bisa dijawab hanya dengan membaca teks materi.
3. Kunci jawaban harus singkat, padat, dan sesuai dengan teks materi (maksimal 3 kalimat per kunci jawaban).
4. Format output HARUS berupa JSON array murni tanpa teks pembuka/penutup, dengan struktur: [{"nomor": 1, "pertanyaan": "...", "kunciJawaban": "..."}, {"nomor": 2, ...}]

TEKS MATERI:
${combinedText}
`.trim();

    let generatedQuestions: LatihanQuestion[] | null = null;
    let lastError: unknown;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const result = await generateWithModelFallback(genAI, async (modelName) => {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature: 0.3 },
          });
          return model.generateContent(prompt);
        });
        generatedQuestions = parseQuestions(result.response.text());
      } catch (geminiError) {
        lastError = geminiError;
        console.warn("Gemini gagal membuat soal latihan. Mencoba fallback Groq.", geminiError);
      }
    } else {
      console.warn("GEMINI_API_KEY tidak tersedia. Mencoba fallback Groq untuk soal latihan.");
    }

    if (!generatedQuestions && groqApiKey) {
      try {
        const groq = new Groq({ apiKey: groqApiKey });
        const result = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          messages: [{ role: "user", content: prompt }],
        });
        const content = result.choices[0]?.message?.content?.trim();
        if (!content) throw new Error("Groq tidak mengembalikan isi soal latihan.");
        generatedQuestions = parseQuestions(content);
        console.warn("Fallback Groq berhasil digunakan untuk soal latihan.");
      } catch (groqError) {
        console.error("Groq fallback gagal untuk soal latihan:", groqError);
        lastError = groqError;
      }
    }

    if (!generatedQuestions) {
      throw lastError ?? new Error("Gemini dan Groq tidak tersedia untuk membuat soal latihan.");
    }

    return NextResponse.json(generatedQuestions);
  } catch (error) {
    console.error("Latihan generation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal membuat soal latihan.",
      },
      { status: 500 },
    );
  }
}
