'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { AppIcon } from '@/components/icons/AppIcon';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

type PdfReaderProps = {
  url: string;
  title: string;
  onBack: () => void;
  backLabel?: string;
  errorHint?: string;
};

export function PdfReader({
  url,
  title,
  onBack,
  backLabel = 'Back',
  errorHint = 'The file may be missing, private, or uploaded with an invalid PDF format.',
}: PdfReaderProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const renderTaskRef = useRef<any>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [turning, setTurning] = useState<'left' | 'right' | ''>('');

  useEffect(() => {
    let cancelled = false;
    let loadedPdf: PDFDocumentProxy | null = null;
    setStatus('loading');
    setMessage('');
    setPdf(null);
    setPage(1);
    setPageCount(0);

    async function loadPdf() {
      try {
        const response = await fetch(url, {
          cache: 'no-store',
          headers: { Accept: 'application/pdf,*/*;q=0.8' },
        });
        const contentType = response.headers.get('content-type') ?? '';
        if (!response.ok || contentType.includes('application/json') || contentType.includes('text/html')) {
          throw new Error('The file source returned an error instead of a readable PDF.');
        }
        const data = await response.arrayBuffer();
        loadedPdf = await pdfjs.getDocument({ data }).promise;
        if (!cancelled) {
          setPdf(loadedPdf);
          setPageCount(loadedPdf.numPages);
          setStatus('ready');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          setMessage(error instanceof Error ? error.message : 'PDF could not be loaded.');
        }
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
      loadedPdf?.destroy?.();
    };
  }, [url]);

  useEffect(() => {
    if (!pdf || status !== 'ready') return;
    let cancelled = false;

    async function renderPage() {
      const canvas = canvasRef.current;
      const holder = viewportRef.current;
      if (!canvas || !holder || !pdf) return;

      renderTaskRef.current?.cancel?.();
      const pdfPage: PDFPageProxy = await pdf.getPage(page);
      if (cancelled) return;

      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const holderWidth = Math.max(320, holder.clientWidth - 32);
      const holderHeight = Math.max(420, holder.clientHeight - 32);
      const fitWidthScale = holderWidth / baseViewport.width;
      const fitHeightScale = holderHeight / baseViewport.height;
      const scale = Math.min(fitWidthScale, fitHeightScale) * zoom;
      const viewport = pdfPage.getViewport({ scale });
      const pixelRatio = window.devicePixelRatio || 1;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, viewport.width, viewport.height);

      const task = pdfPage.render({ canvasContext: context, viewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (error: any) {
        if (error?.name !== 'RenderingCancelledException') throw error;
      }
    }

    renderPage().catch((error) => {
      if (!cancelled) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Could not render this page.');
      }
    });

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
    };
  }, [pdf, page, status, zoom]);

  useEffect(() => {
    function onResize() {
      setZoom((current) => current);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') goToPage(page - 1);
      if (event.key === 'ArrowRight') goToPage(page + 1);
      if (event.key === 'Escape') onBack();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  function goToPage(nextPage: number) {
    if (!pageCount) return;
    const safePage = Math.min(pageCount, Math.max(1, nextPage));
    if (safePage === page) return;
    setTurning(safePage > page ? 'right' : 'left');
    setPage(safePage);
    window.setTimeout(() => setTurning(''), 260);
  }

  async function toggleFullscreen() {
    if (!shellRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await shellRef.current.requestFullscreen();
    }
  }

  function onTouchEnd(clientX: number) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (start === null) return;
    const delta = clientX - start;
    if (Math.abs(delta) < 45) return;
    goToPage(delta < 0 ? page + 1 : page - 1);
  }

  return (
    <div ref={shellRef} className="flex min-h-0 flex-1 flex-col bg-slate-950 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900 px-3 py-2">
        <button type="button" onClick={onBack} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-950">
          {backLabel}
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-xs text-slate-400">{pageCount ? `Page ${page} of ${pageCount}` : 'Loading PDF'}</p>
        </div>
        <button type="button" onClick={toggleFullscreen} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold">
          {isFullscreen ? 'Exit full screen' : 'Full screen'}
        </button>
      </div>

      {status === 'loading' && (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-sm text-slate-300">Preparing book reader...</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex min-h-0 flex-1 items-center justify-center px-5">
          <div className="max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950 text-red-300">
              <AppIcon name="alert" className="h-6 w-6" />
            </div>
            <h4 className="font-semibold">PDF could not be opened</h4>
            <p className="mt-2 text-sm text-slate-300">{errorHint}</p>
            {message && <p className="mt-3 rounded-xl bg-slate-950 p-3 text-xs text-slate-400">{message}</p>}
          </div>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div
            ref={viewportRef}
            className="relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,#26334a_0,#0f172a_45%,#020617_100%)] p-3"
            onTouchStart={(event) => { touchStartRef.current = event.changedTouches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => onTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
          >
            <div className={`mx-auto flex min-h-full items-center justify-center transition-transform duration-200 ${turning === 'right' ? 'translate-x-2 opacity-80' : turning === 'left' ? '-translate-x-2 opacity-80' : ''}`}>
              <canvas ref={canvasRef} className="rounded-lg bg-white shadow-2xl ring-1 ring-black/20" />
            </div>

            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/95 px-4 py-3 text-2xl font-semibold text-slate-950 shadow-lg disabled:opacity-40 sm:block"
              aria-label="Previous page"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pageCount}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/95 px-4 py-3 text-2xl font-semibold text-slate-950 shadow-lg disabled:opacity-40 sm:block"
              aria-label="Next page"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-white/10 bg-slate-900 p-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-xl bg-slate-800 px-3 py-3 text-sm font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))} className="rounded-lg bg-slate-800 px-3 py-2 text-sm">-</button>
              <span className="min-w-12 text-center text-xs text-slate-300">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.15))} className="rounded-lg bg-slate-800 px-3 py-2 text-sm">+</button>
            </div>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pageCount}
              className="rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
