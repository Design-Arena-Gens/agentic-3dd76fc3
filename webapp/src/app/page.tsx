import { VideoEditor } from "@/components/VideoEditor";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-rose-50 pb-24">
      <header className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.55),_transparent_55%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-6 py-20 text-white sm:px-10">
          <p className="text-sm uppercase tracking-[0.6em] text-pink-200">
            Black Friday Overlay Studio
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Transform your video with in-frame messaging that matches your
            campaign voice.
          </h1>
          <p className="max-w-2xl text-base text-zinc-200 sm:text-lg">
            Upload your footage once, then apply a bold Albanian-language Black
            Friday treatment with precise typography, highlight colors, and
            layered captions ready for social media.
          </p>
        </div>
      </header>

      <main className="mx-auto mt-[-80px] flex max-w-5xl flex-col gap-12 px-6 sm:px-10">
        <VideoEditor />
        <section className="grid gap-6 rounded-3xl border border-zinc-200 bg-white/70 p-8 shadow-lg shadow-black/5 backdrop-blur-sm lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Campaign colors
            </h3>
            <p className="text-base text-zinc-600">
              Bold fuchsia call-to-action backed by soft gold highlight to
              ensure the Black Friday date remains unmissable on every platform.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Instant preview
            </h3>
            <p className="text-base text-zinc-600">
              Review the original footage alongside the rendered output before
              downloading, ensuring alignment with your brand voice.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Localized typography
            </h3>
            <p className="text-base text-zinc-600">
              Preset text supports diacritics for “NËNTORI” while remaining fully
              editable for on-the-fly adjustments to your Albanian messaging.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
