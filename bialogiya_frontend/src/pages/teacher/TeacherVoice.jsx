import { useRef, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Mic, Upload, Trash2, Loader2, CheckCircle2, Info,
  Play, Pause, Square, RotateCcw, Volume2, Sparkles, AlertCircle
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

export default function TeacherVoice() {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');

  // Mode: 'record' or 'upload'
  const [inputMode, setInputMode] = useState('record');

  // Microphone recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Preview test audio states
  const [testStatus, setTestStatus] = useState('idle'); // idle | loading | playing
  const [testText, setTestText] = useState("Assalomu alaykum! Men sizning sun'iy intellekt yordamchingizman. Darslarni sizning ovozingizda tushuntirib beraman.");
  const testAudioRef = useRef(null);
  const testUrlRef = useRef(null);

  // Fetch current voice profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['voice-profile'],
    queryFn: () => api.get('/voice/profile').then(r => r.data.data),
  });

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (testUrlRef.current) URL.revokeObjectURL(testUrlRef.current);
      if (testAudioRef.current) testAudioRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordedUrl]);

  // Upload / clone voice mutation
  const upload = useMutation({
    mutationFn: (fileOrBlob) => {
      const form = new FormData();
      const filename = fileOrBlob.name || 'recorded_sample.webm';
      form.append('sample', fileOrBlob, filename);
      return api.post('/voice/clone', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Ovozingiz muvaffaqiyatli klonlandi!');
      queryClient.invalidateQueries({ queryKey: ['voice-profile'] });
      setFileName('');
      discardRecording();
    },
    onError: (err) => {
      const serverMsg = err.response?.data?.message;
      toast.error(serverMsg || friendlyAiErrorMessage(err));
    },
  });

  // Remove voice profile mutation
  const remove = useMutation({
    mutationFn: () => api.delete('/voice/profile'),
    onSuccess: () => {
      toast.success("Klonlangan ovoz o'chirildi");
      queryClient.invalidateQueries({ queryKey: ['voice-profile'] });
      stopTest();
    },
    onError: (err) => toast.error(err.response?.data?.message || "O'chirishda xatolik"),
  });

  // --- Microphone Recording Functions ---
  const startRecording = async () => {
    try {
      discardRecording();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
      };

      recorder.start(500);
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      toast.error("Mikrofon ruxsati berilmadi. Iltimos brauzer sozlamalaridan mikrofonga ruxsat bering.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordSeconds(0);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    upload.mutate(file);
  };

  // --- Voice Testing / Preview Functions ---
  const playTestVoice = async () => {
    if (testStatus === 'playing') {
      stopTest();
      return;
    }

    setTestStatus('loading');
    try {
      const res = await api.post(
        '/voice/test',
        { text: testText },
        { responseType: 'blob' }
      );
      if (testUrlRef.current) URL.revokeObjectURL(testUrlRef.current);
      const url = URL.createObjectURL(res.data);
      testUrlRef.current = url;
      const audio = new Audio(url);
      testAudioRef.current = audio;

      audio.onended = () => setTestStatus('idle');
      audio.onerror = () => {
        setTestStatus('idle');
        toast.error("Ovozni ijro etishda xatolik yuz berdi");
      };

      await audio.play();
      setTestStatus('playing');
    } catch (err) {
      setTestStatus('idle');
      const serverMsg = err.response?.data?.message;
      toast.error(serverMsg || friendlyAiErrorMessage(err));
    }
  };

  const stopTest = () => {
    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current.currentTime = 0;
    }
    setTestStatus('idle');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2.5">
          <Mic className="text-primary" size={26} />
          Mening ovozim (Ovoz klonlash)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ovoz namunangizni yozib oling yoki fayl yuklang — shundan so'ng darslaringizdagi sun'iy intellekt
          hikoyalari va ovozli tushuntirishlar aynan sizning ovozingizda gapiradi.
        </p>
      </div>

      {/* Info Notice */}
      <div className="card flex items-start gap-3 bg-primary/5 border-primary/20">
        <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
          <p className="font-semibold text-gray-800 dark:text-white">Eng yaxshi natija uchun tavsiya:</p>
          <p>
            Shovqinsiz xonada 30 soniyadan 2 daqiqagacha aniq va ravon gapiring. Dars tushuntirayotgandek
            ohangda gapirish ovozning yanada tabiiy chiqishini ta'minlaydi.
          </p>
          <p className="text-gray-400">Qo'llab-quvvatlanadigan formatlar: Mikrofon (jonli), MP3, WAV, M4A, WEBM, OGG.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : profile?.hasClonedVoice ? (
        /* --- Active Cloned Voice View --- */
        <div className="space-y-4">
          <div className="card border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800 dark:text-white text-base">
                    {profile.name || 'Mening ovozim'}
                  </h3>
                  <span className="badge text-[11px] bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                    Faol
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Barcha darslaringizdagi AI tushuntirishlar va hikoyalar shu ovozda gapirmoqda.
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm("Rostdan ham klonlangan ovozingizni o'chirmoqchimisiz?")) {
                    remove.mutate();
                  }
                }}
                disabled={remove.isPending}
                className="btn-ghost p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0"
                title="Ovozni o'chirish"
              >
                {remove.isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              </button>
            </div>
          </div>

          {/* Voice Preview / Test Player */}
          <div className="card space-y-3 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm text-gray-800 dark:text-white">
                <Sparkles size={16} className="text-primary" />
                Ovozingizni sinab ko'ring
              </div>
              <span className="text-[11px] text-gray-400">AI sintezi</span>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Sinov matni:</label>
              <textarea
                value={testText}
                onChange={e => setTestText(e.target.value)}
                rows={2}
                className="input-field text-xs resize-none"
                placeholder="AI o'qishi kerak bo'lgan matnni kiriting..."
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={playTestVoice}
                disabled={testStatus === 'loading' || !testText.trim()}
                className="btn-primary flex items-center gap-2 text-sm py-2 px-4 shadow-md"
              >
                {testStatus === 'loading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Ovoz tayyorlanmoqda...
                  </>
                ) : testStatus === 'playing' ? (
                  <>
                    <Square size={16} className="fill-current" />
                    To'xtatish
                  </>
                ) : (
                  <>
                    <Volume2 size={16} />
                    Ovozni tinglash
                  </>
                )}
              </button>

              {testStatus === 'playing' && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Ovoz yangramoqda...
                </div>
              )}
            </div>
          </div>

          {/* Replace Voice Option */}
          <div className="pt-2">
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Yangi namuna bilan almashtirish
            </div>
            <div className="card space-y-4">
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode('record')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    inputMode === 'record'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Mikrofon orqali yozish
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    inputMode === 'upload'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Fayl orqali yuklash
                </button>
              </div>

              {inputMode === 'record' ? (
                <div className="space-y-3">
                  {!isRecording && !recordedBlob ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={upload.isPending}
                      className="btn-outline w-full flex items-center justify-center gap-2 py-3 border-dashed"
                    >
                      <Mic size={18} className="text-red-500" />
                      Yangi ovoz yozishni boshlash
                    </button>
                  ) : isRecording ? (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400">
                          {formatTimer(recordSeconds)}
                        </span>
                        <span className="text-xs text-gray-500">(Kamida 30 soniya gapiring)</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-1.5 text-xs py-1.5 px-3"
                      >
                        <Square size={13} className="fill-current" />
                        To'xtatish
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <audio src={recordedUrl} controls className="h-8 max-w-full" />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={discardRecording}
                          disabled={upload.isPending}
                          className="btn-ghost text-xs p-2 text-gray-500 hover:text-red-500"
                        >
                          <RotateCcw size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => upload.mutate(recordedBlob)}
                          disabled={upload.isPending}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          {upload.isPending ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                          {upload.isPending ? 'Klonlanmoqda...' : 'Almashtirish'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">
                  <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onPickFile} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={upload.isPending}
                    className="btn-outline w-full flex items-center justify-center gap-2 py-3 border-dashed"
                  >
                    {upload.isPending ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {upload.isPending ? `Yuklanmoqda${fileName ? `: ${fileName}` : '...'}` : 'Audio faylni tanlash'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* --- No Cloned Voice Yet: Creation View --- */
        <div className="card space-y-5">
          {/* Tabs for Input Mode */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 text-xs">
            <button
              type="button"
              onClick={() => setInputMode('record')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                inputMode === 'record'
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mic size={15} />
              Mikrofon orqali yozib olish (Tavsiya)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                inputMode === 'upload'
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload size={15} />
              Tayyor audio fayl yuklash
            </button>
          </div>

          {inputMode === 'record' ? (
            /* Microphone Recording Panel */
            <div className="text-center py-6 space-y-4">
              {!isRecording && !recordedBlob ? (
                <>
                  <div
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full mx-auto flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-xl bg-red-500 text-white hover:bg-red-600 shadow-red-500/25"
                    title="Yozishni boshlash"
                  >
                    <Mic size={36} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white text-base">
                      Ovozingizni yozib oling
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Qizil tugmani bosing va 30 soniyadan 2 daqiqagacha dars mavzusidan matn o'qing.
                    </p>
                  </div>
                  <button
                    onClick={startRecording}
                    className="btn-primary bg-red-500 hover:bg-red-600 text-sm mx-auto flex items-center gap-2"
                  >
                    <Mic size={16} />
                    Yozishni boshlash
                  </button>
                </>
              ) : isRecording ? (
                /* Active Recording */
                <div className="space-y-4">
                  <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center bg-red-500/10 text-red-500 border-2 border-red-500 animate-pulse">
                    <Mic size={42} />
                  </div>
                  <div>
                    <div className="font-mono text-3xl font-extrabold text-red-500 tracking-wider">
                      {formatTimer(recordSeconds)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {recordSeconds < 30
                        ? `Yana ${30 - recordSeconds} soniya gapiring (minimal talab)...`
                        : "Yetarli! Istalgan vaqtda to'xtatishingiz mumkin."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="btn-primary bg-red-600 hover:bg-red-700 text-sm mx-auto flex items-center gap-2 shadow-lg"
                  >
                    <Square size={16} className="fill-current" />
                    Yozishni to'xtatish
                  </button>
                </div>
              ) : (
                /* Recorded Audio Preview */
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white text-base">
                      Ovoz namunasi tayyor! ({formatTimer(recordSeconds)})
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Yuklashdan oldin namunani tinglab ko'ring.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-[var(--border)] flex justify-center">
                    <audio src={recordedUrl} controls className="w-full h-9" />
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={discardRecording}
                      disabled={upload.isPending}
                      className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
                    >
                      <RotateCcw size={14} />
                      Qaytadan yozish
                    </button>
                    <button
                      type="button"
                      onClick={() => upload.mutate(recordedBlob)}
                      disabled={upload.isPending}
                      className="btn-primary text-sm py-2 px-5 flex items-center gap-2 shadow-lg"
                    >
                      {upload.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {upload.isPending ? 'Ovoz klonlanmoqda...' : 'Ovozimni klonlash'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Upload File Panel */
            <div className="text-center py-8">
              <Mic size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Kompyuteringiz yoki telefoningizdan audio fayl tanlang
              </p>
              <p className="text-xs text-gray-400 mb-5">
                MP3, WAV, M4A, WEBM formatlar (30 soniya — 3 daqiqa)
              </p>
              <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onPickFile} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={upload.isPending}
                className="btn-primary flex items-center gap-2 mx-auto py-2.5 px-5 shadow-lg"
              >
                {upload.isPending ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {upload.isPending ? `Yuklanmoqda${fileName ? `: ${fileName}` : '...'}` : 'Audio faylni tanlash'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
