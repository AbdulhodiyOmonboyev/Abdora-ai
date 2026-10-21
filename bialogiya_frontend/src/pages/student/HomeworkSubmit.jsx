import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Upload, Send, FileText, X, Mic, Square, Play, Pause,
  Sparkles, CheckCircle2, Clock, Award, Heart, HelpCircle
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';

export default function HomeworkSubmit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState('');
  const [files, setFiles] = useState([]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioElementRef = useRef(null);

  const { data: hw, isLoading } = useQuery({
    queryKey: ['homework', id],
    queryFn: () => api.get(`/homework/${id}`).then(r => r.data.data),
  });

  const submitMutation = useMutation({
    mutationFn: (formData) => api.post(`/homework/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      toast.success('Ajoyib! Uy vazifangiz muvaffaqiyatli topshirildi. Harakatingiz uchun yulduz! ⭐');
      navigate('/student/homework');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Topshirishda xatolik yuz berdi'),
  });

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration(prev => {
          if (prev >= 120) {
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Mikrofonni yoqishga ruxsat berilmadi. Sozlamalardan mikrofonni oching.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const discardAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordDuration(0);
    setIsPlayingAudio(false);
  };

  const togglePlayAudio = () => {
    if (!audioElementRef.current && audioUrl) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }
    if (audioElementRef.current) {
      if (isPlayingAudio) {
        audioElementRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioElementRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleSubmit = () => {
    if (!answer.trim() && files.length === 0 && !audioBlob) {
      return toast.error('Iltimos, javob matnini yozing, audio yozib oling yoki fayl yuklang');
    }
    const fd = new FormData();
    fd.append('answerText', answer);

    if (audioBlob) {
      fd.append('files', audioBlob, `ovozli_vazifa_${Date.now()}.webm`);
    }

    files.forEach(f => fd.append('files', f));
    submitMutation.mutate(fd);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTushun = hw?.description && (
    hw.description.includes('TUSHUN') ||
    hw.description.includes('Teskari Dars') ||
    hw.description.includes('Sehrli Ovoz') ||
    hw.description.includes('Erkin Kvest')
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl text-gray-400 hover:text-gray-800 dark:hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            {hw?.title || 'Vazifani topshirish'}
          </h1>
          <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
            {hw?.dueDate && <span><Clock size={11} className="inline mr-1" /> Muddat: {formatDate(hw.dueDate)}</span>}
            {hw?.maxScore && <span className="badge text-[11px] bg-primary/10 text-primary font-bold">Maksimal: {hw.maxScore} ball</span>}
          </p>
        </div>
      </div>

      {/* Warm Encouragement Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-primary/10 border border-primary/20 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Heart size={20} className="fill-primary text-primary" />
        </div>
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
            Xato qilishdan aslo qo'rqma, do'stim! ✨
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Bu yerda sening har bir urinishing, mustaqil fikring va jur'ating qadrlanadi.
            O'z so'zlaring bilan yoz, sevimli qahramoning ovozida audio yubor yoki yasagan ishingni rasmga olib jo'nat!
          </p>
        </div>
      </motion.div>

      {/* Homework Task Details */}
      {hw?.description && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles size={14} />
            <span>Topshiriq mazmuni & Ko'rsatmalar</span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--secondary-background)] border border-[var(--border)] text-xs sm:text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
            {hw.description}
          </div>
        </div>
      )}

      {/* Answer Area Card */}
      <div className="card space-y-5">
        {/* 1. Voice Lab Section */}
        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Mic size={15} />
              </div>
              <span className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white">
                Sehrli Ovoz Laboratoriyasi (Audio xabar)
              </span>
            </div>
            {isRecording && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Yozilmoqda ({formatTimer(recordDuration)})
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Mavzuni qahramon ovozida aytib berish yoki ota-onangizga o'rgatganingizni 20-30 soniyalik audio qilib yuboring:
          </p>

          {!audioUrl && !isRecording && (
            <button
              type="button"
              onClick={startRecording}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2 rounded-xl"
            >
              <Mic size={14} /> Ovoz yozishni boshlash
            </button>
          )}

          {isRecording && (
            <button
              type="button"
              onClick={stopRecording}
              className="btn-danger text-xs py-2 px-3.5 flex items-center gap-2 rounded-xl"
            >
              <Square size={14} /> To'xtatish ({formatTimer(recordDuration)})
            </button>
          )}

          {audioUrl && !isRecording && (
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-primary/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm"
                >
                  {isPlayingAudio ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                <div className="text-xs">
                  <div className="font-semibold text-gray-800 dark:text-white">Ovozli javob tayyor ({formatTimer(recordDuration)})</div>
                  <div className="text-[11px] text-green-600 dark:text-green-400">Vazifa bilan birga yuboriladi</div>
                </div>
              </div>

              <button
                type="button"
                onClick={discardAudio}
                className="btn-ghost p-1.5 text-gray-400 hover:text-red-500 rounded-lg text-xs flex items-center gap-1"
              >
                <X size={14} /> O'chirish
              </button>
            </div>
          )}
        </div>

        {/* 2. Text Answer */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
            Sizning javobingiz yoki xulosangiz
          </label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Do'stim, o'rganganlaring yoki uydagilarga qanday tushuntirganing haqida bemalol shu yerga yozishing mumkin..."
            rows={7}
            className="input-field resize-none text-xs sm:text-sm"
          />
        </div>

        {/* 3. Photo & Document Upload */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
            Rasm yoki fayl yuklash (Chizgan rasmingiz, daftaringiz yoki Lego model fotosi)
          </label>
          <label className="border-2 border-dashed border-[var(--border)] rounded-2xl p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all block">
            <Upload size={22} className="mx-auto mb-1.5 text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">Rasm yoki hujjatni tanlash uchun bosing</span>
            <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, PDF yoki Word formatida</p>
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
              onChange={e => setFiles(Array.from(e.target.files))} />
          </label>
          {files.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-[var(--secondary-background)] border border-[var(--border)] rounded-xl px-3 py-2">
                  <FileText size={14} className="text-primary flex-shrink-0" />
                  <span className="flex-1 truncate font-medium">{f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 p-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Action */}
        <button
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 font-bold shadow-soft"
        >
          {submitMutation.isPending ? (
            'Yuborilmoqda...'
          ) : (
            <><Sparkles size={16} /> Vazifani yuborish (Harakatingiz uchun yulduz!)</>
          )}
        </button>
      </div>
    </div>
  );
}
