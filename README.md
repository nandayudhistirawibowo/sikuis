# siKuis

siKuis membantu mahasiswa menyiapkan UTS dan UAS dengan mengubah materi kuliah dari file PDF atau PPTX menjadi 30 pertanyaan esai beserta kunci jawaban singkat yang bersumber dari materi tersebut. Soal bisa ditinjau langsung di aplikasi atau diunduh sebagai PDF, sehingga mahasiswa dapat fokus berlatih tanpa menyusun pertanyaan secara manual.

## Fitur Utama

- **Upload materi:** Unggah satu atau beberapa file PDF/PPTX.
- **AI generate soal:** Buat tepat 30 soal esai UTS/UAS dari materi dengan Gemini dan fallback ke Groq.
- **Kunci jawaban accordion:** Buka kunci jawaban per soal saat diperlukan.
- **Download PDF:** Unduh kumpulan soal dan kunci jawaban dalam bentuk PDF.

## Tech Stack

- Next.js 16.4.5 (App Router)
- Tailwind CSS 4
- Google Gemini API
- Groq API
- jsPDF
- unpdf
- adm-zip

## Menjalankan Secara Lokal

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Buat file `.env.local` di root proyek dan isi kedua API key:

   ```text
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

   Gemini dicoba terlebih dahulu. Groq digunakan sebagai fallback jika Gemini gagal.

3. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

4. Buka [http://localhost:3000](http://localhost:3000), pilih **Mulai**, unggah materi, lalu klik **Proses**.

## Struktur Folder

```text
src/
├── app/       # Halaman, layout, dan API routes Next.js
├── lib/       # Context dan state latihan
└── types/     # Tipe TypeScript aplikasi
```
