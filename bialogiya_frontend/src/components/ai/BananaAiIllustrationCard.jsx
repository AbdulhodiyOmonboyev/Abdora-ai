import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Download, Maximize2, X, RefreshCw, Loader2, Image as ImageIcon,
  AlertCircle, ZoomIn, ZoomOut
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function BananaAiIllustrationCard({
  lessonId,
  kind = 'mindmap', // 'mindmap' | 'explanation'
  title = '',
  subtitle = '',
  isTeacher = false,
}) {
  const [imageUrl, setImageUrl] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const objectUrlRef = useRef(null);

  const endpoint = kind === 'explanation'
    ? `/lessons/${lessonId}/ai/explanation-image`
    : `/lessons/${lessonId}/ai/mindmap-image`;

  const loadImage = async (forceRegenerate = false) => {
    if (forceRegenerate) {
      setIsRegenerating(true);
    } else {
      setStatus('loading');
    }
    setErrorMessage('');

    try {
      const url = forceRegenerate ? `${endpoint}?regenerate=true` : endpoint;
      const res = await api.get(url, { responseType: 'blob' });

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const objUrl = URL.createObjectURL(res.data);
      objectUrlRef.current = objUrl;
      setImageUrl(objUrl);
      setStatus('ready');
      if (forceRegenerate) {
        toast.success("Banana AI tasviri qayta yaratildi!");
      }
    } catch (err) {
      console.warn('Banana AI image fetch error:', err.message);
      setErrorMessage(err?.response?.data?.message || "Tasvirni yuklashda xatolik yuz berdi");
      setStatus('error');
      if (forceRegenerate) {
        toast.error("Qayta yaratishda xatolik yuz berdi");
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    loadImage(false);
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [lessonId, kind]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `Banana_AI_${kind}_${lessonId || 'lesson'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleZoomOpen = () => {
    setZoomScale(1);
    setIsZoomed(true);
  };

  const badgeText = kind === 'explanation' ? 'Banana AI • Konsept Rasm' : 'Banana AI • Vizual Xarita';
  const defaultSub = kind === 'explanation'
    ? 'Darsning ko‘rgazmali tushuntirish diagrammasi'
    : 'Mavzuning vizual konseptual tuzilishi va aql xaritasi';

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-inner">
            🍌
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                {badgeText}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                Nano Banana
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle || defaultSub}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {status === 'ready' && (
            <>
              <button
                onClick={handleZoomOpen}
                className="btn-ghost p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/10 transition-colors"
                title="Kattalashtirib ko'rish"
              >
                <Maximize2 size={14} />
                <span className="hidden sm:inline">Kattalashtirish</span>
              </button>
              <button
                onClick={handleDownload}
                className="btn-ghost p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/10 transition-colors"
                title="Tasvirni yuklab olish"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Yuklab olish</span>
              </button>
            </>
          )}

          {isTeacher && (
            <button
              onClick={() => loadImage(true)}
              disabled={isRegenerating || status === 'loading'}
              className="btn-ghost p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
              title="Tasvirni qayta yaratish"
            >
              <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Qayta chizish</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/9] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center overflow-hidden group">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-300">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-pulse text-2xl">
                🍌
              </div>
              <Loader2 size={18} className="animate-spin text-amber-400 absolute -bottom-1 -right-1" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Banana AI rasm chizmoqda...</div>
              <div className="text-xs text-slate-400 mt-0.5">Konseptual ko‘rgazmali diagramma yaratilmoqda</div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Tasvirni yuklab bo‘lmadi</div>
              <div className="text-xs text-slate-400 mt-0.5 max-w-sm">{errorMessage || "Qayta urinib ko'ring"}</div>
            </div>
            <button
              onClick={() => loadImage(false)}
              className="mt-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={12} /> Qayta urinish
            </button>
          </div>
        )}

        {status === 'ready' && imageUrl && (
          <>
            <img
              src={imageUrl}
              alt={title || badgeText}
              className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
              onClick={handleZoomOpen}
            />

            {/* Quick overlay pill on hover */}
            <div
              onClick={handleZoomOpen}
              className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer pointer-events-auto shadow-lg"
            >
              <Maximize2 size={12} /> Kattalashtirish
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Zoom Modal */}
      <AnimatePresence>
        {isZoomed && imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-4 sm:p-6"
            onClick={() => setIsZoomed(false)}
          >
            {/* Top Toolbar */}
            <div
              className="flex items-center justify-between gap-3 text-white pb-3 border-b border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🍌</span>
                <div>
                  <h4 className="font-semibold text-sm">{title || badgeText}</h4>
                  <span className="text-[11px] text-white/60">{badgeText}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomScale(s => Math.max(0.7, s - 0.25))}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Kichiklashtirish"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs text-white/70 min-w-[45px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale(s => Math.min(2.5, s + 0.25))}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Kattalashtirish"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
                  title="Yuklab olish"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setIsZoomed(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 text-white transition-colors ml-2"
                  title="Yopish"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Image Area */}
            <div
              className="flex-1 flex items-center justify-center overflow-auto p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                src={imageUrl}
                alt={title || badgeText}
                style={{ transform: `scale(${zoomScale})` }}
                transition={{ duration: 0.2 }}
                className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
