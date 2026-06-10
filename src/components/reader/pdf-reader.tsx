"use client";

import "@/lib/pdfjs/polyfills";
import { getPdfJsDocumentOptions } from "@/lib/pdfjs/document-options";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  LightbulbOff,
  Loader2,
  Maximize,
  Minimize,
  Minus,
  Moon,
  Plus,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { catalogBookPath } from "@/lib/books/paths";
import { cn } from "@/lib/utils";

type PdfReaderProps = {
  bookId: string;
  title: string;
  author: string;
  initialPage: number;
};

const SAVE_DEBOUNCE_MS = 2000;
const FOCUS_CHROME_HIDE_MS = 2500;
const PAGE_CACHE_LIMIT = 8;
const MAX_OUTPUT_SCALE = 2.5;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function getTouchDistance(touches: TouchList | React.TouchList) {
  if (touches.length < 2) {
    return 0;
  }

  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function getOutputScale() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.min(window.devicePixelRatio || 1, MAX_OUTPUT_SCALE);
}

function pageCacheKey(
  page: number,
  renderScale: number,
  width: number,
  outputScale: number,
) {
  return `${page}:${renderScale.toFixed(3)}:${width}:${outputScale.toFixed(2)}`;
}

function getPageRenderLayout(
  page: import("pdfjs-dist").PDFPageProxy,
  renderScale: number,
  outputScale: number,
) {
  const viewport = page.getViewport({ scale: renderScale });

  return {
    viewport,
    pixelWidth: Math.floor(viewport.width * outputScale),
    pixelHeight: Math.floor(viewport.height * outputScale),
    cssWidth: viewport.width,
    cssHeight: viewport.height,
    transform:
      outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : undefined,
  };
}

function storePageBitmap(
  cache: Map<string, ImageBitmap>,
  key: string,
  bitmap: ImageBitmap,
) {
  const existing = cache.get(key);
  if (existing) {
    existing.close();
  }
  cache.set(key, bitmap);

  while (cache.size > PAGE_CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (!oldest) {
      break;
    }
    cache.get(oldest)?.close();
    cache.delete(oldest);
  }
}

