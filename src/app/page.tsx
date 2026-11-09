export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-[#f7f6f2] px-6 py-16 text-[#17211b]">
      <div aria-hidden="true" className="absolute inset-0 opacity-70 [background-image:linear-gradient(#17211b0d_1px,transparent_1px),linear-gradient(90deg,#17211b0d_1px,transparent_1px)] [background-size:32px_32px]" />
      <div aria-hidden="true" className="absolute -right-24 bottom-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[#ffb000] opacity-90 sm:right-[-4rem]" />

      <section id="mulai" className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <p className="mb-6 text-sm font-bold uppercase tracking-[0.18em] text-[#397a5a]">
            Belajar aktif untuk mahasiswa
          </p>
          <h1 className="max-w-3xl font-display text-7xl leading-[0.88] font-black sm:text-8xl lg:text-[9rem]">
            siKuis
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-[#4d5851] sm:text-xl">
            Ubah materi PDF atau PPT kuliah menjadi 30 soal esai latihan UTS/UAS lengkap dengan kunci jawaban.
          </p>
          <a
            href="/upload"
            className="mt-10 inline-flex h-14 items-center justify-center rounded-md bg-[#17211b] px-8 text-base font-bold text-white transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#397a5a]"
          >
            Mulai
          </a>
        </div>

        <div className="relative hidden aspect-[4/5] lg:block">
          <div className="absolute inset-6 rotate-3 border-2 border-[#17211b] bg-white" />
          <div className="absolute inset-6 -rotate-2 border-2 border-[#17211b] bg-[#397a5a] p-6 text-white">
            <span className="text-sm font-bold uppercase tracking-[0.12em]">Latihan UTS/UAS</span>
            <p className="mt-10 text-2xl font-bold leading-tight">30 soal esai dari materi kuliahmu.</p>
            <p className="mt-5 border-t border-white/60 pt-5 text-sm leading-6">
              Pelajari pertanyaan dan buka kunci jawaban saat siap.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
