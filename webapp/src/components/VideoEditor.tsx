'use client';

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Loader2, UploadCloud, Wand2 } from 'lucide-react';
import clsx from 'clsx';

type ProcessingState = 'idle' | 'loading' | 'ready' | 'error';

const DEFAULT_PRIMARY = 'original as i write';
const DEFAULT_PROMO = 'BLACK FRIDAY 28 NËNTORI';
const DEFAULT_DESCRIPTION =
  'Personalizoni shishet me logo foto shkrime sipas dëshirës.';

const boldFontPath = 'Montserrat-Bold.ttf';
const regularFontPath = 'Montserrat-Regular.ttf';

const ffmpegInstance = new FFmpeg();

const escapeDrawtext = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');

export function VideoEditor() {
  const [primaryText, setPrimaryText] = useState(DEFAULT_PRIMARY);
  const [promoText, setPromoText] = useState(DEFAULT_PROMO);
  const [descriptionText, setDescriptionText] = useState(DEFAULT_DESCRIPTION);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [inputName, setInputName] = useState<string | null>(null);
  const inputVideoRef = useRef<HTMLVideoElement>(null);
  const outputVideoRef = useRef<HTMLVideoElement>(null);
  const inputObjectUrlRef = useRef<string | null>(null);

  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    return () => {
      if (inputObjectUrlRef.current) {
        URL.revokeObjectURL(inputObjectUrlRef.current);
      }
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [outputUrl]);

  const ensureFFmpeg = useCallback(async () => {
    if (ffmpegReady) return;
    if (!ffmpegInstance.loaded) {
      ffmpegInstance.on('progress', ({ progress: ratio }) => {
        const percent = Math.round((ratio || 0) * 100);
        setProgress(percent);
      });
      await ffmpegInstance.load();
    }
    if (!fontsLoaded) {
      const boldResponse = await fetch(`/fonts/${boldFontPath}`);
      const boldBuffer = new Uint8Array(await boldResponse.arrayBuffer());
      await ffmpegInstance.writeFile(boldFontPath, boldBuffer);
      const regularResponse = await fetch(`/fonts/${regularFontPath}`);
      const regularBuffer = new Uint8Array(await regularResponse.arrayBuffer());
      await ffmpegInstance.writeFile(regularFontPath, regularBuffer);
      setFontsLoaded(true);
    }
    setFfmpegReady(true);
  }, [ffmpegReady, fontsLoaded]);

  const handleChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      setOutputUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return null;
      });
      setInputName(file.name);
      if (inputObjectUrlRef.current) {
        URL.revokeObjectURL(inputObjectUrlRef.current);
      }
      const fileUrl = URL.createObjectURL(file);
      inputObjectUrlRef.current = fileUrl;
      if (inputVideoRef.current) {
        inputVideoRef.current.src = fileUrl;
        void inputVideoRef.current.play().catch(() => undefined);
      }
      await ensureFFmpeg();
      const data = await fetchFile(file);
      await ffmpegInstance.writeFile('input.mp4', data);
      setProcessingState('ready');
      setError(null);
      setProgress(0);
    },
    [ensureFFmpeg],
  );

  const filterGraph = useMemo(() => {
    const blocks = [
      `drawtext=fontfile=${boldFontPath}:text='${escapeDrawtext(primaryText)}':fontcolor=0xFFFFFFFF:fontsize=64:x=(w-text_w)/2:y=h*0.08:box=1:boxcolor=0x000000AA:boxborderw=24`,
      `drawtext=fontfile=${boldFontPath}:text='${escapeDrawtext(promoText)}':fontcolor=0xFFD700FF:fontsize=80:x=(w-text_w)/2:y=h*0.38:box=1:boxcolor=0x000000C0:boxborderw=28`,
      `drawtext=fontfile=${regularFontPath}:text='${escapeDrawtext(descriptionText)}':fontcolor=0xFFFFFFFF:fontsize=48:x=(w-text_w)/2:y=h*0.72:box=1:boxcolor=0x000000AA:boxborderw=22`,
    ];
    return blocks.join(',');
  }, [primaryText, promoText, descriptionText]);

  const generateVideo = useCallback(async () => {
    if (!ffmpegReady) return;
    try {
      setProcessingState('loading');
      setProgress(0);
      setError(null);
      const command = [
        '-i',
        'input.mp4',
        '-vf',
        filterGraph,
        '-c:a',
        'copy',
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-movflags',
        'faststart',
        '-pix_fmt',
        'yuv420p',
        'output.mp4',
      ];
      await ffmpegInstance.exec(command);
      const data = await ffmpegInstance.readFile('output.mp4');
      const byteData =
        typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
      const blob = new Blob([byteData], { type: 'video/mp4' });
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
      const downloadUrl = URL.createObjectURL(blob);
      setOutputUrl(downloadUrl);
      setProcessingState('ready');
      setProgress(100);
      if (outputVideoRef.current) {
        outputVideoRef.current.src = downloadUrl;
        outputVideoRef.current.load();
      }
    } catch (err) {
      console.error(err);
      setError(
        'Processing failed. Please try a shorter video or adjust the overlay text.',
      );
      setProcessingState('ready');
    }
  }, [filterGraph, ffmpegReady, outputUrl]);

  return (
    <div className="flex flex-col gap-10 rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-lg shadow-black/5 backdrop-blur-sm">
      <div className="grid gap-4">
        <label
          htmlFor="video-upload"
          className={clsx(
            'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition hover:border-pink-500 hover:bg-pink-50',
            processingState === 'loading' && 'pointer-events-none opacity-60',
          )}
        >
          <UploadCloud className="h-10 w-10 text-pink-500" />
          <div className="text-lg font-semibold text-zinc-900">
            Drop your video or click to upload
          </div>
          <p className="max-w-sm text-sm text-zinc-500">
            MP4 and MOV files are supported. We will add the specified Black
            Friday messaging directly on top of the original video.
          </p>
          <input
            id="video-upload"
            type="file"
            accept="video/mp4,video/quicktime"
            className="hidden"
            onChange={handleChange}
          />
        </label>
        {inputName && (
          <p className="text-sm font-medium text-zinc-500">
            Selected file: <span className="text-zinc-900">{inputName}</span>
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-zinc-700">
            Upper Tagline
          </label>
          <input
            value={primaryText}
            onChange={(event) => setPrimaryText(event.target.value)}
            placeholder="original as i write"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base shadow-inner focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-zinc-700">
            Promo Highlight
          </label>
          <input
            value={promoText}
            onChange={(event) => setPromoText(event.target.value)}
            placeholder="BLACK FRIDAY 28 NËNTORI"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base shadow-inner focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-semibold text-zinc-700">
            Support Message
          </label>
          <textarea
            value={descriptionText}
            onChange={(event) => setDescriptionText(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base shadow-inner focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Original Preview
          </h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black/60 shadow-inner">
            <video
              ref={inputVideoRef}
              className="h-full w-full"
              controls
              playsInline
            />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Output Preview
          </h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black/60 shadow-inner">
            <video
              ref={outputVideoRef}
              className="h-full w-full"
              controls
              playsInline
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={generateVideo}
          disabled={!ffmpegReady || processingState !== 'ready'}
          className={clsx(
            'inline-flex items-center gap-2 rounded-full bg-pink-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:bg-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-300 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none',
          )}
        >
          {processingState === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Rendering…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Render Overlay
            </>
          )}
        </button>

        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
          <span
            className={clsx(
              'font-semibold',
              ffmpegReady ? 'text-emerald-600' : 'text-amber-600',
            )}
          >
            {ffmpegReady ? 'Render engine ready' : 'Fetching render engine…'}
          </span>
          {processingState === 'loading' && (
            <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
              {progress}% processed
            </span>
          )}
          {outputUrl && (
            <a
              href={outputUrl}
              download="black-friday-overlay.mp4"
              className="rounded-full border border-pink-200 px-4 py-2 font-semibold text-pink-600 transition hover:bg-pink-50"
            >
              Download result
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