export function PdfReader({
  bookId,
  title,
  author,
  initialPage,
}: PdfReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const readingAreaRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchRef = useRef<{ initialDistance: number; initialScale: number } | null>(
    null,
  );
  const isPinchingRef = useRef(false);
  const renderScaleRef = useRef(1.35);
  const pdfRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageBitmapCacheRef = useRef<Map<string, ImageBitmap>>(new Map());
  const renderTaskRef = useRef<import("pdfjs-dist").RenderTask | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{
    currentPage: number;
    totalPages: number;
  } | null>(null);
  const currentPageRef = useRef(initialPage);
  const totalPagesRef = useRef(0);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.35);
  const [manualScale, setManualScale] = useState<number | null>(null);
  const [displayScale, setDisplayScale] = useState(1.35);
  const [containerWidth, setContainerWidth] = useState(0);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [lightsOff, setLightsOff] = useState(false);
  const [showFocusChrome, setShowFocusChrome] = useState(false);
  const focusChromeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pdfUrl = `/api/files/books/${encodeURIComponent(bookId)}/pdf`;

  const saveProgress = useCallback(
    async (page: number, total: number) => {
      setIsSaving(true);
      try {
        await fetch(`/api/progress/${bookId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPage: page, totalPages: total }),
        });
      } finally {
        setIsSaving(false);
      }
    },
    [bookId],
  );

  const queueSave = useCallback(
    (page: number, total: number) => {
      pendingSaveRef.current = { currentPage: page, totalPages: total };
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        const pending = pendingSaveRef.current;
        if (pending) {
          void saveProgress(pending.currentPage, pending.totalPages);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [saveProgress],
  );

  const goToPage = useCallback(
    (page: number) => {
      const total = totalPagesRef.current;
      if (total === 0) {
        return;
      }
      const next = Math.min(Math.max(1, page), total);
      currentPageRef.current = next;
      setCurrentPage(next);
    },
    [],
  );

  const revealFocusChrome = useCallback(() => {
    setShowFocusChrome(true);
    if (focusChromeTimerRef.current) {
      clearTimeout(focusChromeTimerRef.current);
    }
    focusChromeTimerRef.current = setTimeout(() => {
      setShowFocusChrome(false);
    }, FOCUS_CHROME_HIDE_MS);
  }, []);

  const exitLightsOff = useCallback(() => {
    setLightsOff(false);
    setShowFocusChrome(false);
    if (focusChromeTimerRef.current) {
      clearTimeout(focusChromeTimerRef.current);
    }
  }, []);

  function handleEdgeTap(clientX: number, width: number) {
    if (isLoading || error) {
      return;
    }

    const ratio = clientX / width;
    if (ratio < 0.2) {
      goToPage(currentPageRef.current - 1);
    } else if (ratio > 0.8) {
      goToPage(currentPageRef.current + 1);
    }

    if (lightsOff) {
      revealFocusChrome();
    }
  }

  function handleReadingAreaClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!lightsOff && !isMobile) {
      return;
    }

    handleEdgeTap(event.clientX, event.currentTarget.getBoundingClientRect().width);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      isPinchingRef.current = true;
      touchRef.current = null;
      pinchRef.current = {
        initialDistance: getTouchDistance(event.touches),
        initialScale: renderScaleRef.current,
      };
      return;
    }

    if (isPinchingRef.current) {
      return;
    }

    const touch = event.touches[0];
    touchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length >= 2) {
      return;
    }

    if (isPinchingRef.current) {
      if (event.touches.length === 0) {
        isPinchingRef.current = false;
        pinchRef.current = null;
      }
      return;
    }

    if (!touchRef.current || isLoading || error) {
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchRef.current.x;
    const dy = touch.clientY - touchRef.current.y;
    const elapsed = Date.now() - touchRef.current.time;
    touchRef.current = null;

    if (elapsed < 300 && Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      handleEdgeTap(touch.clientX, window.innerWidth);
      return;
    }

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
      if (dx < 0) {
        goToPage(currentPageRef.current + 1);
      } else {
        goToPage(currentPageRef.current - 1);
      }
      if (lightsOff) {
        revealFocusChrome();
      }
    }
  }

  function adjustZoom(delta: number) {
    setManualScale((current) => {
      const base = current ?? renderScaleRef.current;
      return clampZoom(base + delta);
    });
  }

  function resetZoomFit() {
    setManualScale(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const probe = await fetch(pdfUrl, {
          credentials: "include",
          headers: { Range: "bytes=0-0" },
        });
        if (!probe.ok) {
          if (probe.status === 401) {
            throw new Error("unauthorized");
          }
          if (probe.status === 404) {
            let detail = "missing";
            try {
              const body = (await probe.json()) as { error?: string };
              if (body.error === "pdf_not_in_storage") {
                detail = "storage";
              }
            } catch {
              // Empty or non-JSON 404 body.
            }
            throw new Error(detail);
          }
          throw new Error(`PDF fetch failed (${probe.status})`);
        }

        let doc: import("pdfjs-dist").PDFDocumentProxy;
        const pdfOptions = {
          ...getPdfJsDocumentOptions(pdfjs.version),
          disableRange: true,
          disableStream: true,
        };

        try {
          doc = await pdfjs.getDocument({
            url: pdfUrl,
            withCredentials: true,
            ...pdfOptions,
          }).promise;
        } catch (rangeError) {
          const response = await fetch(pdfUrl, { credentials: "include" });
          if (!response.ok) {
            throw new Error(`PDF fetch failed (${response.status})`);
          }
          const data = await response.arrayBuffer();
          if (data.byteLength < 5) {
            throw new Error("storage");
          }
          try {
            doc = await pdfjs.getDocument({
              data,
              ...pdfOptions,
            }).promise;
          } catch {
            const hint =
              rangeError instanceof Error ? rangeError.message : "Invalid PDF";
            throw new Error(
              hint.toLowerCase().includes("invalid")
                ? "storage"
                : `PDF open failed: ${hint}`,
            );
          }
        }

        if (cancelled) {
          return;
        }

        pdfRef.current = doc;
        const total = doc.numPages;
        totalPagesRef.current = total;
        setTotalPages(total);

        const startPage = Math.min(Math.max(1, initialPage), total);
        currentPageRef.current = startPage;
        setCurrentPage(startPage);
        setIsLoading(false);
      } catch (reason) {
        if (!cancelled) {
          const message =
            reason instanceof Error ? reason.message.toLowerCase() : "";
          const rawMessage =
            reason instanceof Error ? reason.message : "Unknown error";
          const code =
            rawMessage === "storage"
              ? "storage"
              : rawMessage === "unauthorized"
                ? "unauthorized"
                : rawMessage === "missing"
                  ? "missing"
                  : message.includes("(401)")
                    ? "unauthorized"
                    : message.includes("(404)")
                      ? "missing"
                      : rawMessage.startsWith("PDF open failed:")
                        ? "parse"
                        : message.includes("pdf fetch failed")
                          ? "fetch"
                          : "unknown";
          setError(
            code === "storage"
              ? "This book's PDF is missing or invalid in storage. Re-upload the PDF from Admin, or use npm run db:upload-files for large files."
              : code === "missing"
                ? "This book's PDF hasn't been uploaded yet. An admin needs to add the file."
                : code === "unauthorized"
                  ? "Sign in to read this book."
                  : code === "parse" || code === "fetch"
                    ? rawMessage
                    : "Could not load this book. Try again later.",
          );
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, initialPage]);

  useEffect(() => {
    if (!isMobile) {
      setManualScale(null);
    }
  }, [isMobile]);

  useEffect(() => {
    const element = readingAreaRef.current;
    if (!element || !isMobile) {
      return;
    }

    function onTouchMove(event: TouchEvent) {
      if (event.touches.length !== 2 || !pinchRef.current) {
        return;
      }

      event.preventDefault();

      const distance = getTouchDistance(event.touches);
      if (distance <= 0 || pinchRef.current.initialDistance <= 0) {
        return;
      }

      const ratio = distance / pinchRef.current.initialDistance;
      const nextScale = clampZoom(pinchRef.current.initialScale * ratio);
      setManualScale(nextScale);
    }

    element.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => element.removeEventListener("touchmove", onTouchMove);
  }, [isMobile, isLoading, error]);

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element || isLoading) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    setContainerWidth(element.clientWidth);

    return () => observer.disconnect();
  }, [isLoading]);

  useEffect(() => {
    const doc = pdfRef.current;
    if (!doc || totalPages === 0) {
      return;
    }

    for (const pageNumber of [currentPage - 1, currentPage + 1]) {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        void doc.getPage(pageNumber);
      }
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    return () => {
      for (const bitmap of pageBitmapCacheRef.current.values()) {
        bitmap.close();
      }
      pageBitmapCacheRef.current.clear();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      const doc = pdfRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas || totalPages === 0) {
        return;
      }

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page = await doc.getPage(currentPage);
      if (cancelled) {
        return;
      }

      let renderScale = manualScale ?? scale;
      if (isMobile && manualScale === null && containerWidth > 0) {
        const baseViewport = page.getViewport({ scale: 1 });
        renderScale = clampZoom((containerWidth - 16) / baseViewport.width);
      }

      renderScaleRef.current = renderScale;
      setDisplayScale(renderScale);

      const outputScale = getOutputScale();
      const layout = getPageRenderLayout(page, renderScale, outputScale);
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const cacheKey = pageCacheKey(
        currentPage,
        renderScale,
        isMobile ? containerWidth : 0,
        outputScale,
      );
      const cachedBitmap = pageBitmapCacheRef.current.get(cacheKey);
      if (cachedBitmap) {
        canvas.width = cachedBitmap.width;
        canvas.height = cachedBitmap.height;
        canvas.style.width = `${layout.cssWidth}px`;
        canvas.style.height = `${layout.cssHeight}px`;
        context.drawImage(cachedBitmap, 0, 0);
        queueSave(currentPage, totalPages);
        return;
      }

      let offscreen = offscreenCanvasRef.current;
      if (!offscreen) {
        offscreen = document.createElement("canvas");
        offscreenCanvasRef.current = offscreen;
      }

      offscreen.width = layout.pixelWidth;
      offscreen.height = layout.pixelHeight;

      const offscreenContext = offscreen.getContext("2d");
      if (!offscreenContext) {
        return;
      }

      offscreenContext.fillStyle = "#ffffff";
      offscreenContext.fillRect(0, 0, offscreen.width, offscreen.height);

      const task = page.render({
        canvasContext: offscreenContext,
        viewport: layout.viewport,
        transform: layout.transform,
        canvas: offscreen,
      });
      renderTaskRef.current = task;

      try {
        await task.promise;
      } catch (reason) {
        if (
          reason instanceof Error &&
          reason.name === "RenderingCancelledException"
        ) {
          return;
        }
        throw reason;
      }

      if (cancelled) {
        return;
      }

      renderTaskRef.current = null;

      canvas.width = layout.pixelWidth;
      canvas.height = layout.pixelHeight;
      canvas.style.width = `${layout.cssWidth}px`;
      canvas.style.height = `${layout.cssHeight}px`;
      context.drawImage(offscreen, 0, 0);

      if (typeof createImageBitmap === "function") {
        try {
          const bitmap = await createImageBitmap(offscreen);
          if (!cancelled) {
            storePageBitmap(pageBitmapCacheRef.current, cacheKey, bitmap);
          } else {
            bitmap.close();
          }
        } catch {
          // Bitmap caching is optional — rendering already succeeded.
        }
      }

      queueSave(currentPage, totalPages);
    }

    void renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [
    currentPage,
    scale,
    manualScale,
    containerWidth,
    isMobile,
    totalPages,
    queueSave,
  ]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && lightsOff) {
        exitLightsOff();
        return;
      }
      if (event.key === "ArrowLeft") {
        goToPage(currentPageRef.current - 1);
      }
      if (event.key === "ArrowRight") {
        goToPage(currentPageRef.current + 1);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToPage, lightsOff, exitLightsOff]);

  useEffect(() => {
    if (lightsOff) {
      revealFocusChrome();
    } else {
      setShowFocusChrome(false);
      if (focusChromeTimerRef.current) {
        clearTimeout(focusChromeTimerRef.current);
      }
    }
  }, [lightsOff, revealFocusChrome]);

  useEffect(() => {
    return () => {
      if (focusChromeTimerRef.current) {
        clearTimeout(focusChromeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      const pending = pendingSaveRef.current;
      if (pending) {
        void fetch(`/api/progress/${bookId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending),
          keepalive: true,
        });
      }
    };
  }, [bookId]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    if (!containerRef.current) {
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  }

  const progressPercent =
    totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex h-dvh flex-col",
        lightsOff
          ? "bg-black text-zinc-100"
          : darkMode
            ? "bg-zinc-950 text-zinc-100"
            : "bg-zinc-50 text-zinc-900",
      )}
    >
      {!lightsOff && (
      <header
        className={cn(
          "flex shrink-0 items-center gap-2 border-b px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3",
          "pt-[max(0.625rem,env(safe-area-inset-top))]",
          darkMode ? "border-zinc-800 bg-zinc-950/95" : "border-zinc-200 bg-white/95",
        )}
      >
        <Link href={catalogBookPath(bookId)}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 shrink-0 touch-manipulation sm:h-8 sm:w-auto sm:px-3",
              darkMode ? "text-zinc-300 hover:text-white" : "",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p
            className={cn(
              "truncate text-xs",
              darkMode ? "text-zinc-400" : "text-zinc-500",
            )}
          >
            {author}
          </p>
        </div>

        {totalPages > 0 && (
          <p className="shrink-0 rounded-full bg-muted/80 px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground sm:hidden">
            {currentPage}/{totalPages}
          </p>
        )}

        <div className="hidden items-center gap-1 sm:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 touch-manipulation"
            onClick={() => adjustZoom(-0.15)}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={resetZoomFit}
            className="w-12 text-center text-xs tabular-nums text-muted-foreground"
            title="Reset zoom"
          >
            {Math.round(displayScale * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 touch-manipulation"
            onClick={() => adjustZoom(0.15)}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 touch-manipulation"
            onClick={() => setDarkMode((value) => !value)}
            aria-label="Toggle reader theme"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 touch-manipulation"
            onClick={() => setLightsOff(true)}
            aria-label="Lights off"
            title="Lights off"
          >
            <LightbulbOff className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 touch-manipulation md:inline-flex"
            onClick={() => void toggleFullscreen()}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-0.5 sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-manipulation"
            onClick={() => adjustZoom(-0.15)}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={resetZoomFit}
            className="w-10 text-center text-[10px] tabular-nums text-muted-foreground"
            title="Reset zoom"
          >
            {Math.round(displayScale * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-manipulation"
            onClick={() => adjustZoom(0.15)}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-manipulation"
            onClick={() => setLightsOff(true)}
            aria-label="Lights off"
          >
            <LightbulbOff className="h-4 w-4" />
          </Button>
        </div>
      </header>
      )}

      {!lightsOff && (
      <div className="relative h-1 shrink-0 bg-zinc-800">
        <div
          className="h-full bg-brand-gradient transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      )}

      <div
        className="flex flex-1 flex-col overflow-hidden"
        onMouseMove={lightsOff ? revealFocusChrome : undefined}
        onTouchStart={lightsOff ? revealFocusChrome : undefined}
      >
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className={cn("text-sm", darkMode ? "text-zinc-400" : "text-zinc-500")}>
              Opening book…
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm">{error}</p>
            <Link href={catalogBookPath(bookId)}>
              <Button variant="outline">Back to book</Button>
            </Link>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className={cn(
              "flex-1 overflow-auto",
              isMobile ? "touch-pan-x touch-pan-y" : "touch-pan-y",
            )}
          >
            <div
              ref={readingAreaRef}
              className={cn(
                "flex min-h-full items-center justify-center",
                lightsOff ? "cursor-default p-0" : "p-2 sm:p-8",
              )}
              onClick={handleReadingAreaClick}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <canvas
                ref={canvasRef}
                className={cn(
                  "max-w-full",
                  lightsOff ? "max-h-[100dvh]" : "shadow-2xl shadow-black/40",
                )}
              />
            </div>
          </div>
        )}

        {lightsOff && !isLoading && !error && (
          <div
            className={cn(
              "pointer-events-none fixed inset-0 flex flex-col transition-opacity duration-300",
              showFocusChrome ? "opacity-100" : "opacity-0",
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-center p-4">
              <Button
                variant="secondary"
                size="sm"
                className={cn(
                  "bg-zinc-900/90 text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800",
                  showFocusChrome && "pointer-events-auto",
                )}
                onClick={exitLightsOff}
              >
                <Lightbulb className="h-4 w-4" />
                Lights on
              </Button>
            </div>

            <div className="mt-auto flex items-center justify-between px-4 pb-6 sm:px-8">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 text-zinc-400 hover:bg-zinc-900/80 hover:text-white",
                  showFocusChrome && "pointer-events-auto",
                )}
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <p className="rounded-full bg-zinc-900/80 px-3 py-1 text-xs tabular-nums text-zinc-300 backdrop-blur">
                {currentPage} / {totalPages}
              </p>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 text-zinc-400 hover:bg-zinc-900/80 hover:text-white",
                  showFocusChrome && "pointer-events-auto",
                )}
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {!lightsOff && !isLoading && !error && totalPages > 0 && (
        <footer
          className={cn(
            "flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3",
            "pb-[max(0.625rem,env(safe-area-inset-bottom))]",
            darkMode ? "border-zinc-800 bg-zinc-950/95" : "border-zinc-200 bg-white/95",
          )}
        >
          <Button
            variant="outline"
            size="sm"
            className="h-11 min-w-11 touch-manipulation px-3 sm:h-9"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="min-w-0 text-center text-sm">
            <span className="font-medium tabular-nums">
              <span className="sm:hidden">
                {currentPage} / {totalPages}
              </span>
              <span className="hidden sm:inline">
                Page {currentPage} of {totalPages}
              </span>
            </span>
            <span
              className={cn(
                "mt-0.5 block text-xs",
                darkMode ? "text-zinc-500" : "text-zinc-400",
              )}
            >
              {progressPercent}%
              <span className="hidden sm:inline"> complete</span>
              {isSaving ? " · Saving…" : ""}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-11 min-w-11 touch-manipulation px-3 sm:h-9"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </footer>
      )}
    </div>
  );
}
